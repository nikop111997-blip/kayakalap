
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

import { getFacebookCollections } from "@/lib/facebook/db";
import { decryptToken } from "@/lib/facebook/encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GRAPH_VERSION =
  process.env.META_GRAPH_API_VERSION || "v27.0";

const CRM_FIELDS = [
  "fullName",
  "email",
  "phone",
  "city",
  "goal",
  "currentWeight",
];

// ---------------------------------------------
// META WEBHOOK VERIFICATION
// ---------------------------------------------

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (
      mode === "subscribe" &&
      token &&
      token === process.env.META_WEBHOOK_VERIFY_TOKEN
    ) {
      return new Response(challenge || "", {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Webhook verification failed",
      },
      { status: 403 }
    );
  } catch (error) {
    console.error("Facebook webhook verification error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Webhook verification error",
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// VERIFY META SIGNATURE
// ---------------------------------------------

function verifyMetaSignature(rawBody, signature) {
  const appSecret = process.env.META_APP_SECRET;

  if (!appSecret || !signature) {
    return false;
  }

  const expected =
    "sha256=" +
    createHmac("sha256", appSecret)
      .update(rawBody)
      .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

// ---------------------------------------------
// NORMALIZE FACEBOOK ANSWERS
// ---------------------------------------------

function normalizeAnswer(value) {
  if (Array.isArray(value)) {
    return value.map(String).join(", ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function getFieldData(lead) {
  const result = {};

  for (const field of lead.field_data || []) {
    result[field.name] = field.values || [];
  }

  return result;
}

// ---------------------------------------------
// BUILD CRM LEAD USING SAVED MAPPING
// ---------------------------------------------

function buildLeadDocument(lead, mapping, pageId, formId) {
  const fieldData = getFieldData(lead);

  const document = {
    // Your actual CRM fields
    fullName: "",
    email: "",
    phone: "",
    city: "",
    goal: "",
    currentWeight: "",

    // Source information
    source: "Social Media",

    // Attribution information
    metaAttribution: {
      fbclid: null,
      fbp: null,
      fbc: null,
      capturedAt: new Date(),
    },

    utm_source: "Meta",
    utm_medium: "Ads",

    // Lead timestamps
    submittedAt: lead.created_time
      ? new Date(lead.created_time).toISOString()
      : new Date().toISOString(),

    createdAt: new Date(),

    // CRM status
    status: mapping.defaultLeadStatus || "new",

    // Facebook references
    facebookLeadId: String(lead.id),
    facebookPageId: String(pageId),
    facebookFormId: String(formId),

    // Additional unmapped answers
    others: {},
  };

  const mappedQuestionKeys = new Set();

  // Apply saved form mappings.
  for (const item of mapping.mappings || []) {
    const questionKey = item.questionKey;
    const crmField = item.crmField;

    if (!questionKey) continue;

    mappedQuestionKeys.add(questionKey);

    const values = fieldData[questionKey];

    if (!values) continue;

    const answer = normalizeAnswer(values);

    if (crmField && CRM_FIELDS.includes(crmField)) {
      document[crmField] = answer;
    } else {
      document.others[questionKey] = answer;
    }
  }

  // Store all unmapped Facebook answers in others.
  for (const [key, values] of Object.entries(fieldData)) {
    const mappingItem = (mapping.mappings || []).find(
      (item) => item.questionKey === key
    );

    if (mappingItem?.crmField && CRM_FIELDS.includes(mappingItem.crmField)) {
      continue;
    }

    document.others[key] = normalizeAnswer(values);
  }

  // Facebook advertising information.
  if (lead.ad_id) {
    document.facebookAdId = String(lead.ad_id);
  }

  if (lead.form_id) {
    document.facebookFormId = String(lead.form_id);
  }

  if (lead.is_organic !== undefined) {
    document.isOrganic = lead.is_organic;
  }

  if (lead.platform) {
    document.facebookPlatform = lead.platform;
  }

  return document;
}

// ---------------------------------------------
// FETCH ACTUAL LEAD DETAILS FROM META
// ---------------------------------------------

async function fetchFacebookLead(leadgenId, accessToken) {
  const url = new URL(
    `https://graph.facebook.com/${GRAPH_VERSION}/${leadgenId}`
  );

  url.searchParams.set(
    "fields",
    [
      "id",
      "created_time",
      "field_data",
      "form_id",
      "ad_id",
      "is_organic",
      "platform",
    ].join(",")
  );

  url.searchParams.set("access_token", accessToken);

  const response = await fetch(url.toString(), {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error("Facebook lead retrieval failed:", {
      leadgenId,
      error: data.error?.message,
    });

    throw new Error(
      data.error?.message || "Unable to retrieve Facebook lead"
    );
  }

  return data;
}

// ---------------------------------------------
// PROCESS ONE FACEBOOK LEAD EVENT
// ---------------------------------------------

async function processLeadEvent(value) {
  const pageId = String(value.page_id || "");
  const formId = String(value.form_id || "");
  const leadgenId = String(value.leadgen_id || "");

  if (!pageId || !formId || !leadgenId) {
    throw new Error("Invalid Facebook lead webhook payload");
  }

  const {
    pages,
    mappings,
    leads,
  } = await getFacebookCollections();

  // 1. Find connected Facebook Page.
  const page = await pages.findOne({
    pageId,
    status: "connected",
  });

  if (!page) {
    throw new Error(
      `Connected Facebook Page not found: ${pageId}`
    );
  }

  // 2. Find saved mapping for exact Page and form.
  const mapping = await mappings.findOne({
    userId: String(page.userId),
    pageId,
    formId,
  });

  if (!mapping) {
    throw new Error(
      `Mapping not found for Facebook form: ${formId}`
    );
  }

  // 3. Check Page access token.
  if (!page.pageAccessTokenEncrypted) {
    throw new Error("Facebook Page access token is missing");
  }

  // 4. Check duplicate lead.
  const existingLead = await leads.findOne({
    facebookLeadId: leadgenId,
  });

  if (existingLead) {
    return {
      status: "duplicate",
      leadgenId,
    };
  }

  // 5. Decrypt Page access token.
  const accessToken = decryptToken(
    page.pageAccessTokenEncrypted
  );

  if (!accessToken) {
    throw new Error("Unable to decrypt Facebook Page token");
  }

  // 6. Fetch full Facebook lead.
  const facebookLead = await fetchFacebookLead(
    leadgenId,
    accessToken
  );

  // Make sure the fetched lead belongs to the expected form.
  if (
    facebookLead.form_id &&
    String(facebookLead.form_id) !== formId
  ) {
    throw new Error("Facebook lead form ID mismatch");
  }

  // 7. Build CRM document using saved mapping.
  const leadDocument = buildLeadDocument(
    facebookLead,
    mapping,
    pageId,
    formId
  );

  // 8. Insert unique index for duplicate protection.
  await leads.createIndex(
    { facebookLeadId: 1 },
    {
      unique: true,
      sparse: true,
      name: "facebook_lead_id_unique",
    }
  );

  // 9. Insert lead.
  try {
    await leads.insertOne(leadDocument);

    return {
      status: "created",
      leadgenId,
    };
  } catch (error) {
    if (error.code === 11000) {
      return {
        status: "duplicate",
        leadgenId,
      };
    }

    throw error;
  }
}

// ---------------------------------------------
// POST: RECEIVE FACEBOOK WEBHOOK
// ---------------------------------------------

export async function POST(req) {
  try {
    // 1. Read raw body for signature verification.
    const rawBody = await req.text();

    const signature = req.headers.get(
      "x-hub-signature-256"
    );

    // 2. Verify request came from Meta.
    if (!verifyMetaSignature(rawBody, signature)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid webhook signature",
        },
        { status: 401 }
      );
    }

    // 3. Parse payload.
    const body = JSON.parse(rawBody);

    if (body.object !== "page") {
      return NextResponse.json({
        success: true,
        message: "Event ignored",
      });
    }

    const results = [];
    const errors = [];

    // 4. Process each Page event.
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") {
          continue;
        }

        try {
          const result = await processLeadEvent(
            change.value || {}
          );

          results.push(result);
        } catch (error) {
          console.error(
            "Facebook lead event failed:",
            error.message
          );

          errors.push({
            leadgenId: change.value?.leadgen_id || null,
            message: error.message,
          });
        }
      }
    }

    // If any lead failed, return 500 so Meta can retry.
    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Some Facebook lead events failed",
          processed: results.length,
          results,
          errors,
        },
        { status: 500 }
      );
    }

    // 5. Acknowledge successful delivery.
    return NextResponse.json({
      success: true,
      message: "Facebook webhook processed successfully",
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Facebook webhook processing error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}

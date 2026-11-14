
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getFacebookCollections } from "@/lib/facebook/db";
import { decryptToken } from "@/lib/facebook/encryption";

export const runtime = "nodejs";

const GRAPH_VERSION =
  process.env.META_GRAPH_API_VERSION || "v27.0";

const CRM_FIELDS = [
  "name",
  "email",
  "whatsapp",
  "age",
  "schedule",
  "frustration",
];

// ---------------------------------------------
// META WEBHOOK VERIFICATION
// ---------------------------------------------

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
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
    { success: false, message: "Webhook verification failed" },
    { status: 403 }
  );
}

// ---------------------------------------------
// VERIFY META REQUEST SIGNATURE
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

  return String(value);
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
    name: "",
    email: "",
    whatsapp: "",
    age: "",
    schedule: "",
    frustration: "",

    answers: {},
    score: 0,

    submittedAt: lead.created_time
      ? new Date(lead.created_time).toISOString()
      : new Date().toISOString(),

    createdAt: new Date(),

    source: "facebook-lead-ads",
    status: mapping.defaultLeadStatus || "new",

    facebookLeadId: String(lead.id),
    facebookPageId: String(pageId),
    facebookFormId: String(formId),

    others: {},
  };

  const mappedQuestionKeys = new Set();

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

  // Keep every unmapped Facebook answer.
  for (const [key, values] of Object.entries(fieldData)) {
    if (mappedQuestionKeys.has(key)) {
      const item = (mapping.mappings || []).find(
        (entry) => entry.questionKey === key
      );

      if (item?.crmField) continue;
    }

    document.others[key] = normalizeAnswer(values);
  }

  if (lead.ad_id) {
    document.facebookAdId = String(lead.ad_id);
  }

  if (lead.ad_name) {
    document.facebookAdName = lead.ad_name;
  }

  if (lead.adset_id) {
    document.facebookAdsetId = String(lead.adset_id);
  }

  if (lead.campaign_id) {
    document.facebookCampaignId = String(lead.campaign_id);
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
      "ad_name",
      "adset_id",
      "campaign_id",
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

  // Find the exact connected Page.
  const page = await pages.findOne({
    pageId,
    status: "connected",
  });

  if (!page) {
    throw new Error(`Connected Facebook Page not found: ${pageId}`);
  }

  // Find mapping for this exact Page and form.
  const mapping = await mappings.findOne({
    userId: String(page.userId),
    pageId,
    formId,
  });

  if (!mapping) {
    throw new Error(
      `No saved mapping found for Page ${pageId} and Form ${formId}`
    );
  }

  if (!page.pageAccessTokenEncrypted) {
    throw new Error("Facebook Page access token is missing");
  }

  // Avoid fetching a lead that has already been saved.
  const existingLead = await leads.findOne({
    facebookLeadId: leadgenId,
  });

  if (existingLead) {
    return {
      status: "duplicate",
      leadgenId,
    };
  }

  const accessToken = decryptToken(
    page.pageAccessTokenEncrypted
  );

  if (!accessToken) {
    throw new Error("Unable to decrypt Facebook Page token");
  }

  // Fetch the complete lead details from Meta.
  const facebookLead = await fetchFacebookLead(
    leadgenId,
    accessToken
  );

  const leadDocument = buildLeadDocument(
    facebookLead,
    mapping,
    pageId,
    formId
  );

  // Unique index makes duplicate webhook deliveries safe.
  await leads.createIndex(
    { facebookLeadId: 1 },
    {
      unique: true,
      sparse: true,
      name: "facebook_lead_id_unique",
    }
  );

  try {
    await leads.insertOne(leadDocument);

    return {
      status: "created",
      leadgenId,
    };
  } catch (error) {
    // Another webhook request may have inserted it concurrently.
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
// POST: RECEIVE FACEBOOK LEAD WEBHOOK
// ---------------------------------------------

export async function POST(req) {
  try {
    const rawBody = await req.text();

    const signature = req.headers.get(
      "x-hub-signature-256"
    );

    if (!verifyMetaSignature(rawBody, signature)) {
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const body = JSON.parse(rawBody);

    if (body.object !== "page") {
      return NextResponse.json(
        { success: true, message: "Event ignored" },
        { status: 200 }
      );
    }

    const results = [];

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;

        const result = await processLeadEvent(change.value || {});
        results.push(result);
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Facebook webhook processing error:", error);

    // Non-2xx allows Meta to retry delivery.
    return NextResponse.json(
      {
        success: false,
        message: "Webhook processing failed",
      },
      { status: 500 }
    );
  }
}

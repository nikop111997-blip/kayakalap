
import crypto from "crypto";

const DATASET_ID = process.env.META_DATASET_ID;
const API_VERSION = process.env.META_GRAPH_API_VERSION || "v27.0";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;

// SHA256 normalization for customer matching
function hashValue(value) {
  if (!value) return undefined;

  const normalized = String(value).trim().toLowerCase();

  if (!normalized) return undefined;

  return crypto
    .createHash("sha256")
    .update(normalized)
    .digest("hex");
}

function normalizePhone(phone) {
  if (!phone) return undefined;

  // Keep digits and an optional international country code.
  return String(phone).replace(/\D/g, "");
}

export async function sendMetaCRMEvent({
  lead,
  eventName,
  eventTime = new Date(),
  eventId,
}) {
  if (!DATASET_ID || !ACCESS_TOKEN) {
    throw new Error("Meta CAPI environment variables are missing");
  }

  if (!lead || !eventName) {
    throw new Error("Lead and event name are required");
  }

  const userData = {};

  if (lead.email) {
    userData.em = [hashValue(lead.email)];
  }

  if (lead.phone) {
    const phone = normalizePhone(lead.phone);
    if (phone) {
      userData.ph = [hashValue(phone)];
    }
  }

  // Include the actual Meta-generated lead ID only.
  if (lead.meta?.leadId) {
    userData.lead_id = String(lead.meta.leadId);
  }

  // Facebook click/browser IDs are not hashed.
  if (lead.meta?.fbc) {
    userData.fbc = lead.meta.fbc;
  }

  if (lead.meta?.fbp) {
    userData.fbp = lead.meta.fbp;
  }

  if (!Object.keys(userData).length) {
    throw new Error("No customer matching information available");
  }

  const payload = {
    data: [
      {
        event_name: eventName,
         event_id: eventId,
        event_time: Math.floor(
          new Date(eventTime).getTime() / 1000
        ),
        action_source: "system_generated",

        user_data: userData,

        custom_data: {
          event_source: "crm",
          lead_event_source: "Kayapalat CRM",
        },
      },
    ],
  };

  if (TEST_EVENT_CODE) {
    payload.test_event_code = TEST_EVENT_CODE;
  }

  const url =
    `https://graph.facebook.com/${API_VERSION}/${DATASET_ID}/events` +
    `?access_token=${encodeURIComponent(ACCESS_TOKEN)}`;
console.log("META CAPI PAYLOAD CHECK:", {
  test_event_code: payload.test_event_code,
  event_name: payload.data[0].event_name,
  event_time: payload.data[0].event_time,
  action_source: payload.data[0].action_source,
  event_source: payload.data[0].custom_data.event_source,
  lead_event_source: payload.data[0].custom_data.lead_event_source,
});
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const result = await response.json();
console.log("META CAPI RESPONSE:", {
  httpStatus: response.status,
  result,
});
  if (!response.ok) {
    console.error("Meta CRM CAPI error:", result);

    throw new Error(
      result?.error?.message || "Meta CRM event delivery failed"
    );
  }

  return result;
}

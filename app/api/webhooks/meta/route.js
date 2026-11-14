
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

// ----------------------------------
// GET: META WEBHOOK VERIFICATION
// ----------------------------------

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    token === process.env.META_VERIFY_TOKEN &&
    challenge
  ) {
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  return NextResponse.json(
    { error: "Webhook verification failed" },
    { status: 403 }
  );
}

// ----------------------------------
// POST: RECEIVE LEAD NOTIFICATIONS
// ----------------------------------

export async function POST(req) {
  try {
    const rawBody = await req.text();

    const signature = req.headers.get("x-hub-signature-256");
    const appSecret = process.env.META_APP_SECRET;

    if (!signature || !appSecret) {
      return NextResponse.json(
        { error: "Missing signature or app secret" },
        { status: 401 }
      );
    }

    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", appSecret)
        .update(rawBody)
        .digest("hex");

    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      signatureBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
    ) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);

    if (payload.object === "page") {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === "leadgen") {
            console.log("New Facebook Lead:", {
              leadId: change.value.leadgen_id,
              pageId: change.value.page_id,
              formId: change.value.form_id,
              adId: change.value.ad_id,
            });
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Meta webhook error:", error);

    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

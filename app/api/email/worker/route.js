// /app/api/email/worker/route.js

import { redis } from "@/lib/upstash";
import clientPromise from "@/lib/mongodb";
import { sendEmail } from "@/lib/mailer2";
import { buildEmailHtml } from "@/lib/emailTemplate";
import { ObjectId } from "mongodb";
import { addClickTracking } from "@/lib/addClickTracking";

const BASE_URL = "https://kayapalat.in";

export async function GET() {
  console.log("🔥 WORKER TRIGGERED");

  const client = await clientPromise;
  const db = client.db("kayakalap");

  let processed = 0;

  for (let i = 0; i < 10; i++) {
    const job = await redis.rpop("email_queue");

    if (!job) break;

    let data;

    try {
      data =
        typeof job === "string"
          ? JSON.parse(job)
          : job;
    } catch {
      continue;
    }

    const { campaignId, email } = data;

    try {
      const campaign = await db.collection("campaigns").findOne({
        _id: new ObjectId(campaignId),
      });

      if (!campaign) continue;

      const template = await db.collection("email_templates").findOne({
        _id: new ObjectId(campaign.templateId),
      });

      if (!template) continue;

      // Build email HTML
      let html = buildEmailHtml(
        template.compiledHtml,
        template.compiledCss
      );

      // =====================================
      // UNSUBSCRIBE LINK
      // =====================================

      const unsubscribeUrl =
        `${BASE_URL}/api/email/unsubscribe?email=${encodeURIComponent(
          email
        )}`;

      html = html.replace(
        /{{unsubscribe_link}}/g,
        unsubscribeUrl
      );

      // =====================================
      // CLICK TRACKING
      // =====================================

      html = addClickTracking(
        html,
        campaignId,
        email
      );

      // =====================================
      // OPEN TRACKING PIXEL
      // =====================================

      const pixel = `
        <img
          src="${BASE_URL}/api/email/open/${campaignId}/${encodeURIComponent(
            email
          )}?t=${Date.now()}"
          width="1"
          height="1"
          style="display:none;"
        />
      `;

      if (html.includes("</body>")) {
        html = html.replace(
          "</body>",
          pixel + "</body>"
        );
      } else {
        html += pixel;
      }

      // =====================================
      // SEND EMAIL
      // =====================================

      await sendEmail({
        to: email,
        subject: campaign.subject,
        html,
      });

      // =====================================
      // UPDATE EMAIL LOG
      // =====================================

      await db.collection("email_logs").updateOne(
        {
          campaignId,
          email,
        },
        {
          $set: {
            status: "sent",
            sentAt: new Date(),
          },
        }
      );

      // =====================================
      // UPDATE CAMPAIGN STATS
      // =====================================

      await db.collection("campaigns").updateOne(
        {
          _id: new ObjectId(campaignId),
        },
        {
          $inc: {
            sent: 1,
          },
        }
      );

      processed++;

      // Slow down sending slightly
      await new Promise((r) =>
        setTimeout(r, 200)
      );
    } catch (err) {
      console.error(
        "❌ Failed:",
        email,
        err
      );

      await db.collection("email_logs").updateOne(
        {
          campaignId,
          email,
        },
        {
          $set: {
            status: "failed",
            failedAt: new Date(),
            error:
              err?.message ||
              "Unknown error",
          },
        }
      );
    }
  }

  // Continue queue automatically
  if (processed > 0) {
    setTimeout(() => {
      fetch(`${BASE_URL}/api/email/worker`).catch(
        () => {}
      );
    }, 1000);
  }

  return Response.json({
    success: true,
    processed,
  });
}
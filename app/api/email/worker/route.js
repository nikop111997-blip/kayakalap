// /app/api/email/worker/route.js

import { redis } from "@/lib/upstash";
import clientPromise from "@/lib/mongodb";
import { sendEmail } from "@/lib/mailer2";
import { buildEmailHtml } from "@/lib/emailTemplate";
import { ObjectId } from "mongodb";
import { addClickTracking } from "@/lib/addClickTracking";

const BASE_URL = "https://kayakalap.vercel.app";

export async function GET() {
  console.log("🔥 WORKER TRIGGERED");

  const client = await clientPromise;
  const db = client.db("kayakalap");

  let processed = 0;

  for (let i = 0; i < 10; i++) {
    const job = await redis.rpop("email_queue");
    if (!job) break;

    // safe parse
    let data;
    if (typeof job === "string") {
      data = JSON.parse(job);
    } else {
      data = job;
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

      // build html
      let html = buildEmailHtml(
        template.compiledHtml,
        template.compiledCss
      );

      // click tracking
      html = addClickTracking(html, campaignId, email);

      // open tracking
      const pixel = `<img src="${BASE_URL}/api/email/open/${campaignId}/${encodeURIComponent(email)}?t=${Date.now()}" width="1" height="1" style="display:none;" />`;

      html = html.replace("</body>", pixel + "</body>");

      // send email
      await sendEmail({
        to: email,
        subject: campaign.subject,
        html,
      });

      await db.collection("email_logs").updateOne(
        { campaignId, email },
        { $set: { status: "sent" } }
      );

      await db.collection("campaigns").updateOne(
        { _id: new ObjectId(campaignId) },
        { $inc: { sent: 1 } }
      );

      processed++;

      await new Promise(r => setTimeout(r, 200)); // avoid spam

    } catch (err) {
      console.error("❌ Failed:", email);

      await db.collection("email_logs").updateOne(
        { campaignId, email },
        { $set: { status: "failed" } }
      );
    }
  }

  // 🔥 auto continue
  if (processed > 0) {
    setTimeout(() => {
      fetch(`${BASE_URL}/api/email/worker`).catch(() => {});
    }, 1000);
  }

  return Response.json({ processed });
}
import { redis } from "@/lib/upstash";
import clientPromise from "@/lib/mongodb";
import { sendEmail } from "@/lib/mailer2";
import { buildEmailHtml } from "@/lib/emailTemplate";
import { ObjectId } from "mongodb";
import { addClickTracking } from "@/lib/addClickTracking";

export async function GET() {
  const client = await clientPromise;
  const db = client.db("kayakalap");

  let processed = 0;

  for (let i = 0; i < 10; i++) {
    const job = await redis.rpop("email_queue");
    if (!job) break;

    // ✅ SAFE PARSE
    let data;
    if (typeof job === "string") {
      data = JSON.parse(job);
    } else {
      data = job;
    }

    const { campaignId, email } = data;

    console.log("Processing:", email);

    const campaign = await db.collection("campaigns").findOne({
      _id: new ObjectId(campaignId),
    });

    const template = await db.collection("email_templates").findOne({
      _id: new ObjectId(campaign.templateId),
    });

    try {
      // ✅ build html
      let html = buildEmailHtml(
        template.compiledHtml,
        template.compiledCss
      );

      // ✅ click tracking
      html = addClickTracking(html, campaignId, email);

      // ✅ open tracking (ONLY ONCE)
      const trackingPixel = `<img src="https://kayakalap.vercel.app/api/email/open/${campaignId}/${encodeURIComponent(email)}" width="1" height="1" style="display:none;" />`;

      const finalHtml = html + trackingPixel;

      // ✅ CORRECT PARAM
      await sendEmail({
        to: email,
        subject: campaign.subject,
        html: finalHtml,
      });

      console.log("Email sent:", email);

      await db.collection("email_logs").updateOne(
        { campaignId, email },
        { $set: { status: "sent" } }
      );

      await db.collection("campaigns").updateOne(
        { _id: new ObjectId(campaignId) },
        { $inc: { sent: 1 } }
      );

      processed++;

    } catch (err) {
      console.error("Email failed:", email, err);

      await db.collection("email_logs").updateOne(
        { campaignId, email },
        { $set: { status: "failed" } }
      );
    }
  }

  return Response.json({ processed });
}
import { buildEmailHtml } from "@/lib/emailTemplate";
import { sendEmail } from "@/lib/mailer2";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const { email, templateId, subject } = await req.json();
console.log("Received email request for:", email, "with template ID:", templateId);
    const client = await clientPromise;
    const db = client.db("kayakalap");

    // 🔥 get your template (same structure you shared)
    const template = await db.collection("email_templates").findOne({
      _id: new ObjectId(templateId),
    });

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    // 🔥 combine HTML + CSS
    const finalHtml = buildEmailHtml(
      template.compiledHtml,
      template.compiledCss
    );

    console.log("Sending email to:", email);

    // 🔥 send email
    await sendEmail({
      to: email,
      subject: subject || "Test Email",
      html: finalHtml,
    });

    return Response.json({ success: true });

  } catch (err) {
    console.error(err);
    return Response.json({ error: "Email failed" }, { status: 500 });
  }
}
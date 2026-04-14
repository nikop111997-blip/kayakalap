import nodemailer from "nodemailer";

// ✅ transporter (singleton)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587, // ✅ important
  secure: false, // ✅ MUST be false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
// ✅ reusable send function
export async function sendMail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"Kayakalap" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
      replyTo: process.env.EMAIL_USER,
    });

    return { success: true, id: info.messageId };
  } catch (err) {
    console.error("Mail Error:", err);
    return { success: false };
  }
}
import clientPromise from "@/lib/mongodb";
import { sendMail } from "@/lib/mailer";
import { getTemplate } from "@/lib/template";
export async function POST(req) {
  try {
    const { email } = await req.json();

    // Validation
    if (!email) {
      return new Response(
        JSON.stringify({ success: false, message: "Email is required" }),
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, message: "Invalid email" }),
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    const client = await clientPromise;
    const db = client.db("kayakalap");

    const existing = await db.collection("newsletter").findOne({ email });

    if (existing) {
      return new Response(
        JSON.stringify({ success: false, message: "Already subscribed" }),
        {
          status: 409,
          headers: corsHeaders(),
        }
      );
    }

    await db.collection("newsletter").insertOne({
      email,
      createdAt: new Date(),
    });
    const userTpl = getTemplate("newsletter", { name: email });
sendMail({
  to: email,
  subject: userTpl.subject,
  html: userTpl.html,
});
const adminTpl = getTemplate("admin", { email });
sendMail({
  to: "puni199711@gmail.com",
  subject: adminTpl.subject,
  html: adminTpl.html,
});
    return new Response(
      JSON.stringify({ success: true, message: "Subscribed successfully" }),
      {
        status: 201,
        headers: corsHeaders(),
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({ success: false, message: "Server error" }),
      {
        status: 500,
        headers: corsHeaders(),
      }
    );
  }
}

// ✅ CORS HEADERS FUNCTION
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// ✅ HANDLE PREFLIGHT REQUEST (VERY IMPORTANT)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  });
}
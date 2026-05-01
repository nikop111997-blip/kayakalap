import clientPromise from "@/lib/mongodb";

export async function GET(req, { params }) {
  try {
    const { campaignId, email } = params;

    // ✅ decode email
    const decodedEmail = decodeURIComponent(email);

    const client = await clientPromise;
    const db = client.db("kayakalap");

    console.log("OPEN HIT:", campaignId, decodedEmail);

    // ✅ update safely
    const result = await db.collection("email_logs").updateOne(
      {
        campaignId: campaignId,
        email: decodedEmail,
      },
      {
        $set: {
          opened: true,
          openedAt: new Date(),
        },
      }
    );

    console.log("UPDATE RESULT:", result);

    // ✅ return valid image (FIX BROKEN IMAGE)
    const pixel = Buffer.from(
      "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
      "base64"
    );

    return new Response(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });

  } catch (err) {
    console.error("OPEN ERROR:", err);
    return new Response(null, { status: 500 });
  }
}
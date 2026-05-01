import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const email = decodeURIComponent(searchParams.get("email"));
    const campaignId = searchParams.get("cid");
    const url = searchParams.get("url");

    const decodedUrl = decodeURIComponent(url);

    const client = await clientPromise;
    const db = client.db("kayakalap");

    console.log("CLICK:", campaignId, email, decodedUrl);

    // ✅ update DB
    await db.collection("email_logs").updateOne(
      { campaignId, email },
      {
        $set: {
          clicked: true,
          clickedAt: new Date(),
        },
      }
    );

    // ✅ redirect to original link
    return Response.redirect(decodedUrl, 302);

  } catch (err) {
    console.error("CLICK ERROR:", err);
    return new Response("Error", { status: 500 });
  }
}
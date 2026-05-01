import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  const { searchParams } = new URL(req.url);

  const email = searchParams.get("email");
  const campaignId = searchParams.get("cid");
  const url = searchParams.get("url");

  const client = await clientPromise;
  const db = client.db("kayakalap");

  await db.collection("email_logs").updateOne(
    { campaignId, email },
    {
      $set: {
        clicked: true,
        clickedAt: new Date(),
      },
    }
  );

  return Response.redirect(decodeURIComponent(url));
}
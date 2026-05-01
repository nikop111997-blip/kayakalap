import clientPromise from "@/lib/mongodb";

export async function GET(req, { params }) {
  const { campaignId, email } = params;

  const client = await clientPromise;
  const db = client.db("kayakalap"); 

  await db.collection("email_logs").updateOne(
    { campaignId, email },
    {
      $set: {
        opened: true,
        openedAt: new Date(),
      },
    }
  );

  // return 1x1 pixel
  return new Response(
    Buffer.from("R0lGODlhAQABAIAAAAUEBA==", "base64"),
    { headers: { "Content-Type": "image/gif" } }
  );
}
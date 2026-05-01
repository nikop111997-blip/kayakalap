import clientPromise from "@/lib/mongodb";
import { redis } from "@/lib/upstash";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("kayakalap");

    let users = [];

    if (body.audience === "all") {
      users = await db.collection("newsletter").find().toArray();
    }

    if (body.audience === "last_7_days") {
      const date = new Date();
      date.setDate(date.getDate() - 7);

      users = await db.collection("newsletter").find({
        createdAt: { $gte: date },
      }).toArray();
    }

    if (body.audience === "last_30_days") {
      const date = new Date();
      date.setDate(date.getDate() - 30);

      users = await db.collection("newsletter").find({
        createdAt: { $gte: date },
      }).toArray();
    }

    const campaign = await db.collection("campaigns").insertOne({
      title: body.title,
      subject: body.subject,
      templateId: body.templateId,
      audience: body.audience,
      status: "queued",
      total: users.length,
      sent: 0,
      createdAt: new Date(),
    });

    const logs = users.map(u => ({
      campaignId: campaign.insertedId.toString(),
      email: u.email,
      status: "pending",
      opened: false,
      clicked: false,
    }));

    if (logs.length > 0) {
      await db.collection("email_logs").insertMany(logs);
    }

    // ✅ NEW QUEUE (Upstash)
    for (const user of users) {
      await redis.lpush("email_queue", JSON.stringify({
        campaignId: campaign.insertedId.toString(),
        email: user.email,
      }));
    }

    return Response.json({ success: true });

  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
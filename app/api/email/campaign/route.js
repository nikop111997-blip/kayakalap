import clientPromise from "@/lib/mongodb";
import { redis } from "@/lib/upstash";

export async function POST(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("kayakalap");

    let users = [];

    // ✅ audience filter
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

    // ⚠️ remove duplicate emails
    const uniqueEmails = [...new Set(users.map(u => u.email))];

    // ✅ create campaign
    const campaign = await db.collection("campaigns").insertOne({
      title: body.title,
      subject: body.subject,
      templateId: body.templateId,
      audience: body.audience,
      status: "queued",
      total: uniqueEmails.length,
      sent: 0,
      createdAt: new Date(),
    });

    // ✅ create logs
    const logs = uniqueEmails.map(email => ({
      campaignId: campaign.insertedId.toString(),
      email,
      status: "pending",
      opened: false,
      clicked: false,
      retryCount: 0,
    }));

    if (logs.length > 0) {
      await db.collection("email_logs").insertMany(logs);
    }

    // 🚀 PUSH TO QUEUE (BATCH — FAST)
    const queueData = uniqueEmails.map(email => ({
      campaignId: campaign.insertedId.toString(),
      email,
    }));

    // push all at once
    await redis.lpush("email_queue", ...queueData);

    // 🔥 TRIGGER WORKER (IMPORTANT)
    for (let i = 0; i < 5; i++) {
      fetch("https://kayakalap.vercel.app/api/email/worker");
    }

    return Response.json({
      success: true,
      total: uniqueEmails.length,
    });

  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
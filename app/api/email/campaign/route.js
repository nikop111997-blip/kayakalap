// /app/api/email/campaign/route.js

import clientPromise from "@/lib/mongodb";
import { redis } from "@/lib/upstash";

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

    // remove duplicates
    const uniqueEmails = [...new Set(users.map(u => u.email))];

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

    // logs
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

    // 🚀 push to queue (STRING SAFE)
    await redis.lpush(
      "email_queue",
      ...uniqueEmails.map(email =>
        JSON.stringify({
          campaignId: campaign.insertedId.toString(),
          email,
        })
      )
    );

    return Response.json({
      success: true,
      total: uniqueEmails.length,
    });

  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}
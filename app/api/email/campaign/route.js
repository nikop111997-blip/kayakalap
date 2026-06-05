// /app/api/email/campaign/route.js

import clientPromise from "@/lib/mongodb";
import { redis } from "@/lib/upstash";

export async function POST(req) {
  try {
    const body = await req.json();

    const client = await clientPromise;
    const db = client.db("kayakalap");

    let uniqueEmails = [];

    // 🎯 AUDIENCE LOGIC
    if (body.audience === "all") {
      const users = await db.collection("newsletter").find().toArray();
      uniqueEmails = [...new Set(users.map((u) => u.email))];
    }

    else if (body.audience === "last_7_days") {
      const date = new Date();
      date.setDate(date.getDate() - 7);

      const users = await db.collection("newsletter").find({
        createdAt: { $gte: date },
      }).toArray();

      uniqueEmails = [...new Set(users.map((u) => u.email))];
    }

    else if (body.audience === "last_30_days") {
      const date = new Date();
      date.setDate(date.getDate() - 30);

      const users = await db.collection("newsletter").find({
        createdAt: { $gte: date },
      }).toArray();

      uniqueEmails = [...new Set(users.map((u) => u.email))];
    }

    else if (body.audience === "opened_mail") {
      // 🔥 get users who opened emails
      const query = { opened: true };

      // optional: filter by previous campaign
      if (body.previousCampaignId) {
        query.campaignId = body.previousCampaignId;
      }

      const openedLogs = await db.collection("email_logs").find(query).toArray();

      uniqueEmails = [...new Set(openedLogs.map((log) => log.email))];
    }
   else if (body.audience === "not_paid") {
  const date = new Date();
  date.setDate(date.getDate() - 30);

  const pendingOrders = await db.collection("orders").find({
    status: "pending",
    createdAt: { $gte: date }
  }).toArray();

  const paidEmails = await db.collection("orders").distinct(
    "email",
    {
      status: "paid"
    }
  );

  const paidSet = new Set(
    paidEmails.map((e) => e.toLowerCase())
  );

  uniqueEmails = [
    ...new Set(
      pendingOrders
        .map((o) => o.email?.trim().toLowerCase())
        .filter(
          (email) =>
            email &&
            !paidSet.has(email)
        )
    ),
  ];
}

    // 🚫 no users found
    if (uniqueEmails.length === 0) {
      return Response.json({
        success: false,
        message: "No users found for selected audience",
      });
    }

    // 📝 CREATE CAMPAIGN
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

    const campaignId = campaign.insertedId.toString();

    // 📊 CREATE EMAIL LOGS
    const logs = uniqueEmails.map((email) => ({
      campaignId,
      email,
      status: "pending",
      opened: false,
      clicked: false,
      retryCount: 0,
      createdAt: new Date(),
    }));

    if (logs.length > 0) {
      await db.collection("email_logs").insertMany(logs);
    }

    // 🚀 PUSH TO REDIS QUEUE
    await redis.lpush(
      "email_queue",
      ...uniqueEmails.map((email) =>
        JSON.stringify({
          campaignId,
          email,
        })
      )
    );

    return Response.json({
      success: true,
      total: uniqueEmails.length,
    });

  } catch (err) {
    console.error("Campaign Error:", err);

    return Response.json(
      { success: false, error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
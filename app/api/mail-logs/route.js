import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

// ✅ CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
};

// ================= GET =================
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return new Response(
        JSON.stringify({ unauthorized: true }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");
    const dateFilter = searchParams.get("dateFilter");

    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("kayakalap");

    let query = {};

    // 🔍 Search
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { campaignId: { $regex: search, $options: "i" } },
      ];
    }

    // 📅 Date Filter
    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) query.createdAt.$gte = new Date(fromDate);

      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        query.createdAt.$lte = to;
      }
    } else if (dateFilter && dateFilter !== "All") {
      const now = new Date();
      let from = new Date();

      if (dateFilter === "Today") from.setHours(0, 0, 0, 0);
      if (dateFilter === "Last3") from.setDate(now.getDate() - 3);
      if (dateFilter === "Last7") from.setDate(now.getDate() - 7);
      if (dateFilter === "Last30") from.setDate(now.getDate() - 30);

      query.createdAt = { $gte: from };
    }

    // 🔽 Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };

    // 🚀 AGGREGATION (JOIN CAMPAIGN NAME)
    const logs = await db.collection("email_logs").aggregate([
      { $match: query },

      {
        $lookup: {
          from: "campaigns",
          let: { cid: "$campaignId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [{ $toString: "$_id" }, "$$cid"],
                },
              },
            },
          ],
          as: "campaignData",
        },
      },

      {
        $addFields: {
          campaignName: {
            $ifNull: [
              { $arrayElemAt: ["$campaignData.title", 0] },
              "Unknown",
            ],
          },
          campaignSubject: {
            $ifNull: [
              { $arrayElemAt: ["$campaignData.subject", 0] },
              "",
            ],
          },
        },
      },

      {
        $project: {
          campaignData: 0,
        },
      },

      { $sort: sortOption },
      { $skip: skip },
      { $limit: limit },
    ]).toArray();

    const total = await db.collection("email_logs").countDocuments(query);

    return new Response(
      JSON.stringify({
        data: logs,
        pages: Math.ceil(total / limit),
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: true }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// ================= OPTIONS =================
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
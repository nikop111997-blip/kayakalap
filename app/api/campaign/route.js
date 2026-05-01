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
      return new Response(JSON.stringify({ unauthorized: true }), {
        status: 401,
        headers: corsHeaders,
      });
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
        { title: { $regex: search, $options: "i" } },
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
    if (sort === "name") sortOption = { title: 1 };

    // 🚀 AGGREGATION WITH STATS
    const campaigns = await db.collection("campaigns").aggregate([
      { $match: query },

      // 🔗 Join email_logs
      {
        $lookup: {
          from: "email_logs",
          let: { campaignId: { $toString: "$_id" } },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$campaignId", "$$campaignId"],
                },
              },
            },
          ],
          as: "logs",
        },
      },

      // 📊 Stats calculation
      {
        $addFields: {
          totalEmails: { $size: "$logs" },

          openedCount: {
            $size: {
              $filter: {
                input: "$logs",
                as: "log",
                cond: { $eq: ["$$log.opened", true] },
              },
            },
          },

          clickedCount: {
            $size: {
              $filter: {
                input: "$logs",
                as: "log",
                cond: { $eq: ["$$log.clicked", true] },
              },
            },
          },
        },
      },

      // 📈 Rates
      {
        $addFields: {
          openRate: {
            $cond: [
              { $eq: ["$totalEmails", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$openedCount", "$totalEmails"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
            ],
          },

          clickRate: {
            $cond: [
              { $eq: ["$totalEmails", 0] },
              0,
              {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$clickedCount", "$totalEmails"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
            ],
          },
        },
      },

      // 🧹 remove logs array
      {
        $project: {
          logs: 0,
        },
      },

      { $sort: sortOption },
      { $skip: skip },
      { $limit: limit },
    ]).toArray();

    const total = await db.collection("campaigns").countDocuments(query);

    return new Response(
      JSON.stringify({
        data: campaigns,
        pages: Math.ceil(total / limit),
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: true }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// ================= OPTIONS =================
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
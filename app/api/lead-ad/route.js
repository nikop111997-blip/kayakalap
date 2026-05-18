import { authOptions } from "@/lib/authOptions";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    // ================= AUTH =================
    if (!session || session.user.role !== "admin") {
      return Response.json(
        {
          unauthorized: true,
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    // ================= QUERY PARAMS =================
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 20;

    const search = searchParams.get("search") || "";

    const sort = searchParams.get("sort");

    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const goal = searchParams.get("goal");
    const source = searchParams.get("source");

    const dateFilter = searchParams.get("dateFilter");

    const skip = (page - 1) * limit;

    // ================= DB =================
    const client = await clientPromise;

    const db = client.db("kayakalap");

    let query = {};

    // ================= SEARCH =================
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
        { ip: { $regex: search, $options: "i" } },
      ];
    }

    // ================= FILTERS =================
    if (goal) {
      query.goal = goal;
    }

    if (source) {
      query.source = source;
    }

    // ================= DATE FILTER =================

    // Custom date range
    if (fromDate || toDate) {
      query.createdAt = {};

      if (fromDate) {
        query.createdAt.$gte = new Date(fromDate);
      }

      if (toDate) {
        const to = new Date(toDate);

        to.setHours(23, 59, 59, 999);

        query.createdAt.$lte = to;
      }
    }

    // Quick filters
    else if (dateFilter && dateFilter !== "All") {
      const now = new Date();

      let from = new Date();

      if (dateFilter === "Today") {
        from.setHours(0, 0, 0, 0);
      } else if (dateFilter === "Last3") {
        from.setDate(now.getDate() - 3);
      } else if (dateFilter === "Last7") {
        from.setDate(now.getDate() - 7);
      } else if (dateFilter === "Last30") {
        from.setDate(now.getDate() - 30);
      }

      query.createdAt = {
        $gte: from,
      };
    }

    // ================= SORT =================
    let sortOption = {
      createdAt: -1,
    };

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    if (sort === "name") {
      sortOption = {
        fullName: 1,
      };
    }

    // ================= FETCH DATA =================
    const contactsRaw = await db
      .collection("lead_ad")
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();

    // ================= FORMAT =================
    const contacts = contactsRaw.map((item) => ({
      ...item,

      source: item.source || "Unknown",

      utm_source: item.utm_source || "direct",
      utm_medium: item.utm_medium || "website",
      utm_campaign: item.utm_campaign || "default",
    }));

    // ================= TOTAL =================
    const total = await db
      .collection("lead_ad")
      .countDocuments(query);

    // ================= RESPONSE =================
    return Response.json({
      success: true,
      data: contacts,

      total,
      page,
      limit,

      pages: Math.ceil(total / limit),
    });

  } catch (error) {
    console.error("GET LEADS ERROR:", error);

    return Response.json(
      {
        success: false,
        error: true,
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}
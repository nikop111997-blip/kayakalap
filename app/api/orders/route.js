import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const plan = searchParams.get("plan");
    const product = searchParams.get("product");

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");

    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder =
      searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query = {};

    // SEARCH
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        {
          paymentRequestId: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    // STATUS
    if (status && status !== "All") {
      query.status = {
        $regex: `^${status}$`,
        $options: "i",
      };
    }

    // PLAN
    if (plan && plan !== "All") {
      query.plan = plan;
    }

    // PRODUCT TYPE
    if (product && product !== "All") {
      if (product === "Journal") {
        query.product = { $ne: null };
      }

      if (product === "Plans") {
        query.product = null;
      }
    }

    // DATE RANGE
    if (startDate || endDate) {
      query.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        query.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        query.createdAt.$lte = end;
      }
    }

    // AMOUNT RANGE
    if (minAmount || maxAmount) {
      query.amount = {};

      if (minAmount) {
        query.amount.$gte = Number(minAmount);
      }

      if (maxAmount) {
        query.amount.$lte = Number(maxAmount);
      }
    }

    const client = await clientPromise;
    const db = client.db("kayakalap");

    console.log("FILTER QUERY =>", query);

    const totalRecords = await db
      .collection("orders")
      .countDocuments(query);

    const orders = await db
      .collection("orders")
      .find(query)
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        totalRecords,
        currentPage: page,
        totalPages: Math.ceil(
          totalRecords / limit
        ),
        limit,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
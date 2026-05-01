import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const body = await req.json();

    const {
      name,
      projectData,
      compiledHtml,
      compiledCss,
      templateId
    } = body;

    if (!name) {
      return Response.json({ error: "Template name required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("kayakalap");
    const collection = db.collection("email_templates");

    // ✅ 1. PRIORITY: Update by templateId (if editing)
    if (templateId) {
      await collection.updateOne(
        { _id: new ObjectId(templateId) },
        {
          $set: {
            name,
            projectData,
            compiledHtml,
            compiledCss,
            updatedAt: new Date(),
          },
        }
      );

      return Response.json({ success: true, updated: true, type: "id" });
    }

    // ✅ 2. CHECK IF NAME EXISTS
    const existingTemplate = await collection.findOne({ name });

    if (existingTemplate) {
      // 🔁 UPDATE EXISTING
      await collection.updateOne(
        { _id: existingTemplate._id },
        {
          $set: {
            projectData,
            compiledHtml,
            compiledCss,
            updatedAt: new Date(),
          },
        }
      );

      return Response.json({
        success: true,
        updated: true,
        type: "name",
        templateId: existingTemplate._id,
      });
    }

    // 🆕 3. CREATE NEW TEMPLATE
    const result = await collection.insertOne({
      name,
      projectData,
      compiledHtml,
      compiledCss,
      createdAt: new Date(),
    });

    return Response.json({
      success: true,
      insertedId: result.insertedId,
      type: "new",
    });

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    // 🔍 Query Params
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    const skip = (page - 1) * limit;

    const client = await clientPromise;
    const db = client.db("kayakalap");
    const collection = db.collection("email_templates");

    // 🧠 FILTER QUERY
    let query = {};

    // 🔍 Search by name (case-insensitive)
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // 📅 Date filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    // 🔽 SORT LOGIC
    let sortOption = { createdAt: -1 }; // default newest

    if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else if (sort === "name") {
      sortOption = { name: 1 };
    }

    // 📊 FETCH DATA
    const total = await collection.countDocuments(query);

    const templates = await collection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray();

    return Response.json({
      success: true,
      data: templates,
      page,
      pages: Math.ceil(total / limit),
      total,
    });

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
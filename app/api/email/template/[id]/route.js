import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// ✅ GET TEMPLATE BY ID
export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const client = await clientPromise;
    const db = client.db("kayakalap");

    const template = await db.collection("email_templates").findOne({
      _id: new ObjectId(id),
    });

    if (!template) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    return Response.json({ success: true, data: template });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Invalid ID" }, { status: 400 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const { name, projectData, compiledHtml, compiledCss } = body;

    const client = await clientPromise;
    const db = client.db("kayakalap");

    await db.collection("email_templates").updateOne(
      { _id: new ObjectId(id) },
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

    return Response.json({ success: true, updated: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;

    const client = await clientPromise;
    const db = client.db("kayakalap");

    await db.collection("email_templates").deleteOne({
      _id: new ObjectId(id),
    });

    return Response.json({ success: true, deleted: true });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Delete failed" }, { status: 500 });
  }
}
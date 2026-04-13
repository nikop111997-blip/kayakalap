import { put, del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// 🔹 UPLOAD IMAGE
export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // ✅ SAFE EXTENSION HANDLING
    const originalName = file?.name || "";
    let fileExtension = "jpg";

    if (originalName && originalName.includes(".")) {
      fileExtension = originalName.split(".").pop();
    }

    const fileName = `${randomUUID()}.${fileExtension}`;

    const blob = await put(fileName, file, {
      access: "public",
    });

    return NextResponse.json({
      url: blob.url,
      key: blob.pathname,
    });

  } catch (error) {
    console.error("Upload Error:", error);

    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}

// 🔹 DELETE IMAGE
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "No file key provided" },
        { status: 400 }
      );
    }

    // Delete from Vercel Blob
    await del(key);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json(
      { error: "Delete failed" },
      { status: 500 }
    );
  }
}
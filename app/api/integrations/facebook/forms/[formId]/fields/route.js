import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

import { authOptions } from "@/lib/authOptions";
import { getFacebookCollections } from "@/lib/facebook/db";
import { decryptToken } from "@/lib/facebook/encryption";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!["admin", "superadmin"].includes(session.user.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { formId } = await params;

    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json(
        { success: false, message: "pageId is required" },
        { status: 400 }
      );
    }

    const userId = new ObjectId(session.user.id);

    const { pages } = await getFacebookCollections();

    // Find the exact Page
    const page = await pages.findOne({
      pageId,
      userId,
      status: "connected",
    });

    if (!page?.pageAccessTokenEncrypted) {
      return NextResponse.json(
        { success: false, message: "Page not found or not connected" },
        { status: 404 }
      );
    }

    const pageAccessToken = decryptToken(
      page.pageAccessTokenEncrypted
    );

    const version =
      process.env.META_GRAPH_API_VERSION || "v27.0";

    const url = new URL(
      `https://graph.facebook.com/${version}/${formId}`
    );

    url.searchParams.set(
      "fields",
      "id,name,questions,status"
    );

    url.searchParams.set("access_token", pageAccessToken);

    const response = await fetch(url);
    const result = await response.json();

    if (!response.ok || result.error) {
      console.error("FACEBOOK_FORM_FIELDS_ERROR:", {
        pageId,
        formId,
        message: result.error?.message,
        code: result.error?.code,
        errorSubcode: result.error?.error_subcode,
      });

      return NextResponse.json(
        {
          success: false,
          message:
            result.error?.message ||
            "Unable to fetch form questions",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      page: {
        id: page.pageId,
        name: page.pageName,
      },
      form: {
        id: result.id,
        name: result.name,
        status: result.status,
      },
      questions: result.questions || [],
    });

  } catch (error) {
    console.error(
      "FACEBOOK_FORM_FIELDS_ROUTE_ERROR:",
      error.message
    );

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch form questions",
      },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

import { authOptions } from "@/lib/authOptions";
import { getFacebookCollections } from "@/lib/facebook/db";
import { decryptToken } from "@/lib/facebook/encryption";

export async function GET(req) {
  try {
    // 1. Authentication
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

    // 2. Get selected Page ID
    const { searchParams } = new URL(req.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json(
        { success: false, message: "pageId is required" },
        { status: 400 }
      );
    }

    const userId = new ObjectId(session.user.id);

    // 3. Find the selected Page
    const { pages } = await getFacebookCollections();

    const page = await pages.findOne({
      pageId,
      userId,
      status: "connected",
    });

    if (!page?.pageAccessTokenEncrypted) {
      return NextResponse.json(
        { success: false, message: "Facebook Page not found" },
        { status: 404 }
      );
    }

    // 4. Decrypt Page access token
    const pageAccessToken = decryptToken(
      page.pageAccessTokenEncrypted
    );

    // 5. Fetch Instant Forms
    const version = process.env.META_GRAPH_API_VERSION || "v27.0";

    const params = new URLSearchParams({
      fields: "id,name,status,locale,created_time,leads_count",
      limit: "100",
      access_token: pageAccessToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/${version}/${pageId}/leadgen_forms?${params}`
    );

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error(
        "FACEBOOK_FORMS_ERROR:",
        result.error?.message || "Unable to fetch forms"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            result.error?.message || "Unable to fetch Instant Forms",
        },
        { status: 400 }
      );
    }

    // 6. Return forms
    return NextResponse.json({
      success: true,
      page: {
        id: page.pageId,
        name: page.pageName,
      },
      count: result.data?.length || 0,
      forms: result.data || [],
    });
  } catch (error) {
    console.error("FACEBOOK_FORMS_ROUTE_ERROR:", error.message);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch Facebook Instant Forms",
      },
      { status: 500 }
    );
  }
}
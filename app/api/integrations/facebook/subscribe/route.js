
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { decryptToken } from "@/lib/facebook/encryption";
import { getFacebookCollections } from "@/lib/facebook/db";
export async function POST(req) {
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

    const { pageId } = await req.json();

    if (!pageId) {
      return NextResponse.json(
        { success: false, message: "pageId is required" },
        { status: 400 }
      );
    }

    const { pages } = await getFacebookCollections();

    const page = await pages.findOne({
      pageId: String(pageId),
    });

    if (!page || String(page.userId) !== String(session.user.id)) {
      return NextResponse.json(
        { success: false, message: "Facebook Page not found" },
        { status: 404 }
      );
    }

    if (page.status !== "connected") {
      return NextResponse.json(
        { success: false, message: "Facebook Page is not connected" },
        { status: 400 }
      );
    }

    const accessToken = decryptToken(
      page.pageAccessTokenEncrypted
    );

    const version =
      process.env.META_GRAPH_API_VERSION || "v27.0";

    const url = new URL(
      `https://graph.facebook.com/${version}/${pageId}/subscribed_apps`
    );

    url.searchParams.set("subscribed_fields", "leadgen");
    url.searchParams.set("access_token", accessToken);

    const response = await fetch(url.toString(), {
      method: "POST",
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || data.error || !data.success) {
      console.error("Meta Page subscription error:", data.error);

      return NextResponse.json(
        {
          success: false,
          message:
            data.error?.message ||
            "Unable to subscribe Facebook Page to lead notifications",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Facebook Page subscribed to leadgen webhook",
      pageId: String(pageId),
    });
  } catch (error) {
    console.error("Facebook subscribe API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to subscribe Facebook Page",
      },
      { status: 500 }
    );
  }
}

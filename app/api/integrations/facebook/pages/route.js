import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

import { authOptions } from "@/lib/authOptions";
import { getFacebookCollections } from "@/lib/facebook/db";
import { decryptToken, encryptToken } from "@/lib/facebook/encryption";

export async function GET() {
  try {
    // 1. Authenticate admin
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

    // 2. Get MongoDB collections
    const {
      integrations,
      pages,
    } = await getFacebookCollections();

    const userId = new ObjectId(session.user.id);

    // 3. Find connected Facebook integration
    const integration = await integrations.findOne({
      provider: "facebook",
      userId,
      status: "connected",
    });

    if (!integration?.accessTokenEncrypted) {
      return NextResponse.json(
        {
          success: false,
          message: "Facebook account is not connected",
        },
        { status: 404 }
      );
    }

    // 4. Decrypt Facebook user access token
    const userAccessToken = decryptToken(
      integration.accessTokenEncrypted
    );

    // 5. Fetch Facebook Pages
    const version = process.env.META_GRAPH_API_VERSION || "v27.0";

    const params = new URLSearchParams({
      fields: "id,name,access_token,tasks",
      limit: "100",
      access_token: userAccessToken,
    });

    const graphResponse = await fetch(
      `https://graph.facebook.com/${version}/me/accounts?${params}`
    );

    const graphData = await graphResponse.json();

    if (!graphResponse.ok || graphData.error) {
      console.error(
        "FACEBOOK_PAGES_ERROR:",
        graphData.error?.message || "Unable to fetch pages"
      );

      return NextResponse.json(
        {
          success: false,
          message:
            graphData.error?.message ||
            "Unable to fetch Facebook Pages",
        },
        { status: 400 }
      );
    }

    const facebookPages = graphData.data || [];

    // 6. Save Pages in MongoDB
    const savedPages = [];

    for (const page of facebookPages) {
      const encryptedPageToken = encryptToken(page.access_token);

      await pages.updateOne(
        {
          pageId: page.id,
          userId,
        },
        {
          $set: {
            pageId: page.id,
            pageName: page.name,
            userId,
            integrationId: integration._id,
            pageAccessTokenEncrypted: encryptedPageToken,
            tasks: page.tasks || [],
            status: "connected",
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );

      savedPages.push({
        id: page.id,
        name: page.name,
        tasks: page.tasks || [],
      });
    }

    return NextResponse.json({
      success: true,
      message: "Facebook Pages fetched successfully",
      count: savedPages.length,
      pages: savedPages,
    });
  } catch (error) {
    console.error("FACEBOOK_PAGES_ROUTE_ERROR:", error.message);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch Facebook Pages",
      },
      { status: 500 }
    );
  }
}
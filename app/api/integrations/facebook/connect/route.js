import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { authOptions } from "@/lib/authOptions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Adjust this list if your CRM uses different admin role names.
    if (!["admin", "superadmin"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const appId = process.env.META_APP_ID;
    const redirectUri = process.env.META_OAUTH_REDIRECT_URI;
    const apiVersion = process.env.META_GRAPH_API_VERSION;

    if (!appId || !redirectUri || !apiVersion) {
      throw new Error("Facebook OAuth environment variables missing");
    }

    const state = randomBytes(32).toString("hex");

    const oauthUrl = new URL(
      `https://www.facebook.com/${apiVersion}/dialog/oauth`
    );

    oauthUrl.searchParams.set("client_id", appId);
    oauthUrl.searchParams.set("redirect_uri", redirectUri);
    oauthUrl.searchParams.set("state", state);
    oauthUrl.searchParams.set("response_type", "code");

    oauthUrl.searchParams.set(
      "scope",
      [
        "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_manage_ads",
  "leads_retrieval",
  "business_management",
      ].join(",")
    );

    const response = NextResponse.redirect(oauthUrl.toString());

    response.cookies.set("facebook_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    });

    return response;
  } catch (error) {
    console.error("Facebook OAuth Connect:", error);

    return NextResponse.json(
      { error: "Unable to start Facebook connection" },
      { status: 500 }
    );
  }
}
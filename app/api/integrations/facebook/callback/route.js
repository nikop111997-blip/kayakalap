
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { authOptions } from "@/lib/authOptions";
import { getFacebookCollections } from "@/lib/facebook/db";
import { encryptToken } from "@/lib/facebook/encryption";


export const runtime = "nodejs";

function safeEqual(a, b) {
  const first = Buffer.from(a || "");
  const second = Buffer.from(b || "");

  return (
    first.length === second.length &&
    crypto.timingSafeEqual(first, second)
  );
}


function redirectToSettings(req, status) {
  const url = new URL("/integration", req.url);

  url.searchParams.set("facebook", status);

  const response = NextResponse.redirect(url);

  response.cookies.delete("facebook_oauth_state");

  return response;
}


async function graphRequest(url) {
  const response = await fetch(url, {
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(
      data.error?.message || "Meta Graph API request failed"
    );
  }

  return data;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return redirectToSettings(req, "unauthorized");
    }

    if (!["admin", "superadmin"].includes(session.user.role)) {
      return redirectToSettings(req, "forbidden");
    }

    const { searchParams } = new URL(req.url);

    const code = searchParams.get("code");
    const returnedState = searchParams.get("state");
    const savedState = req.cookies.get("facebook_oauth_state")?.value;

    if (
      !code ||
      !returnedState ||
      !savedState ||
      !safeEqual(returnedState, savedState)
    ) {
      return redirectToSettings(req, "invalid-state");
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = process.env.META_OAUTH_REDIRECT_URI;
    const version = process.env.META_GRAPH_API_VERSION;

    if (!appId || !appSecret || !redirectUri || !version) {
      throw new Error("Facebook OAuth configuration is incomplete");
    }

    // 1. Exchange authorization code for short-lived token

    const shortTokenUrl = new URL(
      `https://graph.facebook.com/${version}/oauth/access_token`
    );

    shortTokenUrl.searchParams.set("client_id", appId);
    shortTokenUrl.searchParams.set("client_secret", appSecret);
    shortTokenUrl.searchParams.set("redirect_uri", redirectUri);
    shortTokenUrl.searchParams.set("code", code);

    const shortToken = await graphRequest(shortTokenUrl);

    // 2. Exchange for long-lived user token

    const longTokenUrl = new URL(
      `https://graph.facebook.com/${version}/oauth/access_token`
    );

    longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
    longTokenUrl.searchParams.set("client_id", appId);
    longTokenUrl.searchParams.set("client_secret", appSecret);
    longTokenUrl.searchParams.set(
      "fb_exchange_token",
      shortToken.access_token
    );

    const longToken = await graphRequest(longTokenUrl);

    const accessToken = longToken.access_token;

    if (!accessToken) {
      throw new Error("Meta did not return an access token");
    }

    // 3. Fetch Facebook user information

    const meUrl = new URL(
      `https://graph.facebook.com/${version}/me`
    );

    meUrl.searchParams.set("fields", "id,name");
    meUrl.searchParams.set("access_token", accessToken);

    const facebookUser = await graphRequest(meUrl);

    // 4. Save encrypted connection

    const { integrations } = await getFacebookCollections();

    const now = new Date();

    const expiresIn = Number(longToken.expires_in);

    const expiresAt = Number.isFinite(expiresIn)
      ? new Date(now.getTime() + expiresIn * 1000)
      : null;

    const userId = new ObjectId(session.user.id);

    await integrations.updateOne(
      {
        provider: "facebook",
        userId,
      },
      {
        $set: {
          provider: "facebook",
          appId,
          userId,
          userName: session.user.name || "",
          facebookUserId: facebookUser.id,
          facebookUserName: facebookUser.name,
          accessTokenEncrypted: encryptToken(accessToken),
          tokenType: "user",
          expiresAt,
          status: "connected",
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    return redirectToSettings(req, "connected");

 
} catch (error) {
  console.error("FACEBOOK_OAUTH_ERROR:", {
    message: error.message,
    stack: error.stack,
  });

  return redirectToSettings(req, "error");
}

}

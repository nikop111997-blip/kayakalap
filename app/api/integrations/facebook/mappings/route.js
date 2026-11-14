
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getFacebookCollections } from "@/lib/facebook/db";
import { authOptions } from "@/lib/authOptions";

const ALLOWED_CRM_FIELDS = [
  "fullName",
  "email",
  "phone",
  "city",
  "goal",
  "currentWeight",
];

const ALLOWED_STATUSES = ["new"];

// ---------------------------------------------
// AUTHENTICATION
// ---------------------------------------------

async function authenticateAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: "Unauthorized",
      status: 401,
    };
  }

  if (!["admin", "superadmin"].includes(session.user.role)) {
    return {
      error: "Forbidden",
      status: 403,
    };
  }

  return {
    userId: String(session.user.id),
  };
}

// ---------------------------------------------
// VERIFY FACEBOOK PAGE OWNERSHIP
// ---------------------------------------------

async function verifyFacebookPage(pageId, userId) {
  const { pages } = await getFacebookCollections();

  const page = await pages.findOne({
    pageId: String(pageId),
  });

  if (!page) {
    return {
      success: false,
      error: "Facebook Page not found in database",
      status: 404,
    };
  }

  // Compare IDs as strings because MongoDB may store
  // userId as either ObjectId or string.
  if (String(page.userId) !== String(userId)) {
    console.error("Facebook Page ownership mismatch:", {
      pageId,
      pageUserId: String(page.userId),
      sessionUserId: String(userId),
    });

    return {
      success: false,
      error: "You do not have access to this Facebook Page",
      status: 403,
    };
  }

  if (page.status && page.status !== "connected") {
    return {
      success: false,
      error: "Facebook Page is not connected",
      status: 400,
    };
  }

  return {
    success: true,
    page,
  };
}

// ---------------------------------------------
// GET: FETCH SAVED FORM MAPPING
// ---------------------------------------------

export async function GET(req) {
  try {
    const auth = await authenticateAdmin();

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          message: auth.error,
        },
        { status: auth.status }
      );
    }

    const { searchParams } = new URL(req.url);

    const pageId = searchParams.get("pageId");
    const formId = searchParams.get("formId");

    if (!pageId || !formId) {
      return NextResponse.json(
        {
          success: false,
          message: "pageId and formId are required",
        },
        { status: 400 }
      );
    }

    // Verify Page ownership.
    const verification = await verifyFacebookPage(
      pageId,
      auth.userId
    );

    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          message: verification.error,
        },
        { status: verification.status }
      );
    }

    const { mappings } = await getFacebookCollections();

    const savedMapping = await mappings.findOne({
      userId: auth.userId,
      pageId: String(pageId),
      formId: String(formId),
    });

    return NextResponse.json({
      success: true,
      mapping: savedMapping || null,
    });
  } catch (error) {
    console.error("Facebook mapping GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch Facebook form mapping",
      },
      { status: 500 }
    );
  }
}

// ---------------------------------------------
// POST: SAVE FORM MAPPING
// ---------------------------------------------

export async function POST(req) {
  try {
    // 1. Authenticate admin.
    const auth = await authenticateAdmin();

    if (auth.error) {
      return NextResponse.json(
        {
          success: false,
          message: auth.error,
        },
        { status: auth.status }
      );
    }

    // 2. Read request body.
    const body = await req.json();

    const {
      pageId,
      formId,
      mappings: fieldMappings,
      defaultLeadStatus = "new",
    } = body;

    // 3. Validate required fields.
    if (
      !pageId ||
      !formId ||
      !Array.isArray(fieldMappings)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "pageId, formId and mappings are required",
        },
        { status: 400 }
      );
    }

    // 4. Validate default status.
    if (!ALLOWED_STATUSES.includes(defaultLeadStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid default lead status",
        },
        { status: 400 }
      );
    }

    // 5. Verify Page ownership.
    const verification = await verifyFacebookPage(
      pageId,
      auth.userId
    );

    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          message: verification.error,
        },
        { status: verification.status }
      );
    }

    const page = verification.page;

    // 6. Validate individual mappings.
    const usedFields = new Set();
    const cleanMappings = [];

    for (const item of fieldMappings) {
      if (!item || !item.questionKey) {
        return NextResponse.json(
          {
            success: false,
            message: "Every mapping must have a questionKey",
          },
          { status: 400 }
        );
      }

      const crmField = item.crmField || null;

      if (
        crmField &&
        !ALLOWED_CRM_FIELDS.includes(crmField)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid CRM field: ${crmField}`,
          },
          { status: 400 }
        );
      }

      // Prevent assigning one CRM field to multiple questions.
      if (crmField && usedFields.has(crmField)) {
        return NextResponse.json(
          {
            success: false,
            message: `${crmField} is mapped more than once`,
          },
          { status: 400 }
        );
      }

      if (crmField) {
        usedFields.add(crmField);
      }

      cleanMappings.push({
        questionKey: String(item.questionKey),
        questionLabel: String(
          item.questionLabel || item.questionKey
        ),
        questionType: String(item.questionType || "CUSTOM"),
        crmField,
      });
    }

    // 7. Save mapping.
    const { mappings } = await getFacebookCollections();

    const now = new Date();

    await mappings.updateOne(
      {
        userId: auth.userId,
        pageId: String(pageId),
        formId: String(formId),
      },
      {
        $set: {
          userId: auth.userId,
          pageId: String(pageId),
          pageName: page.pageName,
          formId: String(formId),

          mappings: cleanMappings,

          defaultLeadStatus,

          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      {
        upsert: true,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Facebook form mapping saved successfully",
      data: {
        pageId: String(pageId),
        pageName: page.pageName,
        formId: String(formId),
        defaultLeadStatus,
        totalQuestions: cleanMappings.length,
        mappedQuestions: cleanMappings.filter(
          (item) => item.crmField
        ).length,
      },
    });
  } catch (error) {
    console.error("Facebook mapping POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to save mapping",
      },
      { status: 500 }
    );
  }
}


import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { randomUUID } from "crypto";
import { sendMetaCRMEvent } from "@/lib/meta-capi";

const STATUSES = [
  "New",
  "Interested",
  "Not Interested",
  "Invalid",
  "Converted",
  "Call Back",
];

const META_EVENT_MAP = {
  New: "Lead",
  Interested: "Interested",
  "Not Interested": "NotInterested",
  Invalid: "Invalid",
  Converted: "Converted",
  "Call Back": "CallBack",
};

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!ObjectId.isValid(id)) {
      return Response.json(
        { success: false, message: "Invalid lead ID" },
        { status: 400 }
      );
    }

    if (!STATUSES.includes(body.status)) {
      return Response.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("kayakalap");
    const contacts = db.collection("contacts");

    const lead = await contacts.findOne({
      _id: new ObjectId(id),
    });

    if (!lead) {
      return Response.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    if (lead.status === body.status) {
      return Response.json({
        success: true,
        changed: false,
        message: "Status unchanged",
      });
    }

    const previousStatus = lead.status || null;
    const newStatus = body.status;
    const changedAt = new Date();
    const eventId = randomUUID();

    const event = {
      eventId,
      eventName: META_EVENT_MAP[newStatus],
      previousStatus,
      newStatus,
      eventTime: changedAt,
      deliveryStatus: "pending",
      attempts: 0,
      response: null,
      lastError: null,
      createdAt: changedAt,
    };

    // Save status, history and pending Meta event together.
    const update = await contacts.updateOne(
      {
        _id: new ObjectId(id),
        status: lead.status,
      },
      {
        $set: {
          status: newStatus,
          updatedAt: changedAt,
        },
        $push: {
          statusHistory: {
            from: previousStatus,
            to: newStatus,
            changedAt,
          },
          "metaConversions.events": event,
        },
      }
    );

    if (update.modifiedCount !== 1) {
      return Response.json(
        {
          success: false,
          message: "Lead was updated concurrently. Please retry.",
        },
        { status: 409 }
      );
    }

    // CRM update is already saved.
    // Meta failure must never undo the status change.
    let metaStatus = "pending";

    try {
      const result = await sendMetaCRMEvent({
        lead: {
          ...lead,
          meta: lead.meta || {},
        },
        eventName: event.eventName,
        eventTime: changedAt,
        eventId,
      });

      metaStatus = "sent";

      await contacts.updateOne(
        {
          _id: new ObjectId(id),
          "metaConversions.events.eventId": eventId,
        },
        {
          $set: {
            "metaConversions.events.$.deliveryStatus": "sent",
            "metaConversions.events.$.attempts": 1,
            "metaConversions.events.$.response": result,
            "metaConversions.events.$.sentAt": new Date(),
          },
        }
      );

    } catch (metaError) {
      metaStatus = "failed";

      console.error("Meta CRM event delivery failed:", metaError);

      await contacts.updateOne(
        {
          _id: new ObjectId(id),
          "metaConversions.events.eventId": eventId,
        },
        {
          $set: {
            "metaConversions.events.$.deliveryStatus": "failed",
            "metaConversions.events.$.attempts": 1,
            "metaConversions.events.$.lastError":
              metaError.message,
          },
        }
      );
    }

    return Response.json({
      success: true,
      changed: true,
      previousStatus,
      newStatus,
      metaStatus,
      eventId,
      message: "Lead status updated successfully",
    });

  } catch (error) {
    console.error("Lead status update error:", error);

    return Response.json(
      {
        success: false,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/* =========================================================
   HELPERS
========================================================= */

function serializeId(value) {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (value?.$oid) {
    return value.$oid;
  }

  if (value?.toString) {
    return value.toString();
  }

  return String(value);
}

/* =========================================================
   PRICE RANGE
========================================================= */

function getPriceRange(tickets = []) {
  if (!Array.isArray(tickets) || !tickets.length) {
    return "";
  }

  const prices = tickets
    .map((ticket) => Number(ticket?.price))
    .filter((price) => Number.isFinite(price));

  if (!prices.length) {
    return "";
  }

  const minPrice = Math.min(...prices);

  return `₹${minPrice.toLocaleString("en-IN")} onwards`;
}

/* =========================================================
   EMPTY EDITOR DATA
========================================================= */

function emptyEditorData() {
  return {
    time: Date.now(),
    blocks: [],
    version: "2.31.0",
  };
}

/* =========================================================
   FORMAT EVENT
========================================================= */

function formatEvent(event) {
  if (!event) return null;

  return {
    ...event,

    /* IDs */
    _id: serializeId(event._id),
    id: serializeId(event._id),

    /* Basic */
    title: event.title || "",
    subtitle: event.subtitle || "",

    /* Image */
    imageUrl: event.imageUrl || "",
    imageKey: event.imageKey || "",

    /* Tags */
    tags: Array.isArray(event.tags)
      ? event.tags
      : [],

    /* Interested */
    interestedCount: Number(
      event.interestedCount || 0
    ),

    /* Event information */
    venue: event.venue || "",
    location: event.location || "",
    mapsLink: event.mapsLink || "",
    duration: event.duration || "",
    ageLimit: event.ageLimit || "",
    language: event.language || "",
    genre: event.genre || "",

    /* Status */
    status: event.status || "draft",
    isActive: event.isActive === true,

    /* Slots */
    totalSlots: Number(
      event.totalSlots || 0
    ),

    /* Event details */
    details:
      event.details ||
      emptyEditorData(),

    /* Price */
    priceRange:
      event.priceRange ||
      getPriceRange(event.tickets),

    /* Dates */
    dates: Array.isArray(event.dates)
      ? event.dates.map((date) => ({
          ...date,

          _id: serializeId(
            date?._id
          ),

          id: serializeId(
            date?._id
          ),

          date: date?.date
            ? new Date(date.date).toISOString()
            : null,

          time: date?.time || "",
        }))
      : [],

    /* Tickets */
    tickets: Array.isArray(event.tickets)
      ? event.tickets.map((ticket) => ({
          ...ticket,

          _id: serializeId(
            ticket?._id
          ),

          id: serializeId(
            ticket?._id
          ),

          name: ticket?.name || "",

          price: Number(
            ticket?.price || 0
          ),

          slots: Number(
            ticket?.slots || 0
          ),

          description:
            ticket?.description || "",

          details:
            ticket?.details ||
            emptyEditorData(),

          bookingUrl:
            ticket?.bookingUrl || "",

          isActive:
            ticket?.isActive === true,

          createdAt:
            ticket?.createdAt || null,

          updatedAt:
            ticket?.updatedAt || null,
        }))
      : [],
  };
}

/* =========================================================
   GET
   /api/events
========================================================= */

export async function GET() {
  try {
    /* =====================================================
       DATABASE
    ===================================================== */

    const client = await clientPromise;

    const db = client.db("kayakalap");

    const collection =
      db.collection("events");

    /* =====================================================
       GET ONE PUBLISHED + ACTIVE EVENT
       
       ONLY:
       status === "published"
       AND
       isActive === true
    ===================================================== */

    const event =
      await collection.findOne(
        {
          status: "published",
          isActive: true,
        },
        {
          sort: {
            createdAt: -1,
          },
        }
      );

    /* =====================================================
       NO EVENT FOUND
    ===================================================== */

    if (!event) {
      return NextResponse.json({
        success: true,
        event: null,
      });
    }

    /* =====================================================
       FORMAT EVENT
    ===================================================== */

    const formattedEvent =
      formatEvent(event);

    /* =====================================================
       RESPONSE
    ===================================================== */

    return NextResponse.json({
      success: true,
      event: formattedEvent,
    });
  } catch (error) {
    console.error(
      "GET /api/events error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch event",
      },
      {
        status: 500,
      }
    );
  }
}
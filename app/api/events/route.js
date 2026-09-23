import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

const DB_NAME = "kayakalap";
const COLLECTION_NAME = "events";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function isValidObjectId(id) {
  return ObjectId.isValid(id);
}

function normalizeEditorData(data) {
  if (!data || typeof data !== "object") {
    return {
      time: null,
      blocks: [],
      version: "",
    };
  }

  return {
    time: data.time || null,
    blocks: Array.isArray(data.blocks)
      ? data.blocks
      : [],
    version: data.version || "",
  };
}

function validateEditorData(data, fieldName) {
  if (!data) {
    return {
      valid: true,
    };
  }

  if (typeof data !== "object") {
    return {
      valid: false,
      message: `${fieldName} must be valid Editor.js data`,
    };
  }

  if (!Array.isArray(data.blocks)) {
    return {
      valid: false,
      message: `${fieldName}.blocks must be an array`,
    };
  }

  return {
    valid: true,
  };
}

function validateDates(dates) {
  if (!Array.isArray(dates) || dates.length === 0) {
    return {
      valid: false,
      message: "At least one event date is required",
    };
  }

  for (const dateItem of dates) {
    if (!dateItem.date) {
      return {
        valid: false,
        message: "Every event date requires a date",
      };
    }

    if (!dateItem.time) {
      return {
        valid: false,
        message: "Every event date requires a time",
      };
    }

    const date = new Date(dateItem.date);

    if (Number.isNaN(date.getTime())) {
      return {
        valid: false,
        message: `Invalid date: ${dateItem.date}`,
      };
    }
  }

  return {
    valid: true,
  };
}

function validateTickets(tickets, totalSlots) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return {
      valid: false,
      message: "At least one ticket category is required",
    };
  }

  let totalTicketSlots = 0;

  for (const ticket of tickets) {
    if (!ticket.name?.trim()) {
      return {
        valid: false,
        message: "Ticket name is required",
      };
    }

    const price = Number(ticket.price);
    const slots = Number(ticket.slots);

    if (Number.isNaN(price) || price < 0) {
      return {
        valid: false,
        message: `Invalid price for "${ticket.name}"`,
      };
    }

    if (
      Number.isNaN(slots) ||
      !Number.isInteger(slots) ||
      slots < 1
    ) {
      return {
        valid: false,
        message: `Invalid slots for "${ticket.name}"`,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Individual ticket category cannot exceed total event slots
    |--------------------------------------------------------------------------
    */

    if (slots > totalSlots) {
      return {
        valid: false,

        message:
          `"${ticket.name}" has ${slots} slots, ` +
          `but event has only ${totalSlots} total slots`,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Ticket Editor.js validation
    |--------------------------------------------------------------------------
    */

    const editorValidation = validateEditorData(
      ticket.details,
      `Ticket "${ticket.name}" details`
    );

    if (!editorValidation.valid) {
      return editorValidation;
    }

    totalTicketSlots += slots;
  }

  /*
  |--------------------------------------------------------------------------
  | IMPORTANT
  |
  | Sum of ALL ticket categories cannot exceed totalSlots
  |--------------------------------------------------------------------------
  */

  if (totalTicketSlots > totalSlots) {
    return {
      valid: false,

      message:
        `Total ticket slots (${totalTicketSlots}) ` +
        `cannot exceed total event slots (${totalSlots})`,
    };
  }

  return {
    valid: true,
    totalTicketSlots,
  };
}

function prepareTickets(tickets) {
  return tickets.map((ticket) => ({
    _id: new ObjectId(),

    name: ticket.name.trim(),

    price: Number(ticket.price),

    slots: Number(ticket.slots),

    description:
      ticket.description?.trim() || "",

    details: normalizeEditorData(
      ticket.details
    ),

    bookingUrl:
      ticket.bookingUrl?.trim() || "",

    isActive:
      ticket.isActive !== undefined
        ? Boolean(ticket.isActive)
        : true,

    createdAt: new Date(),

    updatedAt: new Date(),
  }));
}

/*
|--------------------------------------------------------------------------
| GET /api/events
|--------------------------------------------------------------------------
|
| Get all events
|
| Optional:
|
| /api/events?status=published
| /api/events?active=true
|
*/

export async function GET(request) {
  try {
    const client = await clientPromise;

    const db = client.db(DB_NAME);

    const collection =
      db.collection(COLLECTION_NAME);

    const { searchParams } =
      new URL(request.url);

    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const active = searchParams.get("active");

    /*
    |--------------------------------------------------------------------------
    | Get single event
    |--------------------------------------------------------------------------
    */

    if (id) {
      if (!isValidObjectId(id)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid event ID",
          },
          {
            status: 400,
          }
        );
      }

      const event =
        await collection.findOne({
          _id: new ObjectId(id),
        });

      if (!event) {
        return NextResponse.json(
          {
            success: false,
            message: "Event not found",
          },
          {
            status: 404,
          }
        );
      }

      return NextResponse.json({
        success: true,
        event,
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Get all events
    |--------------------------------------------------------------------------
    */

    const query = {};

    if (status) {
      query.status = status;
    }

    if (active === "true") {
      query.isActive = true;
    }

    if (active === "false") {
      query.isActive = false;
    }

    const events = await collection
      .find(query)
      .sort({
        createdAt: -1,
      })
      .toArray();

    return NextResponse.json({
      success: true,

      count: events.length,

      events,
    });
  } catch (error) {
    console.error(
      "GET EVENTS ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch events",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST /api/events
|--------------------------------------------------------------------------
|
| Create new event
|--------------------------------------------------------------------------
*/

export async function POST(request) {
  try {
    const client = await clientPromise;

    const db = client.db(DB_NAME);

    const collection =
      db.collection(COLLECTION_NAME);

    const body = await request.json();

    const {
      title,
      subtitle,
      imageUrl,
      tags,
      details,

      dates,

      duration,
      ageLimit,
      language,
      genre,

      venue,
      location,
      mapsLink,

      totalSlots,

      tickets,

      interestedCount,
      status,
      isActive,
    } = body;

    /*
    |--------------------------------------------------------------------------
    | Basic validation
    |--------------------------------------------------------------------------
    */

    if (!title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Event title is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!venue?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Venue is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!location?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Location is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Total slots
    |--------------------------------------------------------------------------
    */

    const parsedTotalSlots =
      Number(totalSlots);

    if (
      !Number.isInteger(
        parsedTotalSlots
      ) ||
      parsedTotalSlots < 1
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "totalSlots must be a positive integer",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Event Editor.js details
    |--------------------------------------------------------------------------
    */

    const editorValidation =
      validateEditorData(
        details,
        "Event details"
      );

    if (!editorValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message:
            editorValidation.message,
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Dates
    |--------------------------------------------------------------------------
    */

    const dateValidation =
      validateDates(dates);

    if (!dateValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message:
            dateValidation.message,
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Tickets
    |--------------------------------------------------------------------------
    */

    const ticketValidation =
      validateTickets(
        tickets,
        parsedTotalSlots
      );

    if (!ticketValidation.valid) {
      return NextResponse.json(
        {
          success: false,

          message:
            ticketValidation.message,
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Create event
    |--------------------------------------------------------------------------
    */

    const now = new Date();

    const newEvent = {
      title: title.trim(),

      subtitle:
        subtitle?.trim() || "",

      imageUrl:
        imageUrl?.trim() || "",

      tags: Array.isArray(tags)
        ? tags
            .map((tag) =>
              String(tag).trim()
            )
            .filter(Boolean)
        : [],

      /*
      | Editor.js data
      */

      details:
        normalizeEditorData(details),

      /*
      | Event dates
      */

      dates: dates.map((item) => ({
        _id: new ObjectId(),

        date: new Date(item.date),

        time: item.time.trim(),
      })),

      duration:
        duration?.trim() || "",

      ageLimit:
        ageLimit?.trim() || "",

      language:
        language?.trim() || "",

      genre:
        genre?.trim() || "",

      venue: venue.trim(),

      location:
        location.trim(),

      mapsLink:
        mapsLink?.trim() || "",

      /*
      | Slots
      */

      totalSlots:
        parsedTotalSlots,

      /*
      | Ticket categories
      */

      tickets:
        prepareTickets(tickets),

      interestedCount:
        Number(interestedCount || 0),

      status:
        status || "draft",

      isActive:
        isActive !== undefined
          ? Boolean(isActive)
          : true,

      createdAt: now,

      updatedAt: now,
    };

    const result =
      await collection.insertOne(
        newEvent
      );

    const createdEvent =
      await collection.findOne({
        _id: result.insertedId,
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "Event created successfully",

        event: createdEvent,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CREATE EVENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to create event",
      },
      {
        status: 500,
      }
    );
  }
}


export async function PATCH(request) {
  try {
    const client = await clientPromise;

    const db = client.db(DB_NAME);

    const collection =
      db.collection(COLLECTION_NAME);

    const { searchParams } =
      new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Event ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID",
        },
        {
          status: 400,
        }
      );
    }

    const eventId =
      new ObjectId(id);

    const existingEvent =
      await collection.findOne({
        _id: eventId,
      });

    if (!existingEvent) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    /*
    |--------------------------------------------------------------------------
    | Merge values
    |--------------------------------------------------------------------------
    */

    const totalSlots =
      body.totalSlots !== undefined
        ? Number(body.totalSlots)
        : existingEvent.totalSlots;

    const tickets =
      body.tickets !== undefined
        ? body.tickets
        : existingEvent.tickets;

    const dates =
      body.dates !== undefined
        ? body.dates
        : existingEvent.dates;

    /*
    |--------------------------------------------------------------------------
    | Validate total slots
    |--------------------------------------------------------------------------
    */

    if (
      !Number.isInteger(totalSlots) ||
      totalSlots < 1
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "totalSlots must be a positive integer",
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate tickets
    |--------------------------------------------------------------------------
    */

    const ticketValidation =
      validateTickets(
        tickets,
        totalSlots
      );

    if (!ticketValidation.valid) {
      return NextResponse.json(
        {
          success: false,

          message:
            ticketValidation.message,
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate dates
    |--------------------------------------------------------------------------
    */

    const dateValidation =
      validateDates(dates);

    if (!dateValidation.valid) {
      return NextResponse.json(
        {
          success: false,

          message:
            dateValidation.message,
        },
        {
          status: 400,
        }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Update object
    |--------------------------------------------------------------------------
    */

    const update = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      update.title =
        body.title.trim();
    }

    if (body.subtitle !== undefined) {
      update.subtitle =
        body.subtitle?.trim() || "";
    }

    if (body.imageUrl !== undefined) {
      update.imageUrl =
        body.imageUrl?.trim() || "";
    }

    if (body.tags !== undefined) {
      update.tags =
        Array.isArray(body.tags)
          ? body.tags
              .map((tag) =>
                String(tag).trim()
              )
              .filter(Boolean)
          : [];
    }

    /*
    |--------------------------------------------------------------------------
    | Event Editor.js
    |--------------------------------------------------------------------------
    */

    if (body.details !== undefined) {
      const validation =
        validateEditorData(
          body.details,
          "Event details"
        );

      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            message:
              validation.message,
          },
          {
            status: 400,
          }
        );
      }

      update.details =
        normalizeEditorData(
          body.details
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Dates
    |--------------------------------------------------------------------------
    */

    if (body.dates !== undefined) {
      update.dates =
        body.dates.map((item) => ({
          _id:
            item._id
              ? new ObjectId(item._id)
              : new ObjectId(),

          date:
            new Date(item.date),

          time:
            item.time.trim(),
        }));
    }

    if (body.duration !== undefined) {
      update.duration =
        body.duration?.trim() || "";
    }

    if (body.ageLimit !== undefined) {
      update.ageLimit =
        body.ageLimit?.trim() || "";
    }

    if (body.language !== undefined) {
      update.language =
        body.language?.trim() || "";
    }

    if (body.genre !== undefined) {
      update.genre =
        body.genre?.trim() || "";
    }

    if (body.venue !== undefined) {
      update.venue =
        body.venue.trim();
    }

    if (body.location !== undefined) {
      update.location =
        body.location.trim();
    }

    if (body.mapsLink !== undefined) {
      update.mapsLink =
        body.mapsLink?.trim() || "";
    }

    /*
    |--------------------------------------------------------------------------
    | Slots
    |--------------------------------------------------------------------------
    */

    if (body.totalSlots !== undefined) {
      update.totalSlots =
        totalSlots;
    }

    /*
    |--------------------------------------------------------------------------
    | Tickets
    |--------------------------------------------------------------------------
    */

    if (body.tickets !== undefined) {
      update.tickets =
        tickets.map((ticket) => ({
          _id:
            ticket._id &&
            isValidObjectId(
              ticket._id
            )
              ? new ObjectId(
                  ticket._id
                )
              : new ObjectId(),

          name:
            ticket.name.trim(),

          price:
            Number(ticket.price),

          slots:
            Number(ticket.slots),

          description:
            ticket.description?.trim() ||
            "",

          details:
            normalizeEditorData(
              ticket.details
            ),

          bookingUrl:
            ticket.bookingUrl?.trim() ||
            "",

          isActive:
            ticket.isActive !== undefined
              ? Boolean(
                  ticket.isActive
                )
              : true,

          createdAt:
            ticket.createdAt
              ? new Date(
                  ticket.createdAt
                )
              : new Date(),

          updatedAt:
            new Date(),
        }));
    }

    if (
      body.interestedCount !==
      undefined
    ) {
      update.interestedCount =
        Number(
          body.interestedCount
        );
    }

    if (body.status !== undefined) {
      update.status =
        body.status;
    }

    if (body.isActive !== undefined) {
      update.isActive =
        Boolean(body.isActive);
    }

    /*
    |--------------------------------------------------------------------------
    | Save
    |--------------------------------------------------------------------------
    */

    await collection.updateOne(
      {
        _id: eventId,
      },
      {
        $set: update,
      }
    );

    const updatedEvent =
      await collection.findOne({
        _id: eventId,
      });

    return NextResponse.json({
      success: true,

      message:
        "Event updated successfully",

      event: updatedEvent,
    });
  } catch (error) {
    console.error(
      "UPDATE EVENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to update event",
      },
      {
        status: 500,
      }
    );
  }
}


export async function DELETE(request) {
  try {
    const client = await clientPromise;

    const db = client.db(DB_NAME);

    const collection =
      db.collection(COLLECTION_NAME);

    const { searchParams } =
      new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Event ID is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!isValidObjectId(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid event ID",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await collection.deleteOne({
        _id: new ObjectId(id),
      });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Event not found",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Event deleted successfully",

      eventId: id,
    });
  } catch (error) {
    console.error(
      "DELETE EVENT ERROR:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to delete event",
      },
      {
        status: 500,
      }
    );
  }
}
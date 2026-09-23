"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "./Editor";

/* =========================================================
   HELPERS
========================================================= */

const EMPTY_EDITOR_DATA = {
  time: Date.now(),
  blocks: [],
  version: "2.31.0",
};

const EMPTY_DATE = {
  _id: null,
  date: "",
  time: "",
};

const EMPTY_TICKET = {
  _id: null,
  name: "",
  price: "",
  slots: 0,
  description: "",
  details: EMPTY_EDITOR_DATA,
  bookingUrl: "",
  isActive: true,
};

function formatDateForInput(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyEditorData(data) {
  if (
    data &&
    typeof data === "object" &&
    Array.isArray(data.blocks)
  ) {
    return data;
  }

  return EMPTY_EDITOR_DATA;
}

/* =========================================================
   REUSABLE INPUT
========================================================= */

function Input({
  label,
  required = false,
  error = "",
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}

          {required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>
      )}

      <input
        {...props}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition
        placeholder:text-slate-400
        focus:border-blue-500 focus:ring-4 focus:ring-blue-100
        ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-200"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function TextArea({
  label,
  required = false,
  error = "",
  className = "",
  ...props
}) {
  return (
    <div className={className}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-slate-700">
          {label}

          {required && (
            <span className="ml-1 text-red-500">*</span>
          )}
        </label>
      )}

      <textarea
        {...props}
        className={`min-h-[110px] w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition
        placeholder:text-slate-400
        focus:border-blue-500 focus:ring-4 focus:ring-blue-100
        ${
          error
            ? "border-red-400"
            : "border-slate-200"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   SECTION
========================================================= */

function Section({
  title,
  description,
  children,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  );
}

/* =========================================================
   TICKET CARD
========================================================= */

function TicketCard({
  ticket,
  index,
  totalSlots,
  allocatedSlots,
  onChange,
  onRemove,
}) {
  const remainingSlots =
    Math.max(totalSlots - (allocatedSlots - Number(ticket.slots || 0)), 0);

  const maxSlots = Math.max(
    1,
    remainingSlots
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">
            Ticket #{index + 1}
          </h3>

          {ticket._id && (
            <p className="mt-1 text-[11px] text-slate-400">
              Existing ticket
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
        >
          Remove
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Ticket Name"
          required
          placeholder="General Entry"
          value={ticket.name}
          onChange={(e) =>
            onChange(index, "name", e.target.value)
          }
        />

        <Input
          label="Price"
          required
          type="number"
          min="0"
          placeholder="999"
          value={ticket.price}
          onChange={(e) =>
            onChange(index, "price", e.target.value)
          }
        />

        <Input
          label="Available Slots"
          required
          type="number"
          min="1"
          max={maxSlots}
          value={ticket.slots}
          onChange={(e) => {
            const value = Math.max(
              1,
              Number(e.target.value || 1)
            );

            onChange(
              index,
              "slots",
              Math.min(value, maxSlots)
            );
          }}
        />

        <Input
          label="Booking URL"
          type="url"
          placeholder="https://..."
          value={ticket.bookingUrl}
          onChange={(e) =>
            onChange(
              index,
              "bookingUrl",
              e.target.value
            )
          }
        />

        <TextArea
          label="Short Description"
          placeholder="Short description for this ticket"
          className="md:col-span-2"
          value={ticket.description}
          onChange={(e) =>
            onChange(
              index,
              "description",
              e.target.value
            )
          }
        />
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Ticket Details
        </label>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Editor
            key={`ticket-editor-${
              ticket._id || `new-${index}`
            }`}
            initialData={emptyEditorData(ticket.details)}
            onChange={(data) =>
              onChange(index, "details", data)
            }
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-slate-700">
            Ticket Active
          </p>

          <p className="text-xs text-slate-400">
            Allow users to book this ticket
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange(
              index,
              "isActive",
              !ticket.isActive
            )
          }
          className={`relative h-6 w-11 rounded-full transition ${
            ticket.isActive
              ? "bg-blue-600"
              : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
              ticket.isActive
                ? "left-6"
                : "left-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN EVENT FORM
========================================================= */

export default function EventForm({
  eventId = null,
  onSuccess,
}) {
  const isEditMode = Boolean(eventId);

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [form, setForm] = useState({
    title: "",
    subtitle: "",

    imageUrl: "",
    imageKey: "",

    tags: "",

    details: EMPTY_EDITOR_DATA,

    dates: [
      {
        ...EMPTY_DATE,
      },
    ],

    duration: "",
    ageLimit: "",
    language: "",
    genre: "",

    venue: "",
    location: "",
    mapsLink: "",

    totalSlots: "",

    tickets: [],

    status: "draft",
    isActive: true,
  });

  /* =======================================================
     UI STATE
  ======================================================= */

  const [loading, setLoading] = useState(
    isEditMode
  );

  const [submitting, setSubmitting] =
    useState(false);

  const [uploadingImage, setUploadingImage] =
    useState(false);

  const [errors, setErrors] = useState({});

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  /* =======================================================
     LOAD EVENT FOR EDIT
  ======================================================= */

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadEvent() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/events?id=${encodeURIComponent(
            eventId
          )}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Failed to load event"
          );
        }

        if (cancelled) return;

        const event = data.event || data;

        setForm({
          title: event.title || "",
          subtitle: event.subtitle || "",

          imageUrl: event.imageUrl || "",
          imageKey: event.imageKey || "",

          tags: Array.isArray(event.tags)
            ? event.tags.join(", ")
            : event.tags || "",

          details: emptyEditorData(
            event.details
          ),

          dates:
            Array.isArray(event.dates) &&
            event.dates.length
              ? event.dates.map((item) => ({
                  _id: item._id || null,
                  date: formatDateForInput(
                    item.date
                  ),
                  time: item.time || "",
                }))
              : [
                  {
                    ...EMPTY_DATE,
                  },
                ],

          duration: event.duration || "",
          ageLimit: event.ageLimit || "",
          language: event.language || "",
          genre: event.genre || "",

          venue: event.venue || "",
          location: event.location || "",
          mapsLink: event.mapsLink || "",

          totalSlots:
            event.totalSlots ?? "",

          tickets:
            Array.isArray(event.tickets)
              ? event.tickets.map((ticket) => ({
                  _id: ticket._id || null,
                  name: ticket.name || "",
                  price: ticket.price ?? "",
                  slots:
                    ticket.slots ?? 1,
                  description:
                    ticket.description || "",
                  details: emptyEditorData(
                    ticket.details
                  ),
                  bookingUrl:
                    ticket.bookingUrl || "",
                  isActive:
                    ticket.isActive !== false,
                }))
              : [],

          status:
            event.status || "draft",

          isActive:
            event.isActive !== false,
        });
      } catch (error) {
        console.error(
          "Load event error:",
          error
        );

        if (!cancelled) {
          setMessage({
            type: "error",
            text:
              error.message ||
              "Failed to load event",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  /* =======================================================
     UPDATE FIELD
  ======================================================= */

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [field]: "",
    }));
  }

  /* =======================================================
     UPDATE DATE
  ======================================================= */

  function updateDate(index, field, value) {
    setForm((prev) => {
      const dates = [...prev.dates];

      dates[index] = {
        ...dates[index],
        [field]: value,
      };

      return {
        ...prev,
        dates,
      };
    });
  }

  /* =======================================================
     ADD DATE
  ======================================================= */

  function addDate() {
    setForm((prev) => ({
      ...prev,
      dates: [
        ...prev.dates,
        {
          ...EMPTY_DATE,
        },
      ],
    }));
  }

  /* =======================================================
     REMOVE DATE
  ======================================================= */

  function removeDate(index) {
    setForm((prev) => {
      if (prev.dates.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        dates: prev.dates.filter(
          (_, i) => i !== index
        ),
      };
    });
  }

  /* =======================================================
     UPDATE TICKET
  ======================================================= */

  function updateTicket(
    index,
    field,
    value
  ) {
    setForm((prev) => {
      const tickets = [...prev.tickets];

      tickets[index] = {
        ...tickets[index],
        [field]: value,
      };

      return {
        ...prev,
        tickets,
      };
    });
  }

  /* =======================================================
     ADD TICKET
  ======================================================= */

  function addTicket() {
    setForm((prev) => ({
      ...prev,
      tickets: [
        ...prev.tickets,
        {
          ...EMPTY_TICKET,
          details: {
            ...EMPTY_EDITOR_DATA,
            time: Date.now(),
          },
        },
      ],
    }));
  }

  /* =======================================================
     REMOVE TICKET
  ======================================================= */

  function removeTicket(index) {
    setForm((prev) => ({
      ...prev,
      tickets: prev.tickets.filter(
        (_, i) => i !== index
      ),
    }));
  }

  /* =======================================================
     SLOT CALCULATIONS
  ======================================================= */

  const totalSlots = Number(
    form.totalSlots || 0
  );

  const allocatedSlots = useMemo(() => {
    return form.tickets.reduce(
      (sum, ticket) =>
        sum + Number(ticket.slots || 0),
      0
    );
  }, [form.tickets]);

  const remainingSlots =
    Math.max(
      totalSlots - allocatedSlots,
      0
    );

  const slotsExceeded =
    totalSlots > 0 &&
    allocatedSlots > totalSlots;

  /* =======================================================
     IMAGE UPLOAD
  ======================================================= */

  async function uploadImage(file) {
    if (!file) return;

    setMessage({
      type: "",
      text: "",
    });

    /* ---------- SIZE ---------- */

    const maxSize = 500 * 1024;

    if (file.size > maxSize) {
      setMessage({
        type: "error",
        text: "Image must be less than 500 KB.",
      });

      return;
    }

    /* ---------- TYPE ---------- */

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: "error",
        text:
          "Only JPG, PNG and WebP images are allowed.",
      });

      return;
    }

    /* ---------- DIMENSIONS ---------- */

    const image = new Image();

    const imageUrl =
      URL.createObjectURL(file);

    image.src = imageUrl;

    try {
      await new Promise(
        (resolve, reject) => {
          image.onload = resolve;
          image.onerror = reject;
        }
      );

      const width = image.naturalWidth;
      const height = image.naturalHeight;

      if (width < 1200 || height < 675) {
        throw new Error(
          "Image must be at least 1200 × 675 px."
        );
      }

      const ratio = width / height;

      if (
        Math.abs(ratio - 16 / 9) > 0.08
      ) {
        throw new Error(
          "Image should have approximately a 16:9 ratio."
        );
      }
    } catch (error) {
      URL.revokeObjectURL(imageUrl);

      setMessage({
        type: "error",
        text:
          error.message ||
          "Invalid image dimensions.",
      });

      return;
    }

    URL.revokeObjectURL(imageUrl);

    /* ---------- UPLOAD ---------- */

    try {
      setUploadingImage(true);

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        "/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Image upload failed"
        );
      }

      /* ---------------------------------------------
         Keep old values before replacing
      --------------------------------------------- */

      const oldKey = form.imageKey;

      setForm((prev) => ({
        ...prev,
        imageUrl: data.url,
        imageKey: data.key,
      }));

      setMessage({
        type: "success",
        text: "Image uploaded successfully.",
      });

      /* ---------------------------------------------
         Delete previous blob
      --------------------------------------------- */

      if (
        oldKey &&
        oldKey !== data.key
      ) {
        try {
          await fetch(
            `/api/upload?key=${encodeURIComponent(
              oldKey
            )}`,
            {
              method: "DELETE",
            }
          );
        } catch (deleteError) {
          console.warn(
            "Old image delete failed:",
            deleteError
          );
        }
      }
    } catch (error) {
      console.error(
        "Upload image error:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.message ||
          "Image upload failed.",
      });
    } finally {
      setUploadingImage(false);
    }
  }

  /* =======================================================
     REMOVE IMAGE
  ======================================================= */

  async function removeImage() {
    const key = form.imageKey;

    if (key) {
      try {
        await fetch(
          `/api/upload?key=${encodeURIComponent(
            key
          )}`,
          {
            method: "DELETE",
          }
        );
      } catch (error) {
        console.warn(
          "Image delete failed:",
          error
        );
      }
    }

    setForm((prev) => ({
      ...prev,
      imageUrl: "",
      imageKey: "",
    }));
  }

  /* =======================================================
     VALIDATION
  ======================================================= */

  function validateForm() {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title =
        "Event title is required.";
    }

    if (!form.venue.trim()) {
      newErrors.venue =
        "Venue is required.";
    }

    if (!form.location.trim()) {
      newErrors.location =
        "Location is required.";
    }

    if (!form.totalSlots) {
      newErrors.totalSlots =
        "Total slots are required.";
    } else if (
      Number(form.totalSlots) < 1
    ) {
      newErrors.totalSlots =
        "Total slots must be at least 1.";
    }

    /* ---------- DATES ---------- */

    if (!form.dates.length) {
      newErrors.dates =
        "At least one event date is required.";
    }

    form.dates.forEach((item, index) => {
      if (!item.date) {
        newErrors[`date-${index}`] =
          "Date is required.";
      }

      if (!item.time) {
        newErrors[`time-${index}`] =
          "Time is required.";
      }
    });

    /* ---------- TICKETS ---------- */

    form.tickets.forEach(
      (ticket, index) => {
        if (!ticket.name.trim()) {
          newErrors[
            `ticket-name-${index}`
          ] =
            "Ticket name is required.";
        }

        if (
          ticket.price === "" ||
          Number(ticket.price) < 0
        ) {
          newErrors[
            `ticket-price-${index}`
          ] =
            "Valid ticket price is required.";
        }

        if (
          !Number.isInteger(
            Number(ticket.slots)
          ) ||
          Number(ticket.slots) < 1
        ) {
          newErrors[
            `ticket-slots-${index}`
          ] =
            "Slots must be at least 1.";
        }
      }
    );

    if (slotsExceeded) {
      newErrors.tickets =
        "Ticket slots cannot exceed total event slots.";
    }

    setErrors(newErrors);

    return (
      Object.keys(newErrors).length === 0
    );
  }

  /* =======================================================
     PREPARE PAYLOAD
  ======================================================= */

  function buildPayload() {
    return {
      title: form.title.trim(),

      subtitle:
        form.subtitle.trim(),

      imageUrl:
        form.imageUrl.trim(),

      imageKey:
        form.imageKey.trim(),

      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),

      details:
        emptyEditorData(form.details),

      dates: form.dates.map((item) => ({
        ...(item._id
          ? {
              _id: item._id,
            }
          : {}),

        date: item.date,

        time: item.time.trim(),
      })),

      duration:
        form.duration.trim(),

      ageLimit:
        form.ageLimit.trim(),

      language:
        form.language.trim(),

      genre:
        form.genre.trim(),

      venue:
        form.venue.trim(),

      location:
        form.location.trim(),

      mapsLink:
        form.mapsLink.trim(),

      totalSlots: Number(
        form.totalSlots
      ),

      tickets: form.tickets.map(
        (ticket) => ({
          ...(ticket._id
            ? {
                _id: ticket._id,
              }
            : {}),

          name:
            ticket.name.trim(),

          price: Number(
            ticket.price
          ),

          slots: Number(
            ticket.slots
          ),

          description:
            ticket.description.trim(),

          details:
            emptyEditorData(
              ticket.details
            ),

          bookingUrl:
            ticket.bookingUrl.trim(),

          isActive:
            ticket.isActive !== false,
        })
      ),

      status:
        form.status,

      isActive:
        form.isActive,
    };
  }

  /* =======================================================
     SUBMIT
  ======================================================= */

  async function handleSubmit(e) {
    e.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    if (!validateForm()) {
      setMessage({
        type: "error",
        text:
          "Please fix the highlighted fields.",
      });

      return;
    }

    try {
      setSubmitting(true);

      const payload =
        buildPayload();

      const url = isEditMode
        ? `/api/events?id=${encodeURIComponent(
            eventId
          )}`
        : "/api/events";

      const method = isEditMode
        ? "PATCH"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            payload
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save event."
        );
      }

      setMessage({
        type: "success",
        text: isEditMode
          ? "Event updated successfully."
          : "Event created successfully.",
      });

      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error(
        "Save event error:",
        error
      );

      setMessage({
        type: "error",
        text:
          error.message ||
          "Something went wrong.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          Loading event...
        </div>
      </div>
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto  space-y-6 pb-10"
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Event Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {isEditMode
              ? "Edit Event"
              : "Create Event"}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {isEditMode
              ? "Update event information, dates and tickets."
              : "Create a new event with dates and ticket categories."}
          </p>
        </div>

        <button
          type="submit"
          disabled={
            submitting ||
            uploadingImage ||
            slotsExceeded
          }
          className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting
            ? "Saving..."
            : isEditMode
            ? "Update Event"
            : "Create Event"}
        </button>
      </div>

      {/* =================================================
          MESSAGE
      ================================================= */}

      {message.text && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* =================================================
          BASIC INFORMATION
      ================================================= */}

      <Section
        title="Basic Information"
        description="Main information displayed on the event page."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Event Title"
            required
            placeholder="Example: Startup Summit 2026"
            value={form.title}
            error={errors.title}
            onChange={(e) =>
              updateField(
                "title",
                e.target.value
              )
            }
            className="md:col-span-2"
          />

          <Input
            label="Subtitle"
            placeholder="Short event tagline"
            value={form.subtitle}
            onChange={(e) =>
              updateField(
                "subtitle",
                e.target.value
              )
            }
            className="md:col-span-2"
          />

          <Input
            label="Tags"
            placeholder="Music, Concert, Jaipur"
            value={form.tags}
            onChange={(e) =>
              updateField(
                "tags",
                e.target.value
              )
            }
            className="md:col-span-2"
          />
        </div>
      </Section>

      {/* =================================================
          COVER IMAGE
      ================================================= */}

      <Section
        title="Cover Image"
        description="Recommended: 1200 × 675 px, 16:9 ratio, maximum 500 KB."
      >
        <div className="grid gap-5 md:grid-cols-[280px_1fr]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {form.imageUrl ? (
              <div className="relative aspect-video">
                <img
                  src={form.imageUrl}
                  alt={form.title || "Event"}
                  className="h-full w-full object-cover"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-3 top-3 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center text-center text-sm text-slate-400">
                No cover image
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center">
            <label className="inline-flex w-fit cursor-pointer items-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
              {uploadingImage
                ? "Uploading..."
                : form.imageUrl
                ? "Replace Image"
                : "Upload Image"}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => {
                  const file =
                    e.target.files?.[0];

                  if (file) {
                    uploadImage(file);
                  }

                  e.target.value = "";
                }}
              />
            </label>

            <div className="mt-4 space-y-1 text-xs text-slate-500">
              <p>• JPG, PNG or WebP</p>
              <p>• Maximum 500 KB</p>
              <p>• Minimum 1200 × 675 px</p>
              <p>• Recommended 16:9 ratio</p>
            </div>
          </div>
        </div>
      </Section>

      {/* =================================================
          EVENT DETAILS
      ================================================= */}

      <Section
        title="Event Details"
        description="Write the complete event description using the editor."
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <Editor
            key={`event-editor-${
              eventId || "create"
            }`}
            initialData={form.details}
            onChange={(data) =>
              updateField(
                "details",
                data
              )
            }
          />
        </div>
      </Section>

      {/* =================================================
          DATE & TIME
      ================================================= */}

      <Section
        title="Event Dates"
        description="Add one or multiple dates for this event."
      >
        <div className="space-y-4">
          {form.dates.map(
            (item, index) => (
              <div
                key={
                  item._id ||
                  `date-${index}`
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Date #{index + 1}
                  </h3>

                  {form.dates.length >
                    1 && (
                    <button
                      type="button"
                      onClick={() =>
                        removeDate(
                          index
                        )
                      }
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Date"
                    required
                    type="date"
                    value={item.date}
                    error={
                      errors[
                        `date-${index}`
                      ]
                    }
                    onChange={(e) =>
                      updateDate(
                        index,
                        "date",
                        e.target.value
                      )
                    }
                  />

                  <Input
                    label="Time"
                    required
                    type="time"
                    value={item.time}
                    error={
                      errors[
                        `time-${index}`
                      ]
                    }
                    onChange={(e) =>
                      updateDate(
                        index,
                        "time",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            )
          )}
        </div>

        {errors.dates && (
          <p className="mt-3 text-sm text-red-500">
            {errors.dates}
          </p>
        )}

        <button
          type="button"
          onClick={addDate}
          className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          + Add Another Date
        </button>
      </Section>

      {/* =================================================
          EVENT INFORMATION
      ================================================= */}

      <Section
        title="Event Information"
        description="Additional information about the event."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Duration"
            placeholder="2 Hours 30 Minutes"
            value={form.duration}
            onChange={(e) =>
              updateField(
                "duration",
                e.target.value
              )
            }
          />

          <Input
            label="Age Limit"
            placeholder="18+"
            value={form.ageLimit}
            onChange={(e) =>
              updateField(
                "ageLimit",
                e.target.value
              )
            }
          />

          <Input
            label="Language"
            placeholder="Hindi / English"
            value={form.language}
            onChange={(e) =>
              updateField(
                "language",
                e.target.value
              )
            }
          />

          <Input
            label="Genre"
            placeholder="Music / Comedy / Workshop"
            value={form.genre}
            onChange={(e) =>
              updateField(
                "genre",
                e.target.value
              )
            }
          />
        </div>
      </Section>

      {/* =================================================
          VENUE
      ================================================= */}

      <Section
        title="Venue"
        description="Where will the event take place?"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input
            label="Venue Name"
            required
            placeholder="The Lalit Jaipur"
            value={form.venue}
            error={errors.venue}
            onChange={(e) =>
              updateField(
                "venue",
                e.target.value
              )
            }
          />

          <Input
            label="Location"
            required
            placeholder="Jaipur, Rajasthan"
            value={form.location}
            error={errors.location}
            onChange={(e) =>
              updateField(
                "location",
                e.target.value
              )
            }
          />

          <Input
            label="Google Maps Link"
            type="url"
            placeholder="https://maps.google.com/..."
            value={form.mapsLink}
            onChange={(e) =>
              updateField(
                "mapsLink",
                e.target.value
              )
            }
            className="md:col-span-2"
          />
        </div>
      </Section>

      {/* =================================================
          SLOTS
      ================================================= */}

      <Section
        title="Event Capacity"
        description="Define the total number of available event slots."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Input
            label="Total Event Slots"
            required
            type="number"
            min="1"
            placeholder="500"
            value={form.totalSlots}
            error={errors.totalSlots}
            onChange={(e) =>
              updateField(
                "totalSlots",
                e.target.value
              )
            }
          />

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-xs font-medium text-blue-600">
              Allocated
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-900">
              {allocatedSlots}
            </p>
          </div>

          <div
            className={`rounded-xl border p-4 ${
              slotsExceeded
                ? "border-red-200 bg-red-50"
                : "border-emerald-100 bg-emerald-50"
            }`}
          >
            <p
              className={`text-xs font-medium ${
                slotsExceeded
                  ? "text-red-600"
                  : "text-emerald-600"
              }`}
            >
              Remaining
            </p>

            <p
              className={`mt-1 text-2xl font-bold ${
                slotsExceeded
                  ? "text-red-900"
                  : "text-emerald-900"
              }`}
            >
              {slotsExceeded
                ? `-${allocatedSlots - totalSlots}`
                : remainingSlots}
            </p>
          </div>
        </div>

        {slotsExceeded && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Ticket slots exceed the total event capacity.
            Reduce the ticket slots before saving.
          </div>
        )}
      </Section>

      {/* =================================================
          TICKETS
      ================================================= */}

      <Section
        title="Ticket Categories"
        description="Create ticket categories and allocate available slots."
      >
        <div className="space-y-4">
          {form.tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center">
              <p className="text-sm font-medium text-slate-600">
                No ticket categories added.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Add at least one ticket category.
              </p>
            </div>
          ) : (
            form.tickets.map(
              (ticket, index) => (
                <TicketCard
                  key={
                    ticket._id ||
                    `ticket-${index}`
                  }
                  ticket={ticket}
                  index={index}
                  totalSlots={
                    totalSlots
                  }
                  allocatedSlots={
                    allocatedSlots
                  }
                  onChange={
                    updateTicket
                  }
                  onRemove={() =>
                    removeTicket(
                      index
                    )
                  }
                />
              )
            )
          )}
        </div>

        {errors.tickets && (
          <p className="mt-3 text-sm text-red-500">
            {errors.tickets}
          </p>
        )}

        <button
          type="button"
          onClick={addTicket}
          className="mt-5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          + Add Ticket Category
        </button>
      </Section>

      {/* =================================================
          PUBLISH SETTINGS
      ================================================= */}

      <Section
        title="Publishing"
        description="Control event visibility and status."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Status
            </label>

            <select
              value={form.status}
              onChange={(e) =>
                updateField(
                  "status",
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="draft">
                Draft
              </option>

              <option value="published">
                Published
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="completed">
                Completed
              </option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-700">
                Event Active
              </p>

              <p className="text-xs text-slate-400">
                Allow this event to appear as active.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                updateField(
                  "isActive",
                  !form.isActive
                )
              }
              className={`relative h-6 w-11 rounded-full transition ${
                form.isActive
                  ? "bg-blue-600"
                  : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                  form.isActive
                    ? "left-6"
                    : "left-1"
                }`}
              />
            </button>
          </div>
        </div>
      </Section>

      {/* =================================================
          BOTTOM ACTIONS
      ================================================= */}

      <div className="sticky bottom-4 z-20 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-500">
            {isEditMode
              ? "Changes will update the existing event."
              : "Review all information before creating the event."}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                window.history.back()
              }
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                uploadingImage ||
                slotsExceeded
              }
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEditMode
                ? "Update Event"
                : "Create Event"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
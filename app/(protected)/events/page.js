"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* =========================================================
   HELPERS
========================================================= */

function formatDate(date) {
  if (!date) return "-";

  const value = new Date(date);

  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(price) {
  if (price === undefined || price === null || price === "") {
    return "-";
  }

  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function getStatusStyle(status) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";

    case "completed":
      return "bg-purple-50 text-purple-700 border-purple-200";

    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

/* =========================================================
   PAGE
========================================================= */

export default function EventsPage() {
  const [events, setEvents] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  /* =======================================================
     FETCH EVENTS
  ======================================================= */

  async function fetchEvents() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/events",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to fetch events."
        );
      }

      /*
        Supports either:

        {
          events: [...]
        }

        OR

        [...]
      */

      const eventList =
        Array.isArray(data)
          ? data
          : data.events || [];

      setEvents(eventList);
    } catch (error) {
      console.error(
        "Fetch events error:",
        error
      );

      setError(
        error.message ||
          "Failed to load events."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  /* =======================================================
     FILTER EVENTS
  ======================================================= */

  const filteredEvents = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        event.title
          ?.toLowerCase()
          .includes(query) ||
        event.venue
          ?.toLowerCase()
          .includes(query) ||
        event.location
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        event.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    events,
    search,
    statusFilter,
  ]);

  /* =======================================================
     DELETE EVENT
  ======================================================= */

  async function deleteEvent(event) {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${event.title}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/events?id=${encodeURIComponent(
          getEventId(event)
        )}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete event."
        );
      }

      setEvents((prev) =>
        prev.filter(
          (item) =>
            getEventId(item) !==
            getEventId(event)
        )
      );
    } catch (error) {
      console.error(
        "Delete event error:",
        error
      );

      alert(
        error.message ||
          "Failed to delete event."
      );
    }
  }

  /* =======================================================
     OBJECT ID
  ======================================================= */

  function getEventId(event) {
    if (!event?._id) {
      return "";
    }

    if (
      typeof event._id === "string"
    ) {
      return event._id;
    }

    if (
      event._id.$oid
    ) {
      return event._id.$oid;
    }

    return String(event._id);
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />

              Loading events...
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     PAGE UI
  ======================================================= */

  return (
    <div className="min-h-screen  p-4 md:p-8">
      <div className="">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Event Management
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">
              All Events
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your events, tickets and
              event information.
            </p>
          </div>

          <Link
            href="/events/create"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            + Create Event
          </Link>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>

            <button
              type="button"
              onClick={fetchEvents}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            {/* Search */}

            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path d="m20 20-3.5-3.5" />
              </svg>

              <input
                type="text"
                placeholder="Search event, venue or location..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Status */}

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="all">
                All Status
              </option>

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

            {/* Refresh */}

            <button
              type="button"
              onClick={fetchEvents}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* =================================================
            SUMMARY
        ================================================= */}

        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Total Events
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {events.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Published
            </p>

            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {
                events.filter(
                  (event) =>
                    event.status ===
                    "published"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Draft
            </p>

            <p className="mt-1 text-2xl font-bold text-amber-600">
              {
                events.filter(
                  (event) =>
                    event.status ===
                    "draft"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Active
            </p>

            <p className="mt-1 text-2xl font-bold text-blue-600">
              {
                events.filter(
                  (event) =>
                    event.isActive !==
                    false
                ).length
              }
            </p>
          </div>
        </div>

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Desktop Table */}

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Event
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Venue
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tickets
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Capacity
                  </th>

                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEvents.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                          <svg
                            className="h-5 w-5 text-slate-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect
                              x="3"
                              y="4"
                              width="18"
                              height="18"
                              rx="2"
                            />

                            <path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                        </div>

                        <p className="font-semibold text-slate-700">
                          No events found
                        </p>

                        <p className="mt-1 text-sm text-slate-400">
                          Try changing your
                          search or create a
                          new event.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map(
                    (event) => {
                      const id =
                        getEventId(
                          event
                        );

                      const firstDate =
                        event.dates?.[0];

                      const ticketCount =
                        Array.isArray(
                          event.tickets
                        )
                          ? event.tickets
                              .length
                          : 0;

                      return (
                        <tr
                          key={id}
                          className="transition hover:bg-slate-50"
                        >
                          {/* Event */}

                          <td className="px-5 py-4">
                            <div className="flex min-w-[280px] items-center gap-3">
                              <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                                {event.imageUrl ? (
                                  <img
                                    src={
                                      event.imageUrl
                                    }
                                    alt={
                                      event.title ||
                                      "Event"
                                    }
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                                    No Image
                                  </div>
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">
                                  {event.title ||
                                    "Untitled Event"}
                                </p>

                                {event.subtitle && (
                                  <p className="mt-1 max-w-[250px] truncate text-xs text-slate-500">
                                    {
                                      event.subtitle
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Venue */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-medium text-slate-700">
                              {event.venue ||
                                "-"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {event.location ||
                                "-"}
                            </p>
                          </td>

                          {/* Date */}

                          <td className="px-5 py-4">
                            {firstDate ? (
                              <>
                                <p className="text-sm font-medium text-slate-700">
                                  {formatDate(
                                    firstDate.date
                                  )}
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                  {
                                    firstDate.time
                                  }
                                </p>

                                {event
                                  .dates
                                  ?.length >
                                  1 && (
                                  <p className="mt-1 text-[11px] font-medium text-blue-600">
                                    +
                                    {event
                                      .dates
                                      .length -
                                      1}{" "}
                                    more
                                  </p>
                                )}
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* Tickets */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {
                                ticketCount
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              categories
                            </p>
                          </td>

                          {/* Capacity */}

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {Number(
                                event.totalSlots ||
                                  0
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              total slots
                            </p>
                          </td>

                          {/* Status */}

                          <td className="px-5 py-4">
                            <div className="flex flex-col items-start gap-2">
                              <span
                                className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                                  event.status
                                )}`}
                              >
                                {event.status ||
                                  "draft"}
                              </span>

                              {event.isActive !==
                                false && (
                                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Active
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <Link
                                href={`/events/${id}/edit`}
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                              >
                                Edit
                              </Link>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteEvent(
                                    event
                                  )
                                }
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              MOBILE CARDS
          ================================================= */}

          <div className="divide-y divide-slate-100 md:hidden">
            {filteredEvents.length ===
            0 ? (
              <div className="px-5 py-16 text-center">
                <p className="font-semibold text-slate-700">
                  No events found
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Try changing your
                  search.
                </p>
              </div>
            ) : (
              filteredEvents.map(
                (event) => {
                  const id =
                    getEventId(event);

                  const firstDate =
                    event.dates?.[0];

                  return (
                    <div
                      key={id}
                      className="p-4"
                    >
                      <div className="flex gap-3">
                        {/* Image */}

                        <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                          {event.imageUrl ? (
                            <img
                              src={
                                event.imageUrl
                              }
                              alt={
                                event.title ||
                                "Event"
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                              No Image
                            </div>
                          )}
                        </div>

                        {/* Content */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {event.title ||
                                "Untitled Event"}
                            </h3>

                            <span
                              className={`flex-shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${getStatusStyle(
                                event.status
                              )}`}
                            >
                              {event.status ||
                                "draft"}
                            </span>
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {event.venue ||
                              "-"}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {event.location ||
                              "-"}
                          </p>
                        </div>
                      </div>

                      {/* Details */}

                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Date
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-700">
                            {firstDate
                              ? formatDate(
                                  firstDate.date
                                )
                              : "-"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Capacity
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-700">
                            {Number(
                              event.totalSlots ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Tickets
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-700">
                            {Array.isArray(
                              event.tickets
                            )
                              ? event
                                  .tickets
                                  .length
                              : 0}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400">
                            Active
                          </p>

                          <p
                            className={`mt-1 text-xs font-semibold ${
                              event.isActive !==
                              false
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                          >
                            {event.isActive !==
                            false
                              ? "Yes"
                              : "No"}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}

                      <div className="mt-4 flex gap-2">
                        <Link
                          href={`/events/${id}/edit`}
                          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-center text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          Edit Event
                        </Link>

                        <button
                          type="button"
                          onClick={() =>
                            deleteEvent(
                              event
                            )
                          }
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }
              )
            )}
          </div>
        </div>

        {/* =================================================
            FOOTER COUNT
        ================================================= */}

        {filteredEvents.length >
          0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing{" "}
              <span className="font-semibold text-slate-600">
                {filteredEvents.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-600">
                {events.length}
              </span>{" "}
              events
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
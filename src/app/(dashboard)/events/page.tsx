import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

interface EventsPageProps {
  searchParams: Promise<{
    status?: string;
  }>;
}

export default async function EventsPage({
  searchParams,
}: EventsPageProps) {
  const params = await searchParams;

  const status = params.status || "ALL";

  /*
   * =========================================================
   * DATE HELPERS
   * =========================================================
   *
   * Event status is controlled manually.
   *
   * IMPORTANT:
   * An OPEN event remains OPEN even after its event date
   * has passed. It becomes COMPLETED only when the event
   * is explicitly closed.
   */

  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0,
  );

  /*
   * =========================================================
   * FETCH ALL EVENTS
   * =========================================================
   *
   * We fetch all events once so that:
   *
   * - Summary counters remain correct
   * - Active events remain visible after their date
   * - Settlement information can be calculated from
   *   actual fund transfer records
   */

  const allEvents = await prisma.event.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },

      collections: {
        select: {
          amount: true,
        },
      },

      expenses: {
        select: {
          amount: true,
        },
      },

      /*
       * Fund transfers are required to determine whether
       * a completed event has actually been settled.
       *
       * TO_GENERAL_FUND:
       *   Event money transferred to General Fund
       *
       * FROM_GENERAL_FUND:
       *   Money received by the event from General Fund
       */
      transfers: {
        select: {
          direction: true,
          amount: true,
        },
      },
    },

    /*
     * Primary:
     *   eventDate DESC
     *
     * Secondary:
     *   createdAt DESC
     *
     * This keeps the newest event dates first while still
     * maintaining creation order for events on the same date.
     */
    orderBy: [
      {
        eventDate: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  /*
   * =========================================================
   * SUMMARY COUNTS
   * =========================================================
   *
   * IMPORTANT:
   * OPEN means ACTIVE.
   *
   * We intentionally DO NOT check eventDate here.
   *
   * Therefore an event whose date has passed but has not
   * been explicitly closed is still counted as Active.
   */

  const activeCount = allEvents.filter(
    (event) => event.status === "OPEN",
  ).length;

  const completedCount = allEvents.filter(
    (event) => event.status === "COMPLETED",
  ).length;

  const cancelledCount = allEvents.filter(
    (event) => event.status === "CANCELLED",
  ).length;

  /*
   * =========================================================
   * FILTER EVENTS
   * =========================================================
   */

  const events =
    status === "ALL"
      ? allEvents
      : status === "OPEN" ||
          status === "COMPLETED" ||
          status === "CANCELLED"
        ? allEvents.filter(
            (event) => event.status === status,
          )
        : allEvents;

  /*
   * =========================================================
   * RETURN
   * =========================================================
   */

  return (
    <div className="space-y-6">
      {/* ----------------------------------------------------
          HEADER
      ---------------------------------------------------- */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Events
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage Mahallu events and their financial
            records.
          </p>
        </div>

        <Link
          href="/events/new"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Link>
      </div>

      {/* ----------------------------------------------------
          SUMMARY
      ---------------------------------------------------- */}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Active"
          value={activeCount}
        />

        <SummaryCard
          label="Completed"
          value={completedCount}
        />

        <SummaryCard
          label="Cancelled"
          value={cancelledCount}
        />
      </div>

      {/* ----------------------------------------------------
          FILTER
      ---------------------------------------------------- */}

      <div className="flex flex-wrap gap-2">
        <FilterLink
          label="All"
          value="ALL"
          active={status === "ALL"}
        />

        <FilterLink
          label="Active"
          value="OPEN"
          active={status === "OPEN"}
        />

        <FilterLink
          label="Completed"
          value="COMPLETED"
          active={status === "COMPLETED"}
        />

        <FilterLink
          label="Cancelled"
          value="CANCELLED"
          active={status === "CANCELLED"}
        />
      </div>

      {/* ----------------------------------------------------
          EVENT LIST
      ---------------------------------------------------- */}

      {events.length === 0 ? (
        <div className="rounded-xl border bg-white px-6 py-12 text-center shadow-sm">
          <CalendarDays className="mx-auto h-10 w-10 text-gray-300" />

          <h2 className="mt-4 font-semibold text-gray-900">
            No events found
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Create your first event to get started.
          </p>

          <Link
            href="/events/new"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Create Event
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="divide-y">
            {events.map((event) => {
              /*
               * =================================================
               * EVENT FINANCIAL RESULT
               * =================================================
               */

              const collections =
                event.collections.reduce(
                  (total, item) =>
                    total + Number(item.amount),
                  0,
                );

              const expenses =
                event.expenses.reduce(
                  (total, item) =>
                    total + Number(item.amount),
                  0,
                );

              /*
               * Positive:
               *   Event has surplus
               *
               * Negative:
               *   Event has deficit
               *
               * Zero:
               *   Event is balanced
               */
              const result =
                collections - expenses;

              /*
               * =================================================
               * FUND TRANSFERS
               * =================================================
               */

              const transferredToGeneralFund =
                event.transfers
                  .filter(
                    (transfer) =>
                      transfer.direction ===
                      "TO_GENERAL_FUND",
                  )
                  .reduce(
                    (total, transfer) =>
                      total + Number(transfer.amount),
                    0,
                  );

              const receivedFromGeneralFund =
                event.transfers
                  .filter(
                    (transfer) =>
                      transfer.direction ===
                      "FROM_GENERAL_FUND",
                  )
                  .reduce(
                    (total, transfer) =>
                      total + Number(transfer.amount),
                    0,
                  );

              /*
               * =================================================
               * REMAINING SETTLEMENT
               * =================================================
               *
               * SURPLUS:
               *
               *   Final surplus - amount transferred
               *
               * DEFICIT:
               *
               *   Final deficit - amount received
               */

              const surplusRemaining = Math.max(
                result -
                  transferredToGeneralFund,
                0,
              );

              const deficitRemaining = Math.max(
                Math.abs(result) -
                  receivedFromGeneralFund,
                0,
              );

              /*
               * =================================================
               * SETTLEMENT INDICATION
               * =================================================
               *
               * This is deliberately separate from the
               * EventStatus badge.
               *
               * EventStatus tells us whether the event is
               * Active / Completed / Cancelled.
               *
               * Settlement status tells us whether money
               * has actually moved between the event and
               * General Fund.
               */

              let settlementLabel =
                "Current Event Balance";

              let settlementAmount =
                result;

              let settlementType:
                | "positive"
                | "negative"
                | "neutral" =
                result > 0
                  ? "positive"
                  : result < 0
                    ? "negative"
                    : "neutral";

              /*
               * ACTIVE EVENT
               *
               * Even if the event date has passed, an OPEN
               * event is still active until explicitly closed.
               */
              if (event.status === "OPEN") {
                settlementLabel =
                  "Current Event Balance";

                settlementAmount = result;

                settlementType =
                  result > 0
                    ? "positive"
                    : result < 0
                      ? "negative"
                      : "neutral";
              }

              /*
               * COMPLETED EVENT
               */
              if (event.status === "COMPLETED") {
                /*
                 * -----------------------------------------------
                 * SURPLUS
                 * -----------------------------------------------
                 *
                 * Example:
                 *
                 * Final surplus = ₹7,000
                 * Transferred = ₹0
                 *
                 * Result:
                 * Transfer Pending
                 * ₹7,000
                 */
                if (result > 0) {
                  if (surplusRemaining > 0) {
                    settlementLabel =
                      "Transfer Pending";

                    settlementAmount =
                      surplusRemaining;

                    settlementType = "positive";
                  } else {
                    settlementLabel =
                      "Funds Transferred";

                    settlementAmount =
                      transferredToGeneralFund;

                    settlementType = "positive";
                  }
                }

                /*
                 * -----------------------------------------------
                 * DEFICIT
                 * -----------------------------------------------
                 *
                 * Example:
                 *
                 * Final deficit = ₹1,000
                 * Received = ₹0
                 *
                 * Result:
                 * Fund Receipt Pending
                 * ₹1,000
                 */
                else if (result < 0) {
                  if (deficitRemaining > 0) {
                    settlementLabel =
                      "Fund Receipt Pending";

                    settlementAmount =
                      deficitRemaining;

                    settlementType = "negative";
                  } else {
                    settlementLabel =
                      "Funds Received";

                    settlementAmount =
                      receivedFromGeneralFund;

                    settlementType = "positive";
                  }
                }

                /*
                 * -----------------------------------------------
                 * BALANCED EVENT
                 * -----------------------------------------------
                 */
                else {
                  settlementLabel = "Settled";

                  settlementAmount = 0;

                  settlementType = "neutral";
                }
              }

              /*
               * CANCELLED EVENT
               *
               * We do not show settlement information as
               * though the event were completed.
               */
              if (event.status === "CANCELLED") {
                settlementLabel =
                  "Event Cancelled";

                settlementAmount = result;

                settlementType =
                  result > 0
                    ? "positive"
                    : result < 0
                      ? "negative"
                      : "neutral";
              }

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                    {/* ------------------------------------------------
                        EVENT INFORMATION
                    ------------------------------------------------ */}

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-gray-900">
                          {event.title}
                        </h2>

                        <StatusBadge
                          status={event.status}
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4" />

                          {formatDate(
                            event.startDate ??
                              event.eventDate,
                          )}
                        </span>

                        {event.venue && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />

                            {event.venue}
                          </span>
                        )}

                        <span>
                          {event.category.name}
                        </span>
                      </div>
                    </div>

                    {/* ------------------------------------------------
                        SETTLEMENT / FINANCIAL INDICATION
                    ------------------------------------------------ */}

                    <div className="flex items-center justify-between gap-6 lg:justify-end">
                      <div className="text-left lg:text-right">
                        <p className="text-xs text-gray-500">
                          {settlementLabel}
                        </p>

                        <p
                          className={`mt-1 font-semibold ${
                            settlementType ===
                            "positive"
                              ? "text-green-700"
                              : settlementType ===
                                  "negative"
                                ? "text-red-600"
                                : "text-gray-700"
                          }`}
                        >
                          {formatCurrency(
                            Math.abs(
                              settlementAmount,
                            ),
                          )}
                        </p>
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   FILTER LINK
========================================================= */

function FilterLink({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  const href =
    value === "ALL"
      ? "/events"
      : `/events?status=${value}`;

  return (
    <Link
      href={href}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-gray-900 bg-gray-900 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const classes =
    status === "COMPLETED"
      ? "bg-green-50 text-green-700"
      : status === "CANCELLED"
        ? "bg-red-50 text-red-700"
        : "bg-blue-50 text-blue-700";

  const label =
    status === "COMPLETED"
      ? "Completed"
      : status === "CANCELLED"
        ? "Cancelled"
        : "Active";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}
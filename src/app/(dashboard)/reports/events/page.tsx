import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  FileText,
  MapPin,
  Wallet,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

interface EventReportsPageProps {
  searchParams: Promise<{
    eventId?: string;
  }>;
}

export default async function EventReportsPage({
  searchParams,
}: EventReportsPageProps) {
  const params = await searchParams;

  const events = await prisma.event.findMany({
    orderBy: [
      {
        eventDate: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      title: true,
      year: true,
      eventDate: true,
      status: true,
      category: {
        select: {
          name: true,
        },
      },
    },
  });

  const selectedEventId =
    params.eventId || events[0]?.id || "";

  const event = selectedEventId
    ? await prisma.event.findUnique({
        where: {
          id: selectedEventId,
        },
        select: {
          id: true,
          title: true,
          description: true,
          year: true,
          eventDate: true,
          venue: true,
          status: true,

          category: {
            select: {
              name: true,
            },
          },

          collections: {
            orderBy: {
              receivedDate: "asc",
            },
            select: {
              id: true,
              sourceName: true,
              amount: true,
              receivedDate: true,
              referenceNo: true,
              remarks: true,

              category: {
                select: {
                  name: true,
                },
              },
            },
          },

          expenses: {
            orderBy: {
              expenseDate: "asc",
            },
            select: {
              id: true,
              expenseTitle: true,
              amount: true,
              expenseDate: true,
              billNumber: true,
              remarks: true,

              category: {
                select: {
                  name: true,
                },
              },
            },
          },

          transfers: {
            orderBy: {
              transferDate: "asc",
            },
            select: {
              id: true,
              direction: true,
              amount: true,
              transferDate: true,
              referenceNo: true,
              remarks: true,
            },
          },
        },
      })
    : null;

  if (!event) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/reports"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Event Reports
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              No events are available for reporting.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     FINANCIAL CALCULATIONS
     ========================================================= */

  const totalCollections =
    event.collections.reduce(
      (sum, item) =>
        sum + Number(item.amount),
      0,
    );

  const totalExpenses =
    event.expenses.reduce(
      (sum, item) =>
        sum + Number(item.amount),
      0,
    );

  /*
   * IMPORTANT:
   *
   * Event Result = Collections - Expenses
   *
   * Do NOT use Math.abs() here.
   *
   * Example:
   * 10000 - 15000 = -5000
   *
   * Therefore the event has a 5000.00 loss.
   */

  const eventResult =
    totalCollections - totalExpenses;

  const transferredToGeneralFund =
    event.transfers
      .filter(
        (item) =>
          item.direction ===
          "TO_GENERAL_FUND",
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount),
        0,
      );

  const receivedFromGeneralFund =
    event.transfers
      .filter(
        (item) =>
          item.direction ===
          "FROM_GENERAL_FUND",
      )
      .reduce(
        (sum, item) =>
          sum + Number(item.amount),
        0,
      );

  const remainingSurplus =
    eventResult > 0
      ? Math.max(
          eventResult -
            transferredToGeneralFund,
          0,
        )
      : 0;

  const remainingDeficit =
    eventResult < 0
      ? Math.max(
          Math.abs(eventResult) -
            receivedFromGeneralFund,
          0,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="flex items-start gap-3">
          <Link
            href="/reports"
            className="mt-1 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Back to Reports"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Event Financial Report
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Detailed financial report for a selected event.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
    


          <a
  href={`/api/reports/events?eventId=${encodeURIComponent(
    event.id,
  )}&format=pdf`}
  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
>
  Export PDF
</a>

          <a
            href={`/api/reports/events?eventId=${encodeURIComponent(
              event.id,
            )}&format=xlsx`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Export Excel
          </a>
        </div>
      </div>

      {/* =====================================================
          EVENT SELECTOR
          ===================================================== */}

      <section className="rounded-xl border bg-white p-5 shadow-sm print:hidden">
        <form
          method="GET"
          className="grid gap-4 md:grid-cols-[1fr_auto]"
        >
          <div>
            <label
              htmlFor="eventId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Select Event
            </label>

            <select
              id="eventId"
              name="eventId"
              defaultValue={event.id}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              {events.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.title} — {item.year} —{" "}
                  {item.category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-800 md:w-auto"
            >
              Generate Report
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          EVENT DETAILS
          ===================================================== */}

      <section className="rounded-xl border bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-700" />

          <h2 className="text-lg font-semibold text-gray-900">
            Event Details
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={
              <FileText className="h-4 w-4" />
            }
            label="Event"
            value={event.title}
          />

          <InfoItem
            icon={
              <CalendarDays className="h-4 w-4" />
            }
            label="Event Date"
            value={formatDisplayDate(
              event.eventDate,
            )}
          />

          <InfoItem
            icon={
              <FileText className="h-4 w-4" />
            }
            label="Category"
            value={event.category.name}
          />

          <InfoItem
            icon={
              <MapPin className="h-4 w-4" />
            }
            label="Venue"
            value={
              event.venue ||
              "Not specified"
            }
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <InfoItem
            icon={
              <Wallet className="h-4 w-4" />
            }
            label="Year"
            value={String(event.year)}
          />

          <InfoItem
            icon={
              <CheckCircle2 className="h-4 w-4" />
            }
            label="Status"
            value={formatStatus(
              event.status,
            )}
          />
        </div>

        {event.description && (
          <div className="mt-5 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Description
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {event.description}
            </p>
          </div>
        )}
      </section>

      {/* =====================================================
          FINANCIAL SUMMARY
          ===================================================== */}

      <section className="rounded-xl border bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
        <div className="border-b px-6 py-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Financial Summary
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Summary of collections, expenses and
            the financial result of this event.
          </p>
        </div>

        <div className="divide-y">
          <ReportRow
            label="Total Collections"
            amount={totalCollections}
            className="text-green-700"
          />

          <ReportRow
            label="Total Expenses"
            amount={totalExpenses}
            className="text-red-600"
          />

          <ReportRow
            label={
              eventResult > 0
                ? "Event Surplus"
                : eventResult < 0
                  ? "Event Loss"
                  : "Event Result"
            }
            amount={eventResult}
            emphasize
            result
          />

          {eventResult > 0 &&
            transferredToGeneralFund >
              0 && (
              <ReportRow
                label="Transferred to General Fund"
                amount={
                  -transferredToGeneralFund
                }
                className="text-red-600"
              />
            )}

          {eventResult > 0 && (
            <ReportRow
              label="Remaining Event Surplus"
              amount={remainingSurplus}
              emphasize
              className="text-green-700"
            />
          )}

          {eventResult < 0 &&
            receivedFromGeneralFund >
              0 && (
              <ReportRow
                label="Received from General Fund"
                amount={
                  receivedFromGeneralFund
                }
                className="text-green-700"
              />
            )}

          {eventResult < 0 && (
            <ReportRow
              label="Remaining Event Deficit"
              amount={-remainingDeficit}
              emphasize
              result
            />
          )}

          {eventResult === 0 && (
            <ReportRow
              label="No Surplus or Loss"
              amount={0}
              emphasize
            />
          )}
        </div>
      </section>

      {/* =====================================================
          COLLECTIONS
          ===================================================== */}

      <ReportTable
        title="Collections"
        columns={[
          "Date",
          "Category",
          "Source",
          "Reference",
          "Remarks",
          "Amount",
        ]}
      >
        {event.collections.map(
          (item) => (
            <tr
              key={item.id}
              className="border-b"
            >
              <td className="px-4 py-3">
                {formatDisplayDate(
                  item.receivedDate,
                )}
              </td>

              <td className="px-4 py-3">
                {item.category?.name ||
                  "—"}
              </td>

              <td className="px-4 py-3">
                {item.sourceName}
              </td>

              <td className="px-4 py-3">
                {item.referenceNo || "—"}
              </td>

              <td className="px-4 py-3">
                {item.remarks || "—"}
              </td>

              <td className="px-4 py-3 text-right font-semibold text-green-700">
                {formatAmount(
                  Number(item.amount),
                )}
              </td>
            </tr>
          ),
        )}

        {event.collections.length ===
          0 && (
          <EmptyTableRow
            colSpan={6}
            text="No collections recorded."
          />
        )}

        <TotalTableRow
          colSpan={5}
          label="Total Collections"
          amount={totalCollections}
          className="text-green-700"
        />
      </ReportTable>

      {/* =====================================================
          EXPENSES
          ===================================================== */}

      <ReportTable
        title="Expenses"
        columns={[
          "Date",
          "Category",
          "Expense",
          "Bill / Reference",
          "Remarks",
          "Amount",
        ]}
      >
        {event.expenses.map(
          (item) => (
            <tr
              key={item.id}
              className="border-b"
            >
              <td className="px-4 py-3">
                {formatDisplayDate(
                  item.expenseDate,
                )}
              </td>

              <td className="px-4 py-3">
                {item.category?.name ||
                  "—"}
              </td>

              <td className="px-4 py-3">
                {item.expenseTitle}
              </td>

              <td className="px-4 py-3">
                {item.billNumber || "—"}
              </td>

              <td className="px-4 py-3">
                {item.remarks || "—"}
              </td>

              <td className="px-4 py-3 text-right font-semibold text-red-600">
                {formatAmount(
                  Number(item.amount),
                )}
              </td>
            </tr>
          ),
        )}

        {event.expenses.length ===
          0 && (
          <EmptyTableRow
            colSpan={6}
            text="No expenses recorded."
          />
        )}

        <TotalTableRow
          colSpan={5}
          label="Total Expenses"
          amount={totalExpenses}
          className="text-red-600"
        />
      </ReportTable>

      {/* =====================================================
          FUND TRANSFERS
          ===================================================== */}

      <ReportTable
        title="General Fund Transfers"
        columns={[
          "Date",
          "Direction",
          "Amount",
          "Reference",
          "Remarks",
        ]}
      >
        {event.transfers.map(
          (item) => {
            const toGeneralFund =
              item.direction ===
              "TO_GENERAL_FUND";

            return (
              <tr
                key={item.id}
                className="border-b"
              >
                <td className="px-4 py-3">
                  {formatDisplayDate(
                    item.transferDate,
                  )}
                </td>

                <td
                  className={
                    toGeneralFund
                      ? "px-4 py-3 font-medium text-green-700"
                      : "px-4 py-3 font-medium text-blue-700"
                  }
                >
                  {toGeneralFund
                    ? "Transferred to General Fund"
                    : "Received from General Fund"}
                </td>

                <td
                  className={`px-4 py-3 text-right font-semibold ${
                    toGeneralFund
                      ? "text-green-700"
                      : "text-blue-700"
                  }`}
                >
                  {toGeneralFund
                    ? "-"
                    : "+"}

                  {formatAmount(
                    Number(item.amount),
                  )}
                </td>

                <td className="px-4 py-3">
                  {item.referenceNo ||
                    "—"}
                </td>

                <td className="px-4 py-3">
                  {item.remarks || "—"}
                </td>
              </tr>
            );
          },
        )}

        {event.transfers.length ===
          0 && (
          <EmptyTableRow
            colSpan={5}
            text="No General Fund transfers recorded."
          />
        )}
      </ReportTable>

      {/* =====================================================
          FINAL POSITION
          ===================================================== */}

      <section className="rounded-xl border bg-white p-6 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <h2 className="text-lg font-semibold text-gray-900">
          Final Position
        </h2>

        <div
          className={`mt-4 rounded-lg border p-5 ${
            eventResult > 0
              ? "border-green-200 bg-green-50"
              : eventResult < 0
                ? "border-red-200 bg-red-50"
                : "border-gray-200 bg-gray-50"
          }`}
        >
          <p
            className={`text-xl font-bold ${
              eventResult > 0
                ? "text-green-700"
                : eventResult < 0
                  ? "text-red-600"
                  : "text-gray-800"
            }`}
          >
            {eventResult > 0
              ? `Event Surplus: ${formatAmount(
                  eventResult,
                )}`
              : eventResult < 0
                ? `Event Loss: -${formatAmount(
                    Math.abs(eventResult),
                  )}`
                : "Event Result: 0.00"}
          </p>

          {eventResult > 0 ? (
            <>
              {transferredToGeneralFund >
                0 && (
                <p className="mt-2 text-sm text-gray-700">
                  {formatAmount(
                    transferredToGeneralFund,
                  )}{" "}
                  transferred to the General
                  Fund.
                </p>
              )}

              <p className="mt-1 text-sm font-medium text-gray-800">
                Remaining event surplus:{" "}
                {formatAmount(
                  remainingSurplus,
                )}
              </p>
            </>
          ) : eventResult < 0 ? (
            <>
              {receivedFromGeneralFund >
                0 && (
                <p className="mt-2 text-sm text-gray-700">
                  {formatAmount(
                    receivedFromGeneralFund,
                  )}{" "}
                  received from the General
                  Fund.
                </p>
              )}

              <p className="mt-1 text-sm font-medium text-gray-800">
                Remaining event deficit:{" "}
                {formatAmount(
                  remainingDeficit,
                )}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-700">
              No General Fund settlement is
              required.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   INFO ITEM
   ========================================================= */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
        {icon}
      </div>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="mt-1 text-sm font-medium text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   REPORT ROW
   ========================================================= */

function ReportRow({
  label,
  amount,
  emphasize = false,
  result = false,
  className = "text-gray-900",
}: {
  label: string;
  amount: number;
  emphasize?: boolean;
  result?: boolean;
  className?: string;
}) {
  const isNegative = amount < 0;

  let amountClass = className;

  if (result && amount < 0) {
    amountClass = "text-red-600";
  }

  if (result && amount > 0) {
    amountClass = "text-green-700";
  }

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <span
        className={
          emphasize
            ? "font-semibold text-gray-900"
            : "text-gray-700"
        }
      >
        {label}
      </span>

      <span
        className={`${
          emphasize
            ? "font-bold"
            : "font-medium"
        } ${amountClass}`}
      >
        {isNegative ? "-" : ""}
        {formatAmount(
          Math.abs(amount),
        )}
      </span>
    </div>
  );
}

/* =========================================================
   REPORT TABLE
   ========================================================= */

function ReportTable({
  title,
  columns,
  children,
}: {
  title: string;
  columns: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm print:break-inside-auto print:rounded-none print:border-0 print:shadow-none">
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
        <table className="w-full min-w-[850px] text-left text-sm print:min-w-0">
          <thead className="border-b bg-gray-50">
            <tr>
              {columns.map(
                (column) => (
                  <th
                    key={column}
                    className={`px-4 py-3 font-semibold text-gray-600 ${
                      column === "Amount"
                        ? "text-right"
                        : ""
                    }`}
                  >
                    {column}
                  </th>
                ),
              )}
            </tr>
          </thead>

          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* =========================================================
   EMPTY TABLE ROW
   ========================================================= */

function EmptyTableRow({
  colSpan,
  text,
}: {
  colSpan: number;
  text: string;
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-4 py-8 text-center text-sm text-gray-500"
      >
        {text}
      </td>
    </tr>
  );
}

/* =========================================================
   TOTAL TABLE ROW
   ========================================================= */

function TotalTableRow({
  colSpan,
  label,
  amount,
  className,
}: {
  colSpan: number;
  label: string;
  amount: number;
  className: string;
}) {
  return (
    <tr className="bg-gray-50">
      <td
        colSpan={colSpan}
        className="px-4 py-3 text-right font-semibold text-gray-700"
      >
        {label}
      </td>

      <td
        className={`px-4 py-3 text-right font-bold ${className}`}
      >
        {formatAmount(amount)}
      </td>
    </tr>
  );
}

/* =========================================================
   FORMAT AMOUNT
   ========================================================= */

function formatAmount(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    },
  ).format(
    Number(amount) || 0,
  );
}

/* =========================================================
   FORMAT DISPLAY DATE
   ========================================================= */

function formatDisplayDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}

/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatStatus(
  status: string,
) {
  if (status === "COMPLETED") {
    return "Completed";
  }

  if (status === "CANCELLED") {
    return "Cancelled";
  }

  return "Open";
}
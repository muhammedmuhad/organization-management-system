import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  MapPin,
  Plus,
  Receipt,
  Wallet,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import CloseEventButton from "./CloseEventButton";
import SettlementForm from "./SettlementForm";

interface EventDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: {
      id,
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
          id: true,
          name: true,
        },
      },

      collections: {
        orderBy: {
          receivedDate: "desc",
        },

        select: {
          id: true,
          sourceName: true,
          amount: true,
          receivedDate: true,
          remarks: true,
        },
      },

      expenses: {
        orderBy: {
          expenseDate: "desc",
        },

        select: {
          id: true,
          expenseTitle: true,
          amount: true,
          expenseDate: true,
          remarks: true,
        },
      },

      transfers: {
        orderBy: {
          transferDate: "desc",
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
  });

  if (!event) {
    notFound();
  }

  /*
   * =========================================================
   * FINANCIAL CALCULATIONS
   * =========================================================
   *
   * These are calculated from the actual event ledger.
   *
   * Collections = EventCollection records
   * Expenses    = EventExpense records
   *
   * We intentionally do NOT use the legacy
   * Event.amountCollected / Event.totalExpense fields.
   */

  const totalCollections = event.collections.reduce(
    (total, collection) =>
      total + Number(collection.amount),
    0,
  );

  const totalExpenses = event.expenses.reduce(
    (total, expense) =>
      total + Number(expense.amount),
    0,
  );

  const result =
    totalCollections - totalExpenses;

    

  const absoluteResult = Math.abs(result);

  const transferredToGeneralFund =
    event.transfers
      .filter((transfer) => transfer.direction === "TO_GENERAL_FUND")
      .reduce((total, transfer) => total + Number(transfer.amount), 0);

  const receivedFromGeneralFund =
    event.transfers
      .filter((transfer) => transfer.direction === "FROM_GENERAL_FUND")
      .reduce((total, transfer) => total + Number(transfer.amount), 0);

  const surplusRemaining = Math.max(result - transferredToGeneralFund, 0);
  const deficitRemaining = Math.max(Math.abs(result) - receivedFromGeneralFund, 0);

  const isOpen = event.status === "OPEN";
  const isCompleted =
    event.status === "COMPLETED";
  const isCancelled =
    event.status === "CANCELLED";

  const isSurplus = result > 0;
  const isDeficit = result < 0;
  const isBalanced = result === 0;

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/events"
            className="mt-1 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back to events"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {event.title}
              </h1>

              <StatusBadge
                status={event.status}
              />
            </div>

            <p className="mt-1 text-sm text-gray-500">
              {event.category.name}
              {" • "}
              {event.year}
            </p>
          </div>
        </div>

        {/* =================================================
            ACTIONS
        ================================================= */}

        {isOpen && (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/events/${event.id}/collections/new`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
            >
              <Plus className="h-4 w-4" />
              Add Collection
            </Link>

            <Link
              href={`/events/${event.id}/expenses/new`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </Link>

            <CloseEventButton
              eventId={event.id}
            />
          </div>
        )}
      </div>

      {/* =====================================================
          COMPLETED NOTICE
      ===================================================== */}

      {isCompleted && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-green-100 p-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-green-900">
                Event is financially closed
              </h2>

              <p className="mt-1 text-sm text-green-800">
                No new collections or expenses can be
                recorded for this event.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CANCELLED NOTICE
      ===================================================== */}

      {isCancelled && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-gray-200 p-2 text-gray-600">
              <XCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Event cancelled
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                This event is cancelled and cannot receive
                new financial entries.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          EVENT INFORMATION
      ===================================================== */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-green-700" />

          <h2 className="text-lg font-semibold text-gray-900">
            Event Details
          </h2>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            icon={
              <CalendarDays className="h-4 w-4" />
            }
            label="Event Date"
            value={formatDate(event.eventDate)}
          />

          <InfoItem
            icon={
              <Clock className="h-4 w-4" />
            }
            label="Year"
            value={String(event.year)}
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
            value={event.venue || "Not specified"}
          />


        </div>

        {event.description && (
          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Description
            </p>

            <p className="mt-1 text-sm leading-6 text-gray-700">
              {event.description}
            </p>
          </div>
        )}
      </section>

      {/* =====================================================
          FINANCIAL SUMMARY
      ===================================================== */}

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* Total Collections */}

        <SummaryCard
          title="Total Collections"
          amount={totalCollections}
          count={event.collections.length}
          description={
            event.collections.length === 1
              ? "collection"
              : "collections"
          }
          type="income"
          icon={
            <ArrowUpRight className="h-5 w-5" />
          }
        />

        {/* Total Expenses */}

        <SummaryCard
          title="Total Expenses"
          amount={totalExpenses}
          count={event.expenses.length}
          description={
            event.expenses.length === 1
              ? "expense"
              : "expenses"
          }
          type="expense"
          icon={
            <ArrowDownRight className="h-5 w-5" />
          }
        />

        {/* Current / Final Result */}

        <SummaryCard
          title={
            isCompleted
              ? isSurplus
                ? "Final Surplus"
                : isDeficit
                  ? "Final Deficit"
                  : "Final Result"
              : isSurplus
                ? "Current Balance"
                : isDeficit
                  ? "Current Deficit"
                  : "Current Balance"
          }
          amount={absoluteResult}
          description={
            isCompleted
              ? "Final collections minus expenses"
              : "Collections minus expenses so far"
          }
          type={
            isDeficit
              ? "expense"
              : "income"
          }
          icon={
            isCompleted ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Wallet className="h-5 w-5" />
            )
          }
        />
      </section>


      {/* =====================================================
    GENERAL FUND SETTLEMENT
===================================================== */}

{isCompleted && !isBalanced && (
  <section className="rounded-xl border bg-white shadow-sm">
    <div className="border-b px-6 py-5">
      <div className="flex items-start gap-3">
        <div
          className={`rounded-lg p-2 ${
            isSurplus
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {isSurplus ? (
            <ArrowUpFromLine className="h-5 w-5" />
          ) : (
            <ArrowDownToLine className="h-5 w-5" />
          )}
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">
            General Fund Settlement
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {isSurplus
              ? "Transfer the final event surplus to the General Fund."
              : "Receive funding from the General Fund to cover the final event deficit."}
          </p>
        </div>
      </div>
    </div>

    {/* Settlement Summary */}
    <div className="grid gap-4 p-6 sm:grid-cols-3">
      <SettlementSummary
        label={
          isSurplus
            ? "Final Surplus"
            : "Final Deficit"
        }
        amount={absoluteResult}
      />

      <SettlementSummary
        label={
          isSurplus
            ? "Transferred to General Fund"
            : "Received from General Fund"
        }
        amount={
          isSurplus
            ? transferredToGeneralFund
            : receivedFromGeneralFund
        }
      />

      <SettlementSummary
        label="Remaining"
        amount={
          isSurplus
            ? surplusRemaining
            : deficitRemaining
        }
      />
    </div>

    {/* Settlement Action */}
    {(isSurplus
      ? surplusRemaining
      : deficitRemaining) > 0 ? (
      <div className="mx-6 mb-6 rounded-xl border border-gray-200 bg-gray-50 p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900">
            {isSurplus
              ? "Transfer Surplus to General Fund"
              : "Receive Funds from General Fund"}
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {isSurplus
              ? "Transfer the remaining event surplus to the General Fund."
              : "Receive the remaining required amount from the General Fund."}
          </p>
        </div>

        <SettlementForm
          eventId={event.id}
          direction={
            isSurplus
              ? "TO_GENERAL_FUND"
              : "FROM_GENERAL_FUND"
          }
          remainingAmount={
            isSurplus
              ? surplusRemaining
              : deficitRemaining
          }
        />
      </div>
    ) : (
      /* Settlement Complete */
      <div className="mx-6 mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />

          <div>
            <p className="font-semibold text-green-900">
              Settlement Complete
            </p>

            <p className="mt-1 text-sm text-green-700">
              {isSurplus
                ? "The full surplus has been transferred to the General Fund."
                : "The full deficit has been funded from the General Fund."}
            </p>
          </div>
        </div>
      </div>
    )}
  </section>
)}

      {/* =====================================================
          COLLECTIONS
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-green-700" />

            <div>
              <h2 className="font-semibold text-gray-900">
                Event Collections
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Money received specifically for this event.
              </p>
            </div>
          </div>

          {isOpen && (
            <Link
              href={`/events/${event.id}/collections/new`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
            >
              <Plus className="h-4 w-4" />
              Add Collection
            </Link>
          )}
        </div>

        {event.collections.length === 0 ? (
          <EmptyState
            icon={
              <Receipt className="h-6 w-6" />
            }
            title="No collections recorded"
            description="Collections added for this event will appear here."
          />
        ) : (
          <>
            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-600">
                      Source/Name
                    </th>

                    <th className="px-6 py-3 font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-6 py-3 font-semibold text-gray-600">
                      Remarks
                    </th>

                    <th className="px-6 py-3 text-right font-semibold text-gray-600">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {event.collections.map(
                    (collection) => (
                      <tr
                        key={collection.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {collection.sourceName}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(
                            collection.receivedDate,
                          )}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {collection.remarks ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-green-700">
                          {formatCurrency(
                            Number(
                              collection.amount,
                            ),
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}

            <div className="divide-y md:hidden">
              {event.collections.map(
                (collection) => (
                  <div
                    key={collection.id}
                    className="space-y-3 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {collection.sourceName}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(
                            collection.receivedDate,
                          )}
                        </p>
                      </div>

                      <p className="font-semibold text-green-700">
                        {formatCurrency(
                          Number(
                            collection.amount,
                          ),
                        )}
                      </p>
                    </div>

                    {collection.remarks && (
                      <p className="text-sm text-gray-600">
                        {collection.remarks}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>

            <TotalRow
              label="Total Collections"
              amount={totalCollections}
              type="income"
            />
          </>
        )}
      </section>

      {/* =====================================================
          EXPENSES
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="h-5 w-5 text-red-600" />

            <div>
              <h2 className="font-semibold text-gray-900">
                Event Expenses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Expenses recorded specifically for this event.
              </p>
            </div>
          </div>

          {isOpen && (
            <Link
              href={`/events/${event.id}/expenses/new`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-600 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Plus className="h-4 w-4" />
              Add Expense
            </Link>
          )}
        </div>

        {event.expenses.length === 0 ? (
          <EmptyState
            icon={
              <CircleDollarSign className="h-6 w-6" />
            }
            title="No expenses recorded"
            description="Expenses added for this event will appear here."
          />
        ) : (
          <>
            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-gray-600">
                      Expense
                    </th>

                    <th className="px-6 py-3 font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-6 py-3 font-semibold text-gray-600">
                      Remarks
                    </th>

                    <th className="px-6 py-3 text-right font-semibold text-gray-600">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {event.expenses.map(
                    (expense) => (
                      <tr
                        key={expense.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {expense.expenseTitle}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(
                            expense.expenseDate,
                          )}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {expense.remarks ||
                            "—"}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-red-600">
                          {formatCurrency(
                            Number(
                              expense.amount,
                            ),
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}

            <div className="divide-y md:hidden">
              {event.expenses.map(
                (expense) => (
                  <div
                    key={expense.id}
                    className="space-y-3 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {expense.expenseTitle}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(
                            expense.expenseDate,
                          )}
                        </p>
                      </div>

                      <p className="font-semibold text-red-600">
                        {formatCurrency(
                          Number(
                            expense.amount,
                          ),
                        )}
                      </p>
                    </div>

                    {expense.remarks && (
                      <p className="text-sm text-gray-600">
                        {expense.remarks}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>

            <TotalRow
              label="Total Expenses"
              amount={totalExpenses}
              type="expense"
            />
          </>
        )}
      </section>

      {/* =====================================================
          FUND TRANSFERS
      ===================================================== */}

      {event.transfers.length > 0 && (
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-700" />

              <div>
                <h2 className="font-semibold text-gray-900">
                  Fund Transfers
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Transfers recorded for this event.
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y">
            {event.transfers.map(
              (transfer) => (
                <div
                  key={transfer.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-lg p-2 ${
                        transfer.direction ===
                        "TO_GENERAL_FUND"
                          ? "bg-green-50 text-green-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {transfer.direction ===
                      "TO_GENERAL_FUND" ? (
                        <ArrowUpFromLine className="h-4 w-4" />
                      ) : (
                        <ArrowDownToLine className="h-4 w-4" />
                      )}
                    </div>

                    <div>
                      <p className="font-medium text-gray-900">
                        {transfer.direction ===
                        "TO_GENERAL_FUND"
                          ? "Transferred to General Fund"
                          : "Received from General Fund"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(
                          transfer.transferDate,
                        )}
                      </p>

                      {transfer.referenceNo && (
                        <p className="mt-1 text-xs text-gray-500">
                          Reference:{" "}
                          <span className="font-medium text-gray-700">
                            {transfer.referenceNo}
                          </span>
                        </p>
                      )}

                      {transfer.remarks && (
                        <p className="mt-1 text-sm text-gray-600">
                          {transfer.remarks}
                        </p>
                      )}
                    </div>
                  </div>

                  <p
                    className={`font-semibold ${
                      transfer.direction ===
                      "TO_GENERAL_FUND"
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {transfer.direction ===
                    "TO_GENERAL_FUND"
                      ? "+"
                      : "-"}
                    {formatCurrency(
                      Number(
                        transfer.amount,
                      ),
                    )}
                  </p>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      {/* =====================================================
          BACK
      ===================================================== */}

      <div>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Completed
      </span>
    );
  }

  if (status === "CANCELLED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
        <XCircle className="h-3.5 w-3.5" />
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
      <Clock className="h-3.5 w-3.5" />
      Open
    </span>
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
      <div className="mt-0.5 rounded-lg bg-gray-100 p-2 text-gray-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
  title,
  amount,
  count,
  description,
  type,
  icon,
}: {
  title: string;
  amount: number;
  count?: number;
  description: string;
  type: "income" | "expense";
  icon: React.ReactNode;
}) {
  const styles =
    type === "income"
      ? {
          border: "border-green-200",
          icon: "bg-green-50 text-green-700",
          amount: "text-green-700",
        }
      : {
          border: "border-red-200",
          icon: "bg-red-50 text-red-600",
          amount: "text-red-600",
        };

  return (
    <div
      className={`rounded-xl border bg-white p-5 shadow-sm ${styles.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p
            className={`mt-3 text-2xl font-bold ${styles.amount}`}
          >
            {formatCurrency(amount)}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {count !== undefined
              ? `${count} ${description}`
              : description}
          </p>
        </div>

        <div
          className={`rounded-lg p-3 ${styles.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   SETTLEMENT SUMMARY
========================================================= */

function SettlementSummary({
  label,
  amount,
}: {
  label: string;
  amount: number;
}) {
  return (
    <div className="rounded-lg border bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-bold text-gray-900">
        {formatCurrency(amount)}
      </p>
    </div>
  );
}

/* =========================================================
   TOTAL ROW
========================================================= */

function TotalRow({
  label,
  amount,
  type,
}: {
  label: string;
  amount: number;
  type: "income" | "expense";
}) {
  return (
    <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4">
      <span className="text-sm font-semibold text-gray-700">
        {label}
      </span>

      <span
        className={`font-bold ${
          type === "income"
            ? "text-green-700"
            : "text-red-600"
        }`}
      >
        {formatCurrency(amount)}
      </span>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="rounded-full bg-gray-100 p-4 text-gray-500">
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {description}
      </p>
    </div>
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
  }).format(date);
}
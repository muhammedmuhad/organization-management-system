"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  ArrowLeft,
  Save,
} from "lucide-react";

import {
  createEventExpense,
  type EventExpenseState,
} from "../actions";

interface ExpenseFormProps {
  eventId: string;
  eventTitle: string;
}

const initialState: EventExpenseState = {
  success: false,
  message: "",
};

export default function ExpenseForm({
  eventId,
  eventTitle,
}: ExpenseFormProps) {
  const [state, formAction, isPending] =
    useActionState(
      createEventExpense,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-6"
    >
      <input
        type="hidden"
        name="eventId"
        value={eventId}
      />

      {/* =====================================================
          EVENT
      ===================================================== */}

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Event
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Expense for this event.
          </p>
        </div>

        <div className="p-6">
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Event
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {eventTitle}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          EXPENSE DETAILS
      ===================================================== */}

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Expense Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Record an expense against this event.
          </p>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          {/* Expense title */}

          <div className="md:col-span-2">
            <label
              htmlFor="expenseTitle"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Expense
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="expenseTitle"
              name="expenseTitle"
              type="text"
              required
              disabled={isPending}
              placeholder="e.g. Food, Decoration, Electricity"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* Amount */}

          <div>
            <label
              htmlFor="amount"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Amount
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₹
              </span>

              <input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                disabled={isPending}
                placeholder="0.00"
                className="h-11 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
              />
            </div>
          </div>

          {/* Date */}

          <div>
            <label
              htmlFor="expenseDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Expense Date
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="expenseDate"
              name="expenseDate"
              type="date"
              required
              disabled={isPending}
              defaultValue={getToday()}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          {/* Remarks */}

          <div className="md:col-span-2">
            <label
              htmlFor="remarks"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Remarks
            </label>

            <textarea
              id="remarks"
              name="remarks"
              rows={4}
              disabled={isPending}
              placeholder="Optional notes about this expense..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          INFORMATION
      ===================================================== */}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-900">
          Event Expense
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-700">
          This amount will be recorded against the
          event's financial ledger. It will reduce the
          event result but will not create a separate
          General Fund expense.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {state.message && !state.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {state.message && state.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {state.message}
        </div>
      )}

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={`/events/${eventId}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />

          {isPending
            ? "Saving..."
            : "Save Expense"}
        </button>
      </div>
    </form>
  );
}

function getToday() {
  const date = new Date();

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowLeft,
  Save,
} from "lucide-react";

import {
  createEventCollection,
  type EventCollectionState,
} from "../actions";

interface HouseholdOption {
  id: string;
  householdCode: string;
  houseNumber: string | null;
  houseName: string;
}

interface CollectionFormProps {
  eventId: string;
  eventTitle: string;
  households: HouseholdOption[];
}

const initialState: EventCollectionState = {
  success: false,
  message: "",
};

export default function CollectionForm({
  eventId,
  eventTitle,
  households,
}: CollectionFormProps) {
  const [state, formAction, isPending] =
    useActionState(
      createEventCollection,
      initialState,
    );

  const [householdId, setHouseholdId] = useState("");
  const [sourceName, setSourceName] = useState("");

  const selectedHousehold = households.find(
    (household) => household.id === householdId,
  );

  const sourceValue = selectedHousehold
    ? selectedHousehold.houseName
    : sourceName;

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
            Collection for this event.
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
          COLLECTION DETAILS
      ===================================================== */}

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Collection Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Record money received for this event.
          </p>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          {/* Household */}

          <div className="md:col-span-2">
            <label
              htmlFor="householdId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Household
            </label>

            <select
              id="householdId"
              name="householdId"
              value={householdId}
              onChange={(event) => setHouseholdId(event.target.value)}
              disabled={isPending}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            >
              <option value="">
                Select household (optional)
              </option>

              {households.map((household) => (
                <option key={household.id} value={household.id}>
                  {household.householdCode} — {household.houseName}
                  {household.houseNumber
                    ? ` (${household.houseNumber})`
                    : ""}
                </option>
              ))}
            </select>

            <p className="mt-1.5 text-xs text-gray-500">
              Select a household if this collection is from a registered household.
            </p>
          </div>

          {/* Source / Name */}

          <div className="md:col-span-2">
            <label
              htmlFor="sourceName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Source/Name
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="sourceName"
              name="sourceName"
              type="text"
              value={sourceValue}
              onChange={(event) => setSourceName(event.target.value)}
              required={!selectedHousehold}
              disabled={isPending || Boolean(selectedHousehold)}
              placeholder="e.g. Sponsor, Donation, Ticket Collection"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />

            <p className="mt-1.5 text-xs text-gray-500">
              {selectedHousehold
                ? "Household name is used automatically."
                : "Enter who or where the money came from."}
            </p>
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
              htmlFor="receivedDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Received Date
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="receivedDate"
              name="receivedDate"
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
              placeholder="Optional notes about this collection..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          INFORMATION
      ===================================================== */}

      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <p className="text-sm font-medium text-blue-900">
          Event Collection
        </p>

        <p className="mt-1 text-xs leading-5 text-blue-700">
          This amount will be recorded in the event's
          financial ledger. It will not be added to the
          General Fund until the event is settled.
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
            : "Save Collection"}
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
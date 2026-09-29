"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Save,
} from "lucide-react";

import {
  createEvent,
  type EventActionState,
} from "../actions";

interface EventCategory {
  id: string;
  name: string;
}

interface EventFormProps {
  categories: EventCategory[];
}

const initialState: EventActionState = {
  success: false,
  message: "",
};

export default function EventForm({
  categories,
}: EventFormProps) {
  const [state, formAction, isPending] =
    useActionState(
      createEvent,
      initialState,
    );

  return (
    <form action={formAction} className="space-y-6">
      {/* ----------------------------------------------------
          BASIC INFORMATION
      ---------------------------------------------------- */}

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Basic Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the basic details of the event.
          </p>
        </div>

        <div className="grid gap-5 p-6">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Event Name
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              required
              disabled={isPending}
              placeholder="e.g. Annual Mahallu Program"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="categoryId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Event Category
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              id="categoryId"
              name="categoryId"
              required
              disabled={
                isPending ||
                categories.length === 0
              }
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            >
              <option value="">
                Select category
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>

            {categories.length === 0 && (
              <p className="mt-2 text-xs text-red-600">
                No active event categories are
                available. Add an event category in
                Settings first.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              disabled={isPending}
              placeholder="Enter additional details about the event..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          SCHEDULE
      ---------------------------------------------------- */}

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-green-700" />

            <h2 className="font-semibold text-gray-900">
              Schedule
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Define when the event starts and ends.
          </p>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Start Date
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="startDate"
              name="startDate"
              type="date"
              required
              disabled={isPending}
              defaultValue={getToday()}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              End Date
            </label>

            <input
              id="endDate"
              name="endDate"
              type="date"
              disabled={isPending}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="startTime"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Start Time
            </label>

            <input
              id="startTime"
              name="startTime"
              type="time"
              disabled={isPending}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="endTime"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              End Time
            </label>

            <input
              id="endTime"
              name="endTime"
              type="time"
              disabled={isPending}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------
          LOCATION
      ---------------------------------------------------- */}

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-700" />

            <h2 className="font-semibold text-gray-900">
              Location
            </h2>
          </div>
        </div>

        <div className="p-6">
          <label
            htmlFor="venue"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Venue
          </label>

          <input
            id="venue"
            name="venue"
            type="text"
            disabled={isPending}
            placeholder="e.g. Mahallu Hall"
            className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100 disabled:bg-gray-100"
          />
        </div>
      </section>

      {/* ----------------------------------------------------
          ERROR
      ---------------------------------------------------- */}

      {state.message && !state.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      {/* ----------------------------------------------------
          ACTIONS
      ---------------------------------------------------- */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/events"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            isPending ||
            categories.length === 0
          }
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save className="h-4 w-4" />

          {isPending
            ? "Creating Event..."
            : "Create Event"}
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
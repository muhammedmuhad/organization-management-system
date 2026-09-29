import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
} from "lucide-react";

export default function ReportsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Reports
        </h1>

        <p className="mt-1 text-gray-500">
          View financial and event reports.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/reports/financial"
          className="group rounded-xl border bg-white p-6 shadow-sm transition hover:border-green-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-green-50 p-3 text-green-700">
              <BarChart3 className="h-6 w-6" />
            </div>

            <ChevronRight className="h-5 w-5 text-gray-400 transition group-hover:translate-x-1 group-hover:text-green-700" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-gray-900">
            Financial Reports
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            View income, expenses, collections and
            financial balance for a selected period.
          </p>
        </Link>

        <Link
          href="/reports/events"
          className="group rounded-xl border bg-white p-6 shadow-sm transition hover:border-green-300 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
              <CalendarDays className="h-6 w-6" />
            </div>

            <ChevronRight className="h-5 w-5 text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-700" />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-gray-900">
            Event Reports
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            View collections, expenses, transfers and
            financial results for individual events.
          </p>
        </Link>
      </div>
    </main>
  );
}
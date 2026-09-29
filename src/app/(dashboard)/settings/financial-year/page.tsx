import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";

function getCurrentFinancialYear(today = new Date()) {
  return String(today.getFullYear());
}

export default function FinancialYearPage() {
  const currentFinancialYear =
    getCurrentFinancialYear();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/settings"
          className="mt-1 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to settings"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Year
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              The Mahallu financial year follows the calendar year from January to December.
            </p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Financial Year Configuration
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Financial records and reports use January 1 through December 31 as the financial year.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <span className="mb-2 block text-sm font-medium text-gray-900">
                Financial Year
              </span>

              <div className="flex h-12 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-900">
                January 1 – December 31
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-gray-900">
                Current Financial Year
              </span>

              <div className="flex h-12 items-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-900">
                {currentFinancialYear}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
            <p className="text-sm text-blue-900">
              The financial year runs from <span className="font-semibold">January 1</span> to <span className="font-semibold">December 31</span>.
            </p>

            <p className="mt-1 text-xs text-blue-700">
              This is fixed for the Mahallu and is used consistently for financial filtering, summaries and reports.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
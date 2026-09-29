import Link from "next/link";
import {
  ArrowLeft,
  History,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

interface AuditPageProps {
  searchParams: Promise<{
    q?: string;
    module?: string;
    action?: string;
  }>;
}

type AuditData = Record<string, unknown>;

interface AuditRowLog {
  id: string;
  tableName: string;
  recordId: string;
  action: string;
  oldValue: unknown;
  newValue: unknown;
  createdAt: Date;
  performedBy: {
    id: string;
    username: string;
    fullName: string;
  } | null;
}

export default async function FinanceAuditPage({
  searchParams,
}: AuditPageProps) {
  const params = await searchParams;

  const search = (params.q || "").trim();
  const moduleFilter = (params.module || "").trim();
  const actionFilter = (params.action || "").trim();

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(moduleFilter
        ? {
            tableName: moduleFilter,
          }
        : {}),

      ...(actionFilter
        ? {
            action: actionFilter,
          }
        : {}),

      ...(search
        ? {
            OR: [
              {
                recordId: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                tableName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                action: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                performedBy: {
                  is: {
                    username: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
              {
                performedBy: {
                  is: {
                    fullName: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              },
            ],
          }
        : {}),
    },

    include: {
      performedBy: {
        select: {
          id: true,
          username: true,
          fullName: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 100,
  });

  const modules = Array.from(
    new Set(
      logs.map((log) => log.tableName),
    ),
  ).sort();

  const actions = Array.from(
    new Set(
      logs.map((log) => log.action),
    ),
  ).sort();

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center gap-3">
        <Link
          href="/finance"
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to finance"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Audit History
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review changes made to financial records.
          </p>
        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <form
        method="GET"
        className="rounded-xl border bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]">
          {/* Search */}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              name="q"
              defaultValue={search}
              placeholder="Search user, module or record..."
              className="h-11 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Module */}

          <select
            name="module"
            defaultValue={moduleFilter}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              All Modules
            </option>

            {modules.map((module) => (
              <option
                key={module}
                value={module}
              >
                {formatModuleName(module)}
              </option>
            ))}
          </select>

          {/* Action */}

          <select
            name="action"
            defaultValue={actionFilter}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              All Actions
            </option>

            {actions.map((action) => (
              <option
                key={action}
                value={action}
              >
                {action}
              </option>
            ))}
          </select>

          {/* Buttons */}

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Filter
            </button>

            {(search ||
              moduleFilter ||
              actionFilter) && (
              <Link
                href="/finance/audit"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* =====================================================
          AUDIT LIST
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {/* Section Header */}

        <div className="border-b px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-700">
              <History className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">
                Activity History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Showing the latest{" "}
                {logs.length} activity record
                {logs.length !== 1 ? "s" : ""}.
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}

        {logs.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <History className="mx-auto h-8 w-8 text-gray-300" />

            <h3 className="mt-3 font-semibold text-gray-900">
              No audit records found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters.
            </p>
          </div>
        ) : (
          /* Records */

          <div className="divide-y">
            {logs.map((log) => (
              <AuditRow
                key={log.id}
                log={log}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   AUDIT ROW
========================================================= */

function AuditRow({
  log,
}: {
  log: AuditRowLog;
}) {
  const oldData = toAuditData(log.oldValue);
  const newData = toAuditData(log.newValue);

  return (
    <div className="p-6">
      {/* Header */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {/* Badges */}

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
              {formatModuleName(log.tableName)}
            </span>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getActionClass(
                log.action,
              )}`}
            >
              {log.action}
            </span>
          </div>

          {/* User / action */}

          <p className="mt-3 text-sm text-gray-900">
            <span className="font-semibold">
              {log.performedBy?.fullName ||
                log.performedBy?.username ||
                "Unknown user"}
            </span>{" "}
            {getActionText(log.action)}
          </p>

          {/* Record ID */}

          <p className="mt-1 break-all text-xs text-gray-500">
            Record ID: {log.recordId}
          </p>
        </div>

        {/* Date */}

        <div className="shrink-0 text-sm text-gray-500 lg:text-right">
          {formatDateTime(log.createdAt)}
        </div>
      </div>

      {/* =====================================================
          CHANGES
      ===================================================== */}

      {log.action === "UPDATE" &&
        oldData !== null &&
        newData !== null && (
          <ChangeSummary
            oldValue={oldData}
            newValue={newData}
          />
        )}
    </div>
  );
}

/* =========================================================
   CHANGE SUMMARY
========================================================= */

function ChangeSummary({
  oldValue,
  newValue,
}: {
  oldValue: AuditData;
  newValue: AuditData;
}) {
  const keys = Array.from(
    new Set([
      ...Object.keys(oldValue),
      ...Object.keys(newValue),
    ]),
  ).filter(
    (key) =>
      key !== "categoryId" &&
      key !== "categoryName",
  );

  const changedKeys = keys.filter(
    (key) =>
      JSON.stringify(oldValue[key]) !==
      JSON.stringify(newValue[key]),
  );

  if (changedKeys.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg border bg-gray-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
        Changes
      </p>

      <div className="mt-3 space-y-3">
        {changedKeys.map((key) => (
          <div
            key={key}
            className="grid gap-2 text-sm sm:grid-cols-[140px_1fr_1fr]"
          >
            {/* Field */}

            <div className="flex items-center">
              <span className="font-medium text-gray-600">
                {formatFieldName(key)}
              </span>
            </div>

            {/* Previous */}

            <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-400">
                Previous
              </p>

              <p className="break-words text-red-700">
                {formatValue(oldValue[key])}
              </p>
            </div>

            {/* New */}

            <div className="rounded-md border border-green-100 bg-green-50 px-3 py-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-green-500">
                Updated
              </p>

              <p className="break-words text-green-700">
                {formatValue(newValue[key])}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   JSON NORMALIZATION
========================================================= */

function toAuditData(
  value: unknown,
): AuditData | null {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as AuditData;
}

/* =========================================================
   ACTION TEXT
========================================================= */

function getActionText(action: string) {
  switch (action) {
    case "CREATE":
      return "created this record.";

    case "UPDATE":
      return "updated this record.";

    case "DELETE":
      return "deleted this record.";

    case "RESTORE":
      return "restored this record.";

    default:
      return `${action.toLowerCase()} this record.`;
  }
}

/* =========================================================
   ACTION BADGE
========================================================= */

function getActionClass(action: string) {
  switch (action) {
    case "CREATE":
      return "bg-green-50 text-green-700";

    case "UPDATE":
      return "bg-orange-50 text-orange-700";

    case "DELETE":
      return "bg-red-50 text-red-700";

    case "RESTORE":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

/* =========================================================
   MODULE NAME
========================================================= */

function formatModuleName(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ");
}

/* =========================================================
   FIELD NAME
========================================================= */

function formatFieldName(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (char) =>
      char.toUpperCase(),
    );
}

/* =========================================================
   VALUE FORMAT
========================================================= */

function formatValue(value: unknown): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  if (typeof value === "number") {
    return new Intl.NumberFormat("en-IN").format(
      value,
    );
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string") {
    // ISO date detection
    if (
      value.includes("T") &&
      !Number.isNaN(Date.parse(value))
    ) {
      return formatDateTime(
        new Date(value),
      );
    }

    return value || "—";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

/* =========================================================
   DATE / TIME
========================================================= */

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
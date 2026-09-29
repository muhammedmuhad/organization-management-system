import Link from "next/link";
import {
  ArrowLeft,
  ChevronDown,
  History,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

interface AuditLogsPageProps {
  searchParams: Promise<{
    q?: string;
    module?: string;
    action?: string;
  }>;
}

export default async function AuditLogsPage({
  searchParams,
}: AuditLogsPageProps) {
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
    new Set(logs.map((log) => log.tableName)),
  ).sort();

  const actions = Array.from(
    new Set(logs.map((log) => log.action)),
  ).sort();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/settings"
          className="mt-1 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to settings"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <History className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Audit Logs
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Review important system actions and administrative activity.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <form
          method="GET"
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]"
        >
          <div>
            <label
              htmlFor="q"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Search
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

              <input
                id="q"
                name="q"
                defaultValue={search}
                placeholder="Search user, module, action or record..."
                className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="module"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Module
            </label>

            <select
              id="module"
              name="module"
              defaultValue={moduleFilter}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="">All Modules</option>

              {modules.map((module) => (
                <option key={module} value={module}>
                  {formatModuleName(module)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="action"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Action
            </label>

            <select
              id="action"
              name="action"
              defaultValue={actionFilter}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="">All Actions</option>

              {actions.map((action) => (
                <option key={action} value={action}>
                  {formatActionName(action)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="h-11 self-end rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Filter
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              System Activity
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Showing the latest 100 matching audit records.
            </p>
          </div>

          <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {logs.length} records
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <History className="h-7 w-7 text-gray-500" />
            </div>

            <h3 className="font-semibold text-gray-900">
              No audit records found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Try changing the filters or perform an administrative
              action to create an audit record.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {logs.map((log) => (
              <details
                key={log.id}
                className="group"
              >
                <summary className="flex cursor-pointer list-none items-center gap-4 px-6 py-5 transition hover:bg-gray-50">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                    <History className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {formatActionName(log.action)}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                        {formatModuleName(log.tableName)}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span>
                        {log.performedBy?.fullName ||
                          log.performedBy?.username ||
                          "System"}
                      </span>

                      <span>•</span>

                      <span>
                        {formatDateTime(log.createdAt)}
                      </span>

                      <span>•</span>

                      <span>
                        Record: {log.recordId}
                      </span>
                    </div>
                  </div>

                  <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
                </summary>

                <div className="border-t bg-gray-50 px-6 py-5">
                  <div className="grid gap-5 lg:grid-cols-2">
                    <AuditValue
                      title="Previous Value"
                      value={log.oldValue}
                    />

                    <AuditValue
                      title="New Value"
                      value={log.newValue}
                    />
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AuditValue({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </p>

      <pre className="max-h-80 overflow-auto rounded-lg border border-gray-200 bg-white p-4 text-xs leading-5 text-gray-700">
        {value == null
          ? "No data recorded"
          : JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

function formatModuleName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatActionName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
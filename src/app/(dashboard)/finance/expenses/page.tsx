import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  Edit,
  Plus,
  Receipt,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

interface ExpensesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
}

export default async function ExpensesPage({
  searchParams,
}: ExpensesPageProps) {
  const params = await searchParams;

  const search = (params.q || "").trim();
  const categoryId = params.category || "";

  const [categories, expenses] = await Promise.all([
    prisma.expenseCategoryMaster.findMany({
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

    prisma.expense.findMany({
      where: {
        ...(categoryId
          ? {
              categoryId,
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  description: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  billNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  category: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        category: true,
        createdBy: {
          select: {
            username: true,
            fullName: true,
          },
        },
      },

      orderBy: {
        expenseDate: "desc",
      },
    }),
  ]);

  const total = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              Expenses
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage recorded expense transactions.
            </p>
          </div>
        </div>

        <Link
          href="/finance/expenses/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
        >
          <Plus className="h-4 w-4" />
          Add Expense
        </Link>
      </div>

      {/* Summary */}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Total Expenses
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {formatCurrency(total)}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Based on current results
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-3 text-red-600">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Transactions
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {expenses.length}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Matching expense records
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}

      <form
        method="GET"
        className="rounded-xl border bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              name="q"
              defaultValue={search}
              placeholder="Search description, bill or category..."
              className="h-11 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          <select
            name="category"
            defaultValue={categoryId}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
          >
            <option value="">
              All Categories
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

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 flex-1 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800 md:flex-none"
            >
              Search
            </button>

            {(search || categoryId) && (
              <Link
                href="/finance/expenses"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* Expense Table */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            Expense Transactions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {expenses.length} transaction
            {expenses.length !== 1 ? "s" : ""} found.
          </p>
        </div>

        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-red-50 p-4">
              <Receipt className="h-7 w-7 text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              No expense transactions found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              {search || categoryId
                ? "Try changing your search or category filter."
                : "Start by recording your first expense transaction."}
            </p>

            {!search && !categoryId && (
              <Link
                href="/finance/expenses/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Category
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Description
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Bill / Reference
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Created By
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-gray-600">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        {formatDate(expense.expenseDate)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                          {expense.category.name}
                        </span>
                      </td>

                      <td className="max-w-sm px-5 py-4 text-gray-700">
                        {expense.description || "—"}
                      </td>

                      <td className="px-5 py-4 text-gray-500">
                        {expense.billNumber || "—"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {expense.createdBy.fullName ||
                          expense.createdBy.username}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-red-600">
                        -{formatCurrency(Number(expense.amount))}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/finance/expenses/${expense.id}/edit`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile */}

            <div className="divide-y md:hidden">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  className="space-y-4 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        {expense.category.name}
                      </span>

                      <h3 className="mt-2 font-semibold text-gray-900">
                        {expense.description ||
                          "Expense transaction"}
                      </h3>
                    </div>

                    <p className="whitespace-nowrap font-semibold text-red-600">
                      -{formatCurrency(Number(expense.amount))}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem
                      label="Date"
                      value={formatDate(
                        expense.expenseDate,
                      )}
                    />

                    <InfoItem
                      label="Reference"
                      value={expense.billNumber || "—"}
                    />

                    <InfoItem
                      label="Created By"
                      value={
                        expense.createdBy.fullName ||
                        expense.createdBy.username
                      }
                    />
                  </div>

                  <Link
                    href={`/finance/expenses/${expense.id}/edit`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Expense
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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
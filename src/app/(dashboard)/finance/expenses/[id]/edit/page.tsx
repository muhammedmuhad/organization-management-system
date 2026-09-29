import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { updateExpense } from "../../actions";

interface EditExpensePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditExpensePage({
  params,
}: EditExpensePageProps) {
  const { id } = await params;

  const [expense, categories] = await Promise.all([
    prisma.expense.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
      },
    }),

    prisma.expenseCategoryMaster.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),
  ]);

  if (!expense) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}

      <div className="flex items-center gap-3">
        <Link
          href="/finance/expenses"
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to expenses"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Expense
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update this expense transaction.
          </p>
        </div>
      </div>

      {/* Form */}

      <form
        action={updateExpense}
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <input
          type="hidden"
          name="expenseId"
          value={expense.id}
        />

        <div className="space-y-6 p-6">
          {/* Category */}

          <div>
            <label
              htmlFor="categoryId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Expense Category
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue={expense.categoryId}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Amount + Date */}

          <div className="grid gap-6 sm:grid-cols-2">
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                  ₹
                </span>

                <input
                  id="amount"
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={Number(
                    expense.amount,
                  ).toFixed(2)}
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>

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
                defaultValue={formatDateForInput(
                  expense.expenseDate,
                )}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>

          {/* Bill Number */}

          <div>
            <label
              htmlFor="billNumber"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Bill / Reference Number
            </label>

            <input
              id="billNumber"
              name="billNumber"
              type="text"
              maxLength={100}
              defaultValue={
                expense.billNumber || ""
              }
              placeholder="Optional bill or reference number"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* Description */}

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
              maxLength={500}
              defaultValue={
                expense.description || ""
              }
              placeholder="Add additional details..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>

          {/* Metadata */}

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Current Category
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {expense.category.name}
            </p>

            <p className="mt-3 text-xs text-gray-500">
              Created on{" "}
              {formatDisplayDate(
                expense.createdAt,
              )}
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href="/finance/expenses"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}

function formatDateForInput(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
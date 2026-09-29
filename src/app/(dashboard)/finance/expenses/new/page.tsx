import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createExpense } from "../actions";

export default async function AddExpensePage() {
  const categories =
    await prisma.expenseCategoryMaster.findMany({
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
    });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}

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
            Add Expense
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Record a new expense transaction.
          </p>
        </div>
      </div>

      {/* Form */}

      <form
        action={createExpense}
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
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
              defaultValue=""
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            >
              <option value="" disabled>
                Select expense category
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
              <p className="mt-2 text-sm text-amber-600">
                No active expense categories are
                available. Create an expense category
                first.
              </p>
            )}
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
                  placeholder="0.00"
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
                defaultValue={getToday()}
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
              placeholder="Optional bill or reference number"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />

            <p className="mt-1.5 text-xs text-gray-400">
              Use this for a supplier bill number, voucher
              number, bank reference, etc.
            </p>
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
              placeholder="Add details about this expense..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>
        </div>

        {/* Footer */}

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href="/finance"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={categories.length === 0}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Expense
          </button>
        </div>
      </form>
    </div>
  );
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
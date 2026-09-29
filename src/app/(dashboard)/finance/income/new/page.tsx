import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createIncome } from "../actions";

export default async function AddIncomePage() {
  const categories =
    await prisma.incomeCategoryMaster.findMany({
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
            Add Income
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Record a new income transaction.
          </p>
        </div>
      </div>

      {/* Form */}

      <form
        action={createIncome}
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <div className="space-y-6 p-6">
          {/* Category */}

          <div>
            <label
              htmlFor="categoryId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Income Category
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="categoryId"
              name="categoryId"
              required
              defaultValue=""
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="" disabled>
                Select income category
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
                No active income categories are
                available. Create an income category
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
                  className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-8 pr-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="incomeDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Income Date
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="incomeDate"
                name="incomeDate"
                type="date"
                required
                defaultValue={getToday()}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Receipt Number */}

          <div>
            <label
              htmlFor="receiptNumber"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Receipt / Reference Number
            </label>

            <input
              id="receiptNumber"
              name="receiptNumber"
              type="text"
              maxLength={100}
              placeholder="Optional reference number"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />

            <p className="mt-1.5 text-xs text-gray-400">
              Use this for a receipt number, bank reference,
              voucher number, etc.
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
              placeholder="Add any additional details about this income..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-medium text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save Income
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
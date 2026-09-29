import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { updateIncome } from "../../actions";

interface EditIncomePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditIncomePage({
  params,
}: EditIncomePageProps) {
  const { id } = await params;

  const [income, categories] = await Promise.all([
    prisma.income.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
      },
    }),

    prisma.incomeCategoryMaster.findMany({
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

  if (!income) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}

      <div className="flex items-center gap-3">
        <Link
          href="/finance/income"
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to income"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Income
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update this income transaction.
          </p>
        </div>
      </div>

      {/* Form */}

      <form
        action={updateIncome}
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <input
          type="hidden"
          name="incomeId"
          value={income.id}
        />

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
              defaultValue={income.categoryId}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
                    income.amount,
                  ).toFixed(2)}
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
                defaultValue={formatDateForInput(
                  income.incomeDate,
                )}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Receipt */}

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
              defaultValue={
                income.receiptNumber || ""
              }
              placeholder="Optional reference number"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
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
                income.description || ""
              }
              placeholder="Add additional details..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Metadata */}

          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Current Category
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {income.category.name}
            </p>

            <p className="mt-3 text-xs text-gray-500">
              Created on{" "}
              {formatDisplayDate(
                income.createdAt,
              )}
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href="/finance/income"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-medium text-white transition hover:bg-green-800"
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
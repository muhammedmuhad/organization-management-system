import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Plus,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

import DeleteCategoryButton from "./delete-category-button";

type CategoryType = "income" | "expense";

interface IncomeCategoriesPageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

export default async function IncomeCategoriesPage({
  searchParams,
}: IncomeCategoriesPageProps) {
  const params = await searchParams;

  const type: CategoryType =
    params.type === "expense"
      ? "expense"
      : "income";

  const isIncome = type === "income";

  /* =========================================================
     LOAD CATEGORIES
     ========================================================= */

  const [
    incomeCategories,
    expenseCategories,
  ] = await Promise.all([
    prisma.incomeCategoryMaster.findMany({
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    }),

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
  ]);

  /* =========================================================
     LOAD TRANSACTION USAGE COUNTS
     ========================================================= */

  const [
    incomeUsage,
    expenseUsage,
  ] = await Promise.all([
    prisma.income.groupBy({
      by: ["categoryId"],
      _count: {
        categoryId: true,
      },
    }),

    prisma.expense.groupBy({
      by: ["categoryId"],
      _count: {
        categoryId: true,
      },
    }),
  ]);

  const incomeUsageMap = new Map(
    incomeUsage.map((item) => [
      item.categoryId,
      item._count.categoryId,
    ]),
  );

  const expenseUsageMap = new Map(
    expenseUsage.map((item) => [
      item.categoryId,
      item._count.categoryId,
    ]),
  );

  /* =========================================================
     SELECT CURRENT CATEGORY TYPE
     ========================================================= */

  const categories = isIncome
    ? incomeCategories
    : expenseCategories;

  const categoryCount = categories.length;

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
          ===================================================== */}

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
              Categories
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage income and expense categories.
            </p>
          </div>
        </div>

        <Link
          href={`/finance/income-categories/new?type=${type}`}
          className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition ${
            isIncome
              ? "bg-green-700 hover:bg-green-800"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Link>
      </div>

      {/* =====================================================
          CATEGORY TABS
          ===================================================== */}

      <div className="rounded-xl border bg-white p-1 shadow-sm">
        <div className="grid grid-cols-2">
          <Link
            href="/finance/income-categories?type=income"
            className={`rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
              isIncome
                ? "bg-green-700 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Income Categories
          </Link>

          <Link
            href="/finance/income-categories?type=expense"
            className={`rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
              !isIncome
                ? "bg-red-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Expense Categories
          </Link>
        </div>
      </div>

      {/* =====================================================
          SUMMARY
          ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          label="Total Categories"
          value={categoryCount}
        />

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Category Type
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {isIncome ? "Income" : "Expense"}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {isIncome
              ? "Used for money received"
              : "Used for money spent"}
          </p>
        </div>
      </div>

      {/* =====================================================
          CATEGORY LIST
          ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            {isIncome
              ? "Income Categories"
              : "Expense Categories"}
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {isIncome
              ? "Categories used to classify incoming funds."
              : "Categories used to classify outgoing expenses."}
          </p>
        </div>

        {categories.length === 0 ? (
          <EmptyState type={type} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-4 font-semibold text-gray-600">
                    #
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-600">
                    Category
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-600">
                    Description
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-600">
                    Order
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {categories.map(
                  (category, index) => {
                    const usageCount = isIncome
                      ? incomeUsageMap.get(
                          category.id,
                        ) ?? 0
                      : expenseUsageMap.get(
                          category.id,
                        ) ?? 0;

                    return (
                      <tr
                        key={category.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* NUMBER */}

                        <td className="px-5 py-4 text-gray-400">
                          {index + 1}
                        </td>

                        {/* CATEGORY */}

                        <td className="px-5 py-4">
                          <div className="font-medium text-gray-900">
                            {category.name}
                          </div>
                        </td>

                        {/* DESCRIPTION */}

                        <td className="max-w-md px-5 py-4 text-gray-600">
                          {category.description ||
                            "—"}
                        </td>

                        {/* ORDER */}

                        <td className="px-5 py-4 text-gray-600">
                          {category.displayOrder}
                        </td>

                        {/* ACTIONS */}

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {/* EDIT */}

                            <Link
                              href={`/finance/income-categories/${category.id}/edit?type=${type}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Link>

                            {/* DELETE / IN USE */}

                            <DeleteCategoryButton
                              categoryId={
                                category.id
                              }
                              categoryName={
                                category.name
                              }
                              type={type}
                              usageCount={
                                usageCount
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =====================================================
          DELETE INFORMATION
          ===================================================== */}

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-sm font-medium text-amber-800">
          Category deletion
        </p>

        <p className="mt-1 text-sm text-amber-700">
          Categories already used in transactions cannot
          be permanently deleted. They are protected
          automatically.
        </p>
      </div>
    </div>
  );
}

/* ===========================================================
   SUMMARY CARD
   =========================================================== */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>
    </div>
  );
}

/* ===========================================================
   EMPTY STATE
   =========================================================== */

function EmptyState({
  type,
}: {
  type: CategoryType;
}) {
  const isIncome = type === "income";

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className={`mb-4 rounded-full p-4 ${
          isIncome
            ? "bg-green-50"
            : "bg-red-50"
        }`}
      >
        <Plus
          className={`h-7 w-7 ${
            isIncome
              ? "text-green-700"
              : "text-red-600"
          }`}
        />
      </div>

      <h2 className="text-lg font-semibold text-gray-900">
        No{" "}
        {isIncome
          ? "income"
          : "expense"}{" "}
        categories
      </h2>

      <p className="mt-1 max-w-md text-sm text-gray-500">
        Create your first{" "}
        {isIncome
          ? "income"
          : "expense"}{" "}
        category to start classifying transactions.
      </p>

      <Link
        href={`/finance/income-categories/new?type=${type}`}
        className={`mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white ${
          isIncome
            ? "bg-green-700 hover:bg-green-800"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        <Plus className="h-4 w-4" />
        Add Category
      </Link>
    </div>
  );
}
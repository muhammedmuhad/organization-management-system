import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CreditCard,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ReceiptPurpose } from "@prisma/client";

interface TransactionsPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
  }>;
}

type Transaction = {
  id: string;
  date: Date;
  createdAt: Date;
  type:
    | "Income"
    | "Membership"
    | "Expense";
  category: string;
  description: string;
  reference: string;
  amount: number;
};

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;

  const search = (params.q || "").trim();
  const type = params.type || "ALL";

  const [
    income,
    expenses,
    memberships,
  ] = await Promise.all([
    type === "ALL" || type === "INCOME"
      ? prisma.income.findMany({
          where: search
            ? {
                OR: [
                  {
                    description: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    receiptNumber: {
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
            : undefined,
          include: {
            category: true,
          },
          orderBy: {
            incomeDate: "desc",
          },
        })
      : Promise.resolve([]),

    type === "ALL" || type === "EXPENSE"
      ? prisma.expense.findMany({
          where: search
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
            : undefined,
          include: {
            category: true,
          },
          orderBy: {
            expenseDate: "desc",
          },
        })
      : Promise.resolve([]),

    type === "ALL" ||
    type === "MEMBERSHIP"
      ? prisma.membershipReceipt.findMany({
          where: search
            ? {
                OR: [
                  {
                    receiptNumber: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    remarks: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    purpose: {
                      equals:
                        getPurposeFromSearch(
                          search,
                        ),
                    },
                  },
                  {
                    household: {
                      houseName: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                  {
                    household: {
                      householdCode: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : undefined,
          include: {
            household: {
              select: {
                householdCode: true,
                houseName: true,
              },
            },
          },
          orderBy: {
            receiptDate: "desc",
          },
        })
      : Promise.resolve([]),
  ]);

  const transactions: Transaction[] = [
    ...income.map((item) => ({
      id: `income-${item.id}`,
      date: item.incomeDate,
      createdAt: item.createdAt,
      type: "Income" as const,
      category: item.category.name,
      description:
        item.description ||
        "Income transaction",
      reference:
        item.receiptNumber || "—",
      amount: Number(item.amount),
    })),

    ...expenses.map((item) => ({
      id: `expense-${item.id}`,
      date: item.expenseDate,
      createdAt: item.createdAt,
      type: "Expense" as const,
      category: item.category.name,
      description:
        item.description ||
        "Expense transaction",
      reference:
        item.billNumber || "—",
      amount: Number(item.amount),
    })),

    ...memberships.map((item) => ({
      id: `membership-${item.id}`,
      date: item.receiptDate,
      createdAt: item.createdAt,
      type: "Membership" as const,
      category: formatPurpose(
        item.purpose,
      ),
      description: item.household
        ? `${item.household.houseName} (${item.household.householdCode})`
        : item.remarks ||
          formatPurpose(item.purpose),
      reference: item.receiptNumber,
      amount: Number(
        item.totalAmount,
      ),
    })),
  ];

  transactions.sort(
    (a, b) =>
      b.createdAt.getTime() -
      a.createdAt.getTime(),
  );

  const totalIncome = transactions
    .filter(
      (transaction) =>
        transaction.type ===
          "Income" ||
        transaction.type ===
          "Membership",
    )
    .reduce(
      (sum, transaction) =>
        sum + transaction.amount,
      0,
    );

  const totalExpenses = transactions
    .filter(
      (transaction) =>
        transaction.type ===
        "Expense",
    )
    .reduce(
      (sum, transaction) =>
        sum + transaction.amount,
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
              Transactions
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Complete financial transaction
              history.
            </p>
          </div>
        </div>
      </div>

      {/* Summary */}

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          title="Income"
          value={formatCurrency(
            totalIncome,
          )}
          icon={
            <ArrowUpRight className="h-5 w-5" />
          }
          iconClass="bg-green-50 text-green-700"
        />

        <SummaryCard
          title="Expenses"
          value={formatCurrency(
            totalExpenses,
          )}
          icon={
            <ArrowDownRight className="h-5 w-5" />
          }
          iconClass="bg-red-50 text-red-600"
        />

        <SummaryCard
          title="Net"
          value={formatCurrency(
            totalIncome -
              totalExpenses,
          )}
          icon={
            <CreditCard className="h-5 w-5" />
          }
          iconClass={
            totalIncome -
              totalExpenses >=
            0
              ? "bg-blue-50 text-blue-700"
              : "bg-red-50 text-red-600"
          }
        />
      </div>

      {/* Filters */}

      <form
        method="GET"
        className="rounded-xl border bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              name="q"
              defaultValue={search}
              placeholder="Search transactions..."
              className="h-11 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <select
            name="type"
            defaultValue={type}
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="ALL">
              All Transactions
            </option>

            <option value="INCOME">
              Income
            </option>

            <option value="MEMBERSHIP">
              Collections
            </option>

            <option value="EXPENSE">
              Expenses
            </option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Search
            </button>

            {(search ||
              type !== "ALL") && (
              <Link
                href="/finance/transactions"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>

      {/* Transaction Table */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            All Transactions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {transactions.length} transaction
            {transactions.length !==
            1
              ? "s"
              : ""}{" "}
            found.
          </p>
        </div>

        {transactions.length ===
        0 ? (
          <div className="px-6 py-16 text-center">
            <h3 className="font-semibold text-gray-900">
              No transactions found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search
              or transaction type
              filter.
            </p>
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
                      Type
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Category
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Description
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Reference
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-gray-600">
                      Amount
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {transactions.map(
                    (transaction) => (
                      <tr
                        key={
                          transaction.id
                        }
                        className="transition hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                          {formatDate(
                            transaction.date,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <TransactionType
                            type={
                              transaction.type
                            }
                          />
                        </td>

                        <td className="px-5 py-4 font-medium text-gray-900">
                          {
                            transaction.category
                          }
                        </td>

                        <td className="max-w-sm px-5 py-4 text-gray-600">
                          {
                            transaction.description
                          }
                        </td>

                        <td className="px-5 py-4 text-gray-500">
                          {
                            transaction.reference
                          }
                        </td>

                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                            transaction.type ===
                            "Expense"
                              ? "text-red-600"
                              : "text-green-700"
                          }`}
                        >
                          {transaction.type ===
                          "Expense"
                            ? "-"
                            : "+"}
                          {formatCurrency(
                            transaction.amount,
                          )}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile */}

            <div className="divide-y md:hidden">
              {transactions.map(
                (transaction) => (
                  <div
                    key={
                      transaction.id
                    }
                    className="space-y-3 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <TransactionType
                          type={
                            transaction.type
                          }
                        />

                        <p className="mt-2 font-medium text-gray-900">
                          {
                            transaction.category
                          }
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            transaction.description
                          }
                        </p>
                      </div>

                      <p
                        className={`whitespace-nowrap font-semibold ${
                          transaction.type ===
                          "Expense"
                            ? "text-red-600"
                            : "text-green-700"
                        }`}
                      >
                        {transaction.type ===
                        "Expense"
                          ? "-"
                          : "+"}
                        {formatCurrency(
                          transaction.amount,
                        )}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {formatDate(
                          transaction.date,
                        )}
                      </span>

                      <span>
                        {
                          transaction.reference
                        }
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>
        </div>

        <div
          className={`rounded-lg p-3 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function TransactionType({
  type,
}: {
  type: Transaction["type"];
}) {
  const classes =
    type === "Expense"
      ? "bg-red-50 text-red-700"
      : type === "Membership"
        ? "bg-blue-50 text-blue-700"
        : "bg-green-50 text-green-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {type}
    </span>
  );
}

function formatPurpose(
  purpose: ReceiptPurpose,
) {
  switch (purpose) {
    case ReceiptPurpose.MONTHLY_MEMBERSHIP:
      return "Monthly Membership";

    case ReceiptPurpose.NIKAH_HOUSE_WARMING:
      return "Nikah / House Warming";

    case ReceiptPurpose.RENT:
      return "Rent";

    case ReceiptPurpose.CUSTOM:
      return "Custom";

    default:
      return "Collection";
  }
}

function getPurposeFromSearch(
  search: string,
): ReceiptPurpose | undefined {
  const value = search.toLowerCase();

  if (
    value.includes("monthly") ||
    value.includes("membership")
  ) {
    return ReceiptPurpose.MONTHLY_MEMBERSHIP;
  }

  if (
    value.includes("nikah") ||
    value.includes("house warming")
  ) {
    return ReceiptPurpose.NIKAH_HOUSE_WARMING;
  }

  if (value.includes("rent")) {
    return ReceiptPurpose.RENT;
  }

  if (value.includes("custom")) {
    return ReceiptPurpose.CUSTOM;
  }

  return undefined;
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
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  CreditCard,
  Receipt,
  Settings,
  Wallet,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ReceiptPurpose } from "@prisma/client";

type Transaction = {
  id: string;
  date: Date;
  createdAt: Date;
  type: "Income" | "Collection" | "Expense";
  category: string;
  description: string;
  amount: number;
  reference: string;
};

type Period = "current" | "previous" | "custom" | "all";

type PeriodRange = {
  from?: Date;
  to?: Date;
  label: string;
};

interface FinancePageProps {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
  }>;
}

function getFinancialYearRange(
  offset: number,
  now = new Date(),
) {
  const year = now.getFullYear() + offset;

  const from = new Date(
    year,
    0,
    1,
    0,
    0,
    0,
    0,
  );

  const to = new Date(
    year,
    11,
    31,
    23,
    59,
    59,
    999,
  );

  return {
    from,
    to,
    label: String(year),
  };
}

function getPeriod(
  period: Period,
  fromValue?: string,
  toValue?: string,
): PeriodRange {
  if (period === "all") {
    return {
      from: undefined,
      to: undefined,
      label: "All Time",
    };
  }

  if (period === "custom") {
    const from = fromValue
      ? new Date(`${fromValue}T00:00:00`)
      : undefined;

    const to = toValue
      ? new Date(`${toValue}T23:59:59.999`)
      : undefined;

    if (
      from &&
      to &&
      !Number.isNaN(from.getTime()) &&
      !Number.isNaN(to.getTime()) &&
      from <= to
    ) {
      return {
        from,
        to,
        label: `${formatDate(from)} - ${formatDate(to)}`,
      };
    }

    return {
      from: undefined,
      to: undefined,
      label: "Select a valid custom date range",
    };
  }

  return getFinancialYearRange(
    period === "previous" ? -1 : 0,
  );
}

export default async function FinancePage({
  searchParams,
}: FinancePageProps) {
  const params = await searchParams;

  const period: Period =
    params.period === "previous"
      ? "previous"
      : params.period === "custom"
        ? "custom"
        : params.period === "all"
          ? "all"
          : "current";

  const selectedPeriod = getPeriod(
    period,
    params.from,
    params.to,
  );

  const dateFilter =
    selectedPeriod.from && selectedPeriod.to
      ? {
          gte: selectedPeriod.from,
          lte: selectedPeriod.to,
        }
      : selectedPeriod.from
        ? {
            gte: selectedPeriod.from,
          }
        : selectedPeriod.to
          ? {
              lte: selectedPeriod.to,
            }
          : undefined;

  const [
    incomeTotal,
    expenseTotal,
    membershipTotal,
    nikahHouseWarmingTotal,
    rentTotal,
    customTotal,
    recentIncome,
    recentExpenses,
    recentMemberships,
  ] = await Promise.all([
    prisma.income.aggregate({
      where: dateFilter
        ? { incomeDate: dateFilter }
        : undefined,
      _sum: {
        amount: true,
      },
    }),

    prisma.expense.aggregate({
      where: dateFilter
        ? { expenseDate: dateFilter }
        : undefined,
      _sum: {
        amount: true,
      },
    }),

    prisma.membershipReceipt.aggregate({
      where: {
        purpose: ReceiptPurpose.MONTHLY_MEMBERSHIP,
        ...(dateFilter
          ? { receiptDate: dateFilter }
          : {}),
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.membershipReceipt.aggregate({
      where: {
        purpose:
          ReceiptPurpose.NIKAH_HOUSE_WARMING,
        ...(dateFilter
          ? { receiptDate: dateFilter }
          : {}),
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.membershipReceipt.aggregate({
      where: {
        purpose: ReceiptPurpose.RENT,
        ...(dateFilter
          ? { receiptDate: dateFilter }
          : {}),
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.membershipReceipt.aggregate({
      where: {
        purpose: ReceiptPurpose.CUSTOM,
        ...(dateFilter
          ? { receiptDate: dateFilter }
          : {}),
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.income.findMany({
      take: 8,
      where: dateFilter
        ? { incomeDate: dateFilter }
        : undefined,
      orderBy: {
        incomeDate: "desc",
      },
      include: {
        category: true,
      },
    }),

    prisma.expense.findMany({
      take: 8,
      where: dateFilter
        ? { expenseDate: dateFilter }
        : undefined,
      orderBy: {
        expenseDate: "desc",
      },
      include: {
        category: true,
      },
    }),

    prisma.membershipReceipt.findMany({
      take: 8,
      where: dateFilter
        ? { receiptDate: dateFilter }
        : undefined,
      orderBy: {
        receiptDate: "desc",
      },
      include: {
        household: {
          select: {
            householdCode: true,
            houseName: true,
          },
        },
      },
    }),
  ]);

  const otherIncome = Number(
    incomeTotal._sum.amount ?? 0,
  );

  const membershipIncome = Number(
    membershipTotal._sum.totalAmount ?? 0,
  );

  const nikahHouseWarmingIncome = Number(
    nikahHouseWarmingTotal._sum.totalAmount ?? 0,
  );

  const rentIncome = Number(
    rentTotal._sum.totalAmount ?? 0,
  );

  const customIncome = Number(
    customTotal._sum.totalAmount ?? 0,
  );

  /*
   * Total Income includes:
   *
   * Normal Income
   * Monthly Membership
   * Nikah / House Warming
   * Rent
   * Custom
   */
  const totalIncome =
    otherIncome +
    membershipIncome +
    nikahHouseWarmingIncome +
    rentIncome +
    customIncome;

  const totalExpenses = Number(
    expenseTotal._sum.amount ?? 0,
  );

  const balance =
    totalIncome - totalExpenses;

  const transactions: Transaction[] = [
    ...recentIncome.map((item) => ({
      id: `income-${item.id}`,
      date: item.incomeDate,
      createdAt: item.createdAt,
      type: "Income" as const,
      category: item.category.name,
      description:
        item.description ||
        "Income transaction",
      amount: Number(item.amount),
      reference:
        item.receiptNumber || "—",
    })),

    ...recentMemberships.map((item) => ({
      id: `membership-${item.id}`,
      date: item.receiptDate,
      createdAt: item.createdAt,
      type: "Collection" as const,
      category: formatPurpose(
        item.purpose,
      ),
      description:
        item.household
          ? `${item.household.houseName} (${item.household.householdCode})`
          : item.remarks ||
            formatPurpose(item.purpose),
      amount: Number(item.totalAmount),
      reference: item.receiptNumber,
    })),

    ...recentExpenses.map((item) => ({
      id: `expense-${item.id}`,
      date: item.expenseDate,
      createdAt: item.createdAt,
      type: "Expense" as const,
      category: item.category.name,
      description:
        item.description ||
        "Expense transaction",
      amount: Number(item.amount),
      reference:
        item.billNumber || "—",
    })),
  ];

  transactions.sort(
    (a, b) =>
      b.createdAt.getTime() -
      a.createdAt.getTime(),
  );

  const latestTransactions =
    transactions.slice(0, 8);

  // Year-wise summary is shown only for the All Time view.
  // The summary contains only years that actually have financial data.
  const yearWiseData =
    period === "all"
      ? await getYearWiseSummary()
      : [];

  const currentYear =
    getFinancialYearRange(0);

  const previousYear =
    getFinancialYearRange(-1);

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Finance
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage income, membership collections,
            expenses and financial records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/finance/income/new"
            className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
          >
            <ArrowUpRight className="h-4 w-4" />
            Add Income
          </Link>

          <Link
            href="/finance/expenses/new"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <ArrowDownRight className="h-4 w-4" />
            Add Expense
          </Link>
        </div>
      </div>

      {/* PERIOD FILTER */}

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="space-y-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              Financial Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              View financial figures for a
              specific period instead of combining
              all historical records.
            </p>
          </div>

          <form
            method="GET"
            className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[minmax(260px,1.5fr)_minmax(180px,1fr)_minmax(180px,1fr)_110px]"
          >
            <div className="min-w-0">
              <label
                htmlFor="period"
                className="mb-1.5 block text-xs font-medium text-gray-600"
              >
                Period
              </label>

              <select
                id="period"
                name="period"
                defaultValue={period}
                className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="current">
                  Current Financial Year (
                  {currentYear.label})
                </option>

                <option value="previous">
                  Previous Financial Year (
                  {previousYear.label})
                </option>

                <option value="custom">
                  Custom Period
                </option>

                <option value="all">
                  All Time
                </option>
              </select>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="from"
                className="mb-1.5 block text-xs font-medium text-gray-600"
              >
                From
              </label>

              <input
                id="from"
                name="from"
                type="date"
                defaultValue={
                  params.from ?? ""
                }
                className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="to"
                className="mb-1.5 block text-xs font-medium text-gray-600"
              >
                To
              </label>

              <input
                id="to"
                name="to"
                type="date"
                defaultValue={
                  params.to ?? ""
                }
                className="h-10 w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="h-10 w-full rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800"
              >
                Apply
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-900">
              Showing:{" "}
              {selectedPeriod.label}
            </p>

            <p className="mt-1 text-xs text-green-800">
              Financial year: January 1 –
              December 31.
            </p>
          </div>
        </div>
      </section>

      {/* FINANCIAL SUMMARY */}

      <section className="relative">
        <div
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 pr-16"
          style={{ scrollbarWidth: "thin" }}
        >
          <div
            id="summary-total-income"
            className="w-[280px] min-w-[280px] shrink-0 snap-start"
          >
            <FinanceCard
              title="Total Income"
              value={formatCurrency(totalIncome)}
              description="All income and collections"
              icon={
                <ArrowUpRight className="h-5 w-5" />
              }
              iconClass="bg-green-50 text-green-700"
            />
          </div>

          <div
            id="summary-total-expenses"
            className="w-[280px] min-w-[280px] shrink-0 snap-start"
          >
            <FinanceCard
              title="Total Expenses"
              value={formatCurrency(totalExpenses)}
              description="All recorded expenses"
              icon={
                <ArrowDownRight className="h-5 w-5" />
              }
              iconClass="bg-red-50 text-red-600"
            />
          </div>

          <div
            id="summary-balance"
            className="w-[280px] min-w-[280px] shrink-0 snap-start"
          >
            <FinanceCard
              title="Net Balance"
              value={formatCurrency(balance)}
              description="Income minus expenses"
              icon={
                <Wallet className="h-5 w-5" />
              }
              iconClass={
                balance >= 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              }
            />
          </div>

          <div
            id="summary-membership"
            className="w-[280px] min-w-[280px] shrink-0 snap-start"
          >
            <FinanceCard
              title="Membership Collections"
              value={formatCurrency(membershipIncome)}
              description="Monthly membership"
              icon={
                <Receipt className="h-5 w-5" />
              }
              iconClass="bg-blue-50 text-blue-700"
            />
          </div>

          <div
            id="summary-nikah"
            className="w-[280px] min-w-[280px] shrink-0 snap-start"
          >
            <FinanceCard
              title="Nikah / House Warming Collection"
              value={formatCurrency(
                nikahHouseWarmingIncome,
              )}
              description="Nikah and house warming"
              icon={
                <Receipt className="h-5 w-5" />
              }
              iconClass="bg-purple-50 text-purple-700"
            />
          </div>

          <div
            id="summary-rent"
            className="w-[280px] min-w-[280px] shrink-0 snap-start"
          >
            <FinanceCard
              title="Rent Collection"
              value={formatCurrency(rentIncome)}
              description="Rent collections"
              icon={
                <Receipt className="h-5 w-5" />
              }
              iconClass="bg-orange-50 text-orange-700"
            />
          </div>
        </div>
      </section>

      {/* YEAR-WISE SUMMARY */}

      {period === "all" && (
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="font-semibold text-gray-900">
              Year-wise Financial Summary
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Historical financial performance by
              financial year.
            </p>
          </div>

          {yearWiseData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Financial Year
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-gray-600">
                      Income
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-gray-600">
                      Expenses
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-gray-600">
                      Balance
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {yearWiseData.map((item) => (
                    <tr key={item.label}>
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {item.label}
                      </td>

                      <td className="px-5 py-4 text-right text-green-700">
                        {formatCurrency(item.income)}
                      </td>

                      <td className="px-5 py-4 text-right text-red-600">
                        {formatCurrency(item.expenses)}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          item.balance >= 0
                            ? "text-green-700"
                            : "text-red-600"
                        }`}
                      >
                        {formatCurrency(item.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-gray-500">
              No financial data is available for any year.
            </div>
          )}
        </section>
      )}

      {/* QUICK ACTIONS */}

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Quick Actions
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Common finance operations.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/finance/income"
            icon={
              <ArrowUpRight className="h-5 w-5" />
            }
            title="Income"
            description="View and manage income"
          />

          <QuickAction
            href="/finance/expenses"
            icon={
              <ArrowDownRight className="h-5 w-5" />
            }
            title="Expenses"
            description="View and manage expenses"
          />

          <QuickAction
            href="/finance/membership"
            icon={
              <CreditCard className="h-5 w-5" />
            }
            title="Collections"
            description="Record collection receipts"
          />

          <QuickAction
            href="/finance/income-categories"
            icon={<Settings className="h-5 w-5" />}
            title="Categories"
            description="Manage finance categories"
          />
        </div>
      </section>

      {/* RECENT TRANSACTIONS */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="font-semibold text-gray-900">
              Recent Transactions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Latest recorded financial activity
              for the selected period.
            </p>
          </div>

          <Link
            href="/finance/transactions"
            className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
          >
            View All
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {latestTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <BarChart3 className="h-7 w-7 text-gray-500" />
            </div>

            <h3 className="font-semibold text-gray-900">
              No transactions for this period
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Try another period or add a new
              income, collection or expense.
            </p>
          </div>
        ) : (
          <>
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
                  {latestTransactions.map(
                    (transaction) => (
                      <tr
                        key={transaction.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-5 py-4 text-gray-600">
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
                          {transaction.category}
                        </td>

                        <td className="max-w-sm px-5 py-4 text-gray-600">
                          {transaction.description}
                        </td>

                        <td className="px-5 py-4 text-gray-500">
                          {transaction.reference}
                        </td>

                        <td
                          className={`px-5 py-4 text-right font-semibold ${
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

            <div className="divide-y md:hidden">
              {latestTransactions.map(
                (transaction) => (
                  <div
                    key={transaction.id}
                    className="space-y-3 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.category}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            transaction.description
                          }
                        </p>
                      </div>

                      <p
                        className={`shrink-0 font-semibold ${
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

                      <TransactionType
                        type={
                          transaction.type
                        }
                      />
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

async function getYearWiseSummary() {
  /*
   * Build the list from actual transaction dates instead of
   * generating empty years. This means the dropdown contains
   * only financial years that have at least one income,
   * expense, or collection record.
   */
  const [incomeDates, expenseDates, collectionDates] =
    await Promise.all([
      prisma.income.findMany({
        select: {
          incomeDate: true,
        },
      }),

      prisma.expense.findMany({
        select: {
          expenseDate: true,
        },
      }),

      prisma.membershipReceipt.findMany({
        select: {
          receiptDate: true,
        },
      }),
    ]);

  const yearSet = new Set<number>();

  incomeDates.forEach((item) => {
    yearSet.add(item.incomeDate.getFullYear());
  });

  expenseDates.forEach((item) => {
    yearSet.add(item.expenseDate.getFullYear());
  });

  collectionDates.forEach((item) => {
    yearSet.add(item.receiptDate.getFullYear());
  });

  const years = Array.from(yearSet)
    .sort((a, b) => a - b)
    .map((year) => ({
      year,
      from: new Date(
        year,
        0,
        1,
        0,
        0,
        0,
        0,
      ),
      to: new Date(
        year,
        11,
        31,
        23,
        59,
        59,
        999,
      ),
      label: String(year),
    }));

  const rows = await Promise.all(
    years.map(async (year) => {
      const [income, expenses, membership] =
        await Promise.all([
          prisma.income.aggregate({
            where: {
              incomeDate: {
                gte: year.from,
                lte: year.to,
              },
            },
            _sum: {
              amount: true,
            },
          }),

          prisma.expense.aggregate({
            where: {
              expenseDate: {
                gte: year.from,
                lte: year.to,
              },
            },
            _sum: {
              amount: true,
            },
          }),

          prisma.membershipReceipt.aggregate({
            where: {
              receiptDate: {
                gte: year.from,
                lte: year.to,
              },
            },
            _sum: {
              totalAmount: true,
            },
          }),
        ]);

      const totalIncome =
        Number(income._sum.amount ?? 0) +
        Number(
          membership._sum.totalAmount ?? 0,
        );

      const totalExpenses = Number(
        expenses._sum.amount ?? 0,
      );

      return {
        label: year.label,
        income: totalIncome,
        expenses: totalExpenses,
        balance:
          totalIncome - totalExpenses,
      };
    }),
  );

  return rows.filter(
    (row) =>
      row.income !== 0 ||
      row.expenses !== 0,
  );
}

function FinanceCard({
  title,
  value,
  description,
  icon,
  iconClass,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="h-full w-full rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-400">
            {description}
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

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border bg-white p-5 shadow-sm transition hover:border-green-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-green-50 p-3 text-green-700">
          {icon}
        </div>

        <ChevronRight className="h-5 w-5 text-gray-300 transition group-hover:text-green-700" />
      </div>

      <h3 className="mt-4 font-semibold text-gray-900">
        {title}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {description}
      </p>
    </Link>
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
      : type === "Collection"
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
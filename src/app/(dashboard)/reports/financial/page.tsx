import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Download,
  Wallet,
  ArrowLeft,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ReceiptPurpose } from "@prisma/client";


interface ReportsPageProps {
  searchParams: Promise<{
    from?: string;
    to?: string;
  }>;
}

export default async function ReportsPage({
  searchParams,
}: ReportsPageProps) {
  const params = await searchParams;

  const today = new Date();

  const defaultFrom = getFirstDayOfMonth(today);
  const defaultTo = getLastDayOfMonth(today);

  const from =
    params.from || formatDate(defaultFrom);

  const to =
    params.to || formatDate(defaultTo);

  const startDate = new Date(
    `${from}T00:00:00`,
  );

  const endDate = new Date(
    `${to}T23:59:59.999`,
  );

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    startDate > endDate
  ) {
    throw new Error("Invalid report date range.");
  }

  // -------------------------------------------------------
  // Financial data
  // -------------------------------------------------------

  const [
    incomeAggregate,
    expenseAggregate,
    membershipAggregate,
    rentAggregate,
    nikahHouseWarmingAggregate,
    customAggregate,
    membershipReceipts,
    membershipHouseholds,
    incomeGroups,
    expenseGroups,
  ] = await Promise.all([
    prisma.income.aggregate({
      where: {
        incomeDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.expense.aggregate({
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.membershipReceipt.aggregate({
      where: {
        purpose:
          ReceiptPurpose.MONTHLY_MEMBERSHIP,
        receiptDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.membershipReceipt.aggregate({
      where: {
        purpose:
          ReceiptPurpose.RENT,
        receiptDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.membershipReceipt.aggregate({
      where: {
        purpose:
          ReceiptPurpose.NIKAH_HOUSE_WARMING,
        receiptDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.membershipReceipt.aggregate({
      where: {
        purpose:
          ReceiptPurpose.CUSTOM,
        receiptDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.membershipReceipt.count({
      where: {
        receiptDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    }),

    prisma.membershipReceipt.findMany({
      where: {
        receiptDate: {
          gte: startDate,
          lte: endDate,
        },
        householdId: {
          not: null,
        },
      },
      select: {
        householdId: true,
      },
      distinct: ["householdId"],
    }),

    prisma.income.groupBy({
      by: ["categoryId"],
      where: {
        incomeDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),

    prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        expenseDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  const regularIncome = Number(
    incomeAggregate._sum.amount || 0,
  );

  const totalExpenses = Number(
    expenseAggregate._sum.amount || 0,
  );

  const membershipAmount = Number(
    membershipAggregate._sum.totalAmount || 0,
  );

  const rentAmount = Number(
    rentAggregate._sum.totalAmount || 0,
  );

  const nikahHouseWarmingAmount = Number(
    nikahHouseWarmingAggregate._sum.totalAmount || 0,
  );

  const customAmount = Number(
    customAggregate._sum.totalAmount || 0,
  );

  const totalCollections =
    membershipAmount +
    rentAmount +
    nikahHouseWarmingAmount +
    customAmount;

  const totalIncome =
    regularIncome + totalCollections;

  const netBalance =
    totalIncome - totalExpenses;

  const householdsPaid =
    membershipHouseholds.length;

  const incomeCategoryIds =
    incomeGroups.map(
      (item) => item.categoryId,
    );

  const incomeCategories =
    incomeCategoryIds.length
      ? await prisma.incomeCategoryMaster.findMany({
          where: {
            id: {
              in: incomeCategoryIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

  const incomeBreakdown =
    incomeGroups
      .map((group) => {
        const category =
          incomeCategories.find(
            (item) =>
              item.id ===
              group.categoryId,
          );

        return {
          id: group.categoryId,
          name:
            category?.name ||
            "Unknown Category",
          amount: Number(
            group._sum.amount || 0,
          ),
        };
      })
      .sort(
        (a, b) => b.amount - a.amount,
      );

  const expenseCategoryIds =
    expenseGroups.map(
      (item) => item.categoryId,
    );

  const expenseCategories =
    expenseCategoryIds.length
      ? await prisma.expenseCategoryMaster.findMany({
          where: {
            id: {
              in: expenseCategoryIds,
            },
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

  const expenseBreakdown =
    expenseGroups
      .map((group) => {
        const category =
          expenseCategories.find(
            (item) =>
              item.id === group.categoryId,
          );

        return {
          id: group.categoryId,
          name:
            category?.name ||
            "Unknown Category",
          amount: Number(
            group._sum.amount || 0,
          ),
        };
      })
      .sort(
        (a, b) => b.amount - a.amount,
      );

  const collectionBreakdown = [
    {
      id: ReceiptPurpose.MONTHLY_MEMBERSHIP,
      name: "Monthly Membership",
      amount: membershipAmount,
    },
    {
      id: ReceiptPurpose.RENT,
      name: "Rent",
      amount: rentAmount,
    },
    {
      id:
        ReceiptPurpose.NIKAH_HOUSE_WARMING,
      name: "Nikah / House Warming",
      amount:
        nikahHouseWarmingAmount,
    },
    {
      id: ReceiptPurpose.CUSTOM,
      name: "Custom Collection",
      amount: customAmount,
    },
  ];

  const periodLabel =
    formatPeriodLabel(
      startDate,
      endDate,
    );

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between print:hidden">
        <div className="flex items-start gap-3">
          <Link
            href="/reports"
            aria-label="Back to Reports"
            className="mt-1 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Financial Report
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Financial overview for {periodLabel}.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
  

          {/* PDF export/download */}
          <a
            href={`/api/reports/financial?from=${encodeURIComponent(
              from,
            )}&to=${encodeURIComponent(
              to,
            )}&format=pdf`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </a>

          {/* Excel export */}
          <a
            href={`/api/reports/financial?from=${encodeURIComponent(
              from,
            )}&to=${encodeURIComponent(
              to,
            )}&format=xlsx`}
            download
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </a>
        </div>
      </div>

      {/* =====================================================
          REPORT PERIOD
      ===================================================== */}

      <section className="rounded-xl border bg-white p-5 shadow-sm print:hidden">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-green-700" />

          <h2 className="font-semibold text-gray-900">
            Report Period
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <QuickFilter
            label="This Month"
            from={formatDate(
              getFirstDayOfMonth(today),
            )}
            to={formatDate(
              getLastDayOfMonth(today),
            )}
            active={
              from ===
                formatDate(
                  getFirstDayOfMonth(today),
                ) &&
              to ===
                formatDate(
                  getLastDayOfMonth(today),
                )
            }
          />

          <QuickFilter
            label="Last Month"
            from={formatDate(
              getFirstDayOfMonth(
                new Date(
                  today.getFullYear(),
                  today.getMonth() - 1,
                  1,
                ),
              ),
            )}
            to={formatDate(
              getLastDayOfMonth(
                new Date(
                  today.getFullYear(),
                  today.getMonth() - 1,
                  1,
                ),
              ),
            )}
          />

          <QuickFilter
            label="This Year"
            from={`${today.getFullYear()}-01-01`}
            to={`${today.getFullYear()}-12-31`}
            active={
              from ===
                `${today.getFullYear()}-01-01` &&
              to ===
                `${today.getFullYear()}-12-31`
            }
          />

          <QuickFilter
            label="Last Year"
            from={`${today.getFullYear() - 1}-01-01`}
            to={`${today.getFullYear() - 1}-12-31`}
            active={
              from ===
                `${today.getFullYear() - 1}-01-01` &&
              to ===
                `${today.getFullYear() - 1}-12-31`
            }
          />
        </div>

        <form
          method="GET"
          className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label
              htmlFor="from"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              From
            </label>

            <input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label
              htmlFor="to"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              To
            </label>

            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="h-11 w-full rounded-lg bg-gray-900 px-5 text-sm font-medium text-white hover:bg-gray-800 md:w-auto"
            >
              Generate Report
            </button>
          </div>
        </form>
      </section>

      {/* =====================================================
          PRINT HEADER
      ===================================================== */}

      <div className="hidden print:block print-report-header">
        <h1>
          PANDARAKKANDY MAHALLU
        </h1>

        <p>
          FINANCIAL REPORT
        </p>

        <span>
          Period: {periodLabel}
        </span>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Income"
          amount={totalIncome}
          icon={
            <ArrowUpRight className="h-5 w-5" />
          }
          type="income"
        />

        <SummaryCard
          title="Total Expenses"
          amount={totalExpenses}
          icon={
            <ArrowDownRight className="h-5 w-5" />
          }
          type="expense"
        />

        <SummaryCard
          title="Collections"
          amount={totalCollections}
          icon={
            <Wallet className="h-5 w-5" />
          }
          type="membership"
        />

        <SummaryCard
          title="Net Balance"
          amount={netBalance}
          icon={
            <Wallet className="h-5 w-5" />
          }
          type={
            netBalance >= 0
              ? "income"
              : "expense"
          }
        />
      </section>

      {/* =====================================================
          MEMBERSHIP STATISTICS
      ===================================================== */}

      <section className="grid gap-4 md:grid-cols-2">
        <StatCard
          title="Households Paid"
          value={householdsPaid}
          description="Unique households with membership payments"
        />

        <StatCard
          title="Receipts Issued"
          value={membershipReceipts}
          description="Membership collection receipts"
        />
      </section>

      {/* =====================================================
          INCOME / EXPENSE
      ===================================================== */}

      <div className="grid gap-6 xl:grid-cols-2">
        <BreakdownCard
          title="Income Breakdown"
          items={incomeBreakdown}
          total={regularIncome}
          emptyText="No regular income recorded for this period."
        />

        <BreakdownCard
          title="Expense Breakdown"
          items={expenseBreakdown}
          total={totalExpenses}
          emptyText="No expenses recorded for this period."
        />
      </div>

      {/* =====================================================
          MEMBERSHIP BREAKDOWN
      ===================================================== */}

      <BreakdownCard
  title="Collection Breakdown"
  items={collectionBreakdown}
  total={totalCollections}
  emptyText="No collections recorded for this period."
/>

      {/* =====================================================
          PRINT STYLES
      ===================================================== */}

      <style>{`
        .print-report-header {
          display: none;
        }

        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }

          html,
          body {
            background: #fff !important;
            height: auto !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print-report-header {
            display: block !important;
            text-align: center;
            margin-bottom: 18px;
            break-after: avoid;
          }

          .print-report-header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
          }

          .print-report-header p {
            margin: 4px 0 0;
            font-size: 13px;
            font-weight: 600;
          }

          .print-report-header span {
            display: block;
            margin-top: 4px;
            font-size: 9px;
            color: #4b5563;
          }

          /*
           * Do NOT use:
           *
           * section,
           * table {
           *   break-inside: avoid;
           * }
           *
           * Large sections are allowed to flow naturally
           * across printed pages. This prevents blank pages.
           */

          section {
            break-inside: auto;
          }

          .print-avoid-break {
            break-inside: avoid;
          }

          tr {
            break-inside: avoid;
          }

          /*
           * Prevent the next heading from being isolated
           * at the bottom of a page.
           */
          h1,
          h2,
          h3 {
            break-after: avoid;
          }

          /*
           * Keep the report from creating artificial
           * minimum-height pages.
           */
          body > div {
            min-height: 0 !important;
            height: auto !important;
          }

          /*
           * Remove shadows and unnecessary borders
           * from the screen-oriented layout.
           */
          .shadow-sm,
          .shadow-md {
            box-shadow: none !important;
          }

          /*
           * Avoid breaking the progress rows in the
           * middle of their content.
           */
          .divide-y > div {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}

/* -------------------------------------------------------
   Components
------------------------------------------------------- */

function SummaryCard({
  title,
  amount,
  icon,
  type,
}: {
  title: string;
  amount: number;
  icon: React.ReactNode;
  type:
    | "income"
    | "expense"
    | "membership";
}) {
  const classes = {
    income:
      "bg-green-50 text-green-700",

    expense:
      "bg-red-50 text-red-600",

    membership:
      "bg-blue-50 text-blue-700",
  };

  return (
    <div className="print-avoid-break rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {title}
        </p>

        <div
          className={`rounded-lg p-3 ${classes[type]}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-5 text-2xl font-bold text-gray-900">
        {formatCurrency(amount)}
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="print-avoid-break rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-gray-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}

function BreakdownCard({
  title,
  items,
  total,
  emptyText,
}: {
  title: string;
  items: {
    id: string;
    name: string;
    amount: number;
  }[];
  total: number;
  emptyText: string;
}) {
  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <div className="border-b px-5 py-4">
        <h2 className="font-semibold text-gray-900">
          {title}
        </h2>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-8 text-sm text-gray-500">
          {emptyText}
        </div>
      ) : (
        <div className="divide-y">
          {items.map((item) => {
            const percentage =
              total > 0
                ? (item.amount / total) *
                  100
                : 0;

            return (
              <div
                key={item.id}
                className="px-5 py-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {item.name}
                  </span>

                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      item.amount,
                    )}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-green-600"
                      style={{
                        width: `${Math.min(
                          percentage,
                          100,
                        )}%`,
                      }}
                    />
                  </div>

                  <span className="w-14 text-right text-xs text-gray-500">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between border-t bg-gray-50 px-5 py-4">
        <span className="text-sm font-semibold text-gray-700">
          Total
        </span>

        <span className="font-bold text-gray-900">
          {formatCurrency(total)}
        </span>
      </div>
    </section>
  );
}

function QuickFilter({
  label,
  from,
  to,
  active = false,
}: {
  label: string;
  from: string;
  to: string;
  active?: boolean;
}) {
  return (
    <Link
      href={`/reports/financial?from=${from}&to=${to}`}
      className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-green-700 bg-green-700 text-white"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function formatCurrency(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: false,
    },
  ).format(Number(amount) || 0);
}

function formatDate(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getFirstDayOfMonth(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
  );
}

function getLastDayOfMonth(
  date: Date,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
  );
}

function formatPeriodLabel(
  from: Date,
  to: Date,
) {
  const formatter =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );

  return `${formatter.format(
    from,
  )} – ${formatter.format(to)}`;
}
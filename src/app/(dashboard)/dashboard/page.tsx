import {
  Users,
  UserRound,
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarDays,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { ReceiptPurpose } from "@prisma/client";

export default async function DashboardPage() {
  /*
   * Keep Dashboard financial calculations consistent
   * with the Finance page.
   *
   * Finance uses the current financial year:
   * January 1 - December 31.
   */

  const now = new Date();
  const currentYear = now.getFullYear();

  const financialYearFrom = new Date(
    currentYear,
    0,
    1,
    0,
    0,
    0,
    0,
  );

  const financialYearTo = new Date(
    currentYear,
    11,
    31,
    23,
    59,
    59,
    999,
  );

  const incomeDateFilter = {
    incomeDate: {
      gte: financialYearFrom,
      lte: financialYearTo,
    },
  };

  const expenseDateFilter = {
    expenseDate: {
      gte: financialYearFrom,
      lte: financialYearTo,
    },
  };

  const receiptDateFilter = {
    receiptDate: {
      gte: financialYearFrom,
      lte: financialYearTo,
    },
  };

  const [
    totalHouseholds,
    totalMembers,

    // Normal income
    totalIncome,

    // Expenses
    totalExpenses,

    // Membership collections
    membershipTotal,

    // Nikah / House Warming collections
    nikahHouseWarmingTotal,

    // Rent collections
    rentTotal,

    // Custom collections
    customTotal,

    // Active events
    upcomingEvents,

    // Burial records
    totalBurialRecords,
  ] = await Promise.all([
    prisma.household.count(),

    prisma.householdMember.count(),

    /*
     * Normal Income
     */
    prisma.income.aggregate({
      where: incomeDateFilter,
      _sum: {
        amount: true,
      },
    }),

    /*
     * Expenses
     */
    prisma.expense.aggregate({
      where: expenseDateFilter,
      _sum: {
        amount: true,
      },
    }),

    /*
     * Monthly Membership
     */
    prisma.membershipReceipt.aggregate({
      where: {
        purpose: ReceiptPurpose.MONTHLY_MEMBERSHIP,
        ...receiptDateFilter,
      },
      _sum: {
        totalAmount: true,
      },
    }),

    /*
     * Nikah / House Warming
     */
    prisma.membershipReceipt.aggregate({
      where: {
        purpose: ReceiptPurpose.NIKAH_HOUSE_WARMING,
        ...receiptDateFilter,
      },
      _sum: {
        totalAmount: true,
      },
    }),

    /*
     * Rent
     */
    prisma.membershipReceipt.aggregate({
      where: {
        purpose: ReceiptPurpose.RENT,
        ...receiptDateFilter,
      },
      _sum: {
        totalAmount: true,
      },
    }),

    /*
     * Custom
     */
    prisma.membershipReceipt.aggregate({
      where: {
        purpose: ReceiptPurpose.CUSTOM,
        ...receiptDateFilter,
      },
      _sum: {
        totalAmount: true,
      },
    }),

    /*
     * Active events
     *
     * An event remains active until it is explicitly
     * completed or cancelled, regardless of its event date.
     */
    prisma.event.count({
      where: {
        status: "OPEN",
      },
    }),

    prisma.burialRecord.count(),
  ]);

  /*
   * -------------------------------------------------------
   * FINANCIAL CALCULATIONS
   * -------------------------------------------------------
   *
   * These calculations intentionally match FinancePage.
   *
   * Total Income =
   *   Normal Income
   *   + Monthly Membership
   *   + Nikah / House Warming
   *   + Rent
   *   + Custom
   */

  const normalIncome = Number(
    totalIncome._sum.amount ?? 0,
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

  const income =
    normalIncome +
    membershipIncome +
    nikahHouseWarmingIncome +
    rentIncome +
    customIncome;

  const expenses = Number(
    totalExpenses._sum.amount ?? 0,
  );

  const balance = income - expenses;

  const cards = [
    {
      title: "Total Families",
      value: totalHouseholds,
      icon: Users,
    },
    {
      title: "Total Members",
      value: totalMembers,
      icon: UserRound,
    },
    {
      title: "Total Income",
      value: `₹${income.toLocaleString("en-IN")}`,
      icon: TrendingUp,
    },
    {
      title: "Total Expenses",
      value: `₹${expenses.toLocaleString("en-IN")}`,
      icon: TrendingDown,
    },
    {
      title: "Current Balance",
      value: `₹${balance.toLocaleString("en-IN")}`,
      icon: Wallet,
    },
    {
      title: "Active Events",
      value: upcomingEvents,
      icon: CalendarDays,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Overview of Pandarakkandy Mahallu activities.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    {card.title}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {card.value}
                  </p>
                </div>

                <div className="rounded-lg bg-green-50 p-3">
                  <Icon className="h-5 w-5 text-green-700" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
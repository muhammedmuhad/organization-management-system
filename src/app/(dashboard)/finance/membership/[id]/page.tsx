import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import PrintReceiptButton from "@/components/finance/PrintReceiptButton";

interface ReceiptPageProps {
  params: Promise<{
    id: string;
  }>;
}

type ReceiptItem = {
  id: string;
  year: number | null;
  month: number | null;
  amount: unknown;
  paymentCategory: {
    name: string;
  } | null;
};

type GroupedMonthlyItem = {
  year: number;
  startMonth: number;
  endMonth: number;
  amount: number;
  paymentCategoryName: string;
};

export default async function MembershipReceiptPage({
  params,
}: ReceiptPageProps) {
  const { id } = await params;

  const receipt = await prisma.membershipReceipt.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      receiptNumber: true,
      receiptSequence: true,
      purpose: true,

      householdId: true,

      customName: true,
      customPurpose: true,

      receiptDate: true,
      totalAmount: true,
      status: true,
      remarks: true,
      collectedById: true,

      household: {
        select: {
          householdCode: true,
          houseName: true,
          houseNumber: true,
          address: true,
        },
      },

      collectedBy: {
        select: {
          fullName: true,
          username: true,
        },
      },

      items: {
        select: {
          id: true,
          year: true,
          month: true,
          amount: true,

          paymentCategory: {
            select: {
              name: true,
            },
          },
        },

        orderBy: [
          {
            year: "asc",
          },
          {
            month: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  if (!receipt) {
    notFound();
  }

  const isCustom = receipt.purpose === "CUSTOM";

  const isMonthlyMembership =
    receipt.purpose === "MONTHLY_MEMBERSHIP";

  const isRent = receipt.purpose === "RENT";

  /*
   * Monthly Membership and Rent both use monthly payment items.
   *
   * Therefore both should use the same grouped display:
   *
   * 2026 | Jan – Aug | ₹16,000
   *
   * instead of:
   *
   * 2026 | January | ₹2,000
   * 2026 | February | ₹2,000
   * ...
   */
  const isMonthlyCollection =
    isMonthlyMembership || isRent;

  const collectionName = isCustom
    ? receipt.customName
    : null;

  /*
   * ---------------------------------------------------------
   * GROUP MONTHLY COLLECTION ITEMS
   * ---------------------------------------------------------
   *
   * Used for:
   *
   * - Monthly Membership
   * - Rent
   *
   * Example:
   *
   * Jan 2026
   * Feb 2026
   * Mar 2026
   * ...
   * Aug 2026
   *
   * becomes:
   *
   * 2026 | Jan – Aug | total amount
   *
   * If there is a gap:
   *
   * Jan
   * Feb
   * Mar
   * May
   * Jun
   *
   * becomes:
   *
   * Jan – Mar
   * May – Jun
   */

  const groupedMonthlyItems = isMonthlyCollection
    ? groupMonthlyItems(receipt.items)
    : [];

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="print:hidden flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/finance/membership"
            className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back to membership collections"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Receipt
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              {receipt.receiptNumber}
            </p>
          </div>
        </div>

        <PrintReceiptButton />
      </div>

      {/* =====================================================
          PRINTABLE RECEIPT
      ===================================================== */}

      <section
        id="printable-receipt"
        className="receipt-printable overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        {/* =================================================
            RECEIPT HEADER
        ================================================= */}

        <div className="receipt-branding border-b px-6 py-5">
          {/* Committee Information */}

          <div className="text-center">
            <h2 className="text-xl font-bold tracking-wide text-gray-900">
              PANDARAKKANDY MAHALLU COMMITTEE
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Under Pandarakkandy Palli Thanveerul Islam
              Madrassa &amp; Dars Committee
            </p>

            <p className="mt-1 text-sm font-medium text-gray-700">
              SNo : 386/91
            </p>
          </div>

          {/* Receipt Number + Address */}

          <div className="mt-4 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Receipt No
              </p>

              <p className="mt-1 text-sm font-semibold text-gray-900">
                {receipt.receiptNumber}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">
                Central Kannancode
              </p>

              <p className="text-sm text-gray-600">
                Thuvvakkunnu PO, Kannur
              </p>
            </div>
          </div>
        </div>

        {/* =================================================
            RECEIPT META
        ================================================= */}

        <div className="grid gap-5 border-b px-6 py-5 sm:grid-cols-2">
          {/* LEFT SIDE */}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              {isCustom ? "Name" : "Household"}
            </p>

            {isCustom ? (
              <p className="mt-1 text-base font-semibold text-gray-900">
                {collectionName || "—"}
              </p>
            ) : receipt.household ? (
              <>
                <p className="mt-1 text-base font-semibold text-gray-900">
                  {receipt.household.houseName}
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Household Code:{" "}
                  <span className="font-medium">
                    {receipt.household.householdCode}
                  </span>
                </p>

                {receipt.household.houseNumber && (
                  <p className="mt-1 text-sm text-gray-600">
                    House Number:{" "}
                    <span className="font-medium">
                      {receipt.household.houseNumber}
                    </span>
                  </p>
                )}

                {receipt.household.address && (
                  <p className="mt-1 text-sm text-gray-600">
                    {receipt.household.address}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-base font-semibold text-gray-900">
                —
              </p>
            )}
          </div>

          {/* RIGHT SIDE */}

          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Receipt Details
            </p>

            <p className="mt-1 text-sm text-gray-600">
              Date
            </p>

            <p className="font-medium text-gray-900">
              {formatDate(receipt.receiptDate)}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Collected By
            </p>

            <p className="font-medium text-gray-900">
              {receipt.collectedBy.fullName ||
                receipt.collectedBy.username}
            </p>
          </div>
        </div>

        {/* =================================================
            PAYMENT DETAILS
        ================================================= */}

        <div className="px-6 py-5">
          <table className="w-full text-left text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-2 py-3 font-semibold text-gray-700">
                  Payment Category
                </th>

                <th className="px-2 py-3 font-semibold text-gray-700">
                  Year
                </th>

                <th className="px-2 py-3 font-semibold text-gray-700">
                  Period
                </th>

                <th className="px-2 py-3 text-right font-semibold text-gray-700">
                  Amount
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {/* =================================================
                  CUSTOM COLLECTION
              ================================================= */}

              {isCustom ? (
                <tr>
                  <td className="px-2 py-3 font-medium text-gray-900">
                    {receipt.customPurpose ||
                      "Custom Collection"}
                  </td>

                  <td className="px-2 py-3 text-gray-600">
                    —
                  </td>

                  <td className="px-2 py-3 text-gray-600">
                    —
                  </td>

                  <td className="px-2 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(
                      Number(receipt.totalAmount),
                    )}
                  </td>
                </tr>
              ) : isMonthlyCollection ? (
                /* =================================================
                   GROUPED MONTHLY COLLECTION
                   
                   Applies to:
                   - Monthly Membership
                   - Rent
                ================================================= */

                groupedMonthlyItems.map(
                  (item, index) => (
                    <tr
                      key={`${item.year}-${item.startMonth}-${index}`}
                    >
                      <td className="px-2 py-3 font-medium text-gray-900">
                        {item.paymentCategoryName}
                      </td>

                      <td className="px-2 py-3 text-gray-600">
                        {item.year}
                      </td>

                      <td className="px-2 py-3 text-gray-600">
                        {formatMonthRange(
                          item.startMonth,
                          item.endMonth,
                        )}
                      </td>

                      <td className="px-2 py-3 text-right font-medium text-gray-900">
                        {formatCurrency(
                          item.amount,
                        )}
                      </td>
                    </tr>
                  ),
                )
              ) : (
                /* =================================================
                   OTHER COLLECTION TYPES
                ================================================= */

                receipt.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-2 py-3 font-medium text-gray-900">
                      {getPaymentCategoryName(
                        receipt.purpose,
                        item.paymentCategory?.name,
                      )}
                    </td>

                    <td className="px-2 py-3 text-gray-600">
                      {item.year ?? "—"}
                    </td>

                    <td className="px-2 py-3 text-gray-600">
                      {item.month
                        ? getMonthName(item.month)
                        : "—"}
                    </td>

                    <td className="px-2 py-3 text-right font-medium text-gray-900">
                      {formatCurrency(
                        Number(item.amount),
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* =================================================
              TOTAL

              IMPORTANT:
              This is deliberately OUTSIDE the table.
              Therefore the browser will not repeat it when
              the receipt continues onto another printed page.
          ================================================= */}

          <div className="mt-4 flex justify-end border-t pt-4">
            <div className="flex min-w-[260px] items-center justify-between gap-8">
              <span className="font-semibold text-gray-700">
                Total Collection
              </span>

              <span className="text-xl font-bold text-green-700">
                {formatCurrency(
                  Number(receipt.totalAmount),
                )}
              </span>
            </div>
          </div>
        </div>

        {/* =================================================
            REMARKS
        ================================================= */}

        {receipt.remarks && (
          <div className="border-t px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Remarks
            </p>

            <p className="mt-1 text-sm leading-5 text-gray-700">
              {receipt.remarks}
            </p>
          </div>
        )}

        {/* =================================================
            RECEIPT FOOTER
        ================================================= */}

        <div className="receipt-footer border-t px-6 py-5 text-center">
          <p className="text-sm font-medium text-gray-700">
            Thank you for your contribution.
          </p>

          <p className="mt-1 text-xs text-gray-400">
            This is a computer-generated receipt.
          </p>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   GROUP MONTHLY COLLECTION ITEMS
========================================================= */

function groupMonthlyItems(
  items: ReceiptItem[],
): GroupedMonthlyItem[] {
  const monthlyItems = items
    .filter(
      (
        item,
      ): item is ReceiptItem & {
        year: number;
        month: number;
      } =>
        item.year !== null &&
        item.month !== null,
    )
    .map((item) => ({
      year: item.year,
      month: item.month,
      amount: Number(item.amount),
      paymentCategoryName:
        item.paymentCategory?.name ||
        "Monthly Membership",
    }))
    .sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }

      return a.month - b.month;
    });

  const groups: GroupedMonthlyItem[] = [];

  for (const item of monthlyItems) {
    const lastGroup =
      groups[groups.length - 1];

    /*
     * Continue the existing range when:
     *
     * same year
     * AND current month immediately follows
     * previous month.
     */

    if (
      lastGroup &&
      lastGroup.year === item.year &&
      item.month === lastGroup.endMonth + 1
    ) {
      lastGroup.endMonth = item.month;
      lastGroup.amount += item.amount;

      continue;
    }

    /*
     * Start a new range.
     */

    groups.push({
      year: item.year,
      startMonth: item.month,
      endMonth: item.month,
      amount: item.amount,
      paymentCategoryName:
        item.paymentCategoryName,
    });
  }

  return groups;
}

/* =========================================================
   MONTH RANGE
========================================================= */

function formatMonthRange(
  startMonth: number,
  endMonth: number,
) {
  const start = getMonthShortName(
    startMonth,
  );

  const end = getMonthShortName(
    endMonth,
  );

  if (startMonth === endMonth) {
    return start;
  }

  return `${start} – ${end}`;
}

/* =========================================================
   PAYMENT CATEGORY
========================================================= */

function getPaymentCategoryName(
  purpose:
    | "MONTHLY_MEMBERSHIP"
    | "NIKAH_HOUSE_WARMING"
    | "RENT"
    | "CUSTOM",
  existingCategoryName:
    | string
    | null
    | undefined,
) {
  switch (purpose) {
    case "MONTHLY_MEMBERSHIP":
      return "Monthly Membership";

    case "NIKAH_HOUSE_WARMING":
      return "Nikah / House Warming";

    case "RENT":
      return "Rent";

    case "CUSTOM":
      return (
        existingCategoryName ||
        "Custom Collection"
      );

    default:
      return (
        existingCategoryName ||
        "Collection"
      );
  }
}

/* =========================================================
   CURRENCY
========================================================= */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

/* =========================================================
   DATE
========================================================= */

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/* =========================================================
   FULL MONTH NAME
========================================================= */

function getMonthName(month: number) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
  }).format(
    new Date(
      2026,
      month - 1,
      1,
    ),
  );
}

/* =========================================================
   SHORT MONTH NAME
========================================================= */

function getMonthShortName(
  month: number,
) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
  }).format(
    new Date(
      2026,
      month - 1,
      1,
    ),
  );
}
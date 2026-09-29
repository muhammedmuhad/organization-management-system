import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Eye,
  Plus,
  Search,
  Wallet,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

interface MembershipPageProps {
  searchParams: Promise<{
    q?: string;
    purpose?: string;
  }>;
}

type Purpose =
  | "ALL"
  | "MONTHLY_MEMBERSHIP"
  | "RENT"
  | "NIKAH_HOUSE_WARMING"
  | "CUSTOM";

type ReceiptRow = {
  id: string;
  receiptNumber: string;
  receiptDate: Date;
  totalAmount: number;
  purpose:
    | "MONTHLY_MEMBERSHIP"
    | "RENT"
    | "NIKAH_HOUSE_WARMING"
    | "CUSTOM";
  household: {
    householdCode: string;
    houseName: string;
  } | null;
  collectedBy: {
    fullName: string;
    username: string;
  } | null;
  items: {
    year: number | null;
    month: number | null;
    paymentCategory: {
      name: string;
    } | null;
  }[];
};

export default async function MembershipCollectionsPage({
  searchParams,
}: MembershipPageProps) {
  const params = await searchParams;

  const search =
    (params.q || "").trim();

  const selectedPurpose: Purpose =
    params.purpose ===
      "MONTHLY_MEMBERSHIP" ||
    params.purpose === "RENT" ||
    params.purpose ===
      "NIKAH_HOUSE_WARMING" ||
    params.purpose === "CUSTOM"
      ? params.purpose
      : "ALL";

  /* =========================================================
     WHERE
  ========================================================= */

  const where = {
    ...(selectedPurpose !== "ALL"
      ? {
          purpose:
            selectedPurpose,
        }
      : {}),

    ...(search
      ? {
          OR: [
            {
              receiptNumber: {
                contains: search,
                mode: "insensitive" as const,
              },
            },

            {
              household: {
                is: {
                  householdCode: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },

            {
              household: {
                is: {
                  houseName: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              },
            },

            {
              remarks: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  /* =========================================================
     DATA
  ========================================================= */

  const [
    totalCollected,
    receiptCount,
    receipts,
  ] = await Promise.all([
    prisma.membershipReceipt.aggregate({
      where,
      _sum: {
        totalAmount: true,
      },
    }),

    prisma.membershipReceipt.count({
      where,
    }),

    prisma.membershipReceipt.findMany({
      where,

      orderBy: [
        {
          receiptDate: "desc",
        },
        {
          receiptSequence: "desc",
        },
      ],

      select: {
        id: true,
        receiptNumber: true,
        receiptDate: true,
        totalAmount: true,
        purpose: true,

        household: {
          select: {
            householdCode: true,
            houseName: true,
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
            year: true,
            month: true,

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
          ],
        },
      },
    }),
  ]);

  const rows: ReceiptRow[] =
    receipts.map((receipt) => ({
      id: receipt.id,

      receiptNumber:
        receipt.receiptNumber,

      receiptDate:
        receipt.receiptDate,

      totalAmount:
        Number(receipt.totalAmount),

      purpose:
        receipt.purpose as ReceiptRow["purpose"],

      household:
        receipt.household,

      collectedBy:
        receipt.collectedBy,

      items:
        receipt.items,
    }));

  const totalAmount =
    Number(
      totalCollected._sum
        .totalAmount ?? 0,
    );

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/finance"
            className="mt-1 rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            aria-label="Back to finance"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Collections
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Manage monthly membership,
              rent, Nikah / house warming,
              and custom collection receipts.
            </p>
          </div>
        </div>

        <Link
          href="/finance/membership/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
        >
          <Plus className="h-4 w-4" />
          New Collection
        </Link>
      </div>

      {/* =====================================================
          SUMMARY
      ===================================================== */}

      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          title={
            selectedPurpose === "ALL"
              ? "Total Collected"
              : `${getPurposeLabel(
                  selectedPurpose,
                )} Collected`
          }
          value={formatCurrency(
            totalAmount,
          )}
          description={
            selectedPurpose === "ALL"
              ? "Total amount from all collection sources"
              : `Total amount from ${getPurposeLabel(
                  selectedPurpose,
                ).toLowerCase()} collections`
          }
          icon={
            <Wallet className="h-5 w-5" />
          }
          iconClass="bg-green-50 text-green-700"
        />

        <SummaryCard
          title="Receipts"
          value={String(
            receiptCount,
          )}
          description={
            selectedPurpose === "ALL"
              ? "All collection receipts"
              : `Matching ${getPurposeLabel(
                  selectedPurpose,
                ).toLowerCase()} receipts`
          }
          icon={
            <CalendarDays className="h-5 w-5" />
          }
          iconClass="bg-blue-50 text-blue-700"
        />
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <form
          method="GET"
          className="grid gap-3 md:grid-cols-[1fr_260px_auto]"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <input
              name="q"
              defaultValue={search}
              placeholder="Search receipt number, household code or house name..."
              className="h-11 w-full rounded-lg border border-gray-300 pl-9 pr-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <select
            name="purpose"
            defaultValue={
              selectedPurpose
            }
            className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="ALL">
              All Collections
            </option>

            <option value="MONTHLY_MEMBERSHIP">
              Monthly Membership
            </option>

            <option value="RENT">
              Rent
            </option>

            <option value="NIKAH_HOUSE_WARMING">
              Nikah / House Warming
            </option>

            <option value="CUSTOM">
              Custom
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
              selectedPurpose !==
                "ALL") && (
              <Link
                href="/finance/membership"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Clear
              </Link>
            )}
          </div>
        </form>
      </section>

      {/* =====================================================
          RECEIPTS
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            Collection Receipts
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            {receiptCount} receipt
            {receiptCount !== 1
              ? "s"
              : ""}{" "}
            found.
          </p>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            selectedPurpose={
              selectedPurpose
            }
          />
        ) : (
          <>
            {/* =================================================
                DESKTOP
            ================================================= */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Receipt No.
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Collection Type
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Household
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Details
                    </th>

                    <th className="px-5 py-4 font-semibold text-gray-600">
                      Collected By
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-gray-600">
                      Amount
                    </th>

                    <th className="px-5 py-4 text-right font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {rows.map(
                    (receipt) => (
                      <ReceiptTableRow
                        key={
                          receipt.id
                        }
                        receipt={
                          receipt
                        }
                      />
                    ),
                  )}
                </tbody>
              </table>
            </div>

            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="divide-y md:hidden">
              {rows.map(
                (receipt) => (
                  <ReceiptMobileCard
                    key={
                      receipt.id
                    }
                    receipt={
                      receipt
                    }
                  />
                ),
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   DESKTOP ROW
========================================================= */

function ReceiptTableRow({
  receipt,
}: {
  receipt: ReceiptRow;
}) {
  return (
    <tr className="transition hover:bg-gray-50">
      <td className="whitespace-nowrap px-5 py-4">
        <span className="font-semibold text-gray-900">
          {receipt.receiptNumber}
        </span>
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
        {formatDate(
          receipt.receiptDate,
        )}
      </td>

      <td className="px-5 py-4">
        <PurposeBadge
          purpose={
            receipt.purpose
          }
        />
      </td>

      <td className="px-5 py-4">
        {receipt.household ? (
          <div>
            <p className="font-medium text-gray-900">
              {
                receipt
                  .household
                  .houseName
              }
            </p>

            <p className="mt-0.5 text-xs text-gray-500">
              {
                receipt
                  .household
                  .householdCode
              }
            </p>
          </div>
        ) : (
          <span className="text-gray-400">
            —
          </span>
        )}
      </td>

      <td className="px-5 py-4">
        <ReceiptDetails
          receipt={receipt}
        />
      </td>

      <td className="px-5 py-4 text-gray-600">
        {receipt.collectedBy
          ? receipt
              .collectedBy
              .fullName ||
            receipt
              .collectedBy
              .username
          : "—"}
      </td>

      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-green-700">
        {formatCurrency(
          receipt.totalAmount,
        )}
      </td>

      <td className="px-5 py-4 text-right">
        <Link
          href={`/finance/membership/${receipt.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          View
        </Link>
      </td>
    </tr>
  );
}

/* =========================================================
   MOBILE CARD
========================================================= */

function ReceiptMobileCard({
  receipt,
}: {
  receipt: ReceiptRow;
}) {
  return (
    <div className="space-y-4 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-gray-900">
            {receipt.receiptNumber}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatDate(
              receipt.receiptDate,
            )}
          </p>
        </div>

        <p className="font-semibold text-green-700">
          {formatCurrency(
            receipt.totalAmount,
          )}
        </p>
      </div>

      <PurposeBadge
        purpose={
          receipt.purpose
        }
      />

      {receipt.household && (
        <div>
          <p className="font-medium text-gray-900">
            {
              receipt
                .household
                .houseName
            }
          </p>

          <p className="mt-0.5 text-xs text-gray-500">
            {
              receipt
                .household
                .householdCode
            }
          </p>
        </div>
      )}

      <ReceiptDetails
        receipt={receipt}
      />

      <div className="flex items-center justify-between border-t pt-3">
        <span className="text-xs text-gray-500">
          Collected by{" "}
          {receipt.collectedBy
            ? receipt
                .collectedBy
                .fullName ||
              receipt
                .collectedBy
                .username
            : "—"}
        </span>

        <Link
          href={`/finance/membership/${receipt.id}`}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <Eye className="h-4 w-4" />
          View
        </Link>
      </div>
    </div>
  );
}

/* =========================================================
   RECEIPT DETAILS
========================================================= */

function ReceiptDetails({
  receipt,
}: {
  receipt: ReceiptRow;
}) {
  switch (receipt.purpose) {
    case "MONTHLY_MEMBERSHIP":
      return (
        <div>
          <p className="text-sm font-medium text-gray-900">
            Monthly Membership
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatMembershipPeriods(
              receipt.items,
            )}
          </p>
        </div>
      );

    case "RENT":
      return (
        <div>
          <p className="text-sm font-medium text-gray-900">
            Rent
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {formatMembershipPeriods(
              receipt.items,
            )}
          </p>
        </div>
      );

    case "NIKAH_HOUSE_WARMING":
      return (
        <div>
          <p className="text-sm font-medium text-gray-900">
            Nikah / House Warming
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Collection receipt
          </p>
        </div>
      );

    case "CUSTOM":
      return (
        <div>
          <p className="text-sm font-medium text-gray-900">
            Custom Collection
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Custom collection receipt
          </p>
        </div>
      );

    default:
      return null;
  }
}

/* =========================================================
   PURPOSE BADGE
========================================================= */

function PurposeBadge({
  purpose,
}: {
  purpose: ReceiptRow["purpose"];
}) {
  const config = {
    MONTHLY_MEMBERSHIP: {
      label: "Monthly Membership",
      classes:
        "bg-green-50 text-green-700",
    },

    RENT: {
      label: "Rent",
      classes:
        "bg-purple-50 text-purple-700",
    },

    NIKAH_HOUSE_WARMING: {
      label: "Nikah / House Warming",
      classes:
        "bg-blue-50 text-blue-700",
    },

    CUSTOM: {
      label: "Custom",
      classes:
        "bg-orange-50 text-orange-700",
    },
  } as const;

  const item =
    config[purpose];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${item.classes}`}
    >
      {item.label}
    </span>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  selectedPurpose,
}: {
  selectedPurpose: Purpose;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <CalendarDays className="h-6 w-6 text-gray-400" />
      </div>

      <h3 className="font-semibold text-gray-900">
        No collection receipts found
      </h3>

      <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
        {selectedPurpose === "ALL"
          ? "No collection receipts match your search."
          : `No ${getPurposeLabel(
              selectedPurpose,
            ).toLowerCase()} receipts match your search.`}
      </p>
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function SummaryCard({
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
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
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

        <div
          className={`rounded-lg p-3 ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getPurposeLabel(
  purpose: Purpose,
) {
  switch (purpose) {
    case "MONTHLY_MEMBERSHIP":
      return "Monthly Membership";

    case "RENT":
      return "Rent";

    case "NIKAH_HOUSE_WARMING":
      return "Nikah / House Warming";

    case "CUSTOM":
      return "Custom";

    default:
      return "All Collections";
  }
}

function formatMembershipPeriods(
  items: ReceiptRow["items"],
) {
  if (items.length === 0) {
    return "Collection receipt";
  }

  const periods = items
    .map((item) => {
      if (
        item.year &&
        item.month
      ) {
        return `${getMonthName(
          item.month,
        )} ${item.year}`;
      }

      if (item.year) {
        return String(
          item.year,
        );
      }

      return null;
    })
    .filter(
      (
        value,
      ): value is string =>
        Boolean(value),
    );

  if (periods.length === 0) {
    return "Collection receipt";
  }

  return periods.join(
    ", ",
  );
}

function getMonthName(
  month: number,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      month: "short",
    },
  ).format(
    new Date(
      2026,
      month - 1,
      1,
    ),
  );
}

function formatCurrency(
  amount: number,
) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    },
  ).format(amount);
}

function formatDate(
  date: Date,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(date);
}
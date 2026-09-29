"use server";

import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export type MembershipCollectionState = {
  success: boolean;
  message: string;
};

type ReceiptPurposeValue =
  | "MONTHLY_MEMBERSHIP"
  | "NIKAH_HOUSE_WARMING"
  | "RENT"
  | "CUSTOM";

type CollectionItem = {
  paymentCategoryId: string | null;
  year: number | null;
  month: number | null;
  amount: number;
};

/* =========================================================
   CURRENT USER
========================================================= */

async function getCurrentUser() {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error(
      "You must be logged in.",
    );
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (!user) {
    throw new Error(
      "Authenticated user does not exist.",
    );
  }

  if (user.status !== "ACTIVE") {
    throw new Error(
      "Your account is inactive.",
    );
  }

  return user;
}

/* =========================================================
   CREATE COLLECTION
========================================================= */

export async function createMembershipCollection(
  previousState: MembershipCollectionState,
  formData: FormData,
): Promise<MembershipCollectionState> {
  void previousState;

  try {
    /* -------------------------------------------------------
       BASIC FORM VALUES
    ------------------------------------------------------- */

    const purpose =
      String(
        formData.get("purpose") || "",
      ).trim() as ReceiptPurposeValue;

    const householdId =
      String(
        formData.get("householdId") || "",
      ).trim();

    const receiptDateValue =
      String(
        formData.get("receiptDate") || "",
      ).trim();

    const customName =
      String(
        formData.get("customName") || "",
      ).trim();

    const customPurpose =
      String(
        formData.get("customPurpose") || "",
      ).trim();

    const amountValue =
      String(
        formData.get("amount") || "",
      ).trim();

    const remarks =
      String(
        formData.get("remarks") || "",
      ).trim();

    const itemsJson =
      String(
        formData.get("items") || "[]",
      );

    /* -------------------------------------------------------
       PURPOSE
    ------------------------------------------------------- */

    const validPurposes: ReceiptPurposeValue[] = [
      "MONTHLY_MEMBERSHIP",
      "NIKAH_HOUSE_WARMING",
      "RENT",
      "CUSTOM",
    ];

    if (!validPurposes.includes(purpose)) {
      return {
        success: false,
        message:
          "Invalid collection purpose.",
      };
    }

    const isItemBasedCollection =
      purpose === "MONTHLY_MEMBERSHIP" ||
      purpose === "RENT";

    const isSimpleCollection =
      purpose === "NIKAH_HOUSE_WARMING" ||
      purpose === "CUSTOM";

    /* -------------------------------------------------------
       RECEIPT DATE
    ------------------------------------------------------- */

    if (!receiptDateValue) {
      return {
        success: false,
        message:
          "Receipt date is required.",
      };
    }

    const receiptDate = new Date(
      `${receiptDateValue}T00:00:00`,
    );

    if (
      Number.isNaN(
        receiptDate.getTime(),
      )
    ) {
      return {
        success: false,
        message:
          "Invalid receipt date.",
      };
    }

    /* -------------------------------------------------------
       HOUSEHOLD RULE
    ------------------------------------------------------- */

    /*
     * Monthly Membership:
     * Household is required.
     *
     * Nikah / House Warming:
     * Household is required.
     *
     * Rent:
     * Household is NOT required.
     *
     * Custom:
     * Household is NOT required.
     */

    const needsHousehold =
      purpose ===
        "MONTHLY_MEMBERSHIP" ||
      purpose ===
        "NIKAH_HOUSE_WARMING";

    if (
      needsHousehold &&
      !householdId
    ) {
      return {
        success: false,
        message:
          "Household is required for this collection.",
      };
    }

    /* -------------------------------------------------------
       VERIFY HOUSEHOLD
    ------------------------------------------------------- */

    if (householdId) {
      const household =
        await prisma.household.findUnique({
          where: {
            id: householdId,
          },
          select: {
            id: true,
            isArchived: true,
          },
        });

      if (!household) {
        return {
          success: false,
          message:
            "Selected household does not exist.",
        };
      }

      if (household.isArchived) {
        return {
          success: false,
          message:
            "Cannot record a collection for an archived household.",
        };
      }
    }

    /* -------------------------------------------------------
       CUSTOM COLLECTION
    ------------------------------------------------------- */

    if (purpose === "CUSTOM") {
      if (!customName) {
        return {
          success: false,
          message:
            "Name is required for custom collection.",
        };
      }

      if (!customPurpose) {
        return {
          success: false,
          message:
            "Purpose is required for custom collection.",
        };
      }

      if (customName.length > 200) {
        return {
          success: false,
          message:
            "Name cannot exceed 200 characters.",
        };
      }

      if (customPurpose.length > 300) {
        return {
          success: false,
          message:
            "Purpose cannot exceed 300 characters.",
        };
      }
    }

    /* -------------------------------------------------------
       SIMPLE COLLECTION AMOUNT
       
       Used by:
       - Nikah / House Warming
       - Custom
    ------------------------------------------------------- */

    const simpleAmount =
      Number(amountValue);

    if (isSimpleCollection) {
      if (
        !Number.isFinite(
          simpleAmount,
        ) ||
        simpleAmount <= 0
      ) {
        return {
          success: false,
          message:
            "Collection amount must be greater than zero.",
        };
      }
    }

    /* -------------------------------------------------------
       PARSE ITEMS
       
       Items are required only for:
       - Monthly Membership
       - Rent
       
       Nikah / House Warming and Custom can
       legitimately submit an empty items array.
    ------------------------------------------------------- */

    let rawItems: unknown;

    try {
      rawItems =
        JSON.parse(itemsJson);
    } catch {
      return {
        success: false,
        message:
          "Invalid collection items.",
      };
    }

    if (!Array.isArray(rawItems)) {
      return {
        success: false,
        message:
          "Invalid collection items.",
      };
    }

    const items: CollectionItem[] =
      rawItems.map((raw) => {
        const item =
          raw as Record<
            string,
            unknown
          >;

        const categoryValue =
          item.paymentCategoryId;

        const yearValue =
          item.year;

        const monthValue =
          item.month;

        const amountValue =
          item.amount;

        return {
          paymentCategoryId:
            categoryValue === null ||
            categoryValue === undefined ||
            String(
              categoryValue,
            ).trim() === ""
              ? null
              : String(
                  categoryValue,
                ).trim(),

          year:
            yearValue === null ||
            yearValue === undefined ||
            String(
              yearValue,
            ).trim() === ""
              ? null
              : Number(yearValue),

          month:
            monthValue === null ||
            monthValue === undefined ||
            String(
              monthValue,
            ).trim() === ""
              ? null
              : Number(monthValue),

          amount:
            Number(amountValue),
        };
      });

    /* -------------------------------------------------------
       ITEM RULES
    ------------------------------------------------------- */

    /*
     * Monthly Membership and Rent
     * require at least one item.
     */

    if (isItemBasedCollection) {
      if (items.length === 0) {
        return {
          success: false,
          message:
            "At least one collection item is required.",
        };
      }

      for (const item of items) {
        if (
          !Number.isFinite(
            item.amount,
          ) ||
          item.amount <= 0
        ) {
          return {
            success: false,
            message:
              "Every collection amount must be greater than zero.",
          };
        }
      }
    }

    /*
     * Nikah / House Warming and Custom
     * do NOT require collection items.
     *
     * Their amount is stored directly
     * in MembershipReceipt.totalAmount.
     */

    if (isSimpleCollection) {
      if (
        !Number.isFinite(
          simpleAmount,
        ) ||
        simpleAmount <= 0
      ) {
        return {
          success: false,
          message:
            "Collection amount must be greater than zero.",
        };
      }
    }

    /* -------------------------------------------------------
       YEAR + MONTH RULES
       
       Monthly Membership and Rent:
       - Year required
       - Month required
       - Payment category not used
    ------------------------------------------------------- */

    if (
      purpose ===
        "MONTHLY_MEMBERSHIP" ||
      purpose === "RENT"
    ) {
      for (const item of items) {
        if (
          !Number.isInteger(
            item.year,
          ) ||
          item.year! < 2000 ||
          item.year! > 2100
        ) {
          return {
            success: false,
            message:
              "Please provide a valid year.",
          };
        }

        if (
          !Number.isInteger(
            item.month,
          ) ||
          item.month! < 1 ||
          item.month! > 12
        ) {
          return {
            success: false,
            message:
              "Please select valid months.",
          };
        }

        /*
         * Payment category is deliberately
         * not used for Monthly Membership/Rent.
         */

        if (
          item.paymentCategoryId !==
          null
        ) {
          return {
            success: false,
            message:
              "Payment category is not used for this collection type.",
          };
        }
      }
    }

    /* -------------------------------------------------------
       DUPLICATE MONTHS IN SAME RECEIPT
    ------------------------------------------------------- */

    if (
      purpose ===
        "MONTHLY_MEMBERSHIP" ||
      purpose === "RENT"
    ) {
      const periodKeys =
        items.map(
          (item) =>
            `${item.year}-${item.month}`,
        );

      if (
        new Set(periodKeys).size !==
        periodKeys.length
      ) {
        return {
          success: false,
          message:
            "The same month cannot be added twice.",
        };
      }
    }

    /* -------------------------------------------------------
       TOTAL
    ------------------------------------------------------- */

    /*
     * Simple collections:
     * total = direct amount.
     *
     * Item-based collections:
     * total = sum of all item amounts.
     */

    const totalAmount =
      isSimpleCollection
        ? simpleAmount
        : items.reduce(
            (sum, item) =>
              sum + item.amount,
            0,
          );

    if (
      !Number.isFinite(
        totalAmount,
      ) ||
      totalAmount <= 0
    ) {
      return {
        success: false,
        message:
          "Total collection amount must be greater than zero.",
      };
    }

    /* -------------------------------------------------------
       CURRENT USER
    ------------------------------------------------------- */

    const user =
      await getCurrentUser();

    /* -------------------------------------------------------
       RECEIPT PREFIX
    ------------------------------------------------------- */

    const configuration =
      await prisma.systemConfiguration.findFirst(
        {
          select: {
            receiptPrefix: true,
          },
        },
      );

    const prefix =
      configuration?.receiptPrefix?.trim() ||
      "RCPT";

    /* -------------------------------------------------------
       DATABASE TRANSACTION
    ------------------------------------------------------- */

    const result =
      await prisma.$transaction(
        async (tx) => {
          /* -------------------------------------------------
             MONTHLY MEMBERSHIP DUPLICATE CHECK
          ------------------------------------------------- */

          if (
            purpose ===
              "MONTHLY_MEMBERSHIP" &&
            householdId
          ) {
            for (const item of items) {
              const duplicate =
                await tx.membershipReceiptItem.findFirst(
                  {
                    where: {
                      year:
                        item.year,

                      month:
                        item.month,

                      paymentCategoryId:
                        null,

                      receipt: {
                        is: {
                          householdId,

                          purpose:
                            "MONTHLY_MEMBERSHIP",

                          status:
                            "PAID",
                        },
                      },
                    },

                    select: {
                      id: true,

                      receipt: {
                        select: {
                          receiptNumber:
                            true,
                        },
                      },
                    },
                  },
                );

              if (duplicate) {
                throw new DuplicateCollectionError(
                  `This household already has a membership payment for ${getMonthName(
                    item.month!,
                  )} ${item.year}. Receipt: ${duplicate.receipt.receiptNumber}`,
                );
              }
            }
          }

          /* -------------------------------------------------
             GENERATE RECEIPT SEQUENCE
          ------------------------------------------------- */

          const lastReceipt =
            await tx.membershipReceipt.findFirst(
              {
                orderBy: {
                  receiptSequence:
                    "desc",
                },

                select: {
                  receiptSequence:
                    true,
                },
              },
            );

          const nextSequence =
            (lastReceipt?.receiptSequence ||
              0) + 1;

          const receiptNumber =
            `${prefix}-${String(
              nextSequence,
            ).padStart(6, "0")}`;

          /* -------------------------------------------------
             CREATE RECEIPT
          ------------------------------------------------- */

          const receipt =
            await tx.membershipReceipt.create(
              {
                data: {
                  receiptNumber,

                  receiptSequence:
                    nextSequence,

                  purpose,

                  householdId:
                    householdId || null,

                  customName:
                    purpose === "CUSTOM"
                      ? customName
                      : null,

                  customPurpose:
                    purpose === "CUSTOM"
                      ? customPurpose
                      : null,

                  receiptDate,

                  totalAmount,

                  status: "PAID",

                  remarks:
                    remarks || null,

                  collectedById:
                    user.id,

                  /*
                   * Only Monthly Membership
                   * and Rent create items.
                   *
                   * Nikah / House Warming
                   * and Custom are simple
                   * amount-based receipts.
                   */
                  items:
                    isItemBasedCollection
                      ? {
                          create:
                            items.map(
                              (
                                item,
                              ) => ({
                                paymentCategoryId:
                                  item.paymentCategoryId,

                                year:
                                  item.year,

                                month:
                                  item.month,

                                amount:
                                  item.amount,
                              }),
                            ),
                        }
                      : undefined,
                },

                select: {
                  id: true,

                  receiptNumber:
                    true,
                },
              },
            );

          return receipt;
        },

        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,

          maxWait: 5000,

          timeout: 10000,
        },
      );

    /* -------------------------------------------------------
       REDIRECT TO RECEIPT
    ------------------------------------------------------- */

    redirect(
      `/finance/membership/${result.id}`,
    );
  } catch (error) {
    if (
      error instanceof
      DuplicateCollectionError
    ) {
      return {
        success: false,
        message:
          error.message,
      };
    }

    throw error;
  }
}

/* =========================================================
   DUPLICATE COLLECTION ERROR
========================================================= */

class DuplicateCollectionError extends Error {
  constructor(message: string) {
    super(message);

    this.name =
      "DuplicateCollectionError";
  }
}

/* =========================================================
   MONTH NAME
========================================================= */

function getMonthName(
  month: number,
) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      month: "long",
    },
  ).format(
    new Date(
      2026,
      month - 1,
      1,
    ),
  );
}
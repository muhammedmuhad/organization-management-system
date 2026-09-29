"use server";

import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
export async function closeEvent(
  eventId: string,
) {
  if (!eventId) {
    throw new Error("Event ID is required.");
  }

  const event =
    await prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (!event) {
    throw new Error("Event not found.");
  }

  if (event.status === "COMPLETED") {
    throw new Error(
      "This event is already closed.",
    );
  }

  if (event.status === "CANCELLED") {
    throw new Error(
      "A cancelled event cannot be closed.",
    );
  }

  await prisma.event.update({
    where: {
      id: eventId,
    },

    data: {
      status: "COMPLETED",
      closedAt: new Date(),
    },
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
}

/* =========================================================
   EVENT SETTLEMENT
   ========================================================= */

export type EventSettlementDirection =
  | "TO_GENERAL_FUND"
  | "FROM_GENERAL_FUND";

export async function createEventSettlement(
  eventId: string,
  formData: FormData,
) {
  const session =
    await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
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

  const direction = String(
    formData.get("direction") || "",
  ) as EventSettlementDirection;

  const amountValue = String(
    formData.get("amount") || "",
  ).trim();

  const transferDateValue = String(
    formData.get("transferDate") || "",
  ).trim();

  const referenceNo =
    String(
      formData.get("referenceNo") || "",
    ).trim() || null;

  const remarks =
    String(
      formData.get("remarks") || "",
    ).trim() || null;

  if (
    direction !== "TO_GENERAL_FUND" &&
    direction !== "FROM_GENERAL_FUND"
  ) {
    throw new Error(
      "Invalid settlement direction.",
    );
  }

  const amountNumber =
    Number(amountValue);

  if (
    !Number.isFinite(amountNumber) ||
    amountNumber <= 0
  ) {
    throw new Error(
      "Settlement amount must be greater than zero.",
    );
  }

  const amount =
    new Prisma.Decimal(
      amountNumber.toFixed(2),
    );

  let transferDate = new Date();

  if (transferDateValue) {
    transferDate = new Date(
      `${transferDateValue}T00:00:00`,
    );

    if (
      Number.isNaN(
        transferDate.getTime(),
      )
    ) {
      throw new Error(
        "Invalid transfer date.",
      );
    }
  }

  await prisma.$transaction(
    async (tx) => {
      /*
       * -------------------------------------------------------
       * Load completed event
       * -------------------------------------------------------
       */

      const event =
        await tx.event.findUnique({
          where: {
            id: eventId,
          },
          select: {
            id: true,
            title: true,
            status: true,
          },
        });

      if (!event) {
        throw new Error(
          "Event not found.",
        );
      }

      if (event.status !== "COMPLETED") {
        throw new Error(
          "The event must be closed before settlement.",
        );
      }

      /*
       * -------------------------------------------------------
       * Calculate FINAL EVENT RESULT
       * -------------------------------------------------------
       */

      const [
        collectionTotal,
        expenseTotal,
      ] = await Promise.all([
        tx.eventCollection.aggregate({
          where: {
            eventId,
          },
          _sum: {
            amount: true,
          },
        }),

        tx.eventExpense.aggregate({
          where: {
            eventId,
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      const totalCollections =
        collectionTotal._sum.amount ??
        new Prisma.Decimal(0);

      const totalExpenses =
        expenseTotal._sum.amount ??
        new Prisma.Decimal(0);

      const finalResult =
        totalCollections.minus(
          totalExpenses,
        );

      if (finalResult.eq(0)) {
        throw new Error(
          "This event has no surplus or deficit to settle.",
        );
      }

      /*
       * -------------------------------------------------------
       * Validate direction
       * -------------------------------------------------------
       */

      if (
        finalResult.gt(0) &&
        direction !== "TO_GENERAL_FUND"
      ) {
        throw new Error(
          "A surplus must be transferred to the General Fund.",
        );
      }

      if (
        finalResult.lt(0) &&
        direction !== "FROM_GENERAL_FUND"
      ) {
        throw new Error(
          "A deficit must receive funding from the General Fund.",
        );
      }

      const settlementAmount =
        finalResult.abs();

      /*
       * -------------------------------------------------------
       * Calculate already settled amount
       * -------------------------------------------------------
       */

      const previousTransfers =
        await tx.eventTransfer.aggregate({
          where: {
            eventId,
            direction,
          },
          _sum: {
            amount: true,
          },
        });

      const alreadySettled =
        previousTransfers._sum.amount ??
        new Prisma.Decimal(0);

      const remaining =
        settlementAmount.minus(
          alreadySettled,
        );

      /*
       * -------------------------------------------------------
       * Prevent over-transfer
       * -------------------------------------------------------
       */

      if (amount.gt(remaining)) {
        throw new Error(
          `Settlement amount cannot exceed the remaining amount of ₹${remaining.toFixed(2)}.`,
        );
      }

      /*
       * -------------------------------------------------------
       * Get / create system finance category
       * -------------------------------------------------------
       */

      let generalIncomeId:
        | string
        | null = null;

      let generalExpenseId:
        | string
        | null = null;

      if (
        direction ===
        "TO_GENERAL_FUND"
      ) {
        const category =
          await tx.incomeCategoryMaster.upsert(
            {
              where: {
                name: "Event Settlement",
              },
              update: {
                isActive: true,
              },
              create: {
                name: "Event Settlement",
                description:
                  "Surplus transferred from completed events to the General Fund.",
                displayOrder: 999,
                isActive: true,
              },
            },
          );

        /*
         * General Fund receives money.
         */
        const income =
          await tx.income.create({
            data: {
              categoryId: category.id,
              amount,
              incomeDate: transferDate,
              description:
                `Event settlement - ${event.title}`,
              receiptNumber:
                referenceNo ||
                `EVENT-${event.id.slice(-8).toUpperCase()}-${Date.now()}`,
              createdById: user.id,
            },
          });

        generalIncomeId =
          income.id;
      }

      if (
        direction ===
        "FROM_GENERAL_FUND"
      ) {
        const category =
          await tx.expenseCategoryMaster.upsert(
            {
              where: {
                name: "Event Funding",
              },
              update: {
                isActive: true,
              },
              create: {
                name: "Event Funding",
                description:
                  "General Fund funding provided to cover completed event deficits.",
                displayOrder: 999,
                isActive: true,
              },
            },
          );

        /*
         * General Fund provides money.
         */
        const expense =
          await tx.expense.create({
            data: {
              categoryId: category.id,
              amount,
              expenseDate: transferDate,
              description:
                `Event funding - ${event.title}`,
              billNumber:
                referenceNo ||
                `EVENT-${event.id.slice(-8).toUpperCase()}-${Date.now()}`,
              createdById: user.id,
            },
          });

        generalExpenseId =
          expense.id;
      }

      /*
       * -------------------------------------------------------
       * Create Event Transfer
       * -------------------------------------------------------
       */

      await tx.eventTransfer.create({
        data: {
          eventId,
          direction,
          amount,
          transferDate,
          referenceNo,
          remarks,
          createdById: user.id,
          generalIncomeId,
          generalExpenseId,
        },
      });
    },
    {
      isolationLevel:
        Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5000,
      timeout: 10000,
    },
  );

  revalidatePath(
    `/events/${eventId}`,
  );

  revalidatePath("/events");

  revalidatePath("/finance");

  revalidatePath("/finance/income");

  revalidatePath("/finance/expenses");
}
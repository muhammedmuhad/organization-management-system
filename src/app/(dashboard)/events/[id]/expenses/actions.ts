"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export type EventExpenseState = {
  success: boolean;
  message: string;
};

async function getCurrentAdmin() {
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
        role: true,
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

  if (user.role !== "ADMIN") {
    throw new Error(
      "You do not have permission to manage event expenses.",
    );
  }

  return user;
}

export async function createEventExpense(
  previousState: EventExpenseState,
  formData: FormData,
): Promise<EventExpenseState> {
  void previousState;

  const user = await getCurrentAdmin();

  const eventId = String(
    formData.get("eventId") ?? "",
  ).trim();

  const expenseTitle = String(
    formData.get("expenseTitle") ?? "",
  ).trim();

  const amountValue = String(
    formData.get("amount") ?? "",
  ).trim();

  const expenseDateValue = String(
    formData.get("expenseDate") ?? "",
  ).trim();

  const remarks = String(
    formData.get("remarks") ?? "",
  ).trim();

  /*
   * -------------------------------------------------------
   * VALIDATION
   * -------------------------------------------------------
   */

  if (!eventId) {
    return {
      success: false,
      message: "Event is required.",
    };
  }

  if (!expenseTitle) {
    return {
      success: false,
      message: "Expense title is required.",
    };
  }

  if (!amountValue) {
    return {
      success: false,
      message: "Amount is required.",
    };
  }

  const amount = Number(amountValue);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return {
      success: false,
      message:
        "Amount must be greater than zero.",
    };
  }

  if (!expenseDateValue) {
    return {
      success: false,
      message: "Expense date is required.",
    };
  }

  const expenseDate = new Date(
    `${expenseDateValue}T00:00:00`,
  );

  if (
    Number.isNaN(
      expenseDate.getTime(),
    )
  ) {
    return {
      success: false,
      message: "Invalid expense date.",
    };
  }

  /*
   * -------------------------------------------------------
   * VERIFY EVENT
   * -------------------------------------------------------
   */

  const event =
    await prisma.event.findUnique({
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
    return {
      success: false,
      message: "Event not found.",
    };
  }

  if (event.status === "CANCELLED") {
    return {
      success: false,
      message:
        "Expenses cannot be added to a cancelled event.",
    };
  }

  if (event.status === "COMPLETED") {
    return {
      success: false,
      message:
        "This event has already been completed. New expenses cannot be added.",
    };
  }

  /*
   * -------------------------------------------------------
   * CREATE EXPENSE
   * -------------------------------------------------------
   */

  await prisma.eventExpense.create({
    data: {
      eventId,
      expenseTitle,
      amount,
      expenseDate,
      remarks: remarks || null,
      createdById: user.id,
    },
  });

  /*
   * -------------------------------------------------------
   * REDIRECT AFTER SUCCESS
   * -------------------------------------------------------
   *
   * redirect() throws a Next.js redirect response and
   * therefore execution does not continue after this line.
   */

  redirect(`/events/${eventId}`);
}
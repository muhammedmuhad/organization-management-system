"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export type EventActionState = {
  success: boolean;
  message: string;
};

async function getCurrentAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }

  const user = await prisma.user.findUnique({
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
    throw new Error("Authenticated user does not exist.");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is inactive.");
  }

  if (user.role !== "ADMIN") {
    throw new Error(
      "You do not have permission to manage events.",
    );
  }

  return user;
}

export async function createEvent(
  previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  void previousState;

  const user = await getCurrentAdmin();

  const title = String(
    formData.get("title") || "",
  ).trim();

  const categoryId = String(
    formData.get("categoryId") || "",
  ).trim();

  const description = String(
    formData.get("description") || "",
  ).trim();

  const startDateValue = String(
    formData.get("startDate") || "",
  ).trim();

  const endDateValue = String(
    formData.get("endDate") || "",
  ).trim();

  const startTime = String(
    formData.get("startTime") || "",
  ).trim();

  const endTime = String(
    formData.get("endTime") || "",
  ).trim();

  const venue = String(
    formData.get("venue") || "",
  ).trim();

  /*
   * -------------------------------------------------------
   * VALIDATION
   * -------------------------------------------------------
   */

  if (!title) {
    return {
      success: false,
      message: "Event name is required.",
    };
  }

  if (!categoryId) {
    return {
      success: false,
      message: "Event category is required.",
    };
  }

  if (!startDateValue) {
    return {
      success: false,
      message: "Start date is required.",
    };
  }

  const startDate = new Date(
    `${startDateValue}T00:00:00`,
  );

  if (Number.isNaN(startDate.getTime())) {
    return {
      success: false,
      message: "Invalid start date.",
    };
  }

  let endDate: Date | null = null;

  if (endDateValue) {
    endDate = new Date(
      `${endDateValue}T00:00:00`,
    );

    if (Number.isNaN(endDate.getTime())) {
      return {
        success: false,
        message: "Invalid end date.",
      };
    }

    if (endDate < startDate) {
      return {
        success: false,
        message:
          "End date cannot be before the start date.",
      };
    }
  }

  /*
   * -------------------------------------------------------
   * VERIFY CATEGORY
   * -------------------------------------------------------
   */

  const category =
    await prisma.eventCategoryMaster.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        id: true,
        isActive: true,
      },
    });

  if (!category) {
    return {
      success: false,
      message: "Selected event category does not exist.",
    };
  }

  if (!category.isActive) {
    return {
      success: false,
      message: "Selected event category is inactive.",
    };
  }

  /*
   * -------------------------------------------------------
   * CREATE EVENT
   *
   * Legacy financial fields are initialized to zero.
   * New financial logic will calculate values from:
   *
   * EventCollection
   * EventExpense
   * EventTransfer
   *
   * We do NOT use the legacy amountCollected/
   * totalExpense fields as the source of truth.
   * -------------------------------------------------------
   */

  const event = await prisma.event.create({
    data: {
      title,
      categoryId,
      description: description || null,

      year: startDate.getFullYear(),
      eventDate: startDate,

      startDate,
      endDate,

      startTime: startTime || null,
      endTime: endTime || null,

      venue: venue || null,

      status: "OPEN",

      amountCollected: 0,
      totalExpense: 0,

      createdById: user.id,
    },

    select: {
      id: true,
    },
  });

  redirect(`/events/${event.id}`);
}
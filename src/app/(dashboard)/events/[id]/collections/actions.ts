"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export type EventCollectionState = {
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
      "You do not have permission to manage event collections.",
    );
  }

  return user;
}

export async function createEventCollection(
  previousState: EventCollectionState,
  formData: FormData,
): Promise<EventCollectionState> {
  void previousState;

  const user = await getCurrentAdmin();

  const eventId = String(
    formData.get("eventId") || "",
  ).trim();

  const householdId = String(
    formData.get("householdId") || "",
  ).trim();

  const sourceName = String(
    formData.get("sourceName") || "",
  ).trim();

  const amountValue = String(
    formData.get("amount") || "",
  ).trim();

  const receivedDateValue = String(
    formData.get("receivedDate") || "",
  ).trim();

  const remarks = String(
    formData.get("remarks") || "",
  ).trim();

  /*
   * -------------------------------------------------------
   * BASIC VALIDATION
   * -------------------------------------------------------
   */

  if (!eventId) {
    return {
      success: false,
      message: "Event is required.",
    };
  }

  /*
   * If a household is selected, the household name is the
   * source/name. The manually entered source name is ignored.
   *
   * If no household is selected, source/name is required.
   */

  let finalSourceName = sourceName;

  if (householdId) {
    const household = await prisma.household.findUnique({
      where: {
        id: householdId,
      },
      select: {
        id: true,
        houseName: true,
        isArchived: true,
      },
    });

    if (!household) {
      return {
        success: false,
        message: "Selected household was not found.",
      };
    }

    if (household.isArchived) {
      return {
        success: false,
        message:
          "An archived household cannot be selected.",
      };
    }

    finalSourceName = household.houseName.trim();

    if (!finalSourceName) {
      return {
        success: false,
        message:
          "The selected household does not have a valid name.",
      };
    }
  } else {
    if (!sourceName) {
      return {
        success: false,
        message: "Source name is required.",
      };
    }
  }

  if (!amountValue) {
    return {
      success: false,
      message: "Amount is required.",
    };
  }

  const amount = Number(amountValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      success: false,
      message:
        "Amount must be greater than zero.",
    };
  }

  /*
   * -------------------------------------------------------
   * DATE
   * -------------------------------------------------------
   */

  if (!receivedDateValue) {
    return {
      success: false,
      message: "Received date is required.",
    };
  }

  const receivedDate = new Date(
    `${receivedDateValue}T00:00:00`,
  );

  if (Number.isNaN(receivedDate.getTime())) {
    return {
      success: false,
      message: "Invalid received date.",
    };
  }

  /*
   * -------------------------------------------------------
   * VERIFY EVENT
   * -------------------------------------------------------
   */

  const event = await prisma.event.findUnique({
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
        "Collections cannot be added to a cancelled event.",
    };
  }

  if (event.status === "COMPLETED") {
    return {
      success: false,
      message:
        "This event has already been completed. New collections cannot be added.",
    };
  }

  /*
   * -------------------------------------------------------
   * CREATE COLLECTION
   * -------------------------------------------------------
   */

  await prisma.eventCollection.create({
    data: {
      eventId,
      householdId: householdId || null,
      sourceName: finalSourceName,
      amount,
      receivedDate,
      remarks: remarks || null,
      createdById: user.id,
    },
  });

  redirect(`/events/${eventId}`);
}
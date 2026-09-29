import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

async function getNextHouseholdCode() {
  const households = await prisma.household.findMany({
    where: {
      householdCode: {
        startsWith: "PMH-",
      },
    },
    select: {
      householdCode: true,
    },
  });

  let highestNumber = 0;

  for (const household of households) {
    const match =
      household.householdCode.match(/^PMH-(\d+)$/);

    if (!match) {
      continue;
    }

    const number = Number(match[1]);

    if (number > highestNumber) {
      highestNumber = number;
    }
  }

  return `PMH-${String(
    highestNumber + 1,
  ).padStart(3, "0")}`;
}

async function createHousehold(formData: FormData) {
  "use server";

  const houseNumber =
    String(
      formData.get("houseNumber") || "",
    ).trim() || null;

  const houseName = String(
    formData.get("houseName") || "",
  ).trim();

  const address = String(
    formData.get("address") || "",
  ).trim();

  const emergencyContact =
    String(
      formData.get("emergencyContact") || "",
    ).trim() || null;

  const statusId = String(
    formData.get("statusId") || "",
  ).trim();

  const insertAtPosition =
    formData.get("insertAtPosition") === "true";

  const positionValue = String(
    formData.get("householdPosition") || "",
  ).trim();

  if (!houseName || !address || !statusId) {
    throw new Error(
      "Please fill in all required fields.",
    );
  }

  const status =
    await prisma.householdStatusMaster.findUnique({
      where: {
        id: statusId,
      },
    });

  if (!status || !status.isActive) {
    throw new Error("Invalid household status.");
  }

  /*
   * Existing project behavior:
   * use the admin account as creator.
   */
  const adminUser = await prisma.user.findUnique({
    where: {
      username: "admin",
    },
  });

  if (!adminUser) {
    throw new Error(
      "Administrator account was not found.",
    );
  }

  /*
   * Generate permanent household code.
   *
   * IMPORTANT:
   * This code never changes when register position
   * changes.
   */
  const householdCode =
    await getNextHouseholdCode();

  const household =
    await prisma.$transaction(
      async (tx) => {
        /*
         * Get all existing households in register order.
         */
        const households =
          await tx.household.findMany({
            where: {
              isArchived: false,
            },
            select: {
              id: true,
              displayOrder: true,
            },
            orderBy: {
              displayOrder: "asc",
            },
          });

        const householdCount =
          households.length;

        /*
         * Default behavior:
         *
         * Add at the end.
         */
        let position =
          householdCount + 1;

        /*
         * Special behavior:
         *
         * Insert at selected position.
         */
        if (insertAtPosition) {
          position = Number(positionValue);

          if (
            !Number.isInteger(position) ||
            position < 1 ||
            position > householdCount + 1
          ) {
            throw new Error(
              `Invalid household position. Please select a position between 1 and ${
                householdCount + 1
              }.`,
            );
          }
        }

        /*
         * Shift existing households.
         *
         * Example:
         *
         * Existing:
         * 1
         * 2
         * 3
         * 4
         *
         * Insert at 2:
         *
         * 1
         * 3
         * 4
         * 5
         *
         * The new household will receive 2.
         */
        if (position <= householdCount) {
          await tx.household.updateMany({
            where: {
              isArchived: false,
              displayOrder: {
                gte: position,
              },
            },
            data: {
              displayOrder: {
                increment: 1,
              },
            },
          });
        }

        /*
         * Create the new household.
         *
         * householdCode is permanent.
         * displayOrder is the current register position.
         */
        return await tx.household.create({
          data: {
            householdCode,
            displayOrder: position,

            houseNumber,
            houseName,
            address,
            emergencyContact,

            statusId,

            isArchived: false,

            createdById: adminUser.id,
          },
        });
      },
      {
        isolationLevel:
          Prisma.TransactionIsolationLevel.Serializable,
      },
    );

  revalidatePath("/households");

  redirect(
    `/households/${household.id}`,
  );
}

export default async function NewHouseholdPage() {
  const [
    statuses,
    nextHouseholdCode,
    householdCount,
  ] = await Promise.all([
    prisma.householdStatusMaster.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    }),

    getNextHouseholdCode(),

    prisma.household.count({
      where: {
        isArchived: false,
      },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}

      <div className="flex items-center gap-3">
        <Link
          href="/households"
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to households"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Add Household
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Register a new household in the Mahallu.
          </p>
        </div>
      </div>

      {/* Form */}

      <form
        action={createHousehold}
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <div className="border-b px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            Household Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the basic information for this household.
          </p>
        </div>

        <div className="space-y-6 p-6">
          {/* Household Code */}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Household Code
            </label>

            <div className="flex h-11 items-center rounded-lg border border-green-200 bg-green-50 px-3">
              <span className="font-semibold text-green-700">
                {nextHouseholdCode}
              </span>
            </div>

            <p className="mt-1.5 text-xs text-gray-500">
              This code is permanent and will not change
              when the register position changes.
            </p>
          </div>

          {/* Register Position */}

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="insertAtPosition"
                name="insertAtPosition"
                type="checkbox"
                value="true"
                className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
              />

              <label
                htmlFor="insertAtPosition"
                className="text-sm font-medium text-gray-700"
              >
                Insert at a specific register position
              </label>
            </div>

            <div>
              <label
                htmlFor="householdPosition"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Register Position
              </label>

              <input
                id="householdPosition"
                name="householdPosition"
                type="number"
                min={1}
                max={householdCount + 1}
                placeholder={`Default: ${householdCount + 1} (end)`}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Leave empty to add the household at the end.
                Enter a position only when you want to insert
                the household between existing households.
              </p>
            </div>
          </div>

          {/* House Number + House Name */}

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="houseNumber"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                House Number
              </label>

              <input
                id="houseNumber"
                name="houseNumber"
                type="text"
                placeholder="Example: 123"
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label
                htmlFor="houseName"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                House Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="houseName"
                name="houseName"
                type="text"
                required
                placeholder="Example: Rahman Manzil"
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Address */}

          <div>
            <label
              htmlFor="address"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Address
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <textarea
              id="address"
              name="address"
              required
              rows={4}
              placeholder="Enter complete household address"
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Emergency Contact */}

          <div>
            <label
              htmlFor="emergencyContact"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Emergency Contact
            </label>

            <input
              id="emergencyContact"
              name="emergencyContact"
              type="tel"
              placeholder="Example: 9876543210"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Status */}

          <div>
            <label
              htmlFor="statusId"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Household Status
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="statusId"
              name="statusId"
              required
              defaultValue=""
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="" disabled>
                Select status
              </option>

              {statuses.map((status) => (
                <option
                  key={status.id}
                  value={status.id}
                >
                  {status.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href="/households"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-medium text-white hover:bg-green-800"
          >
            <Save className="h-4 w-4" />
            Save Household
          </button>
        </div>
      </form>
    </div>
  );
}
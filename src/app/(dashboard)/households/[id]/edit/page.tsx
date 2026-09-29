import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

interface EditHouseholdPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function updateHousehold(
  householdId: string,
  formData: FormData,
) {
  "use server";

  const householdCode = String(
    formData.get("householdCode") || "",
  ).trim();

  const houseNumber =
    String(formData.get("houseNumber") || "").trim() || null;

  const houseName = String(
    formData.get("houseName") || "",
  ).trim();

  const address = String(
    formData.get("address") || "",
  ).trim();

  const emergencyContact =
    String(formData.get("emergencyContact") || "").trim() || null;

  const statusId = String(
    formData.get("statusId") || "",
  ).trim();

  if (!householdCode || !houseName || !address || !statusId) {
    throw new Error("Please fill in all required fields.");
  }

  const household = await prisma.household.findUnique({
    where: {
      id: householdId,
    },
  });

  if (!household) {
    throw new Error("Household not found.");
  }

  const duplicate = await prisma.household.findFirst({
    where: {
      householdCode,
      NOT: {
        id: householdId,
      },
    },
  });

  if (duplicate) {
    throw new Error(
      "Another household already uses this household code.",
    );
  }

  const status = await prisma.householdStatusMaster.findUnique({
    where: {
      id: statusId,
    },
  });

  if (!status || !status.isActive) {
    throw new Error("Invalid household status.");
  }

  await prisma.household.update({
    where: {
      id: householdId,
    },
    data: {
      householdCode,
      houseNumber,
      houseName,
      address,
      emergencyContact,
      statusId,
    },
  });

  revalidatePath("/households");
  revalidatePath(`/households/${householdId}`);
  revalidatePath(`/households/${householdId}/edit`);

  redirect(`/households/${householdId}`);
}

export default async function EditHouseholdPage({
  params,
}: EditHouseholdPageProps) {
  const { id } = await params;

  const [household, statuses] = await Promise.all([
    prisma.household.findUnique({
      where: {
        id,
      },
      include: {
        status: true,
      },
    }),

    prisma.householdStatusMaster.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    }),
  ]);

  if (!household) {
    notFound();
  }

  const action = updateHousehold.bind(null, household.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/households/${household.id}`}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to household"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Household
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update information for{" "}
            <span className="font-medium text-gray-700">
              {household.houseName}
            </span>
            .
          </p>
        </div>
      </div>

      {/* Form */}
      <form
        action={action}
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <div className="border-b px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            Household Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update the household's basic information.
          </p>
        </div>

        <div className="space-y-6 p-6">
          {/* Household Code */}
          <div>
            <label
              htmlFor="householdCode"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Household Code
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="householdCode"
              name="householdCode"
              type="text"
              required
              defaultValue={household.householdCode}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* House Number + Name */}
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
                defaultValue={household.houseNumber ?? ""}
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
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                id="houseName"
                name="houseName"
                type="text"
                required
                defaultValue={household.houseName}
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
              <span className="ml-1 text-red-500">*</span>
            </label>

            <textarea
              id="address"
              name="address"
              required
              rows={4}
              defaultValue={household.address}
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
              defaultValue={household.emergencyContact ?? ""}
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
              <span className="ml-1 text-red-500">*</span>
            </label>

            <select
              id="statusId"
              name="statusId"
              required
              defaultValue={household.statusId}
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              {statuses.map((status) => (
                <option
                  key={status.id}
                  value={status.id}
                >
                  {status.name}
                </option>
              ))}
            </select>

            <p className="mt-1.5 text-xs text-gray-500">
              Current status: {household.status.name}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href={`/households/${household.id}`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-medium text-white hover:bg-green-800"
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
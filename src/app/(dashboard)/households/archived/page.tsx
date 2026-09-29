import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArchiveRestore,
  ArrowLeft,
  Eye,
  Users,
} from "lucide-react";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

async function restoreHousehold(householdId: string) {
  "use server";

  const activeStatus =
    await prisma.householdStatusMaster.findFirst({
      where: {
        name: "Active",
        isActive: true,
      },
    });

  if (!activeStatus) {
    throw new Error(
      "Active household status was not found.",
    );
  }

  const household = await prisma.household.findUnique({
    where: {
      id: householdId,
    },
  });

  if (!household) {
    throw new Error("Household not found.");
  }

  await prisma.household.update({
    where: {
      id: householdId,
    },
    data: {
      isArchived: false,
      statusId: activeStatus.id,
    },
  });

  revalidatePath("/households");
  revalidatePath("/households/archived");

  redirect("/households/archived");
}

export default async function ArchivedHouseholdsPage() {
  const households =
    await prisma.household.findMany({
      where: {
        OR: [
          {
            isArchived: true,
          },
          {
            status: {
              name: "Archived",
            },
          },
        ],
      },
      include: {
        status: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
              Archived Households
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Households that are no longer active.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
          {households.length} archived household
          {households.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Empty state */}
      {households.length === 0 ? (
        <div className="rounded-xl border bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <ArchiveRestore className="h-7 w-7 text-gray-500" />
          </div>

          <h2 className="text-lg font-semibold text-gray-900">
            No archived households
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            There are currently no archived households.
          </p>

          <Link
            href="/households"
            className="mt-5 inline-flex items-center rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800"
          >
            Back to Households
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-5 py-4 font-semibold text-gray-600">
                    Household Code
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-600">
                    House
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-600">
                    Address
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-600">
                    Members
                  </th>

                  <th className="px-5 py-4 font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {households.map((household) => (
                  <tr
                    key={household.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {household.householdCode}
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-medium text-gray-900">
                        {household.houseName}
                      </div>

                      {household.houseNumber && (
                        <div className="text-xs text-gray-500">
                          No. {household.houseNumber}
                        </div>
                      )}
                    </td>

                    <td className="max-w-xs px-5 py-4 text-gray-600">
                      <span className="line-clamp-2">
                        {household.address}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="h-4 w-4 text-gray-400" />
                        {household._count.members}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        Archived
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/households/${household.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>

                        <form
                          action={restoreHousehold.bind(
                            null,
                            household.id,
                          )}
                        >
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
                          >
                            <ArchiveRestore className="h-4 w-4" />
                            Restore
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y md:hidden">
            {households.map((household) => (
              <div
                key={household.id}
                className="space-y-4 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {household.houseName}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {household.householdCode}
                    </p>
                  </div>

                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    Archived
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <p>{household.address}</p>

                  <p className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    {household._count.members} members
                  </p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/households/${household.id}`}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Link>

                  <form
                    action={restoreHousehold.bind(
                      null,
                      household.id,
                    )}
                    className="flex-1"
                  >
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                      Restore
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
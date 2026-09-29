import Link from "next/link";
import {
  ArchiveRestore,
  Plus,
  Search,
  Users,
  Eye,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

interface HouseholdsPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function HouseholdsPage({
  searchParams,
}: HouseholdsPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() || "";

  const households = await prisma.household.findMany({
    where: {
      isArchived: false,

      status: {
        name: "Active",
      },

      ...(search
        ? {
            OR: [
              {
                householdCode: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                houseName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                houseNumber: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                address: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                emergencyContact: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },

    include: {
      status: true,

      _count: {
        select: {
          members: true,
        },
      },
    },

    orderBy: [
      {
        displayOrder: "asc",
      },
      {
        householdCode: "asc",
      },
    ],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Households
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            {households.length} household
            {households.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Archived */}
          <Link
            href="/households/archived"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <ArchiveRestore className="h-4 w-4" />
            Archived
          </Link>

          {/* Add Household */}
          <Link
            href="/households/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
          >
            <Plus className="h-4 w-4" />
            Add Household
          </Link>
        </div>
      </div>

      {/* Search */}
      <form
        method="GET"
        className="flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

          <input
            type="search"
            name="search"
            defaultValue={search}
            placeholder="Search by household code, house name, number, address..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>

        <button
          type="submit"
          className="h-11 rounded-lg bg-gray-900 px-5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          Search
        </button>

        {search && (
          <Link
            href="/households"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Household Table */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        {households.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-green-50 p-4">
              <Users className="h-7 w-7 text-green-700" />
            </div>

            <h2 className="text-lg font-semibold text-gray-900">
              No households found
            </h2>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              {search
                ? "No households match your search."
                : "Create your first household to get started."}
            </p>

            {!search && (
              <Link
                href="/households/new"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800"
              >
                <Plus className="h-4 w-4" />
                Add Household
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600">
                      No.
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-600">
                      Household Code
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-600">
                      House
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-600">
                      Address
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-600">
                      Members
                    </th>

                    <th className="px-6 py-4 font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="px-6 py-4 text-right font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {households.map((household) => (
                    <tr
                      key={household.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Register Number */}
                      <td className="px-6 py-5 font-medium text-gray-500">
                        {household.displayOrder}
                      </td>

                      {/* Code */}
                      <td className="px-6 py-5">
                        <Link
                          href={`/households/${household.id}`}
                          className="font-medium text-green-700 hover:underline"
                        >
                          {household.householdCode}
                        </Link>
                      </td>

                      {/* House */}
                      <td className="px-6 py-5">
                        <div className="font-medium text-gray-900">
                          {household.houseName}
                        </div>

                        {household.houseNumber && (
                          <div className="text-xs text-gray-500">
                            No. {household.houseNumber}
                          </div>
                        )}
                      </td>

                      {/* Address */}
                      <td className="max-w-xs px-6 py-5">
                        <p className="truncate text-gray-600">
                          {household.address}
                        </p>
                      </td>

                      {/* Members */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="h-4 w-4 text-gray-400" />

                          <span>
                            {household._count.members}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                            household.status.name === "Active"
                              ? "bg-green-100 text-green-700"
                              : household.status.name === "Inactive"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {household.status.name}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-5 text-right">
                        <Link
                          href={`/households/${household.id}`}
                          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y md:hidden">
              {households.map((household) => (
                <div
                  key={household.id}
                  className="space-y-4 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-medium text-gray-500">
                        Register No. {household.displayOrder}
                      </div>

                      <Link
                        href={`/households/${household.id}`}
                        className="font-semibold text-green-700 hover:underline"
                      >
                        {household.householdCode}
                      </Link>

                      <h2 className="mt-1 font-medium text-gray-900">
                        {household.houseName}
                      </h2>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                        household.status.name === "Active"
                          ? "bg-green-100 text-green-700"
                          : household.status.name === "Inactive"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {household.status.name}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600">
                      {household.address}
                    </p>

                    {household.houseNumber && (
                      <p className="text-gray-500">
                        House No: {household.houseNumber}
                      </p>
                    )}

                    <p className="flex items-center gap-2 text-gray-500">
                      <Users className="h-4 w-4" />

                      {household._count.members} member
                      {household._count.members !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                  <Link
                    href={`/households/${household.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-green-700 px-4 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50"
                  >
                    <Eye className="h-4 w-4" />
                    View Household
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
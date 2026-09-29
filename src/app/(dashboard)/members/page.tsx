import Link from "next/link";
import {
  Search,
  UserPlus,
  Users,
  Eye,
  Edit,
  X,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import {
  Gender,
  MaritalStatus,
} from "@prisma/client";

interface MembersPageProps {
  searchParams: Promise<{
    q?: string;
    bloodGroupId?: string;
    gender?: string;
    relationshipId?: string;
    occupationId?: string;
  }>;
}

export default async function MembersPage({
  searchParams,
}: MembersPageProps) {
  const params = await searchParams;

  const q = params.q?.trim() || "";
  const bloodGroupId = params.bloodGroupId || "";
  const gender = params.gender || "";
  const relationshipId =
    params.relationshipId || "";
  const occupationId =
    params.occupationId || "";

  const [
    members,
    bloodGroups,
    relationships,
    occupations,
  ] = await Promise.all([
    prisma.householdMember.findMany({
      where: {
        household: {
          isArchived: false,
        },

        ...(q
          ? {
              OR: [
                {
                  fullName: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  mobile: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  household: {
                    householdCode: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  household: {
                    houseName: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  bloodGroupRel: {
                    name: {
                      contains: q,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : {}),

        ...(bloodGroupId
          ? {
              bloodGroupId,
            }
          : {}),

        ...(gender
          ? {
              gender: gender as Gender,
            }
          : {}),

        ...(relationshipId
          ? {
              relationshipId,
            }
          : {}),

        ...(occupationId
          ? {
              occupationId,
            }
          : {}),
      },

      include: {
        household: {
          select: {
            id: true,
            householdCode: true,
            houseName: true,
          },
        },

        relationship: {
          select: {
            name: true,
          },
        },

        occupation: {
          select: {
            name: true,
          },
        },

        bloodGroupRel: {
          select: {
            name: true,
          },
        },
      },

      orderBy: [
        {
          household: {
            householdCode: "asc",
          },
        },
        {
          isHouseholdHead: "desc",
        },
        {
          updatedAt: "desc",
        },
        {
          fullName: "asc",
        },
      ],
    }),

    prisma.bloodGroupMaster.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    }),

    prisma.relationshipMaster.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    }),

    prisma.occupationMaster.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    }),
  ]);

  const hasFilters =
    Boolean(q) ||
    Boolean(bloodGroupId) ||
    Boolean(gender) ||
    Boolean(relationshipId) ||
    Boolean(occupationId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Members
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Search and manage all registered household members.
          </p>
        </div>

        <Link
          href="/households"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800"
        >
          <UserPlus className="h-4 w-4" />
          Add Member
        </Link>
      </div>

      {/* Search + Filters */}
      <form
        method="GET"
        className="rounded-xl border bg-white p-5 shadow-sm"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, mobile, household code, house name, blood group..."
              className="h-11 w-full rounded-lg border border-gray-300 pl-10 pr-4 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          <button
            type="submit"
            className="h-11 rounded-lg bg-green-700 px-6 text-sm font-medium text-white hover:bg-green-800"
          >
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            name="bloodGroupId"
            defaultValue={bloodGroupId}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              All Blood Groups
            </option>

            {bloodGroups.map((group) => (
              <option
                key={group.id}
                value={group.id}
              >
                {group.name}
              </option>
            ))}
          </select>

          <select
            name="gender"
            defaultValue={gender}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              All Genders
            </option>

            <option value={Gender.MALE}>
              Male
            </option>

            <option value={Gender.FEMALE}>
              Female
            </option>
          </select>

          <select
            name="relationshipId"
            defaultValue={relationshipId}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              All Relationships
            </option>

            {relationships.map((relationship) => (
              <option
                key={relationship.id}
                value={relationship.id}
              >
                {relationship.name}
              </option>
            ))}
          </select>

          <select
            name="occupationId"
            defaultValue={occupationId}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="">
              All Occupations
            </option>

            {occupations.map((occupation) => (
              <option
                key={occupation.id}
                value={occupation.id}
              >
                {occupation.name}
              </option>
            ))}
          </select>
        </div>

        {/* Active filters */}
        {hasFilters && (
          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {members.length}
              </span>{" "}
              matching member
              {members.length !== 1 ? "s" : ""}
            </p>

            <Link
              href="/members"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              Clear filters
            </Link>
          </div>
        )}
      </form>

      {/* Results */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-6 py-5">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Users className="h-5 w-5 text-green-700" />
              Member Directory
            </h2>

            {!hasFilters && (
              <p className="mt-1 text-sm text-gray-500">
                {members.length} member
                {members.length !== 1 ? "s" : ""} registered
              </p>
            )}
          </div>
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4">
              <Users className="h-7 w-7 text-gray-400" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              No members found
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Try changing your search text or filters.
            </p>

            {hasFilters && (
              <Link
                href="/members"
                className="mt-5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear Search
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Member
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Household
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Relationship
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Blood Group
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Occupation
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Mobile
                    </th>

                    <th className="px-5 py-3 text-right font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {members.map((member) => (
                    <tr
                      key={member.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900">
                          {member.fullName}
                        </div>

                        {member.isHouseholdHead && (
                          <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Household Head
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/households/${member.household.id}`}
                          className="font-medium text-green-700 hover:underline"
                        >
                          {member.household.householdCode}
                        </Link>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {member.household.houseName}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {member.relationship.name}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {member.bloodGroupRel?.name ||
                          member.bloodGroup ||
                          "—"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {member.occupation?.name || "—"}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {member.mobile || "—"}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/households/${member.household.id}`}
                            title="View household"
                            className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>

                          <Link
                            href={`/households/${member.household.id}/members/${member.id}/edit`}
                            title="Edit member"
                            className="rounded-md p-2 text-green-700 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y md:hidden">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="space-y-4 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {member.fullName}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {member.relationship.name}
                      </p>

                      {member.isHouseholdHead && (
                        <span className="mt-2 inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                          Household Head
                        </span>
                      )}
                    </div>

                    <span className="rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600">
                      {member.household.householdCode}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem
                      label="Blood Group"
                      value={
                        member.bloodGroupRel?.name ||
                        member.bloodGroup ||
                        "—"
                      }
                    />

                    <InfoItem
                      label="Occupation"
                      value={
                        member.occupation?.name || "—"
                      }
                    />

                    <InfoItem
                      label="Mobile"
                      value={member.mobile || "—"}
                    />

                    <InfoItem
                      label="House"
                      value={member.household.houseName}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/households/${member.household.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="h-4 w-4" />
                      Household
                    </Link>

                    <Link
                      href={`/households/${member.household.id}/members/${member.id}/edit`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 font-medium text-gray-900">
        {value}
      </p>
    </div>
  );
}
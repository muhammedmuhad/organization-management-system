import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  MapPin,
  Phone,
  Plus,
  User,
  Users,
} from "lucide-react";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import RemoveMemberButton from "@/components/households/RemoveMemberButton";

interface HouseholdDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

/* =========================================================
   DEACTIVATE MEMBER
   ========================================================= */

async function deactivateMember(
  householdId: string,
  memberId: string,
) {
  "use server";

  const member = await prisma.householdMember.findFirst({
    where: {
      id: memberId,
      householdId,
    },
  });

  if (!member) {
    throw new Error("Member not found.");
  }

  await prisma.householdMember.update({
    where: {
      id: memberId,
    },
    data: {
      isActive: false,
      isHouseholdHead: false,
    },
  });

  revalidatePath(`/households/${householdId}`);
}

/* =========================================================
   REACTIVATE MEMBER
   ========================================================= */

async function reactivateMember(
  householdId: string,
  memberId: string,
) {
  "use server";

  const member = await prisma.householdMember.findFirst({
    where: {
      id: memberId,
      householdId,
    },
  });

  if (!member) {
    throw new Error("Member not found.");
  }

  await prisma.householdMember.update({
    where: {
      id: memberId,
    },
    data: {
      isActive: true,
    },
  });

  revalidatePath(`/households/${householdId}`);
}

/* =========================================================
   PAGE
   ========================================================= */

export default async function HouseholdDetailsPage({
  params,
}: HouseholdDetailsPageProps) {
  const { id } = await params;

  const household = await prisma.household.findUnique({
    where: {
      id,
    },

    include: {
      status: true,

      members: {
        include: {
          relationship: true,
          occupation: true,
          bloodGroupRel: true,
        },

        orderBy: [
          {
            isActive: "desc",
          },
          {
            isHouseholdHead: "desc",
          },
          {
            fullName: "asc",
          },
        ],
      },
    },
  });

  if (!household) {
    notFound();
  }

  const activeMembers = household.members.filter(
    (member) => member.isActive,
  );

  const inactiveMembers = household.members.filter(
    (member) => !member.isActive,
  );

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

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
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {household.houseName}
              </h1>

              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
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

            <p className="mt-1 text-sm text-gray-500">
              Household Code:{" "}
              <span className="font-medium text-gray-700">
                {household.householdCode}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/households/${household.id}/edit`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            <Edit className="h-4 w-4" />
            Edit Household
          </Link>

          <Link
            href={`/households/${household.id}/members/new`}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-800"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </Link>
        </div>
      </div>

      {/* =====================================================
          HOUSEHOLD INFORMATION
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-5">
          <h2 className="font-semibold text-gray-900">
            Household Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Basic information about this household.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Household Code"
            value={household.householdCode}
          />

          <InfoItem
            label="House Number"
            value={household.houseNumber || "—"}
          />

          <InfoItem
            label="House Name"
            value={household.houseName}
          />

          <div className="sm:col-span-2 lg:col-span-3">
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              <MapPin className="h-4 w-4" />
              Address
            </p>

            <p className="text-sm leading-6 text-gray-700">
              {household.address}
            </p>
          </div>

          <div>
            <p className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-400">
              <Phone className="h-4 w-4" />
              Emergency Contact
            </p>

            <p className="font-medium text-gray-900">
              {household.emergencyContact || "—"}
            </p>
          </div>

          <InfoItem
            label="Active Members"
            value={String(activeMembers.length)}
          />

          <InfoItem
            label="Status"
            value={household.status.name}
          />
        </div>
      </section>

      {/* =====================================================
          MEMBERS
      ===================================================== */}

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-semibold text-gray-900">
              <Users className="h-5 w-5 text-green-700" />
              Household Members
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {activeMembers.length} active member
              {activeMembers.length !== 1 ? "s" : ""}

              {inactiveMembers.length > 0 && (
                <>
                  {" "}
                  · {inactiveMembers.length} inactive
                </>
              )}
            </p>
          </div>

          <Link
            href={`/households/${household.id}/members/new`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50"
          >
            <Plus className="h-4 w-4" />
            Add Member
          </Link>
        </div>

        {household.members.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 rounded-full bg-green-50 p-4">
              <User className="h-7 w-7 text-green-700" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900">
              No members registered
            </h3>

            <p className="mt-1 max-w-md text-sm text-gray-500">
              Add the first member of this household to start
              building the family record.
            </p>

            <Link
              href={`/households/${household.id}/members/new`}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-800"
            >
              <Plus className="h-4 w-4" />
              Add First Member
            </Link>
          </div>
        ) : (
          <>
            {/* =================================================
                DESKTOP
            ================================================= */}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Member
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Relationship
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Gender
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Date of Birth
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Occupation
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Blood Group
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Mobile
                    </th>

                    <th className="px-5 py-3 font-semibold text-gray-600">
                      Status
                    </th>

                    <th className="px-5 py-3 text-right font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {household.members.map((member) => (
                    <tr
                      key={member.id}
                      className={`transition hover:bg-gray-50 ${
                        !member.isActive
                          ? "bg-gray-50/70"
                          : ""
                      }`}
                    >
                      {/* Member */}
                      <td className="px-5 py-4">
                        <div
                          className={`font-medium ${
                            member.isActive
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {member.fullName}
                        </div>

                        {member.isHouseholdHead && (
                          <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            Household Head
                          </span>
                        )}
                      </td>

                      {/* Relationship */}
                      <td className="px-5 py-4 text-gray-600">
                        {member.relationship.name}
                      </td>

                      {/* Gender */}
                      <td className="px-5 py-4 text-gray-600">
                        {member.gender}
                      </td>

                      {/* Date of Birth */}
                      <td className="px-5 py-4 text-gray-600">
                        {formatDate(member.dateOfBirth)}
                      </td>

                      {/* Occupation */}
                      <td className="px-5 py-4 text-gray-600">
                        {member.occupation?.name || "—"}
                      </td>

                      {/* Blood Group */}
                      <td className="px-5 py-4 text-gray-600">
                        {member.bloodGroupRel?.name ||
                          member.bloodGroup ||
                          "—"}
                      </td>

                      {/* Mobile */}
                      <td className="px-5 py-4 text-gray-600">
                        {member.mobile || "—"}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            member.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {member.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/households/${household.id}/members/${member.id}/edit`}
                            className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Link>

                          {member.isActive ? (
                            <form
                              action={deactivateMember.bind(
                                null,
                                household.id,
                                member.id,
                              )}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                              >
                                Deactivate
                              </button>
                            </form>
                          ) : (
                            <form
                              action={reactivateMember.bind(
                                null,
                                household.id,
                                member.id,
                              )}
                            >
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                              >
                                Reactivate
                              </button>
                            </form>
                          )}

                          {/* Existing permanent delete */}
                          <RemoveMemberButton
                            memberId={member.id}
                            memberName={member.fullName}
                            householdId={household.id}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* =================================================
                MOBILE
            ================================================= */}

            <div className="divide-y md:hidden">
              {household.members.map((member) => (
                <div
                  key={member.id}
                  className={`space-y-4 p-5 ${
                    !member.isActive
                      ? "bg-gray-50/70"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p
                        className={`font-semibold ${
                          member.isActive
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {member.fullName}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {member.relationship.name}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {member.isHouseholdHead && (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            Head
                          </span>
                        )}

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            member.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {member.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoItem
                      label="Gender"
                      value={member.gender}
                    />

                    <InfoItem
                      label="Date of Birth"
                      value={formatDate(
                        member.dateOfBirth,
                      )}
                    />

                    <InfoItem
                      label="Occupation"
                      value={
                        member.occupation?.name || "—"
                      }
                    />

                    <InfoItem
                      label="Blood Group"
                      value={
                        member.bloodGroupRel?.name ||
                        member.bloodGroup ||
                        "—"
                      }
                    />

                    <InfoItem
                      label="Mobile"
                      value={member.mobile || "—"}
                    />

                    <InfoItem
                      label="Marital Status"
                      value={member.maritalStatus}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/households/${household.id}/members/${member.id}/edit`}
                      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Member
                    </Link>

                    {member.isActive ? (
                      <form
                        action={deactivateMember.bind(
                          null,
                          household.id,
                          member.id,
                        )}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
                        >
                          Deactivate
                        </button>
                      </form>
                    ) : (
                      <form
                        action={reactivateMember.bind(
                          null,
                          household.id,
                          member.id,
                        )}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-50"
                        >
                          Reactivate
                        </button>
                      </form>
                    )}

                    {/* Existing permanent delete */}
                    <RemoveMemberButton
                      memberId={member.id}
                      memberName={member.fullName}
                      householdId={household.id}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   INFO ITEM
   ========================================================= */

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

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
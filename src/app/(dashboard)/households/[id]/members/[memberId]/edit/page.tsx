import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  BloodGroup,
  Gender,
  MaritalStatus,
} from "@prisma/client";

interface EditMemberPageProps {
  params: Promise<{
    id: string;
    memberId: string;
  }>;
}

async function updateMember(
  householdId: string,
  memberId: string,
  formData: FormData,
) {
  "use server";

  const fullName = String(
    formData.get("fullName") || "",
  ).trim();

  const relationshipId = String(
    formData.get("relationshipId") || "",
  ).trim();

  const occupationId =
    String(formData.get("occupationId") || "").trim() || null;

  const bloodGroupId =
    String(formData.get("bloodGroupId") || "").trim() || null;

  const gender = String(
    formData.get("gender") || "",
  ) as Gender;

  const maritalStatus = String(
    formData.get("maritalStatus") || "",
  ) as MaritalStatus;

  const dateOfBirthValue = String(
    formData.get("dateOfBirth") || "",
  ).trim();

  const mobile =
    String(formData.get("mobile") || "").trim() || null;

  const isHouseholdHead =
    formData.get("isHouseholdHead") === "on";

  if (
    !fullName ||
    !relationshipId ||
    !gender ||
    !maritalStatus
  ) {
    throw new Error("Please fill in all required fields.");
  }

  const member = await prisma.householdMember.findFirst({
    where: {
      id: memberId,
      householdId,
    },
  });

  if (!member) {
    throw new Error("Household member not found.");
  }

  const relationship =
    await prisma.relationshipMaster.findUnique({
      where: {
        id: relationshipId,
      },
    });

  if (!relationship) {
    throw new Error("Invalid relationship selected.");
  }

  let bloodGroup: BloodGroup | null = null;

  if (bloodGroupId) {
    const bloodGroupMaster =
      await prisma.bloodGroupMaster.findUnique({
        where: {
          id: bloodGroupId,
        },
      });

    if (!bloodGroupMaster) {
      throw new Error("Invalid blood group selected.");
    }

    const bloodGroupMap: Record<string, BloodGroup> = {
      "A+": BloodGroup.A_POSITIVE,
      "A-": BloodGroup.A_NEGATIVE,
      "B+": BloodGroup.B_POSITIVE,
      "B-": BloodGroup.B_NEGATIVE,
      "AB+": BloodGroup.AB_POSITIVE,
      "AB-": BloodGroup.AB_NEGATIVE,
      "O+": BloodGroup.O_POSITIVE,
      "O-": BloodGroup.O_NEGATIVE,
    };

    bloodGroup = bloodGroupMap[bloodGroupMaster.name] ?? null;

    if (!bloodGroup) {
      throw new Error("Invalid blood group configuration.");
    }
  }

  const dateOfBirth = dateOfBirthValue
    ? new Date(`${dateOfBirthValue}T00:00:00`)
    : null;

  await prisma.$transaction(async (tx) => {
    // If this member becomes household head,
    // remove the head flag from the previous head.
    if (isHouseholdHead) {
      await tx.householdMember.updateMany({
        where: {
          householdId,
          isHouseholdHead: true,
          NOT: {
            id: memberId,
          },
        },
        data: {
          isHouseholdHead: false,
        },
      });
    }

    await tx.householdMember.update({
      where: {
        id: memberId,
      },
      data: {
        fullName,
        gender,
        maritalStatus,
        dateOfBirth,
        mobile,
        isHouseholdHead,
        bloodGroup,
        household: {
          connect: {
            id: householdId,
          },
        },
        relationship: {
          connect: {
            id: relationshipId,
          },
        },
        ...(occupationId
          ? {
              occupation: {
                connect: {
                  id: occupationId,
                },
              },
            }
          : {
              occupation: {
                disconnect: true,
              },
            }),
        ...(bloodGroupId
          ? {
              bloodGroupRel: {
                connect: {
                  id: bloodGroupId,
                },
              },
            }
          : {
              bloodGroupRel: {
                disconnect: true,
              },
            }),
      },
    });
  });

  revalidatePath(`/households/${householdId}`);
  revalidatePath(
    `/households/${householdId}/members/${memberId}/edit`,
  );

  redirect(`/households/${householdId}`);
}

export default async function EditMemberPage({
  params,
}: EditMemberPageProps) {
  const { id, memberId } = await params;

  const [
    member,
    relationships,
    occupations,
    bloodGroups,
  ] = await Promise.all([
    prisma.householdMember.findFirst({
      where: {
        id: memberId,
        householdId: id,
      },
      include: {
        relationship: true,
        occupation: true,
        bloodGroupRel: true,
        household: true,
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

    prisma.bloodGroupMaster.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        displayOrder: "asc",
      },
    }),
  ]);

  if (!member) {
    notFound();
  }

  const action = updateMember.bind(null, id, memberId);

  const currentBloodGroup =
    member.bloodGroupRel?.name ||
    member.bloodGroup ||
    "";

  const dateOfBirth = member.dateOfBirth
    ? new Date(member.dateOfBirth)
        .toISOString()
        .split("T")[0]
    : "";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/households/${id}`}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to household"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Household Member
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update information for{" "}
            <span className="font-medium text-gray-700">
              {member.fullName}
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
            Member Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update the member's personal and household information.
          </p>
        </div>

        <div className="space-y-6 p-6">
          {/* Full Name */}
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Full Name
              <span className="ml-1 text-red-500">*</span>
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              defaultValue={member.fullName}
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Relationship + Occupation */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="relationshipId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Relationship
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="relationshipId"
                name="relationshipId"
                required
                defaultValue={member.relationshipId}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                {relationships.map((relationship) => (
                  <option
                    key={relationship.id}
                    value={relationship.id}
                  >
                    {relationship.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="occupationId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Occupation
              </label>

              <select
                id="occupationId"
                name="occupationId"
                defaultValue={member.occupationId ?? ""}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  Select occupation
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
          </div>

          {/* Gender + Marital Status */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="gender"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Gender
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="gender"
                name="gender"
                required
                defaultValue={member.gender}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value={Gender.MALE}>
                  Male
                </option>

                <option value={Gender.FEMALE}>
                  Female
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="maritalStatus"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Marital Status
                <span className="ml-1 text-red-500">*</span>
              </label>

              <select
                id="maritalStatus"
                name="maritalStatus"
                required
                defaultValue={member.maritalStatus}
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value={MaritalStatus.SINGLE}>
                  Single
                </option>

                <option value={MaritalStatus.MARRIED}>
                  Married
                </option>

                <option value={MaritalStatus.DIVORCED}>
                  Divorced
                </option>

                <option value={MaritalStatus.WIDOWED}>
                  Widowed
                </option>
              </select>
            </div>
          </div>

          {/* Blood Group + DOB */}
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="bloodGroupId"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Blood Group
              </label>

              <select
                id="bloodGroupId"
                name="bloodGroupId"
                defaultValue={
                  bloodGroups.find(
                    (group) => group.name === currentBloodGroup,
                  )?.id ?? ""
                }
                className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              >
                <option value="">
                  Select blood group
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
            </div>

            <div>
              <label
                htmlFor="dateOfBirth"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Date of Birth
              </label>

              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                defaultValue={dateOfBirth}
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          {/* Mobile */}
          <div>
            <label
              htmlFor="mobile"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Mobile Number
            </label>

            <input
              id="mobile"
              name="mobile"
              type="tel"
              defaultValue={member.mobile ?? ""}
              placeholder="Example: 9876543210"
              className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </div>

          {/* Household Head */}
          <div className="rounded-lg border border-green-100 bg-green-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="isHouseholdHead"
                defaultChecked={member.isHouseholdHead}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
              />

              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Household Head
                </span>

                <span className="mt-1 block text-xs text-gray-600">
                  Only one member can be the household head.
                  Selecting this will remove the head status
                  from the previous household head.
                </span>
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href={`/households/${id}`}
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
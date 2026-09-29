import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import CollectionForm from "./CollectionForm";

export default async function NewMembershipCollectionPage() {
  const households =
    await prisma.household.findMany({
      where: {
        isArchived: false,
      },
      select: {
        id: true,
        householdCode: true,
        displayOrder: true,
        houseNumber: true,
        houseName: true,
      },
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          householdCode: "asc",
        },
        {
          houseName: "asc",
        },
      ],
    });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* HEADER */}

      <div className="flex items-center gap-3">
        <Link
          href="/finance"
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to finance"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            New Collection
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Record a collection and generate a receipt.
          </p>
        </div>
      </div>

      <CollectionForm
        households={households}
      />
    </div>
  );
} 
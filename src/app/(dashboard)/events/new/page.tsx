import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/prisma";
import EventForm from "./EventForm";

export default async function NewEventPage() {
  const categories =
    await prisma.eventCategoryMaster.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: [
        {
          displayOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/events"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 transition hover:bg-gray-50"
          aria-label="Back to events"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create Event
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new Mahallu event.
          </p>
        </div>
      </div>

      <EventForm categories={categories} />
    </div>
  );
}
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

import ExpenseForm from "./ExpenseForm";

interface NewEventExpensePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NewEventExpensePage({
  params,
}: NewEventExpensePageProps) {
  const { id } = await params;

  const event =
    await prisma.event.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

  if (!event) {
    notFound();
  }

  if (event.status === "CANCELLED") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-semibold text-red-900">
            Expense unavailable
          </h1>

          <p className="mt-1 text-sm text-red-700">
            Expenses cannot be added to a cancelled
            event.
          </p>
        </div>
      </div>
    );
  }

  if (event.status === "COMPLETED") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Link>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="font-semibold text-amber-900">
            Event already completed
          </h1>

          <p className="mt-1 text-sm text-amber-700">
            New expenses cannot be added after an
            event has been completed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/events/${event.id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Link>

        <h1 className="mt-4 text-3xl font-bold text-gray-900">
          Add Expense
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Record an expense for{" "}
          <span className="font-medium text-gray-700">
            {event.title}
          </span>
          .
        </p>
      </div>

      <ExpenseForm
        eventId={event.id}
        eventTitle={event.title}
      />
    </div>
  );
}
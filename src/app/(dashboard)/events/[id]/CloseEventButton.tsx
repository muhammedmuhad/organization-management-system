"use client";

import { useState, useTransition } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { closeEvent } from "./actions";

interface CloseEventButtonProps {
  eventId: string;
}

export default function CloseEventButton({
  eventId,
}: CloseEventButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [error, setError] = useState("");

  function handleClose() {
    const confirmed = window.confirm(
      "Are you sure you want to close this event?\n\nOnce closed, no new collections or expenses should be added to this event.",
    );

    if (!confirmed) {
      return;
    }

    setError("");

    startTransition(async () => {
      try {
        await closeEvent(eventId);

        router.refresh();
      } catch (error) {
        console.error(error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to close event.",
        );
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClose}
        disabled={isPending}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Lock className="h-4 w-4" />
        )}

        {isPending
          ? "Closing..."
          : "Close Event"}
      </button>

      {error && (
        <p className="max-w-xs text-right text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
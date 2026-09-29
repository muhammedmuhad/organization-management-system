"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

interface RemoveMemberButtonProps {
  memberId: string;
  memberName: string;
  householdId: string;
}

export default function RemoveMemberButton({
  memberId,
  memberName,
  householdId,
}: RemoveMemberButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${memberName}"?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/households/${householdId}/members/${memberId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to delete member.",
        );
      }

      window.location.href = `/households/${householdId}`;
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to delete member.",
      );

      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleRemove}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />

      {loading ? "Deleting..." : "Remove"}
    </button>
  );
}
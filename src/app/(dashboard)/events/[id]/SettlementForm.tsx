"use client";

import { useState, useTransition } from "react";
import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

import {
  createEventSettlement,
} from "./actions";

interface SettlementFormProps {
  eventId: string;
  direction:
    | "TO_GENERAL_FUND"
    | "FROM_GENERAL_FUND";
  remainingAmount: number;
}

export default function SettlementForm({
  eventId,
  direction,
  remainingAmount,
}: SettlementFormProps) {
  const [isPending, startTransition] =
    useTransition();

  const [error, setError] =
    useState("");

  const isSurplus =
    direction === "TO_GENERAL_FUND";

  function handleSubmit(
    formData: FormData,
  ) {
    setError("");

    startTransition(async () => {
      try {
        await createEventSettlement(
          eventId,
          formData,
        );

        window.location.reload();
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to record settlement.",
        );
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-5"
    >
      <input
        type="hidden"
        name="direction"
        value={direction}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Amount
        </label>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
            ₹
          </span>

          <input
            type="number"
            name="amount"
            min="0.01"
            max={remainingAmount}
            step="0.01"
            required
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-3 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
          />
        </div>

        <p className="mt-1.5 text-xs text-gray-500">
          Remaining amount: ₹
          {remainingAmount.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Transfer Date
        </label>

        <input
          type="date"
          name="transferDate"
          defaultValue={
            new Date()
              .toISOString()
              .split("T")[0]
          }
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Reference Number
          <span className="ml-1 text-gray-400">
            (optional)
          </span>
        </label>

        <input
          type="text"
          name="referenceNo"
          placeholder="Receipt / voucher reference"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Remarks
          <span className="ml-1 text-gray-400">
            (optional)
          </span>
        </label>

        <textarea
          name="remarks"
          rows={3}
          placeholder="Additional remarks"
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-300"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isSurplus
            ? "bg-green-700 hover:bg-green-800"
            : "bg-red-600 hover:bg-red-700"
        }`}
      >
        {isSurplus ? (
          <ArrowUpFromLine className="h-4 w-4" />
        ) : (
          <ArrowDownToLine className="h-4 w-4" />
        )}

        {isPending
          ? "Saving..."
          : isSurplus
            ? "Transfer to General Fund"
            : "Receive from General Fund"}
      </button>
    </form>
  );
}
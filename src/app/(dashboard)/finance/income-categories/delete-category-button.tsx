"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  AlertTriangle,
  Lock,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteExpenseCategory,
  deleteIncomeCategory,
} from "./actions";

type CategoryType = "income" | "expense";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  type: CategoryType;
  usageCount: number;
}

export default function DeleteCategoryButton({
  categoryId,
  categoryName,
  type,
  usageCount,
}: DeleteCategoryButtonProps) {
  const [open, setOpen] =
    useState(false);

  const [message, setMessage] =
    useState<string | null>(null);

  const [isPending, startTransition] =
    useTransition();

  const isUsed = usageCount > 0;

  function handleDelete() {
    setMessage(null);

    startTransition(async () => {
      const result =
        type === "income"
          ? await deleteIncomeCategory(
              categoryId,
            )
          : await deleteExpenseCategory(
              categoryId,
            );

      if (!result.success) {
        setMessage(result.message);
        return;
      }

      setOpen(false);

      /*
       * Refresh the server-rendered category list.
       */
      window.location.reload();
    });
  }

  /* =======================================================
     CATEGORY IN USE
     ======================================================= */

  if (isUsed) {
    return (
      <div className="group relative">
        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-400"
        >
          <Lock className="h-4 w-4" />
          In Use
        </button>

        <div className="pointer-events-none absolute bottom-full right-0 z-30 mb-2 hidden w-72 rounded-lg border bg-white p-3 text-left shadow-lg group-hover:block">
          <p className="text-sm font-semibold text-gray-900">
            Category cannot be deleted
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">
            This category is currently used by{" "}
            <span className="font-semibold text-gray-700">
              {usageCount}
            </span>{" "}
            {type === "income"
              ? "income"
              : "expense"}{" "}
            transaction
            {usageCount === 1
              ? ""
              : "s"}
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ===================================================
          DELETE BUTTON
          =================================================== */}

      <button
        type="button"
        onClick={() => {
          setMessage(null);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </button>

      {/* ===================================================
          MODAL
          =================================================== */}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
          >
            {/* Header */}

            <div className="flex items-start justify-between border-b px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-red-50 p-2.5">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>

                <div>
                  <h2
                    id="delete-category-title"
                    className="text-lg font-semibold text-gray-900"
                  >
                    Delete{" "}
                    {type === "income"
                      ? "Income"
                      : "Expense"}{" "}
                    Category
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Category
                </p>

                <p className="mt-1 text-base font-semibold text-gray-900">
                  {categoryName}
                </p>
              </div>

              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">
                  Permanently delete this category?
                </p>

                <p className="mt-1 text-sm leading-5 text-red-700">
                  This category has no existing{" "}
                  {type === "income"
                    ? "income"
                    : "expense"}{" "}
                  transactions, so it can be safely
                  removed.
                </p>
              </div>

              {message && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-800">
                    {message}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}

            <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />

                {isPending
                  ? "Deleting..."
                  : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
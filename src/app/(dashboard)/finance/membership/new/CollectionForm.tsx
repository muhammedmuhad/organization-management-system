"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Save, Trash2 } from "lucide-react";

import {
  createMembershipCollection,
  type MembershipCollectionState,
} from "../actions";

interface Household {
  id: string;
  householdCode: string;
  houseNumber: string | null;
  houseName: string;
}

interface CollectionFormProps {
  households: Household[];
}

interface MembershipItem {
  id: string;
  year: number;
  months: number[];
  amountPerMonth: string;
}

type Purpose =
  | "MONTHLY_MEMBERSHIP"
  | "NIKAH_HOUSE_WARMING"
  | "RENT"
  | "CUSTOM";

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const initialState: MembershipCollectionState = {
  success: false,
  message: "",
};

export default function CollectionForm({
  households,
}: CollectionFormProps) {
  const currentYear = new Date().getFullYear();

  /*
   * Important:
   * The first item has a deterministic ID.
   * Do NOT use Date.now() or Math.random()
   * during the initial render.
   */
  const nextItemId = useRef(2);

  const [state, formAction, isPending] =
    useActionState(
      createMembershipCollection,
      initialState,
    );

  const [purpose, setPurpose] =
    useState<Purpose>("MONTHLY_MEMBERSHIP");

  const [householdId, setHouseholdId] =
    useState("");

  const [receiptDate, setReceiptDate] =
    useState(getToday());

  const [remarks, setRemarks] =
    useState("");

  const [customName, setCustomName] =
    useState("");

  const [customPurpose, setCustomPurpose] =
    useState("");

  /*
   * Amount for one-time collections:
   * Nikah / House Warming
   * Custom
   */
  const [oneTimeAmount, setOneTimeAmount] =
    useState("");

  /*
   * Monthly Membership / Rent items.
   *
   * Initial ID is deterministic to avoid
   * hydration mismatch.
   */
  const [items, setItems] =
    useState<MembershipItem[]>([
      {
        id: "item-1",
        year: currentYear,
        months: [],
        amountPerMonth: "",
      },
    ]);

  /*
   * -------------------------------------------------------
   * CONDITIONS
   * -------------------------------------------------------
   */

  const needsHousehold =
    purpose === "MONTHLY_MEMBERSHIP" ||
    purpose === "NIKAH_HOUSE_WARMING";

  const needsMonthlyItems =
    purpose === "MONTHLY_MEMBERSHIP" ||
    purpose === "RENT";

  const needsCustomDetails =
    purpose === "CUSTOM";

  /*
   * -------------------------------------------------------
   * TOTAL
   * -------------------------------------------------------
   */

  const monthlyTotal = items.reduce(
    (sum, item) => {
      const amount = Number(
        item.amountPerMonth,
      );

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return sum;
      }

      return (
        sum +
        amount * item.months.length
      );
    },
    0,
  );

  const total =
    needsMonthlyItems
      ? monthlyTotal
      : Number(oneTimeAmount) || 0;

  /*
   * -------------------------------------------------------
   * PURPOSE CHANGE
   * -------------------------------------------------------
   */

  function handlePurposeChange(
    value: Purpose,
  ) {
    setPurpose(value);

    /*
     * Household is required only for
     * Monthly Membership and Nikah /
     * House Warming.
     */
    if (
      value !== "MONTHLY_MEMBERSHIP" &&
      value !== "NIKAH_HOUSE_WARMING"
    ) {
      setHouseholdId("");
    }

    /*
     * Reset one-time amount when changing
     * collection type.
     */
    setOneTimeAmount("");

    /*
     * Keep the monthly item structure available
     * for Membership and Rent.
     */
    if (
      value === "MONTHLY_MEMBERSHIP" ||
      value === "RENT"
    ) {
      setItems([
        {
          id: "item-1",
          year: currentYear,
          months: [],
          amountPerMonth: "",
        },
      ]);

      nextItemId.current = 2;
    }
  }

  /*
   * -------------------------------------------------------
   * ITEM FUNCTIONS
   * -------------------------------------------------------
   */

  function addItem() {
    const id =
      `item-${nextItemId.current}`;

    nextItemId.current += 1;

    setItems((current) => [
      ...current,
      {
        id,
        year: currentYear,
        months: [],
        amountPerMonth: "",
      },
    ]);
  }

  function removeItem(id: string) {
    if (items.length === 1) {
      return;
    }

    setItems((current) =>
      current.filter(
        (item) => item.id !== id,
      ),
    );
  }

  function updateYear(
    id: string,
    value: string,
  ) {
    const year = Number(value);

    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              year,
            }
          : item,
      ),
    );
  }

  function updateAmount(
    id: string,
    value: string,
  ) {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              amountPerMonth: value,
            }
          : item,
      ),
    );
  }

  function toggleMonth(
    id: string,
    month: number,
  ) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const exists =
          item.months.includes(month);

        return {
          ...item,
          months: exists
            ? item.months.filter(
                (value) =>
                  value !== month,
              )
            : [
                ...item.months,
                month,
              ].sort(
                (a, b) => a - b,
              ),
        };
      }),
    );
  }

  /*
   * -------------------------------------------------------
   * VALIDATION
   * -------------------------------------------------------
   */

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    if (!receiptDate) {
      event.preventDefault();
      alert("Receipt date is required.");
      return;
    }

    if (needsHousehold && !householdId) {
      event.preventDefault();
      alert("Please select a household.");
      return;
    }

    /*
     * Custom validation
     */
    if (
      needsCustomDetails &&
      !customName.trim()
    ) {
      event.preventDefault();
      alert("Name is required.");
      return;
    }

    if (
      needsCustomDetails &&
      !customPurpose.trim()
    ) {
      event.preventDefault();
      alert("Purpose is required.");
      return;
    }

    /*
     * One-time collections
     */
    if (
      purpose === "NIKAH_HOUSE_WARMING" ||
      purpose === "CUSTOM"
    ) {
      const amount =
        Number(oneTimeAmount);

      if (
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        event.preventDefault();
        alert(
          "Collection amount must be greater than zero.",
        );
        return;
      }
    }

    /*
     * Monthly Membership / Rent
     */
    if (needsMonthlyItems) {
      if (items.length === 0) {
        event.preventDefault();
        alert(
          "Add at least one payment item.",
        );
        return;
      }

      for (const item of items) {
        if (
          !Number.isInteger(item.year) ||
          item.year < 2000 ||
          item.year > 2100
        ) {
          event.preventDefault();
          alert(
            "Please enter a valid year.",
          );
          return;
        }

        if (item.months.length === 0) {
          event.preventDefault();
          alert(
            `Please select at least one month for ${item.year}.`,
          );
          return;
        }

        const amount =
          Number(item.amountPerMonth);

        if (
          !Number.isFinite(amount) ||
          amount <= 0
        ) {
          event.preventDefault();
          alert(
            `Amount per month for ${item.year} must be greater than zero.`,
          );
          return;
        }
      }
    }
  }

  /*
   * -------------------------------------------------------
   * SERIALIZED MONTHLY ITEMS
   *
   * Example:
   *
   * Item 1:
   * 2026 -> Jan, Feb, Mar
   *
   * Item 2:
   * 2027 -> Jan, Feb
   *
   * This creates:
   *
   * 2026 / Jan
   * 2026 / Feb
   * 2026 / Mar
   * 2027 / Jan
   * 2027 / Feb
   *
   * in ONE receipt.
   * -------------------------------------------------------
   */

  const serializedItems =
    JSON.stringify(
      items.flatMap((item) =>
        item.months.map((month) => ({
          paymentCategoryId: null,
          year: item.year,
          month,
          amount:
            Number(item.amountPerMonth),
        })),
      ),
    );

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {state.message &&
        !state.success && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4"
          >
            <p className="font-semibold text-red-800">
              Collection could not be saved
            </p>

            <p className="mt-1 text-sm text-red-700">
              {state.message}
            </p>
          </div>
        )}

      {/* =====================================================
          HIDDEN VALUES
      ===================================================== */}

      <input
        type="hidden"
        name="purpose"
        value={purpose}
      />

      <input
        type="hidden"
        name="householdId"
        value={householdId}
      />

      <input
        type="hidden"
        name="receiptDate"
        value={receiptDate}
      />

      <input
        type="hidden"
        name="remarks"
        value={remarks}
      />

      <input
        type="hidden"
        name="customName"
        value={customName}
      />

      <input
        type="hidden"
        name="customPurpose"
        value={customPurpose}
      />

      <input
        type="hidden"
        name="items"
        value={serializedItems}
      />

      <input
        type="hidden"
        name="amount"
        value={oneTimeAmount}
      />

      {/* =====================================================
          COLLECTION TYPE
      ===================================================== */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Collection Type
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Select what this receipt is for.
        </p>

        <div className="mt-5">
          <label
            htmlFor="purpose"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Purpose
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <select
            id="purpose"
            value={purpose}
            onChange={(event) =>
              handlePurposeChange(
                event.target.value as Purpose,
              )
            }
            disabled={isPending}
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          >
            <option value="MONTHLY_MEMBERSHIP">
              Monthly Membership
            </option>

            <option value="NIKAH_HOUSE_WARMING">
              Nikah / House Warming
            </option>

            <option value="RENT">
              Rent
            </option>

            <option value="CUSTOM">
              Custom
            </option>
          </select>
        </div>
      </section>

      {/* =====================================================
          HOUSEHOLD
      ===================================================== */}

      {needsHousehold && (
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Household
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select the household making the payment.
          </p>

          <div className="mt-5">
            <label
              htmlFor="household-select"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Household
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="household-select"
              value={householdId}
              onChange={(event) =>
                setHouseholdId(
                  event.target.value,
                )
              }
              disabled={isPending}
              required
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            >
              <option value="">
                Select household
              </option>

              {households.map(
                (household) => (
                  <option
                    key={household.id}
                    value={household.id}
                  >
                    {household.householdCode} —{" "}
                    {household.houseName}
                    {household.houseNumber
                      ? ` (${household.houseNumber})`
                      : ""}
                  </option>
                ),
              )}
            </select>
          </div>
        </section>
      )}

      {/* =====================================================
          RECEIPT DETAILS
      ===================================================== */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Receipt Details
        </h2>

        <div className="mt-5 max-w-sm">
          <label
            htmlFor="receipt-date"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Receipt Date
            <span className="ml-1 text-red-500">
              *
            </span>
          </label>

          <input
            id="receipt-date"
            type="date"
            value={receiptDate}
            onChange={(event) =>
              setReceiptDate(
                event.target.value,
              )
            }
            disabled={isPending}
            required
            className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </div>
      </section>

      {/* =====================================================
          CUSTOM
      ===================================================== */}

      {needsCustomDetails && (
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Collection Details
          </h2>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="custom-name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Name
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="custom-name"
                value={customName}
                onChange={(event) =>
                  setCustomName(
                    event.target.value,
                  )
                }
                disabled={isPending}
                placeholder="Enter name"
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>

            <div>
              <label
                htmlFor="custom-purpose"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Purpose
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <input
                id="custom-purpose"
                value={customPurpose}
                onChange={(event) =>
                  setCustomPurpose(
                    event.target.value,
                  )
                }
                disabled={isPending}
                placeholder="Enter purpose"
                className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>

          <div className="mt-5 max-w-md">
            <label
              htmlFor="custom-amount"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Amount
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₹
              </span>

              <input
                id="custom-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={oneTimeAmount}
                onChange={(event) =>
                  setOneTimeAmount(
                    event.target.value,
                  )
                }
                disabled={isPending}
                placeholder="0.00"
                className="h-11 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          NIKAH / HOUSE WARMING
      ===================================================== */}

      {purpose ===
        "NIKAH_HOUSE_WARMING" && (
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Collection Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the amount for this collection.
          </p>

          <div className="mt-5 max-w-md">
            <label
              htmlFor="nikah-amount"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Collection Amount
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ₹
              </span>

              <input
                id="nikah-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={oneTimeAmount}
                onChange={(event) =>
                  setOneTimeAmount(
                    event.target.value,
                  )
                }
                disabled={isPending}
                placeholder="0.00"
                className="h-11 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
              />
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          MEMBERSHIP / RENT
      ===================================================== */}

      {needsMonthlyItems && (
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                {purpose ===
                "MONTHLY_MEMBERSHIP"
                  ? "Membership Payments"
                  : "Rent Payments"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Select a year and multiple months.
                Add another item when the collection
                covers a different year.
              </p>
            </div>

            <button
              type="button"
              onClick={addItem}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-700 px-3 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          <div className="divide-y">
            {items.map(
              (item, index) => {
                const itemAmount =
                  Number(
                    item.amountPerMonth,
                  );

                const itemTotal =
                  Number.isFinite(
                    itemAmount,
                  )
                    ? itemAmount *
                      item.months.length
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="space-y-5 p-6"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-800">
                        {purpose ===
                        "MONTHLY_MEMBERSHIP"
                          ? `Membership ${index + 1}`
                          : `Rent ${index + 1}`}
                      </p>

                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(
                              item.id,
                            )
                          }
                          disabled={isPending}
                          className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      )}
                    </div>

                    {/* YEAR */}

                    <div className="max-w-md">
                      <label
                        htmlFor={`year-${item.id}`}
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Year
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <input
                        id={`year-${item.id}`}
                        type="number"
                        min="2000"
                        max="2100"
                        value={item.year}
                        onChange={(event) =>
                          updateYear(
                            item.id,
                            event.target
                              .value,
                          )
                        }
                        disabled={isPending}
                        className="h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                      />
                    </div>

                    {/* MONTHS */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Months
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                        {months.map(
                          (month) => {
                            const checked =
                              item.months.includes(
                                month.value,
                              );

                            return (
                              <label
                                key={
                                  month.value
                                }
                                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm transition ${
                                  checked
                                    ? "border-green-600 bg-green-50 text-green-800"
                                    : "border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  onChange={() =>
                                    toggleMonth(
                                      item.id,
                                      month.value,
                                    )
                                  }
                                  disabled={
                                    isPending
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-green-700 focus:ring-green-600"
                                />

                                <span>
                                  {
                                    month.label
                                  }
                                </span>
                              </label>
                            );
                          },
                        )}
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        {item.months.length ===
                        0
                          ? "No months selected."
                          : `${item.months.length} month${
                              item.months.length ===
                              1
                                ? ""
                                : "s"
                            } selected.`}
                      </p>
                    </div>

                    {/* AMOUNT */}

                    <div className="max-w-md">
                      <label
                        htmlFor={`amount-${item.id}`}
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        Amount Per Month
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                          ₹
                        </span>

                        <input
                          id={`amount-${item.id}`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={
                            item.amountPerMonth
                          }
                          onChange={(event) =>
                            updateAmount(
                              item.id,
                              event.target
                                .value,
                            )
                          }
                          disabled={isPending}
                          placeholder="0.00"
                          className="h-11 w-full rounded-lg border border-gray-300 pl-8 pr-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                        />
                      </div>
                    </div>

                    {/* ITEM TOTAL */}

                    <div className="rounded-lg bg-gray-50 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {item.months.length}{" "}
                          month
                          {item.months.length ===
                          1
                            ? ""
                            : "s"}{" "}
                          × ₹
                          {Number(
                            item.amountPerMonth ||
                              0,
                          ).toFixed(2)}
                        </span>

                        <span className="font-semibold text-green-700">
                          {formatCurrency(
                            itemTotal,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>

          {/* TOTAL */}

          <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-5">
            <span className="text-base font-semibold text-gray-700">
              Total Collection
            </span>

            <span className="text-2xl font-bold text-green-700">
              {formatCurrency(total)}
            </span>
          </div>
        </section>
      )}

      {/* =====================================================
          REMARKS
      ===================================================== */}

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <label
          htmlFor="remarks"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Remarks
        </label>

        <textarea
          id="remarks"
          value={remarks}
          onChange={(event) =>
            setRemarks(
              event.target.value,
            )
          }
          disabled={isPending}
          rows={4}
          maxLength={500}
          placeholder="Optional remarks about this collection..."
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
      </section>

      {/* =====================================================
          ACTIONS
      ===================================================== */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/finance"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-medium text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />

          {isPending
            ? "Saving..."
            : "Save Collection"}
        </button>
      </div>
    </form>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getToday() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
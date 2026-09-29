import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

type CategoryType = "income" | "expense";

interface NewCategoryPageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

async function createCategory(formData: FormData) {
  "use server";

  const typeValue = String(
    formData.get("type") || "income",
  ).trim();

  const type: CategoryType =
    typeValue === "expense"
      ? "expense"
      : "income";

  const name = String(
    formData.get("name") || "",
  ).trim();

  const description =
    String(
      formData.get("description") || "",
    ).trim() || null;

  const displayOrderValue = String(
    formData.get("displayOrder") || "0",
  ).trim();

  let requestedOrder = Number.parseInt(
    displayOrderValue,
    10,
  );

  if (!Number.isFinite(requestedOrder)) {
    requestedOrder = 0;
  }

  if (requestedOrder < 0) {
    throw new Error(
      "Display order cannot be negative.",
    );
  }

  if (!name) {
    throw new Error(
      "Category name is required.",
    );
  }

  if (type === "income") {
    const existing =
      await prisma.incomeCategoryMaster.findUnique({
        where: {
          name,
        },
      });

    if (existing) {
      throw new Error(
        "An income category with this name already exists.",
      );
    }

    await prisma.$transaction(async (tx) => {
      const categories =
        await tx.incomeCategoryMaster.findMany({
          orderBy: [
            { displayOrder: "asc" },
            { name: "asc" },
          ],
        });

      const insertPosition = Math.min(
        requestedOrder,
        categories.length,
      );

      const orderedIds = categories.map(
        (category) => category.id,
      );

      orderedIds.splice(
        insertPosition,
        0,
        "__NEW_CATEGORY__",
      );

      const created =
        await tx.incomeCategoryMaster.create({
          data: {
            name,
            description,
            displayOrder: 0,
          },
        });

      const newIds = orderedIds.map((id) =>
        id === "__NEW_CATEGORY__"
          ? created.id
          : id,
      );

      for (
        let index = 0;
        index < newIds.length;
        index++
      ) {
        await tx.incomeCategoryMaster.update({
          where: {
            id: newIds[index],
          },
          data: {
            displayOrder: index,
          },
        });
      }
    });
  } else {
    const existing =
      await prisma.expenseCategoryMaster.findUnique({
        where: {
          name,
        },
      });

    if (existing) {
      throw new Error(
        "An expense category with this name already exists.",
      );
    }

    await prisma.$transaction(async (tx) => {
      const categories =
        await tx.expenseCategoryMaster.findMany({
          orderBy: [
            { displayOrder: "asc" },
            { name: "asc" },
          ],
        });

      const insertPosition = Math.min(
        requestedOrder,
        categories.length,
      );

      const orderedIds = categories.map(
        (category) => category.id,
      );

      orderedIds.splice(
        insertPosition,
        0,
        "__NEW_CATEGORY__",
      );

      const created =
        await tx.expenseCategoryMaster.create({
          data: {
            name,
            description,
            displayOrder: 0,
          },
        });

      const newIds = orderedIds.map((id) =>
        id === "__NEW_CATEGORY__"
          ? created.id
          : id,
      );

      for (
        let index = 0;
        index < newIds.length;
        index++
      ) {
        await tx.expenseCategoryMaster.update({
          where: {
            id: newIds[index],
          },
          data: {
            displayOrder: index,
          },
        });
      }
    });
  }

  revalidatePath(
    "/finance/income-categories",
  );

  redirect(
    `/finance/income-categories?type=${type}`,
  );
}

export default async function NewCategoryPage({
  searchParams,
}: NewCategoryPageProps) {
  const params = await searchParams;

  const type: CategoryType =
    params.type === "expense"
      ? "expense"
      : "income";

  const isIncome = type === "income";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}

      <div className="flex items-center gap-3">
        <Link
          href={`/finance/income-categories?type=${type}`}
          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Back to categories"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Add{" "}
            {isIncome
              ? "Income"
              : "Expense"}{" "}
            Category
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a category for classifying{" "}
            {isIncome
              ? "income"
              : "expense"}{" "}
            transactions.
          </p>
        </div>
      </div>

      {/* Type selector */}

      <div className="grid grid-cols-2 rounded-xl border bg-white p-1 shadow-sm">
        <Link
          href="/finance/income-categories/new?type=income"
          className={`rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
            isIncome
              ? "bg-green-700 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Income Category
        </Link>

        <Link
          href="/finance/income-categories/new?type=expense"
          className={`rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
            !isIncome
              ? "bg-red-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Expense Category
        </Link>
      </div>

      {/* Form */}

      <form
        action={createCategory}
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <input
          type="hidden"
          name="type"
          value={type}
        />

        <div className="space-y-6 p-6">
          {/* Name */}

          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Category Name
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={100}
              placeholder={
                isIncome
                  ? "Example: Donation"
                  : "Example: Electricity"
              }
              className={`h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition ${
                isIncome
                  ? "focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  : "focus:border-red-600 focus:ring-2 focus:ring-red-100"
              }`}
            />
          </div>

          {/* Description */}

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={500}
              placeholder="Optional description..."
              className={`w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition ${
                isIncome
                  ? "focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  : "focus:border-red-600 focus:ring-2 focus:ring-red-100"
              }`}
            />
          </div>

          {/* Display Order */}

          <div>
            <label
              htmlFor="displayOrder"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Display Order
            </label>

            <input
              id="displayOrder"
              name="displayOrder"
              type="number"
              min="0"
              defaultValue="0"
              className={`h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition ${
                isIncome
                  ? "focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  : "focus:border-red-600 focus:ring-2 focus:ring-red-100"
              }`}
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Enter the position where this category
              should appear. Existing categories will
              automatically move down.
            </p>
          </div>
        </div>

        {/* Actions */}

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href={`/finance/income-categories?type=${type}`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium text-white ${
              isIncome
                ? "bg-green-700 hover:bg-green-800"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            <Save className="h-4 w-4" />
            Save Category
          </button>
        </div>
      </form>
    </div>
  );
}
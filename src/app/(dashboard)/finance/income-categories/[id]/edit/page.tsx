import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

type CategoryType = "income" | "expense";

interface EditCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    type?: string;
  }>;
}

/* =========================================================
   UPDATE CATEGORY
   ========================================================= */

async function updateCategory(formData: FormData) {
  "use server";

  const id = String(
    formData.get("id") || "",
  ).trim();

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

  const orderValue = String(
    formData.get("displayOrder") || "0",
  ).trim();

  let requestedOrder = Number.parseInt(
    orderValue,
    10,
  );

  if (!Number.isFinite(requestedOrder)) {
    requestedOrder = 0;
  }

  if (!id) {
    throw new Error("Category ID is required.");
  }

  if (!name) {
    throw new Error(
      "Category name is required.",
    );
  }

  if (requestedOrder < 0) {
    throw new Error(
      "Display order cannot be negative.",
    );
  }

  /* =======================================================
     INCOME CATEGORY
     ======================================================= */

  if (type === "income") {
    const existing =
      await prisma.incomeCategoryMaster.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      throw new Error(
        "Income category not found.",
      );
    }

    const duplicate =
      await prisma.incomeCategoryMaster.findFirst({
        where: {
          name,
          NOT: {
            id,
          },
        },
      });

    if (duplicate) {
      throw new Error(
        "An income category with this name already exists.",
      );
    }

    await prisma.$transaction(async (tx) => {
      const categories =
        await tx.incomeCategoryMaster.findMany({
          where: {
            NOT: {
              id,
            },
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

      const newPosition = Math.min(
        requestedOrder,
        categories.length,
      );

      const orderedIds = categories.map(
        (category) => category.id,
      );

      orderedIds.splice(
        newPosition,
        0,
        id,
      );

      /*
       * Temporarily move the edited record out of the
       * normal order range. This avoids unique/order
       * conflicts while rebuilding the sequence.
       */

      await tx.incomeCategoryMaster.update({
        where: {
          id,
        },
        data: {
          displayOrder: -1,
          name,
          description,
        },
      });

      for (
        let index = 0;
        index < orderedIds.length;
        index++
      ) {
        await tx.incomeCategoryMaster.update({
          where: {
            id: orderedIds[index],
          },
          data: {
            displayOrder: index,
          },
        });
      }
    });
  }

  /* =======================================================
     EXPENSE CATEGORY
     ======================================================= */

  if (type === "expense") {
    const existing =
      await prisma.expenseCategoryMaster.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      throw new Error(
        "Expense category not found.",
      );
    }

    const duplicate =
      await prisma.expenseCategoryMaster.findFirst({
        where: {
          name,
          NOT: {
            id,
          },
        },
      });

    if (duplicate) {
      throw new Error(
        "An expense category with this name already exists.",
      );
    }

    await prisma.$transaction(async (tx) => {
      const categories =
        await tx.expenseCategoryMaster.findMany({
          where: {
            NOT: {
              id,
            },
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

      const newPosition = Math.min(
        requestedOrder,
        categories.length,
      );

      const orderedIds = categories.map(
        (category) => category.id,
      );

      orderedIds.splice(
        newPosition,
        0,
        id,
      );

      await tx.expenseCategoryMaster.update({
        where: {
          id,
        },
        data: {
          displayOrder: -1,
          name,
          description,
        },
      });

      for (
        let index = 0;
        index < orderedIds.length;
        index++
      ) {
        await tx.expenseCategoryMaster.update({
          where: {
            id: orderedIds[index],
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

/* =========================================================
   PAGE
   ========================================================= */

export default async function EditCategoryPage({
  params,
  searchParams,
}: EditCategoryPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const type: CategoryType =
    query.type === "expense"
      ? "expense"
      : "income";

  const isIncome = type === "income";

  const category = isIncome
    ? await prisma.incomeCategoryMaster.findUnique({
        where: {
          id,
        },
      })
    : await prisma.expenseCategoryMaster.findUnique({
        where: {
          id,
        },
      });

  if (!category) {
    notFound();
  }

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
            Edit{" "}
            {isIncome
              ? "Income"
              : "Expense"}{" "}
            Category
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update category information and display
            order.
          </p>
        </div>
      </div>

      {/* Type */}

      <div className="grid grid-cols-2 rounded-xl border bg-white p-1 shadow-sm">
        <Link
          href={`/finance/income-categories/${id}/edit?type=income`}
          className={`rounded-lg px-4 py-3 text-center text-sm font-semibold transition ${
            isIncome
              ? "bg-green-700 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Income Category
        </Link>

        <Link
          href={`/finance/income-categories/${id}/edit?type=expense`}
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
        action={updateCategory}
        className="overflow-hidden rounded-xl border bg-white shadow-sm"
      >
        <input
          type="hidden"
          name="id"
          value={category.id}
        />

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
              defaultValue={category.name}
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
              defaultValue={
                category.description || ""
              }
              className={`w-full resize-none rounded-lg border border-gray-300 px-3 py-3 text-sm outline-none transition ${
                isIncome
                  ? "focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  : "focus:border-red-600 focus:ring-2 focus:ring-red-100"
              }`}
            />
          </div>

          {/* Order */}

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
              required
              defaultValue={
                category.displayOrder
              }
              className={`h-11 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition ${
                isIncome
                  ? "focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  : "focus:border-red-600 focus:ring-2 focus:ring-red-100"
              }`}
            />

            <p className="mt-1.5 text-xs text-gray-500">
              Changing the position automatically
              reorders the other categories.
            </p>
          </div>

          {/* Information */}

          <div
            className={`rounded-lg p-4 ${
              isIncome
                ? "bg-green-50"
                : "bg-red-50"
            }`}
          >
            <p
              className={`text-sm font-medium ${
                isIncome
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              Category Type
            </p>

            <p
              className={`mt-1 text-sm ${
                isIncome
                  ? "text-green-700"
                  : "text-red-700"
              }`}
            >
              {isIncome
                ? "This category is used for income transactions."
                : "This category is used for expense transactions."}
            </p>
          </div>
        </div>

        {/* Footer */}

        <div className="flex flex-col-reverse gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <Link
            href={`/finance/income-categories?type=${type}`}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-medium text-white transition ${
              isIncome
                ? "bg-green-700 hover:bg-green-800"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";

export type DeleteCategoryResult = {
  success: boolean;
  message: string;
};

/* =========================================================
   DELETE INCOME CATEGORY
   ========================================================= */

export async function deleteIncomeCategory(
  categoryId: string,
): Promise<DeleteCategoryResult> {
  try {
    const usageCount = await prisma.income.count({
      where: {
        categoryId,
      },
    });

    if (usageCount > 0) {
      return {
        success: false,
        message: `This category is currently used by ${usageCount} income transaction${
          usageCount === 1 ? "" : "s"
        }. It cannot be deleted.`,
      };
    }

    const category =
      await prisma.incomeCategoryMaster.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      return {
        success: false,
        message: "Income category not found.",
      };
    }

    await prisma.incomeCategoryMaster.delete({
      where: {
        id: categoryId,
      },
    });

    revalidatePath(
      "/finance/income-categories",
    );

    return {
      success: true,
      message: "Income category deleted successfully.",
    };
  } catch {
    return {
      success: false,
      message:
        "Unable to delete this income category. Please try again.",
    };
  }
}

/* =========================================================
   DELETE EXPENSE CATEGORY
   ========================================================= */

export async function deleteExpenseCategory(
  categoryId: string,
): Promise<DeleteCategoryResult> {
  try {
    const usageCount = await prisma.expense.count({
      where: {
        categoryId,
      },
    });

    if (usageCount > 0) {
      return {
        success: false,
        message: `This category is currently used by ${usageCount} expense transaction${
          usageCount === 1 ? "" : "s"
        }. It cannot be deleted.`,
      };
    }

    const category =
      await prisma.expenseCategoryMaster.findUnique({
        where: {
          id: categoryId,
        },
      });

    if (!category) {
      return {
        success: false,
        message: "Expense category not found.",
      };
    }

    await prisma.expenseCategoryMaster.delete({
      where: {
        id: categoryId,
      },
    });

    revalidatePath(
      "/finance/income-categories",
    );

    return {
      success: true,
      message:
        "Expense category deleted successfully.",
    };
  } catch {
    return {
      success: false,
      message:
        "Unable to delete this expense category. Please try again.",
    };
  }
}
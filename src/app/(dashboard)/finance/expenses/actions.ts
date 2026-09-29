"use server";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("Authenticated user does not exist.");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("Your account is inactive.");
  }

  return user;
}

export async function createExpense(formData: FormData) {
  const categoryId = String(
    formData.get("categoryId") || "",
  ).trim();

  const amountValue = String(
    formData.get("amount") || "",
  ).trim();

  const expenseDateValue = String(
    formData.get("expenseDate") || "",
  ).trim();

  const description = String(
    formData.get("description") || "",
  ).trim();

  const billNumber = String(
    formData.get("billNumber") || "",
  ).trim();

  if (!categoryId) {
    throw new Error("Expense category is required.");
  }

  if (!amountValue) {
    throw new Error("Amount is required.");
  }

  const amount = Number(amountValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Amount must be greater than zero.",
    );
  }

  if (!expenseDateValue) {
    throw new Error("Expense date is required.");
  }

  const expenseDate = new Date(
    `${expenseDateValue}T00:00:00`,
  );

  if (Number.isNaN(expenseDate.getTime())) {
    throw new Error("Invalid expense date.");
  }

  const category =
    await prisma.expenseCategoryMaster.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    throw new Error(
      "Selected expense category does not exist.",
    );
  }

  if (!category.isActive) {
    throw new Error(
      "Selected expense category is inactive.",
    );
  }

  const user = await getCurrentUser();

  await prisma.expense.create({
    data: {
      categoryId,
      amount,
      expenseDate,
      description: description || null,
      billNumber: billNumber || null,
      createdById: user.id,
    },
  });

  redirect("/finance");
}
export async function updateExpense(formData: FormData) {
  const expenseId = String(
    formData.get("expenseId") || "",
  ).trim();

  const categoryId = String(
    formData.get("categoryId") || "",
  ).trim();

  const amountValue = String(
    formData.get("amount") || "",
  ).trim();

  const expenseDateValue = String(
    formData.get("expenseDate") || "",
  ).trim();

  const description = String(
    formData.get("description") || "",
  ).trim();

  const billNumber = String(
    formData.get("billNumber") || "",
  ).trim();

  if (!expenseId) {
    throw new Error("Expense ID is required.");
  }

  if (!categoryId) {
    throw new Error(
      "Expense category is required.",
    );
  }

  if (!amountValue) {
    throw new Error("Amount is required.");
  }

  const amount = Number(amountValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(
      "Amount must be greater than zero.",
    );
  }

  if (!expenseDateValue) {
    throw new Error("Expense date is required.");
  }

  const expenseDate = new Date(
    `${expenseDateValue}T00:00:00`,
  );

  if (Number.isNaN(expenseDate.getTime())) {
    throw new Error("Invalid expense date.");
  }

  const user = await getCurrentUser();

  const existingExpense =
    await prisma.expense.findUnique({
      where: {
        id: expenseId,
      },
      include: {
        category: true,
      },
    });

  if (!existingExpense) {
    throw new Error(
      "Expense transaction not found.",
    );
  }

  const category =
    await prisma.expenseCategoryMaster.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    throw new Error(
      "Selected expense category does not exist.",
    );
  }

  if (!category.isActive) {
    throw new Error(
      "Selected expense category is inactive.",
    );
  }

  /*
   * Save the new expense and audit record together.
   * If either operation fails, neither is committed.
   */
  await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: {
        id: expenseId,
      },
      data: {
        categoryId,
        amount,
        expenseDate,
        description: description || null,
        billNumber: billNumber || null,
      },
    });

    await tx.auditLog.create({
      data: {
        tableName: "expense",
        recordId: expenseId,
        action: "UPDATE",
        performedById: user.id,

        oldValue: {
          categoryId: existingExpense.categoryId,
          categoryName:
            existingExpense.category.name,
          amount: existingExpense.amount.toString(),
          expenseDate:
            existingExpense.expenseDate.toISOString(),
          description:
            existingExpense.description,
          billNumber:
            existingExpense.billNumber,
        },

        newValue: {
          categoryId,
          categoryName: category.name,
          amount: amount.toString(),
          expenseDate:
            expenseDate.toISOString(),
          description:
            description || null,
          billNumber:
            billNumber || null,
        },
      },
    });
  });

  redirect("/finance/expenses");
}
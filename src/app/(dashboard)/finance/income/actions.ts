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

/* =========================================================
   CREATE INCOME
   ========================================================= */

export async function createIncome(formData: FormData) {
  const categoryId = String(
    formData.get("categoryId") || "",
  ).trim();

  const amountValue = String(
    formData.get("amount") || "",
  ).trim();

  const incomeDateValue = String(
    formData.get("incomeDate") || "",
  ).trim();

  const description = String(
    formData.get("description") || "",
  ).trim();

  const receiptNumber = String(
    formData.get("receiptNumber") || "",
  ).trim();

  if (!categoryId) {
    throw new Error("Income category is required.");
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

  if (!incomeDateValue) {
    throw new Error("Income date is required.");
  }

  const incomeDate = new Date(
    `${incomeDateValue}T00:00:00`,
  );

  if (Number.isNaN(incomeDate.getTime())) {
    throw new Error("Invalid income date.");
  }

  const category =
    await prisma.incomeCategoryMaster.findUnique({
      where: {
        id: categoryId,
      },
    });

  if (!category) {
    throw new Error(
      "Selected income category does not exist.",
    );
  }

  if (!category.isActive) {
    throw new Error(
      "Selected income category is inactive.",
    );
  }

  const user = await getCurrentUser();

  await prisma.income.create({
    data: {
      categoryId,
      amount,
      incomeDate,
      description: description || null,
      receiptNumber: receiptNumber || null,
      createdById: user.id,
    },
  });

  redirect("/finance");
}

/* =========================================================
   UPDATE INCOME
   ========================================================= */

export async function updateIncome(formData: FormData) {
  const incomeId = String(
    formData.get("incomeId") || "",
  ).trim();

  const categoryId = String(
    formData.get("categoryId") || "",
  ).trim();

  const amountValue = String(
    formData.get("amount") || "",
  ).trim();

  const incomeDateValue = String(
    formData.get("incomeDate") || "",
  ).trim();

  const description = String(
    formData.get("description") || "",
  ).trim();

  const receiptNumber = String(
    formData.get("receiptNumber") || "",
  ).trim();

  /* =========================================================
     VALIDATION
     ========================================================= */

  if (!incomeId) {
    throw new Error("Income ID is required.");
  }

  if (!categoryId) {
    throw new Error("Income category is required.");
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

  if (!incomeDateValue) {
    throw new Error("Income date is required.");
  }

  const incomeDate = new Date(
    `${incomeDateValue}T00:00:00`,
  );

  if (Number.isNaN(incomeDate.getTime())) {
    throw new Error("Invalid income date.");
  }

  /* =========================================================
     AUTHENTICATION
     ========================================================= */

  const user = await getCurrentUser();

  /* =========================================================
     GET EXISTING INCOME
     ========================================================= */

  const existingIncome =
    await prisma.income.findUnique({
      where: {
        id: incomeId,
      },
    });

  if (!existingIncome) {
    throw new Error(
      "Income transaction not found.",
    );
  }

  /* =========================================================
     GET OLD CATEGORY
     ========================================================= */

  const oldCategory =
    await prisma.incomeCategoryMaster.findUnique({
      where: {
        id: existingIncome.categoryId,
      },
      select: {
        name: true,
      },
    });

  /* =========================================================
     GET NEW CATEGORY
     ========================================================= */

  const newCategory =
    await prisma.incomeCategoryMaster.findUnique({
      where: {
        id: categoryId,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

  if (!newCategory) {
    throw new Error(
      "Selected income category does not exist.",
    );
  }

  if (!newCategory.isActive) {
    throw new Error(
      "Selected income category is inactive.",
    );
  }

  /* =========================================================
     UPDATE + AUDIT LOG
     ========================================================= */

  await prisma.$transaction(
    async (tx) => {
      await tx.income.update({
        where: {
          id: incomeId,
        },

        data: {
          categoryId,
          amount,
          incomeDate,
          description:
            description || null,
          receiptNumber:
            receiptNumber || null,
        },
      });

      await tx.auditLog.create({
        data: {
          tableName: "Income",
          recordId: incomeId,
          action: "UPDATE",

          oldValue: {
            categoryId:
              existingIncome.categoryId,

            categoryName:
              oldCategory?.name ?? null,

            amount:
              Number(existingIncome.amount),

            incomeDate:
              existingIncome.incomeDate.toISOString(),

            description:
              existingIncome.description ??
              null,

            receiptNumber:
              existingIncome.receiptNumber ??
              null,
          },

          newValue: {
            categoryId,

            categoryName:
              newCategory.name,

            amount,

            incomeDate:
              incomeDate.toISOString(),

            description:
              description || null,

            receiptNumber:
              receiptNumber || null,
          },

          performedById: user.id,
        },
      });
    },
    {
      maxWait: 10000,
      timeout: 15000,
    },
  );

  redirect("/finance/income");
}
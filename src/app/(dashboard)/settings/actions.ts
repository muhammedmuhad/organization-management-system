"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/* =========================================================
   GENERAL / MAHALLU INFORMATION
   ========================================================= */

export async function updateSystemConfiguration(
  formData: FormData,
) {
  const mahalluName = String(
    formData.get("mahalluName") || "",
  ).trim();

  const address =
    String(formData.get("address") || "").trim() ||
    null;

  const phone =
    String(formData.get("phone") || "").trim() ||
    null;

  const email =
    String(formData.get("email") || "").trim() ||
    null;

  if (!mahalluName) {
    throw new Error("Mahallu name is required.");
  }

  if (email && !email.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const existing =
    await prisma.systemConfiguration.findFirst();

  let configuration;

  if (existing) {
    configuration =
      await prisma.systemConfiguration.update({
        where: {
          id: existing.id,
        },
        data: {
          mahalluName,
          address,
          phone,
          email,
        },
      });
  } else {
    configuration =
      await prisma.systemConfiguration.create({
        data: {
          mahalluName,
          address,
          phone,
          email,
        },
      });
  }

  await prisma.auditLog.create({
    data: {
      tableName: "system_configuration",
      recordId: configuration.id,
      action: existing ? "UPDATE" : "CREATE",
      oldValue: existing
        ? {
            mahalluName: existing.mahalluName,
            address: existing.address,
            phone: existing.phone,
            email: existing.email,
            logoUrl: existing.logoUrl,
          }
        : undefined,
      newValue: {
        mahalluName: configuration.mahalluName,
        address: configuration.address,
        phone: configuration.phone,
        email: configuration.email,
        logoUrl: configuration.logoUrl,
      },
    },
  });

  revalidatePath("/settings");
}

/* =========================================================
   FINANCIAL YEAR
   ========================================================= */

export async function updateFinancialYear(
  formData: FormData,
) {
  const startMonth = Number(
    formData.get(
      "financialYearStartMonth",
    ),
  );

  if (
    !Number.isInteger(startMonth) ||
    startMonth < 1 ||
    startMonth > 12
  ) {
    throw new Error(
      "Please select a valid financial year start month.",
    );
  }

  const key =
    "financial_year_start_month";

  const existing =
    await prisma.setting.findUnique({
      where: {
        key,
      },
    });

  const newValue = String(startMonth);

  const setting =
    await prisma.setting.upsert({
      where: {
        key,
      },
      update: {
        value: newValue,
        description:
          "Month in which the Mahallu financial year begins.",
      },
      create: {
        key,
        value: newValue,
        description:
          "Month in which the Mahallu financial year begins.",
      },
    });

  await prisma.auditLog.create({
    data: {
      tableName: "settings",
      recordId: setting.id,
      action: existing ? "UPDATE" : "CREATE",
      oldValue: existing
        ? {
            key: existing.key,
            value: existing.value,
          }
        : undefined,
      newValue: {
        key,
        value: newValue,
      },
    },
  });

  revalidatePath("/settings");
}

/* =========================================================
   ACCOUNT SECURITY
   ========================================================= */

export type AccountSecurityState = {
  success: boolean;
  message: string;
};

export async function updateAccountSecurity(
  _previousState: AccountSecurityState,
  formData: FormData,
): Promise<AccountSecurityState> {
  try {
    const session =
      await getServerSession(authOptions);

    if (!session?.user) {
      return {
        success: false,
        message: "Your session has expired. Please log in again.",
      };
    }

    const userId = (session.user as { id?: string }).id;

    if (!userId) {
      return {
        success: false,
        message: "Unable to identify the current user.",
      };
    }

    const currentPassword = String(
      formData.get("currentPassword") || "",
    );

    const newUsername = String(
      formData.get("newUsername") || "",
    ).trim();

    const newPassword = String(
      formData.get("newPassword") || "",
    );

    const confirmPassword = String(
      formData.get("confirmPassword") || "",
    );

    if (!currentPassword) {
      return {
        success: false,
        message: "Please enter your current password.",
      };
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      return {
        success: false,
        message: "User account was not found.",
      };
    }

    if (user.status !== "ACTIVE") {
      return {
        success: false,
        message: "Your account is not active.",
      };
    }

    const validCurrentPassword =
      await compare(
        currentPassword,
        user.passwordHash,
      );

    if (!validCurrentPassword) {
      return {
        success: false,
        message: "Current password is incorrect.",
      };
    }

    const usernameChanged =
      newUsername.length > 0 &&
      newUsername !== user.username;

    const passwordChanged =
      newPassword.length > 0;

    if (!usernameChanged && !passwordChanged) {
      return {
        success: false,
        message:
          "Please enter a new username or a new password.",
      };
    }

    if (newUsername.length > 0) {
      if (newUsername.length < 3) {
        return {
          success: false,
          message:
            "Username must be at least 3 characters long.",
        };
      }

      if (newUsername.length > 50) {
        return {
          success: false,
          message:
            "Username cannot exceed 50 characters.",
        };
      }

      if (!/^[a-zA-Z0-9._-]+$/.test(newUsername)) {
        return {
          success: false,
          message:
            "Username may contain only letters, numbers, dots, underscores and hyphens.",
        };
      }

      if (usernameChanged) {
        const existingUser =
          await prisma.user.findUnique({
            where: {
              username: newUsername,
            },
            select: {
              id: true,
            },
          });

        if (
          existingUser &&
          existingUser.id !== user.id
        ) {
          return {
            success: false,
            message:
              "That username is already in use. Please choose another username.",
          };
        }
      }
    }

    if (passwordChanged) {
      if (newPassword.length < 8) {
        return {
          success: false,
          message:
            "New password must be at least 8 characters long.",
        };
      }

      if (newPassword.length > 128) {
        return {
          success: false,
          message:
            "New password cannot exceed 128 characters.",
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          success: false,
          message:
            "New password and confirmation password do not match.",
        };
      }

      if (newPassword === currentPassword) {
        return {
          success: false,
          message:
            "New password must be different from your current password.",
        };
      }
    }

    const updateData: {
      username?: string;
      passwordHash?: string;
    } = {};

    if (usernameChanged) {
      updateData.username = newUsername;
    }

    if (passwordChanged) {
      updateData.passwordHash =
        await hash(newPassword, 12);
    }

    const updatedUser =
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: updateData,
        select: {
          id: true,
          username: true,
        },
      });

    /*
     * Never store passwords or password hashes
     * in the audit log.
     */
    const auditActions: string[] = [];

    if (usernameChanged) {
      auditActions.push("USERNAME_CHANGE");
    }

    if (passwordChanged) {
      auditActions.push("PASSWORD_CHANGE");
    }

    await prisma.auditLog.create({
      data: {
        tableName: "users",
        recordId: user.id,
        action: auditActions.join("_AND_"),
        performedById: user.id,

        oldValue: {
          username: usernameChanged
            ? user.username
            : undefined,
        },

        newValue: {
          username: usernameChanged
            ? updatedUser.username
            : undefined,
          passwordChanged: passwordChanged,
        },
      },
    });

    revalidatePath("/settings");
    revalidatePath("/settings/account");

    return {
      success: true,
      message:
        usernameChanged && passwordChanged
          ? "Username and password changed successfully."
          : usernameChanged
            ? "Username changed successfully."
            : "Password changed successfully.",
    };
  } catch (error) {
    console.error(
      "Account security update error:",
      error,
    );

    return {
      success: false,
      message:
        "Unable to update account security settings. Please try again.",
    };
  }
}
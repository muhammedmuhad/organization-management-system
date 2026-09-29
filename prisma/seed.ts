import {
  PrismaClient,
  UserRole,
  UserStatus,
} from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = "ChangeMe@123";
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

  try {
    await prisma.$transaction(async (tx) => {
      // helper to upsert by name
      const upsertNames = async (model: any, names: string[]) =>
        Promise.all(
          names.map((name, idx) =>
            model.upsert({
              where: { name },
              update: { description: null, displayOrder: idx, isActive: true },
              create: { name, description: null, displayOrder: idx, isActive: true },
            })
          )
        );

      // Household Status
      await upsertNames(tx.householdStatusMaster, ["Active", "Inactive", "Archived"]);

      // Relationships
      await upsertNames(tx.relationshipMaster, [
        "Head",
        "Wife",
        "Son",
        "Daughter",
        "Father",
        "Mother",
        "Brother",
        "Sister",
        "Other",
      ]);

      // Occupations
      await upsertNames(tx.occupationMaster, [
        "Business",
        "Engineer",
        "Teacher",
        "Doctor",
        "Student",
        "Driver",
        "Farmer",
        "Retired",
        "Housewife",
        "Other",
      ]);

      // Blood Group Master
      await upsertNames(tx.bloodGroupMaster, ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);

      // Payment Categories
      await upsertNames(tx.paymentCategoryMaster, [
        "Monthly Membership",
        "Building Fund",
        "Ramadan Fund",
        "Milad Fund",
        "Special Contribution",
      ]);

      // Income Categories
      await upsertNames(tx.incomeCategoryMaster, ["Donation", "Membership", "Sponsor", "Building Donation", "Other"]);

      // Expense Categories
      await upsertNames(tx.expenseCategoryMaster, [
        "Electricity",
        "Water",
        "Salary",
        "Cleaning",
        "Maintenance",
        "Construction",
        "Charity",
        "Other",
      ]);

      // Event Categories
      await upsertNames(tx.eventCategoryMaster, [
        "Ramadan",
        "Eid",
        "Milad",
        "Meeting",
        "Youth Program",
        "Islamic Class",
        "Nikah",
        "Other",
      ]);

      // Notification Types
      await upsertNames(tx.notificationTypeMaster, [
        "Announcement",
        "Payment Reminder",
        "Event Reminder",
        "Emergency",
        "Funeral",
      ]);

      // System Configuration (single record)
      const systemConfigId = "system-configuration-1";
      await tx.systemConfiguration.upsert({
        where: { id: systemConfigId },
        update: {
          mahalluName: "Pandarakkandy Mahallu",
          address: null,
          phone: null,
          email: null,
          logoUrl: null,
          receiptPrefix: "RCPT",
        },
        create: {
          id: systemConfigId,
          mahalluName: "Pandarakkandy Mahallu",
          address: null,
          phone: null,
          email: null,
          logoUrl: null,
          receiptPrefix: "RCPT",
        },
      });

      // Admin user
      await tx.user.upsert({
        where: { username: "admin" },
        update: {
          fullName: "System Administrator",
          email: "admin@mahallu.local",
          mobile: "9999999999",
          passwordHash: passwordHash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
        create: {
          fullName: "System Administrator",
          username: "admin",
          email: "admin@mahallu.local",
          mobile: "9999999999",
          passwordHash: passwordHash,
          role: UserRole.ADMIN,
          status: UserStatus.ACTIVE,
        },
      });
    });

    console.log("Seeding completed successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

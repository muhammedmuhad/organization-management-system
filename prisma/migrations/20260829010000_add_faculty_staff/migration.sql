CREATE TYPE "FacultyStaffType" AS ENUM ('TEACHING', 'NON_TEACHING');

CREATE TABLE "faculty_staff" (
    "id" TEXT NOT NULL,
    "type" "FacultyStaffType" NOT NULL,
    "name" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "photo" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faculty_staff_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "faculty_staff_type_idx" ON "faculty_staff"("type");
CREATE INDEX "faculty_staff_displayOrder_idx" ON "faculty_staff"("displayOrder");

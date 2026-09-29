-- CreateEnum
CREATE TYPE "public"."EventTransferDirection" AS ENUM ('TO_GENERAL_FUND', 'FROM_GENERAL_FUND');

-- AlterTable
ALTER TABLE "public"."event_collections" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "referenceNo" TEXT;

-- AlterTable
ALTER TABLE "public"."event_expenses" ADD COLUMN     "billNumber" TEXT,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "public"."event_transfers" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "direction" "public"."EventTransferDirection",
ADD COLUMN     "referenceNo" TEXT;

-- AlterTable
ALTER TABLE "public"."events" ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "startTime" TEXT;

-- CreateIndex
CREATE INDEX "event_collections_categoryId_idx" ON "public"."event_collections"("categoryId");

-- CreateIndex
CREATE INDEX "event_collections_createdById_idx" ON "public"."event_collections"("createdById");

-- CreateIndex
CREATE INDEX "event_expenses_categoryId_idx" ON "public"."event_expenses"("categoryId");

-- CreateIndex
CREATE INDEX "event_expenses_createdById_idx" ON "public"."event_expenses"("createdById");

-- CreateIndex
CREATE INDEX "event_transfers_direction_idx" ON "public"."event_transfers"("direction");

-- CreateIndex
CREATE INDEX "event_transfers_createdById_idx" ON "public"."event_transfers"("createdById");

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "public"."events"("startDate");

-- CreateIndex
CREATE INDEX "events_endDate_idx" ON "public"."events"("endDate");

-- AddForeignKey
ALTER TABLE "public"."event_collections" ADD CONSTRAINT "event_collections_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."income_category_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_collections" ADD CONSTRAINT "event_collections_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_expenses" ADD CONSTRAINT "event_expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."expense_category_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_expenses" ADD CONSTRAINT "event_expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."event_transfers" ADD CONSTRAINT "event_transfers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

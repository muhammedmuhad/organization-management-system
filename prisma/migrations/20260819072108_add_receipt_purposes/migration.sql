/*
  Warnings:

  - A unique constraint covering the columns `[receiptSequence]` on the table `membership_receipts` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ReceiptPurpose" AS ENUM ('MONTHLY_MEMBERSHIP', 'NIKAH_HOUSE_WARMING', 'RENT', 'CUSTOM');

-- DropForeignKey
ALTER TABLE "public"."membership_receipt_items" DROP CONSTRAINT "membership_receipt_items_paymentCategoryId_fkey";

-- DropForeignKey
ALTER TABLE "public"."membership_receipts" DROP CONSTRAINT "membership_receipts_householdId_fkey";

-- AlterTable
ALTER TABLE "public"."membership_receipt_items" ALTER COLUMN "paymentCategoryId" DROP NOT NULL,
ALTER COLUMN "year" DROP NOT NULL;

-- AlterTable
CREATE SEQUENCE "public".membership_receipts_receiptsequence_seq;
ALTER TABLE "public"."membership_receipts" ADD COLUMN     "purpose" "public"."ReceiptPurpose" NOT NULL DEFAULT 'MONTHLY_MEMBERSHIP',
ADD COLUMN     "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "receiptSequence" SET DEFAULT nextval('"public".membership_receipts_receiptsequence_seq'),
ALTER COLUMN "householdId" DROP NOT NULL;
ALTER SEQUENCE "public".membership_receipts_receiptsequence_seq OWNED BY "public"."membership_receipts"."receiptSequence";

-- CreateIndex
CREATE INDEX "membership_receipt_items_month_idx" ON "public"."membership_receipt_items"("month");

-- CreateIndex
CREATE UNIQUE INDEX "membership_receipts_receiptSequence_key" ON "public"."membership_receipts"("receiptSequence");

-- CreateIndex
CREATE INDEX "membership_receipts_collectedById_idx" ON "public"."membership_receipts"("collectedById");

-- CreateIndex
CREATE INDEX "membership_receipts_status_idx" ON "public"."membership_receipts"("status");

-- CreateIndex
CREATE INDEX "membership_receipts_purpose_idx" ON "public"."membership_receipts"("purpose");

-- AddForeignKey
ALTER TABLE "public"."membership_receipts" ADD CONSTRAINT "membership_receipts_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "public"."households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."membership_receipt_items" ADD CONSTRAINT "membership_receipt_items_paymentCategoryId_fkey" FOREIGN KEY ("paymentCategoryId") REFERENCES "public"."payment_category_master"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add household reference to event collections
ALTER TABLE "public"."event_collections"
ADD COLUMN "householdId" TEXT;

-- CreateIndex
CREATE INDEX "event_collections_householdId_idx"
ON "public"."event_collections"("householdId");

-- AddForeignKey
ALTER TABLE "public"."event_collections"
ADD CONSTRAINT "event_collections_householdId_fkey"
FOREIGN KEY ("householdId")
REFERENCES "public"."households"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
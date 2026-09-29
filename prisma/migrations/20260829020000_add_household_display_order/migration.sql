/*
  Add register position to households.

  Existing PMH-XXX household codes are used only to
  initialize the current register order.

  householdCode itself is NOT changed.
*/

ALTER TABLE "households"
ADD COLUMN "displayOrder" INTEGER NOT NULL DEFAULT 0;


/*
  Initialize displayOrder from the numeric portion of
  the existing PMH household code.

  Example:

  PMH-001 -> 1
  PMH-002 -> 2
  PMH-003 -> 3
*/
UPDATE "households"
SET "displayOrder" =
  CAST(
    SUBSTRING("householdCode" FROM 'PMH-([0-9]+)')
    AS INTEGER
  )
WHERE "householdCode" ~ '^PMH-[0-9]+$';


/*
  Add index for register-order queries.
*/
CREATE INDEX "households_displayOrder_idx"
ON "households"("displayOrder");
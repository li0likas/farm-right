-- AlterTable
ALTER TABLE "TaskEquipment" ADD COLUMN     "fuelUsed" DOUBLE PRECISION,
ADD COLUMN     "minutesUsed" INTEGER;

-- AlterTable
ALTER TABLE "TaskParticipant" ADD COLUMN     "minutesWorked" INTEGER;

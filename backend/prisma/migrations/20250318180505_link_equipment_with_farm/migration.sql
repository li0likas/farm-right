/*
  Warnings:

  - Added the required column `farmId` to the `Equipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "farmId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

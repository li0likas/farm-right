/*
  Warnings:

  - Added the required column `farmId` to the `Field` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Field" ADD COLUMN     "farmId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

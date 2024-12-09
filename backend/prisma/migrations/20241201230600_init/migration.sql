/*
  Warnings:

  - Made the column `area` on table `Field` required. This step will fail if there are existing NULL values in that column.
  - Made the column `cropId` on table `Field` required. This step will fail if there are existing NULL values in that column.
  - Made the column `perimeter` on table `Field` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Field" ALTER COLUMN "area" SET NOT NULL,
ALTER COLUMN "cropId" SET NOT NULL,
ALTER COLUMN "perimeter" SET NOT NULL;

/*
  Warnings:

  - You are about to drop the column `crop` on the `Field` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Field` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Field` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Field" DROP COLUMN "crop",
DROP COLUMN "location",
DROP COLUMN "size",
ADD COLUMN     "area" DOUBLE PRECISION,
ADD COLUMN     "cropId" INTEGER,
ADD COLUMN     "perimeter" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "field_crops" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "field_crops_pkey" PRIMARY KEY ("id")
);

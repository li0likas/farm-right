/*
  Warnings:

  - You are about to drop the column `title` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `field_crops` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `completionDate` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `Task` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Task" DROP COLUMN "title",
ADD COLUMN     "completionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dueDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "typeId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "field_crops";

-- CreateTable
CREATE TABLE "FieldCropOptions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FieldCropOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTypeOptions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "TaskTypeOptions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Field" ADD CONSTRAINT "Field_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "FieldCropOptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TaskTypeOptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

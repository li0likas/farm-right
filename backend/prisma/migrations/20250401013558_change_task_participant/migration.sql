/*
  Warnings:

  - You are about to drop the column `userId` on the `TaskParticipant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[taskId,farmMemberId]` on the table `TaskParticipant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `farmMemberId` to the `TaskParticipant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TaskParticipant" DROP CONSTRAINT "TaskParticipant_userId_fkey";

-- DropIndex
DROP INDEX "TaskParticipant_taskId_userId_key";

-- AlterTable
ALTER TABLE "TaskParticipant" DROP COLUMN "userId",
ADD COLUMN     "farmMemberId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TaskParticipant_taskId_farmMemberId_key" ON "TaskParticipant"("taskId", "farmMemberId");

-- AddForeignKey
ALTER TABLE "TaskParticipant" ADD CONSTRAINT "TaskParticipant_farmMemberId_fkey" FOREIGN KEY ("farmMemberId") REFERENCES "FarmMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

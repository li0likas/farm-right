/*
  Warnings:

  - You are about to drop the column `role` on the `FarmMember` table. All the data in the column will be lost.
  - You are about to drop the `UserRole` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `roleId` to the `FarmMember` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_roleId_fkey";

-- DropForeignKey
ALTER TABLE "UserRole" DROP CONSTRAINT "UserRole_userId_fkey";

-- AlterTable
ALTER TABLE "FarmMember" DROP COLUMN "role",
ADD COLUMN     "roleId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "UserRole";

-- AddForeignKey
ALTER TABLE "FarmMember" ADD CONSTRAINT "FarmMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

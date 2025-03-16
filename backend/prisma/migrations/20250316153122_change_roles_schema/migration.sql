/*
  Warnings:

  - You are about to drop the `RoleRight` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RoleRight" DROP CONSTRAINT "RoleRight_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "RoleRight" DROP CONSTRAINT "RoleRight_roleId_fkey";

-- DropTable
DROP TABLE "RoleRight";

-- CreateTable
CREATE TABLE "FarmRolePermission" (
    "id" SERIAL NOT NULL,
    "farmId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "FarmRolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmRolePermission_farmId_roleId_permissionId_key" ON "FarmRolePermission"("farmId", "roleId", "permissionId");

-- AddForeignKey
ALTER TABLE "FarmRolePermission" ADD CONSTRAINT "FarmRolePermission_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmRolePermission" ADD CONSTRAINT "FarmRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmRolePermission" ADD CONSTRAINT "FarmRolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

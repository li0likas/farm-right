-- CreateTable
CREATE TABLE "FarmInvitation" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "farmId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmInvitation_token_key" ON "FarmInvitation"("token");

-- CreateIndex
CREATE INDEX "FarmInvitation_email_idx" ON "FarmInvitation"("email");

-- AddForeignKey
ALTER TABLE "FarmInvitation" ADD CONSTRAINT "FarmInvitation_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmInvitation" ADD CONSTRAINT "FarmInvitation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

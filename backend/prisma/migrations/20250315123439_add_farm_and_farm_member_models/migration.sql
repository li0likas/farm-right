-- CreateTable
CREATE TABLE "Farm" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmMember" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "farmId" INTEGER NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "FarmMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmMember_userId_farmId_key" ON "FarmMember"("userId", "farmId");

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmMember" ADD CONSTRAINT "FarmMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmMember" ADD CONSTRAINT "FarmMember_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

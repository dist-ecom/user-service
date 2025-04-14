/*
  Warnings:

  - A unique constraint covering the columns `[emailVerifyToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerifyExpires" TIMESTAMP(3),
ADD COLUMN     "emailVerifyToken" TEXT,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_emailVerifyToken_key" ON "User"("emailVerifyToken");

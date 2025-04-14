-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'MERCHANT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VIEWER');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'VIEWER';

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

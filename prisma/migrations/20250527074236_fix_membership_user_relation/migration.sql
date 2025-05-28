/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_memberId_fkey`;

-- DropIndex
DROP INDEX `memberships_iqamaNumber_key` ON `memberships`;

-- DropIndex
DROP INDEX `memberships_memberId_key` ON `memberships`;

-- AlterTable
ALTER TABLE `memberships` ADD COLUMN `userId` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `memberships_userId_key` ON `memberships`(`userId`);

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

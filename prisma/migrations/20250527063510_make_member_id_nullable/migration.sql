-- DropForeignKey
ALTER TABLE `user` DROP FOREIGN KEY `User_memberId_fkey`;

-- AlterTable
ALTER TABLE `user` MODIFY `memberId` VARCHAR(191) NULL;

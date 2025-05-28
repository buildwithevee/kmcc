/*
  Warnings:

  - You are about to drop the column `userId` on the `memberships` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[memberId]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[iqamaNumber]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.
  - Made the column `memberId` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `memberships` DROP FOREIGN KEY `memberships_userId_fkey`;

-- DropIndex
DROP INDEX `memberships_userId_key` ON `memberships`;

-- AlterTable
ALTER TABLE `memberships` DROP COLUMN `userId`;

-- AlterTable
ALTER TABLE `user` MODIFY `memberId` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `memberships_memberId_key` ON `memberships`(`memberId`);

-- CreateIndex
CREATE UNIQUE INDEX `memberships_iqamaNumber_key` ON `memberships`(`iqamaNumber`);

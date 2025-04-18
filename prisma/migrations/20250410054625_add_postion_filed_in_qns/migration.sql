/*
  Warnings:

  - Added the required column `timeToRead` to the `News` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `news` ADD COLUMN `timeToRead` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `question` ADD COLUMN `position` INTEGER NOT NULL DEFAULT 0;

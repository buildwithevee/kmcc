/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `news` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `news` DROP COLUMN `updatedAt`,
    MODIFY `body` TEXT NOT NULL;

/*
  Warnings:

  - Added the required column `image` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `question` ADD COLUMN `image` LONGBLOB NOT NULL;

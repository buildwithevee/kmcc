/*
  Warnings:

  - You are about to alter the column `highlights` on the `event` table. The data in that column could be lost. The data in that column will be cast from `Text` to `Json`.

*/
-- AlterTable
ALTER TABLE `event` ADD COLUMN `description` VARCHAR(191) NULL,
    MODIFY `highlights` JSON NOT NULL;

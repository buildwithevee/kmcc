/*
  Warnings:

  - You are about to drop the column `availableTime` on the `services` table. All the data in the column will be lost.
  - Added the required column `startingTime` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stoppingTime` to the `services` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `job` MODIFY `jobDescription` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `services` DROP COLUMN `availableTime`,
    ADD COLUMN `startingTime` VARCHAR(191) NOT NULL,
    ADD COLUMN `stoppingTime` VARCHAR(191) NOT NULL,
    MODIFY `availableDays` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `ExclusiveMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `image` LONGBLOB NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

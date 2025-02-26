/*
  Warnings:

  - You are about to drop the column `employer` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `place` on the `profiles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[email]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `profiles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `profiles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `profiles` DROP COLUMN `employer`,
    DROP COLUMN `occupation`,
    DROP COLUMN `place`,
    ADD COLUMN `address` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `gender` VARCHAR(191) NULL,
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `phoneNumber` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `profiles_email_key` ON `profiles`(`email`);

-- CreateIndex
CREATE UNIQUE INDEX `profiles_phoneNumber_key` ON `profiles`(`phoneNumber`);

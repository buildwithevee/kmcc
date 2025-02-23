/*
  Warnings:

  - You are about to drop the column `completed` on the `usersurvey` table. All the data in the column will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `contact_infos` DROP FOREIGN KEY `contact_infos_userId_fkey`;

-- DropForeignKey
ALTER TABLE `eventregistration` DROP FOREIGN KEY `EventRegistration_userId_fkey`;

-- DropForeignKey
ALTER TABLE `profiles` DROP FOREIGN KEY `profiles_userId_fkey`;

-- DropForeignKey
ALTER TABLE `response` DROP FOREIGN KEY `Response_userId_fkey`;

-- DropForeignKey
ALTER TABLE `service_bookings` DROP FOREIGN KEY `service_bookings_userId_fkey`;

-- DropForeignKey
ALTER TABLE `usersurvey` DROP FOREIGN KEY `UserSurvey_userId_fkey`;

-- DropIndex
DROP INDEX `EventRegistration_userId_fkey` ON `eventregistration`;

-- DropIndex
DROP INDEX `Response_userId_fkey` ON `response`;

-- DropIndex
DROP INDEX `service_bookings_userId_fkey` ON `service_bookings`;

-- AlterTable
ALTER TABLE `usersurvey` DROP COLUMN `completed`,
    ADD COLUMN `isCompleted` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `users`;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `iqamaNumber` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `profileImage` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `isSurveyCompleted` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    UNIQUE INDEX `User_memberId_key`(`memberId`),
    UNIQUE INDEX `User_iqamaNumber_key`(`iqamaNumber`),
    UNIQUE INDEX `User_phoneNumber_key`(`phoneNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSurveyProgress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `surveyId` INTEGER NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `lastQuestionId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserSurveyAnswer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `surveyId` INTEGER NOT NULL,
    `questionId` INTEGER NOT NULL,
    `answer` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `UserSurveyAnswer_userId_questionId_key`(`userId`, `questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profiles` ADD CONSTRAINT `profiles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contact_infos` ADD CONSTRAINT `contact_infos_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EventRegistration` ADD CONSTRAINT `EventRegistration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_bookings` ADD CONSTRAINT `service_bookings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSurvey` ADD CONSTRAINT `UserSurvey_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSurveyProgress` ADD CONSTRAINT `UserSurveyProgress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSurveyProgress` ADD CONSTRAINT `UserSurveyProgress_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `Survey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSurveyAnswer` ADD CONSTRAINT `UserSurveyAnswer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSurveyAnswer` ADD CONSTRAINT `UserSurveyAnswer_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `Survey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserSurveyAnswer` ADD CONSTRAINT `UserSurveyAnswer_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `Question`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Response` ADD CONSTRAINT `Response_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

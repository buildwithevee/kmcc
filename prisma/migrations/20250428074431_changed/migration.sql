/*
  Warnings:

  - You are about to drop the `goldinvestmentcycle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goldinvestmentlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goldinvestmentpayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `goldinvestmentwinner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `goldinvestmentlot` DROP FOREIGN KEY `GoldInvestmentLot_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `goldinvestmentlot` DROP FOREIGN KEY `GoldInvestmentLot_userId_fkey`;

-- DropForeignKey
ALTER TABLE `goldinvestmentpayment` DROP FOREIGN KEY `GoldInvestmentPayment_lotId_fkey`;

-- DropForeignKey
ALTER TABLE `goldinvestmentwinner` DROP FOREIGN KEY `GoldInvestmentWinner_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `goldinvestmentwinner` DROP FOREIGN KEY `GoldInvestmentWinner_lotId_fkey`;

-- DropTable
DROP TABLE `goldinvestmentcycle`;

-- DropTable
DROP TABLE `goldinvestmentlot`;

-- DropTable
DROP TABLE `goldinvestmentpayment`;

-- DropTable
DROP TABLE `goldinvestmentwinner`;

-- CreateTable
CREATE TABLE `gold_programs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gold_cycles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `programId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gold_lots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cycleId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `lotNumber` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `gold_lots_lotNumber_key`(`lotNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gold_monthly_data` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cycleId` INTEGER NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `drawDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `gold_monthly_data_cycleId_month_year_key`(`cycleId`, `month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gold_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `monthlyDataId` INTEGER NOT NULL,
    `lotId` INTEGER NOT NULL,
    `isPaid` BOOLEAN NOT NULL DEFAULT false,
    `paymentDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `gold_payments_monthlyDataId_lotId_key`(`monthlyDataId`, `lotId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gold_winners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `monthlyDataId` INTEGER NOT NULL,
    `lotId` INTEGER NOT NULL,
    `prizeAmount` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `programId` INTEGER NULL,
    `cycleId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `gold_cycles` ADD CONSTRAINT `gold_cycles_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `gold_programs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gold_lots` ADD CONSTRAINT `gold_lots_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `gold_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gold_lots` ADD CONSTRAINT `gold_lots_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gold_monthly_data` ADD CONSTRAINT `gold_monthly_data_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `gold_cycles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gold_payments` ADD CONSTRAINT `gold_payments_monthlyDataId_fkey` FOREIGN KEY (`monthlyDataId`) REFERENCES `gold_monthly_data`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gold_payments` ADD CONSTRAINT `gold_payments_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `gold_lots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gold_winners` ADD CONSTRAINT `gold_winners_monthlyDataId_fkey` FOREIGN KEY (`monthlyDataId`) REFERENCES `gold_monthly_data`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gold_winners` ADD CONSTRAINT `gold_winners_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `gold_lots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `gold_programs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `gold_cycles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - You are about to drop the `audit_logs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gold_cycles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gold_lots` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gold_monthly_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gold_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gold_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `gold_winners` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_programId_fkey`;

-- DropForeignKey
ALTER TABLE `audit_logs` DROP FOREIGN KEY `audit_logs_userId_fkey`;

-- DropForeignKey
ALTER TABLE `gold_cycles` DROP FOREIGN KEY `gold_cycles_programId_fkey`;

-- DropForeignKey
ALTER TABLE `gold_lots` DROP FOREIGN KEY `gold_lots_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `gold_lots` DROP FOREIGN KEY `gold_lots_userId_fkey`;

-- DropForeignKey
ALTER TABLE `gold_monthly_data` DROP FOREIGN KEY `gold_monthly_data_cycleId_fkey`;

-- DropForeignKey
ALTER TABLE `gold_payments` DROP FOREIGN KEY `gold_payments_lotId_fkey`;

-- DropForeignKey
ALTER TABLE `gold_payments` DROP FOREIGN KEY `gold_payments_monthlyDataId_fkey`;

-- DropForeignKey
ALTER TABLE `gold_winners` DROP FOREIGN KEY `gold_winners_lotId_fkey`;

-- DropForeignKey
ALTER TABLE `gold_winners` DROP FOREIGN KEY `gold_winners_monthlyDataId_fkey`;

-- DropTable
DROP TABLE `audit_logs`;

-- DropTable
DROP TABLE `gold_cycles`;

-- DropTable
DROP TABLE `gold_lots`;

-- DropTable
DROP TABLE `gold_monthly_data`;

-- DropTable
DROP TABLE `gold_payments`;

-- DropTable
DROP TABLE `gold_programs`;

-- DropTable
DROP TABLE `gold_winners`;

-- CreateTable
CREATE TABLE `GoldInvestmentCycle` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `GoldInvestmentCycle_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoldInvestmentLot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cycleId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `lotNumber` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlyPayment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lotId` INTEGER NOT NULL,
    `paymentMonth` DATETIME(3) NOT NULL,
    `isPaid` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `goldInvestmentCycleId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MonthlyWinner` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cycleId` INTEGER NOT NULL,
    `winnerLotId` INTEGER NOT NULL,
    `drawDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GoldInvestmentLot` ADD CONSTRAINT `GoldInvestmentLot_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `GoldInvestmentCycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoldInvestmentLot` ADD CONSTRAINT `GoldInvestmentLot_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlyPayment` ADD CONSTRAINT `MonthlyPayment_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `GoldInvestmentLot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlyPayment` ADD CONSTRAINT `MonthlyPayment_goldInvestmentCycleId_fkey` FOREIGN KEY (`goldInvestmentCycleId`) REFERENCES `GoldInvestmentCycle`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlyWinner` ADD CONSTRAINT `MonthlyWinner_cycleId_fkey` FOREIGN KEY (`cycleId`) REFERENCES `GoldInvestmentCycle`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MonthlyWinner` ADD CONSTRAINT `MonthlyWinner_winnerLotId_fkey` FOREIGN KEY (`winnerLotId`) REFERENCES `GoldInvestmentLot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

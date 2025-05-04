/*
  Warnings:

  - You are about to drop the column `profitReceived` on the `longterminvestment` table. All the data in the column will be lost.
  - You are about to drop the `investmentprofit` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `investmentprofit` DROP FOREIGN KEY `InvestmentProfit_investmentId_fkey`;

-- AlterTable
ALTER TABLE `longterminvestment` DROP COLUMN `profitReceived`,
    ADD COLUMN `profitDistributed` DOUBLE NOT NULL DEFAULT 0,
    ADD COLUMN `profitPending` DOUBLE NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE `investmentprofit`;

-- CreateTable
CREATE TABLE `ProfitPayout` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `investmentId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `payoutDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ProfitPayout` ADD CONSTRAINT `ProfitPayout_investmentId_fkey` FOREIGN KEY (`investmentId`) REFERENCES `LongTermInvestment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `LongTermInvestment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `totalDeposited` DOUBLE NOT NULL DEFAULT 0,
    `totalProfit` DOUBLE NOT NULL DEFAULT 0,
    `profitReceived` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvestmentDeposit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `investmentId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `depositDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvestmentProfit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `investmentId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `payoutDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LongTermInvestment` ADD CONSTRAINT `LongTermInvestment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvestmentDeposit` ADD CONSTRAINT `InvestmentDeposit_investmentId_fkey` FOREIGN KEY (`investmentId`) REFERENCES `LongTermInvestment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvestmentProfit` ADD CONSTRAINT `InvestmentProfit_investmentId_fkey` FOREIGN KEY (`investmentId`) REFERENCES `LongTermInvestment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

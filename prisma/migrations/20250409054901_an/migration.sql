/*
  Warnings:

  - A unique constraint covering the columns `[monthlyDataId,lotId]` on the table `gold_winners` will be added. If there are existing duplicate values, this will fail.

*/
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

-- CreateIndex
CREATE UNIQUE INDEX `gold_winners_monthlyDataId_lotId_key` ON `gold_winners`(`monthlyDataId`, `lotId`);

-- AddForeignKey
ALTER TABLE `gold_payments` ADD CONSTRAINT `gold_payments_monthlyDataId_fkey` FOREIGN KEY (`monthlyDataId`) REFERENCES `gold_monthly_data`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gold_payments` ADD CONSTRAINT `gold_payments_lotId_fkey` FOREIGN KEY (`lotId`) REFERENCES `gold_lots`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

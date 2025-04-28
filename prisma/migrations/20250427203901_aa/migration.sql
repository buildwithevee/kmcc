/*
  Warnings:

  - A unique constraint covering the columns `[lotId,month,year]` on the table `GoldInvestmentPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `GoldInvestmentPayment_lotId_month_year_key` ON `GoldInvestmentPayment`(`lotId`, `month`, `year`);

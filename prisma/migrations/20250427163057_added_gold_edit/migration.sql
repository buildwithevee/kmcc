/*
  Warnings:

  - A unique constraint covering the columns `[cycleId,month,year]` on the table `gold_monthly_data` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `gold_monthly_data_cycleId_month_year_key` ON `gold_monthly_data`(`cycleId`, `month`, `year`);

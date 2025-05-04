/*
  Warnings:

  - A unique constraint covering the columns `[userId,isActive]` on the table `LongTermInvestment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `LongTermInvestment_userId_isActive_key` ON `LongTermInvestment`(`userId`, `isActive`);

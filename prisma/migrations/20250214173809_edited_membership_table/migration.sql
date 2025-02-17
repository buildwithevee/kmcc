/*
  Warnings:

  - A unique constraint covering the columns `[memberId,iqamaNumber]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `memberships_memberId_iqamaNumber_key` ON `memberships`(`memberId`, `iqamaNumber`);

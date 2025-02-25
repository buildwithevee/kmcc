-- CreateTable
CREATE TABLE `Airport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `iataCode` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Airport_iataCode_key`(`iataCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Travel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `fromAirportId` INTEGER NOT NULL,
    `toAirportId` INTEGER NOT NULL,
    `travelDate` DATETIME(3) NOT NULL,
    `travelTime` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Travel` ADD CONSTRAINT `Travel_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Travel` ADD CONSTRAINT `Travel_fromAirportId_fkey` FOREIGN KEY (`fromAirportId`) REFERENCES `Airport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Travel` ADD CONSTRAINT `Travel_toAirportId_fkey` FOREIGN KEY (`toAirportId`) REFERENCES `Airport`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

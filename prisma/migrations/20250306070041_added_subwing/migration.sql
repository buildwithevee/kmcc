-- CreateTable
CREATE TABLE `SubWing` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `icon` LONGBLOB NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubWingMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `position` VARCHAR(191) NOT NULL,
    `image` LONGBLOB NULL,
    `subWingId` INTEGER NOT NULL,

    INDEX `SubWingMember_subWingId_idx`(`subWingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SubWingMember` ADD CONSTRAINT `SubWingMember_subWingId_fkey` FOREIGN KEY (`subWingId`) REFERENCES `SubWing`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

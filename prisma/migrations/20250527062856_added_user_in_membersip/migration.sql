-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `memberships`(`memberId`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS `RoleMenuAccess` (
    `roleId` VARCHAR(191) NOT NULL,
    `topMenu` VARCHAR(191) NOT NULL,
    `viewKey` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`roleId`, `topMenu`, `viewKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Element` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `thumbLabel` VARCHAR(191) NULL,
    `content` LONGTEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RoleMenuAccess`
    ADD CONSTRAINT `RoleMenuAccess_roleId_fkey`
    FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;

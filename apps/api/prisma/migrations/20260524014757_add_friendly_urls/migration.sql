-- CreateTable
CREATE TABLE `FriendlyUrl` (
    `id` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `targetType` VARCHAR(191) NOT NULL,
    `sectionId` VARCHAR(191) NULL,
    `contentId` VARCHAR(191) NULL,
    `primarySectionId` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `FriendlyUrl_path_key`(`path`),
    INDEX `FriendlyUrl_targetType_idx`(`targetType`),
    INDEX `FriendlyUrl_sectionId_idx`(`sectionId`),
    INDEX `FriendlyUrl_contentId_idx`(`contentId`),
    INDEX `FriendlyUrl_primarySectionId_idx`(`primarySectionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FriendlyUrl` ADD CONSTRAINT `FriendlyUrl_sectionId_fkey` FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FriendlyUrl` ADD CONSTRAINT `FriendlyUrl_contentId_fkey` FOREIGN KEY (`contentId`) REFERENCES `Content`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FriendlyUrl` ADD CONSTRAINT `FriendlyUrl_primarySectionId_fkey` FOREIGN KEY (`primarySectionId`) REFERENCES `Section`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

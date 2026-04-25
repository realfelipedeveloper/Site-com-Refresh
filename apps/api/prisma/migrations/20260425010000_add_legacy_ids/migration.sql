CREATE TABLE `LegacyApplication` (
  `id` VARCHAR(191) NOT NULL,
  `legacyId` INTEGER NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `area` VARCHAR(191) NOT NULL,
  `link` VARCHAR(191) NOT NULL,

  UNIQUE INDEX `LegacyApplication_legacyId_key`(`legacyId`),
  UNIQUE INDEX `LegacyApplication_name_key`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RoleApplicationAccess` (
  `id` VARCHAR(191) NOT NULL,
  `legacyId` INTEGER NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `appId` VARCHAR(191) NOT NULL,
  `canCreate` BOOLEAN NOT NULL DEFAULT false,
  `canUpdate` BOOLEAN NOT NULL DEFAULT false,
  `canDelete` BOOLEAN NOT NULL DEFAULT false,
  `canAccess` BOOLEAN NOT NULL DEFAULT true,

  UNIQUE INDEX `RoleApplicationAccess_legacyId_key`(`legacyId`),
  UNIQUE INDEX `RoleApplicationAccess_roleId_appId_key`(`roleId`, `appId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RoleApplicationAccess`
  ADD CONSTRAINT `RoleApplicationAccess_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RoleApplicationAccess`
  ADD CONSTRAINT `RoleApplicationAccess_appId_fkey`
  FOREIGN KEY (`appId`) REFERENCES `LegacyApplication`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `RoleSectionAccess` (
  `roleId` VARCHAR(191) NOT NULL,
  `sectionId` VARCHAR(191) NOT NULL,

  PRIMARY KEY (`roleId`, `sectionId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `RoleContentTypeAccess` (
  `roleId` VARCHAR(191) NOT NULL,
  `contentTypeId` VARCHAR(191) NOT NULL,

  PRIMARY KEY (`roleId`, `contentTypeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `SystemEmail` (
  `id` VARCHAR(191) NOT NULL,
  `legacyId` INTEGER NULL,
  `name` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `area` VARCHAR(191) NOT NULL,
  `description` TEXT NULL,
  `value` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `SystemEmail_legacyId_key`(`legacyId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RoleSectionAccess`
  ADD CONSTRAINT `RoleSectionAccess_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RoleSectionAccess`
  ADD CONSTRAINT `RoleSectionAccess_sectionId_fkey`
  FOREIGN KEY (`sectionId`) REFERENCES `Section`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RoleContentTypeAccess`
  ADD CONSTRAINT `RoleContentTypeAccess_roleId_fkey`
  FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `RoleContentTypeAccess`
  ADD CONSTRAINT `RoleContentTypeAccess_contentTypeId_fkey`
  FOREIGN KEY (`contentTypeId`) REFERENCES `ContentType`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `User` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `User_legacyId_key` ON `User`(`legacyId`);

ALTER TABLE `Role` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `Role_legacyId_key` ON `Role`(`legacyId`);

ALTER TABLE `Permission` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `Permission_legacyId_key` ON `Permission`(`legacyId`);

ALTER TABLE `Section` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `Section_legacyId_key` ON `Section`(`legacyId`);

ALTER TABLE `ContentType` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `ContentType_legacyId_key` ON `ContentType`(`legacyId`);


ALTER TABLE `Template` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `Template_legacyId_key` ON `Template`(`legacyId`);

ALTER TABLE `Element` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `Element_legacyId_key` ON `Element`(`legacyId`);

ALTER TABLE `Content` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `Content_legacyId_key` ON `Content`(`legacyId`);

ALTER TABLE `ContentRevision` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `ContentRevision_legacyId_key` ON `ContentRevision`(`legacyId`);

ALTER TABLE `MediaAsset` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `MediaAsset_legacyId_key` ON `MediaAsset`(`legacyId`);

ALTER TABLE `SeoMetadata` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `SeoMetadata_legacyId_key` ON `SeoMetadata`(`legacyId`);

ALTER TABLE `NewsletterCampaign` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `NewsletterCampaign_legacyId_key` ON `NewsletterCampaign`(`legacyId`);

ALTER TABLE `NewsletterGroup` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `NewsletterGroup_legacyId_key` ON `NewsletterGroup`(`legacyId`);

ALTER TABLE `NewsletterRecipient` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `NewsletterRecipient_legacyId_key` ON `NewsletterRecipient`(`legacyId`);

ALTER TABLE `NewsletterDispatch` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `NewsletterDispatch_legacyId_key` ON `NewsletterDispatch`(`legacyId`);

ALTER TABLE `AuditLog` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `AuditLog_legacyId_key` ON `AuditLog`(`legacyId`);

ALTER TABLE `PrivacyRequest` ADD COLUMN `legacyId` INTEGER NULL;
CREATE UNIQUE INDEX `PrivacyRequest_legacyId_key` ON `PrivacyRequest`(`legacyId`);

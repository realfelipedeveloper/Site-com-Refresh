-- AlterTable
ALTER TABLE `Content` ADD COLUMN `validFrom` DATETIME(3) NULL,
    ADD COLUMN `validUntil` DATETIME(3) NULL,
    ADD COLUMN `validateValidity` BOOLEAN NOT NULL DEFAULT false;

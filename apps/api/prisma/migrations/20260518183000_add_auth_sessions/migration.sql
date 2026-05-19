CREATE TABLE `AuthSession` (
  `id` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NULL,
  `tokenHash` VARCHAR(191) NOT NULL,
  `userAgent` TEXT NULL,
  `ipAddress` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `idleExpiresAt` DATETIME(3) NOT NULL,
  `absoluteExpiresAt` DATETIME(3) NOT NULL,
  `revokedAt` DATETIME(3) NULL,

  UNIQUE INDEX `AuthSession_tokenHash_key`(`tokenHash`),
  INDEX `AuthSession_userId_idx`(`userId`),
  INDEX `AuthSession_idleExpiresAt_idx`(`idleExpiresAt`),
  INDEX `AuthSession_absoluteExpiresAt_idx`(`absoluteExpiresAt`),
  INDEX `AuthSession_revokedAt_idx`(`revokedAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AuthSession`
  ADD CONSTRAINT `AuthSession_userId_fkey`
  FOREIGN KEY (`userId`) REFERENCES `User`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

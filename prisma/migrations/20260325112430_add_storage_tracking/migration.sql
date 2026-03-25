-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "size" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "additionalStorageGB" INTEGER NOT NULL DEFAULT 0;

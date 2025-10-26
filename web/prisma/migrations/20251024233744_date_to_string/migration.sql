/*
  Warnings:

  - Made the column `files` on table `health_events` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "health_events" ALTER COLUMN "date" SET DATA TYPE TEXT,
ALTER COLUMN "files" SET NOT NULL;

/*
  Warnings:

  - Added the required column `endTime` to the `health_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `professionalId` to the `health_events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `health_events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "health_events" ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "professionalId" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "health_events" ADD CONSTRAINT "health_events_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

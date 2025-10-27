/*
Warnings:

- The values [PROCEDURE,MEDICATION,OTHER] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;

CREATE TYPE "EventType_new" AS ENUM ('CONSULTA', 'EXAME');

ALTER TABLE "health_events" ALTER COLUMN "type" TYPE "EventType_new" USING ("type"::text::"EventType_new");

ALTER TYPE "EventType" RENAME TO "EventType_old";

ALTER TYPE "EventType_new" RENAME TO "EventType";

DROP TYPE "public"."EventType_old";

COMMIT;
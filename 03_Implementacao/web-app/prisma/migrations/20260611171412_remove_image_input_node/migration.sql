/*
  Warnings:

  - The values [IMAGE] on the enum `EmotionInputMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EmotionInputMode_new" AS ENUM ('TEXT', 'AUDIO', 'VIDEO');
ALTER TABLE "public"."emotion_records" ALTER COLUMN "inputMode" DROP DEFAULT;
ALTER TABLE "emotion_records" ALTER COLUMN "inputMode" TYPE "EmotionInputMode_new" USING ("inputMode"::text::"EmotionInputMode_new");
ALTER TYPE "EmotionInputMode" RENAME TO "EmotionInputMode_old";
ALTER TYPE "EmotionInputMode_new" RENAME TO "EmotionInputMode";
DROP TYPE "public"."EmotionInputMode_old";
ALTER TABLE "emotion_records" ALTER COLUMN "inputMode" SET DEFAULT 'TEXT';
COMMIT;

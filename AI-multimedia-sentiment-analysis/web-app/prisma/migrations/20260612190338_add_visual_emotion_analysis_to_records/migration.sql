-- AlterTable
ALTER TABLE "emotion_records" ADD COLUMN     "visualAnalysis" JSONB,
ADD COLUMN     "visualConfidence" DOUBLE PRECISION,
ADD COLUMN     "visualConfidenceLevel" TEXT,
ADD COLUMN     "visualEmodiaEmotion" TEXT,
ADD COLUMN     "visualEmotion" TEXT;

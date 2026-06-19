-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- AlterTable
ALTER TABLE "emotion_records" ADD COLUMN     "riskLevel" "RiskLevel" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "riskMessage" TEXT,
ADD COLUMN     "riskTerms" TEXT,
ADD COLUMN     "transcript" TEXT;

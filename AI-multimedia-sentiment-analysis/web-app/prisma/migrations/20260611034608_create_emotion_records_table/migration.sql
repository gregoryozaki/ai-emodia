-- CreateEnum
CREATE TYPE "EmotionType" AS ENUM ('ALEGRIA', 'TRISTEZA', 'RAIVA', 'MEDO', 'NOJO', 'ANSIEDADE');

-- CreateEnum
CREATE TYPE "EmotionInputMode" AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "emotion_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emotion" "EmotionType" NOT NULL,
    "inputMode" "EmotionInputMode" NOT NULL DEFAULT 'TEXT',
    "content" TEXT,
    "intensity" INTEGER,
    "trigger" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emotion_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "sid" VARCHAR NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "emotion_records_userId_createdAt_idx" ON "emotion_records"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "IDX_session_expire" ON "session"("expire");

-- AddForeignKey
ALTER TABLE "emotion_records" ADD CONSTRAINT "emotion_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

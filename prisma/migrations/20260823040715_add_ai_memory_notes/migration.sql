-- CreateTable
CREATE TABLE "AiMemoryNote" (
    "id" TEXT NOT NULL,
    "psicologoId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiMemoryNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiMemoryNote_psicologoId_idx" ON "AiMemoryNote"("psicologoId");

-- AddForeignKey
ALTER TABLE "AiMemoryNote" ADD CONSTRAINT "AiMemoryNote_psicologoId_fkey" FOREIGN KEY ("psicologoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

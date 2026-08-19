/*
  Warnings:

  - You are about to drop the column `soapJson` on the `ClinicalNote` table. All the data in the column will be lost.
  - Added the required column `contenidoJson` to the `ClinicalNote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClinicalNote" DROP COLUMN "soapJson",
ADD COLUMN     "contenidoJson" JSONB NOT NULL;

-- CreateTable
CREATE TABLE "HistoriaClinica" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HistoriaClinica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HistoriaClinica_patientId_key" ON "HistoriaClinica"("patientId");

-- CreateIndex
CREATE INDEX "HistoriaClinica_patientId_idx" ON "HistoriaClinica"("patientId");

-- AddForeignKey
ALTER TABLE "HistoriaClinica" ADD CONSTRAINT "HistoriaClinica_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

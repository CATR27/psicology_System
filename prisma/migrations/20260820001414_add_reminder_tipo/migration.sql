/*
  Warnings:

  - Added the required column `destinatarioEmail` to the `Reminder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `Reminder` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReminderTipo" AS ENUM ('PSICOLOGO_DIA_ANTES', 'PSICOLOGO_HORA_ANTES', 'PACIENTE_DIA_ANTES');

-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "destinatarioEmail" TEXT NOT NULL,
ADD COLUMN     "tipo" "ReminderTipo" NOT NULL;

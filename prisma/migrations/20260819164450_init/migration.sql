-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PSICOLOGO', 'RECEPCION');

-- CreateEnum
CREATE TYPE "ConsentTipo" AS ENUM ('GRABACION', 'TRATAMIENTO_IA');

-- CreateEnum
CREATE TYPE "PatientEstado" AS ENUM ('ACTIVO', 'INACTIVO', 'ALTA');

-- CreateEnum
CREATE TYPE "AppointmentEstado" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "RecordingEstado" AS ENUM ('PENDIENTE', 'SUBIDO', 'TRANSCRIBIENDO', 'TRANSCRITO', 'ANALIZANDO', 'LISTO', 'FALLIDO');

-- CreateEnum
CREATE TYPE "Hablante" AS ENUM ('PSICOLOGO', 'PACIENTE');

-- CreateEnum
CREATE TYPE "ClinicalNoteEstado" AS ENUM ('BORRADOR', 'FIRMADA');

-- CreateEnum
CREATE TYPE "ReminderCanal" AS ENUM ('EMAIL');

-- CreateEnum
CREATE TYPE "ReminderEstado" AS ENUM ('PENDIENTE', 'ENVIADO', 'FALLIDO');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "zonaHoraria" TEXT NOT NULL DEFAULT 'America/Mexico_City',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "rol" "Role" NOT NULL DEFAULT 'PSICOLOGO',
    "cedulaProfesional" TEXT,
    "nombre" TEXT,
    "email" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "psicologoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "contacto" TEXT,
    "estado" "PatientEstado" NOT NULL DEFAULT 'ACTIVO',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "tipo" "ConsentTipo" NOT NULL,
    "otorgadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revocadoEn" TIMESTAMP(3),
    "evidenciaUrl" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "psicologoId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" "AppointmentEstado" NOT NULL DEFAULT 'PROGRAMADA',
    "googleEventId" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT,
    "patientId" TEXT NOT NULL,
    "psicologoId" TEXT NOT NULL,
    "numeroSesion" INTEGER NOT NULL,
    "iniciadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "r2Key" TEXT,
    "duracionSeg" INTEGER,
    "bytes" INTEGER,
    "estado" "RecordingEstado" NOT NULL DEFAULT 'PENDIENTE',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "borradoEn" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadaEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" TEXT NOT NULL,
    "recordingId" TEXT NOT NULL,
    "proveedor" TEXT NOT NULL DEFAULT 'deepgram',
    "idioma" TEXT NOT NULL DEFAULT 'es',
    "textoCompleto" TEXT NOT NULL,
    "confianza" DOUBLE PRECISION,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" TEXT NOT NULL,
    "transcriptId" TEXT NOT NULL,
    "hablante" "Hablante" NOT NULL,
    "msInicio" INTEGER NOT NULL,
    "msFin" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicalNote" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "estado" "ClinicalNoteEstado" NOT NULL DEFAULT 'BORRADOR',
    "soapJson" JSONB NOT NULL,
    "generadaPorIa" BOOLEAN NOT NULL DEFAULT false,
    "editadaPorId" TEXT,
    "firmadaEn" TIMESTAMP(3),
    "firmadaPorId" TEXT,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAnalysis" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "modelo" TEXT,
    "tokensIn" INTEGER,
    "tokensOut" INTEGER,
    "costoUsd" DOUBLE PRECISION,
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmotionMetric" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "puntaje" DOUBLE PRECISION NOT NULL,
    "msInicio" INTEGER NOT NULL,

    CONSTRAINT "EmotionMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "canal" "ReminderCanal" NOT NULL DEFAULT 'EMAIL',
    "programadoPara" TIMESTAMP(3) NOT NULL,
    "enviadoEn" TIMESTAMP(3),
    "estado" "ReminderEstado" NOT NULL DEFAULT 'PENDIENTE',
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "actorId" TEXT,
    "accion" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "recursoId" TEXT,
    "ip" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_clerkOrgId_key" ON "Organization"("clerkOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkUserId_key" ON "User"("clerkUserId");

-- CreateIndex
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- CreateIndex
CREATE INDEX "Patient_orgId_idx" ON "Patient"("orgId");

-- CreateIndex
CREATE INDEX "Patient_psicologoId_idx" ON "Patient"("psicologoId");

-- CreateIndex
CREATE INDEX "Patient_orgId_psicologoId_idx" ON "Patient"("orgId", "psicologoId");

-- CreateIndex
CREATE INDEX "Consent_patientId_idx" ON "Consent"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_orgId_idx" ON "Appointment"("orgId");

-- CreateIndex
CREATE INDEX "Appointment_psicologoId_idx" ON "Appointment"("psicologoId");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Session_patientId_idx" ON "Session"("patientId");

-- CreateIndex
CREATE INDEX "Session_psicologoId_idx" ON "Session"("psicologoId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_patientId_numeroSesion_key" ON "Session"("patientId", "numeroSesion");

-- CreateIndex
CREATE INDEX "Recording_sessionId_idx" ON "Recording"("sessionId");

-- CreateIndex
CREATE INDEX "Recording_estado_idx" ON "Recording"("estado");

-- CreateIndex
CREATE INDEX "Transcript_recordingId_idx" ON "Transcript"("recordingId");

-- CreateIndex
CREATE INDEX "TranscriptSegment_transcriptId_idx" ON "TranscriptSegment"("transcriptId");

-- CreateIndex
CREATE INDEX "ClinicalNote_sessionId_idx" ON "ClinicalNote"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicalNote_sessionId_version_key" ON "ClinicalNote"("sessionId", "version");

-- CreateIndex
CREATE INDEX "AiAnalysis_sessionId_idx" ON "AiAnalysis"("sessionId");

-- CreateIndex
CREATE INDEX "EmotionMetric_sessionId_idx" ON "EmotionMetric"("sessionId");

-- CreateIndex
CREATE INDEX "Reminder_appointmentId_idx" ON "Reminder"("appointmentId");

-- CreateIndex
CREATE INDEX "Reminder_programadoPara_idx" ON "Reminder"("programadoPara");

-- CreateIndex
CREATE INDEX "Reminder_estado_idx" ON "Reminder"("estado");

-- CreateIndex
CREATE INDEX "AuditLog_orgId_idx" ON "AuditLog"("orgId");

-- CreateIndex
CREATE INDEX "AuditLog_recurso_recursoId_idx" ON "AuditLog"("recurso", "recursoId");

-- CreateIndex
CREATE INDEX "AuditLog_creadoEn_idx" ON "AuditLog"("creadoEn");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_psicologoId_fkey" FOREIGN KEY ("psicologoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_psicologoId_fkey" FOREIGN KEY ("psicologoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_psicologoId_fkey" FOREIGN KEY ("psicologoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recording" ADD CONSTRAINT "Recording_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_recordingId_fkey" FOREIGN KEY ("recordingId") REFERENCES "Recording"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_editadaPorId_fkey" FOREIGN KEY ("editadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicalNote" ADD CONSTRAINT "ClinicalNote_firmadaPorId_fkey" FOREIGN KEY ("firmadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiAnalysis" ADD CONSTRAINT "AiAnalysis_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmotionMetric" ADD CONSTRAINT "EmotionMetric_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reminder" ADD CONSTRAINT "Reminder_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

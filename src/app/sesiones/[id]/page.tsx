import Link from "next/link";

import { getSession } from "@/lib/dal/sessions";
import { listNoteVersions } from "@/lib/dal/notes";
import { hasActiveConsent } from "@/lib/dal/consents";
import { listSessionRecordings } from "@/lib/dal/recordings";
import type { FormatoSesion } from "@/lib/schemas/formato-sesion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormatoSesionEditor } from "@/components/formato-sesion-editor";
import { FormatoSesionView } from "@/components/formato-sesion-view";
import { SignNoteButton } from "@/components/sign-note-button";
import { LeaveSessionLink } from "@/components/leave-session-link";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { RecordingSection } from "@/components/recorder/recording-section";

export default async function SesionDetallePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nueva?: string }>;
}) {
  const { id } = await params;
  const { nueva } = await searchParams;
  const session = await getSession(id);
  const versions = await listNoteVersions(id);
  const consentida = await hasActiveConsent(session.patient.id, "GRABACION");
  const recordings = await listSessionRecordings(id);

  const latestNote = versions[0] ?? null;
  const hasTranscript = recordings.some((r) => r.estado === "TRANSCRITO");

  let noteSection;
  if (!latestNote) {
    noteSection = (
      <FormatoSesionEditor sessionId={id} hasTranscript={hasTranscript} />
    );
  } else if (latestNote.estado === "BORRADOR") {
    noteSection = (
      <div className="space-y-4">
        <FormatoSesionEditor
          sessionId={id}
          noteId={latestNote.id}
          initial={latestNote.contenidoJson as unknown as FormatoSesion}
          hasTranscript={hasTranscript}
        />
        <SignNoteButton noteId={latestNote.id} sessionId={id} />
      </div>
    );
  } else if (nueva === "1") {
    noteSection = (
      <FormatoSesionEditor
        sessionId={id}
        initial={latestNote.contenidoJson as unknown as FormatoSesion}
        hasTranscript={hasTranscript}
      />
    );
  } else {
    noteSection = (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge>Firmada</Badge>
          <span className="text-sm text-muted-foreground">
            por {latestNote.firmante?.nombre ?? "—"} el{" "}
            {latestNote.firmadaEn
              ? new Date(latestNote.firmadaEn).toLocaleString("es-MX")
              : "—"}
          </span>
        </div>
        <FormatoSesionView
          data={latestNote.contenidoJson as unknown as FormatoSesion}
        />
        <Link href={`/sesiones/${id}?nueva=1`}>
          <Button variant="outline">Nueva versión</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-6 space-y-6">
      <div className="space-y-1">
        <LeaveSessionLink
          href={`/pacientes/${session.patient.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {session.patient.nombre}
        </LeaveSessionLink>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Consulta · Sesión {session.numeroSesion}
          </h1>
          {latestNote && (
            <a href={`/api/sesiones/${id}/pdf`} target="_blank">
              <Button variant="outline" size="sm">
                Descargar PDF
              </Button>
            </a>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {new Date(session.iniciadaEn).toLocaleString("es-MX")}
        </p>
      </div>

      <RecordingSection
        sessionId={id}
        hasConsent={consentida}
        initialRecordings={recordings}
      />

      <Card>
        <CardHeader>
          <CardTitle>Registro de la consulta</CardTitle>
        </CardHeader>
        <CardContent>{noteSection}</CardContent>
      </Card>

      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historial de versiones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <span className="text-sm">Versión {v.version}</span>
                  <div className="flex items-center gap-2">
                    {v.firmadaEn && (
                      <span className="text-xs text-muted-foreground">
                        firmada{" "}
                        {new Date(v.firmadaEn).toLocaleDateString("es-MX")}
                      </span>
                    )}
                    <Badge
                      variant={v.estado === "FIRMADA" ? "default" : "secondary"}
                    >
                      {v.estado === "FIRMADA" ? "Firmada" : "Borrador"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end border-t pt-4">
        <DeleteSessionButton sessionId={id} patientId={session.patient.id} />
      </div>
    </div>
  );
}

import Link from "next/link";

import { getSession } from "@/lib/dal/sessions";
import { listNoteVersions } from "@/lib/dal/notes";
import type { SoapNote } from "@/lib/schemas/note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NoteEditor } from "@/components/note-editor";
import { NoteView } from "@/components/note-view";
import { SignNoteButton } from "@/components/sign-note-button";

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

  const latestNote = versions[0] ?? null;

  let noteSection;
  if (!latestNote) {
    noteSection = <NoteEditor sessionId={id} />;
  } else if (latestNote.estado === "BORRADOR") {
    noteSection = (
      <div className="space-y-4">
        <NoteEditor
          sessionId={id}
          noteId={latestNote.id}
          initial={latestNote.soapJson as unknown as SoapNote}
        />
        <SignNoteButton noteId={latestNote.id} sessionId={id} />
      </div>
    );
  } else if (nueva === "1") {
    noteSection = (
      <NoteEditor
        sessionId={id}
        initial={latestNote.soapJson as unknown as SoapNote}
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
        <NoteView soap={latestNote.soapJson as unknown as SoapNote} />
        <Link href={`/sesiones/${id}?nueva=1`}>
          <Button variant="outline">Nueva versión</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-6 space-y-6">
      <div className="space-y-1">
        <Link
          href={`/pacientes/${session.patient.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {session.patient.nombre}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Sesión {session.numeroSesion}
        </h1>
        <p className="text-sm text-muted-foreground">
          {new Date(session.iniciadaEn).toLocaleString("es-MX")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Nota clínica</CardTitle>
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
                  <span className="text-sm">
                    Versión {v.version}
                    {v.generadaPorIa ? " · generada por IA" : ""}
                  </span>
                  <div className="flex items-center gap-2">
                    {v.firmadaEn && (
                      <span className="text-xs text-muted-foreground">
                        firmada {new Date(v.firmadaEn).toLocaleDateString("es-MX")}
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
    </div>
  );
}

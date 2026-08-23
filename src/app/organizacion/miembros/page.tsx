import { listOrgMembers } from "@/lib/dal/invitations";
import { InviteMemberForm } from "@/components/invite-member-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const ROL_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  PSICOLOGO: "Psicólogo",
  RECEPCION: "Recepción",
};

export default async function MiembrosPage() {
  const members = await listOrgMembers();

  return (
    <div className="max-w-3xl mx-auto w-full py-8 px-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Miembros</h1>
        <p className="text-muted-foreground text-sm">
          Invita a un psicólogo o recepcionista de tu clínica por correo.
        </p>
      </div>

      <InviteMemberForm />

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Miembros actuales
        </h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id}>
              <Card>
                <CardContent className="flex items-center justify-between py-3">
                  <div className="space-y-0.5">
                    <p className="font-medium">{m.nombre ?? m.email ?? m.id}</p>
                    {m.email && (
                      <p className="text-sm text-muted-foreground">
                        {m.email}
                      </p>
                    )}
                  </div>
                  <Badge variant="secondary">{ROL_LABEL[m.rol]}</Badge>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

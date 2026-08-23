import Link from "next/link";
import { Show } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Expedientes clínicos con IA
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Graba, transcribe y analiza sesiones de psicoterapia para generar
          expedientes clínicos estructurados. Con agenda y recordatorios.
        </p>
        <Show when="signed-out">
          <div className="flex items-center justify-center gap-3">
            <Button
              render={<Link href="/sign-in" />}
              className="rounded-full border-0 px-6"
              style={{
                background: "var(--brand-accent)",
                color: "var(--brand-on-accent)",
              }}
            >
              Iniciar sesión
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            El acceso es solo por invitación de tu clínica.
          </p>
        </Show>
      </div>
    </div>
  );
}

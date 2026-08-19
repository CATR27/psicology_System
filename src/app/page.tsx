import { Show, SignInButton, SignUpButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 px-6">
      <div className="max-w-xl text-center space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          Expedientes clínicos con IA
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Graba, transcribe y analiza sesiones de psicoterapia para generar
          expedientes clínicos estructurados. Con agenda y recordatorios.
        </p>
        <Show when="signed-out">
          <div className="flex items-center justify-center gap-3">
            <SignInButton mode="modal">
              <Button variant="outline">Iniciar sesión</Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button>Crear cuenta</Button>
            </SignUpButton>
          </div>
        </Show>
        <Show when="signed-in">
          <p className="text-sm text-muted-foreground">
            Bienvenido. Crea una organización para comenzar.
          </p>
        </Show>
      </div>
    </div>
  );
}

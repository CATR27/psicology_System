"use client";

import { useEffect, useRef, type ReactNode } from "react";

import type { VeraTheme } from "@/components/auth/use-vera-theme";

const WAVE_BARS = Array.from({ length: 48 });

function setCursorGlow(event: React.MouseEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

interface VeraAuthShellProps {
  theme: VeraTheme;
  onToggleTheme: () => void;
  children: ReactNode;
}

export function VeraAuthShell({
  theme,
  onToggleTheme,
  children,
}: VeraAuthShellProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    rootRef.current?.setAttribute("data-theme", theme);
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <div ref={rootRef} className="vera-auth">
      <button
        type="button"
        className="theme-toggle"
        aria-label={isDark ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
        aria-pressed={isDark}
        onClick={onToggleTheme}
        onMouseMove={setCursorGlow}
      >
        <svg
          className="icon-sun"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.4M12 19.1v2.4M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7" />
        </svg>
        <svg
          className="icon-moon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
        </svg>
      </button>

      <div className="auth-shell">
        <div className="auth-frame">
          <section className="auth-visual" onMouseMove={setCursorGlow}>
            <div
              className="visual-bg-photo"
              role="img"
              aria-label="Psicóloga trabajando por la noche en su despacho, con Vera abierto en su portátil junto a plantas y luz cálida"
            />
            <div className="aurora" aria-hidden="true">
              <span className="aurora-blob b1" />
              <span className="aurora-blob b2" />
              <span className="aurora-blob b3" />
            </div>
            <svg
              className="wave-line"
              viewBox="0 0 500 120"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M0,70 C 80,40 160,100 250,70 C 340,40 420,100 500,70 L500,120 L0,120 Z"
                fill="color-mix(in oklch, var(--auth-accent) 22%, transparent)"
              />
            </svg>

            <div className="visual-content">
              <div className="brand-mark" aria-hidden="true">
                V
              </div>
              <p className="eyebrow">Acceso para profesionales</p>
              <h1>El espacio donde cuidas mejor a quienes confían en ti.</h1>
              <p className="lead">
                Expedientes clínicos con IA para psicoterapia: graba, transcribe
                y documenta cada sesión con calma y precisión.
              </p>
            </div>

            <div className="visual-waveform" aria-hidden="true">
              <div className="waveform-head">
                <span className="rec-dot" />
                <span className="waveform-label">
                  Grabación · Transcripción
                </span>
              </div>
              <div className="waveform-bars">
                {WAVE_BARS.map((_, i) => (
                  <span key={i} />
                ))}
              </div>
            </div>
          </section>

          <section className="auth-form-panel">
            <div className="auth-card" onMouseMove={setCursorGlow}>
              {children}
            </div>
            <div className="auth-foot meta">
              <span>Cifrado de extremo a extremo</span>
              <span>·</span>
              <span>Cumple NOM-004</span>
              <span>·</span>
              <span>Vera © 2026</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

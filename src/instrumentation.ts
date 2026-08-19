import type { Instrumentation } from "next";
import * as Sentry from "@sentry/nextjs";

const CLINICAL_KEYS =
  /(transcript|segment|soap|texto|text|contenido|content|body|nota|note|diagnos|emotion|emoci|riesgo|risk|paciente|patient|audio|mensaje|message)/i;

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(scrub);
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] = CLINICAL_KEYS.test(key) ? "[REDACTED]" : scrub(v);
    }
    return out;
  }
  return value;
}

function beforeSend(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  // Nunca enviar el cuerpo del request: puede contener contenido clínico.
  if (event.request) {
    event.request.data = undefined;
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((breadcrumb) =>
      breadcrumb.data
        ? { ...breadcrumb, data: scrub(breadcrumb.data) as object }
        : breadcrumb,
    );
  }
  if (event.extra) {
    event.extra = scrub(event.extra) as Record<string, unknown>;
  }
  return event;
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      tracesSampleRate: 0.1,
      beforeSend,
    });
  }
}

export const onRequestError: Instrumentation.onRequestError = (
  error,
  request,
  context,
) => {
  Sentry.captureRequestError(error, request, context);
};

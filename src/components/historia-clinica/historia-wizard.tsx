"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { saveHistoriaAction } from "@/app/actions/historias";
import {
  emptyHistoriaClinica,
  computeHistoriaProgress,
  computeProgress,
  type HistoriaClinica,
} from "@/lib/schemas/historia-clinica";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SENTIMIENTOS = [
  "Temeroso", "Irritado", "Enojado", "Ansioso", "Avergonzado", "Triste",
  "Tranquilo", "Animado", "Satisfecho", "Culpable", "Enérgico", "Deprimido",
  "Preocupado", "Entusiasmado", "Indiferente", "Feliz", "Esperanzado",
  "Humillado", "Inseguro", "Suicida", "Desesperanzado", "Asustado",
];

const PENSAMIENTOS = [
  "No puedo hacer esto", "Lo intentaré", "No vale la pena intentarlo",
  "Voy a esforzarme al máximo", "Puedo lidiar con este problema",
  "Tengo talentos valiosos", "Todos van a reírse de mí", "Tengo buenas ideas",
  "Nunca he podido triunfar", "No merezco ser amado", "Merezco más",
  "Nadie es perfecto",
];

const ANTECEDENTES_INFANCIA = [
  "Infancia feliz", "Problemas familiares", "Problemas emocionales",
  "Problemas de conducta", "Problemas escolares", "Problemas médicos",
  "Mojar la cama", "Tartamudez", "Comerse las uñas", "Chuparse el dedo",
  "Infancia infeliz", "Terrores nocturnos", "Temores o miedos", "Abuso sexual",
  "Abuso de drogas",
];

const SOMATIZACIONES = [
  "Dolores de cabeza", "Presión Alta", "Presión Baja", "Vómitos",
  "Dolor de espalda", "Diarrea", "Problemas para dormir", "Problemas cardíacos",
  "Estreñimiento", "Despertarse durante la noche", "Alergias", "Poco apetito",
  "Problemas de la piel", "Náuseas", "Comer en exceso",
];

const HEREDOFAMILIARES = [
  "Problemas de tiroides", "Enfermedad Neurológica", "Glaucoma",
  "Problemas renales", "Problemas de presión", "Epilepsia", "Asma",
  "Problemas gastrointestinales", "Alcoholismo", "Cáncer",
  "Problemas de próstata", "Diabetes", "Dolores de cabeza", "Otros",
];

const SECCIONES = [
  "Identificación",
  "Historia familiar",
  "Relaciones interpersonales",
  "Factores emocionales",
  "Factores biológicos",
  "Adicciones",
  "Antecedentes escolares",
  "Antecedentes laborales",
  "Situación actual",
  "Agregado del paciente",
  "Observaciones",
];

type Props = { patientId: string; initial: HistoriaClinica };

export function HistoriaWizard({ patientId, initial }: Props) {
  const [data, setData] = useState<HistoriaClinica>(
    initial ?? emptyHistoriaClinica,
  );
  const [active, setActive] = useState(0);
  const [status, setStatus] = useState<"guardado" | "guardando" | "error">(
    "guardado",
  );
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextSave = useRef(false);

  const save = useCallback(
    async (d: HistoriaClinica) => {
      setStatus("guardando");
      const res = await saveHistoriaAction(patientId, d);
      setStatus(res.ok ? "guardado" : "error");
    },
    [patientId],
  );

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(data), 1200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [data, save]);

  const progress = computeHistoriaProgress(data);
  const seccionData = [
    data.identificacion,
    data.historiaFamiliar,
    data.relacionesInterpersonales,
    data.factoresEmocionales,
    data.factoresBiologicos,
    data.adicciones,
    data.antecedentesEscolares,
    data.antecedentesLaborales,
    data.situacionActual,
    data.agregadoPaciente,
    data.observacionesGenerales,
  ];

  function toggleChip(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  function renderSection() {
    switch (active) {
      case 0:
        return (
          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Apodo">
              <Input value={data.identificacion.apodo} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, apodo: e.target.value } }))} />
            </Field>
            <Field label="Sexo">
              <Input value={data.identificacion.sexo} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, sexo: e.target.value } }))} />
            </Field>
            <Field label="Lugar de elaboración">
              <Input value={data.identificacion.lugarElaboracion} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, lugarElaboracion: e.target.value } }))} />
            </Field>
            <Field label="Fecha de elaboración">
              <Input type="date" value={data.identificacion.fechaElaboracion} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, fechaElaboracion: e.target.value } }))} />
            </Field>
            <Field label="Lugar de nacimiento">
              <Input value={data.identificacion.lugarNacimiento} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, lugarNacimiento: e.target.value } }))} />
            </Field>
            <Field label="Escolaridad">
              <Input value={data.identificacion.escolaridad} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, escolaridad: e.target.value } }))} />
            </Field>
            <Field label="Ocupación actual">
              <Input value={data.identificacion.ocupacionActual} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, ocupacionActual: e.target.value } }))} />
            </Field>
            <Field label="Estado civil">
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={data.identificacion.estadoCivil ?? ""}
                onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, estadoCivil: (e.target.value || null) as HistoriaClinica["identificacion"]["estadoCivil"] } }))}
              >
                <option value="">—</option>
                <option>Soltero</option>
                <option>Separado</option>
                <option>Viudo</option>
                <option>Divorciado</option>
                <option>Casado</option>
                <option>UnionLibre</option>
              </select>
            </Field>
            <Field label="Dirección actual">
              <Textarea rows={2} value={data.identificacion.direccionActual} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, direccionActual: e.target.value } }))} />
            </Field>
            <BoolRow label="¿Se ha vuelto a casar?" checked={data.identificacion.vueltoACasar} onChange={(v) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, vueltoACasar: v } }))} />
            <Field label="¿Cuántas veces?">
              <Num value={data.identificacion.vecesVueltoACasar} onChange={(v) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, vecesVueltoACasar: v } }))} />
            </Field>
            <BoolRow label="Vivienda adecuada (habitantes y servicios)" checked={data.identificacion.viviendaAdecuada} onChange={(v) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, viviendaAdecuada: v } }))} />
            <Field label="¿Quiénes la habitan?">
              <Input value={data.identificacion.habitantesVivienda} onChange={(e) => setData((d) => ({ ...d, identificacion: { ...d.identificacion, habitantesVivienda: e.target.value } }))} />
            </Field>
          </section>
        );
      case 1:
        return (
          <section className="space-y-6">
            <Persona title="Padre" p={data.historiaFamiliar.padre} onChange={(p) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, padre: p } }))} />
            <Persona title="Madre" p={data.historiaFamiliar.madre} onChange={(p) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, madre: p } }))} />
            <Field label="Madrastra / Padrastro">
              <Input value={data.historiaFamiliar.madrastraPadrastro} onChange={(e) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, madrastraPadrastro: e.target.value } }))} />
            </Field>
            <PersonaLista title="Hermanos" items={data.historiaFamiliar.hermanos} onChange={(hermanos) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, hermanos } }))} />
            <Sub title="Pareja">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre">
                  <Input value={data.historiaFamiliar.pareja.nombre} onChange={(e) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, pareja: { ...d.historiaFamiliar.pareja, nombre: e.target.value } } }))} />
                </Field>
                <Field label="Edad">
                  <Num value={data.historiaFamiliar.pareja.edad} onChange={(v) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, pareja: { ...d.historiaFamiliar.pareja, edad: v } } }))} />
                </Field>
              </div>
            </Sub>
            <PersonaLista title="Hijos" items={data.historiaFamiliar.hijos} onChange={(hijos) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, hijos } }))} />
            <Field label="Abuelos (si son tutores)">
              <Input value={data.historiaFamiliar.tutoresAbuelos} onChange={(e) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, tutoresAbuelos: e.target.value } }))} />
            </Field>
            <Chips label="Antecedentes de la infancia" options={ANTECEDENTES_INFANCIA} selected={data.historiaFamiliar.antecedentesInfancia} onToggle={(v) => setData((d) => ({ ...d, historiaFamiliar: { ...d.historiaFamiliar, antecedentesInfancia: toggleChip(d.historiaFamiliar.antecedentesInfancia, v) } }))} />
          </section>
        );
      case 2:
        return (
          <section className="space-y-6">
            <Sub title="Familia de origen">
              <div className="grid gap-4 sm:grid-cols-2">
                <BoolRow label="¿Se crió con sus padres?" checked={data.relacionesInterpersonales.familiaOrigen.crioConPadres} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, crioConPadres: v } } }))} />
                <Field label="¿Con quién?">
                  <Input value={data.relacionesInterpersonales.familiaOrigen.conQuienCrio} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, conQuienCrio: e.target.value } } }))} />
                </Field>
                <Field label="¿Desde qué edad?">
                  <Num value={data.relacionesInterpersonales.familiaOrigen.desdeEdad} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, desdeEdad: v } } }))} />
                </Field>
                <Field label="¿Cuánto tiempo?">
                  <Input value={data.relacionesInterpersonales.familiaOrigen.cuantoTiempo} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, cuantoTiempo: e.target.value } } }))} />
                </Field>
                <Field label="Relación con el padre">
                  <Textarea rows={2} value={data.relacionesInterpersonales.familiaOrigen.relacionPadre} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, relacionPadre: e.target.value } } }))} />
                </Field>
                <Field label="Relación con la madre">
                  <Textarea rows={2} value={data.relacionesInterpersonales.familiaOrigen.relacionMadre} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, relacionMadre: e.target.value } } }))} />
                </Field>
                <Field label="Relación con hermanos">
                  <Textarea rows={2} value={data.relacionesInterpersonales.familiaOrigen.relacionHermanos} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, relacionHermanos: e.target.value } } }))} />
                </Field>
                <BoolRow label="¿Cuidaba hermanos?" checked={data.relacionesInterpersonales.familiaOrigen.cuidarHermanos} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, cuidarHermanos: v } } }))} />
                <BoolRow label="¿Trabajaba?" checked={data.relacionesInterpersonales.familiaOrigen.trabajar} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, trabajar: v } } }))} />
                <BoolRow label="¿Hacía quehacer del hogar?" checked={data.relacionesInterpersonales.familiaOrigen.quehacerHogar} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, quehacerHogar: v } } }))} />
                <Field label="Disciplina / castigo">
                  <Input value={data.relacionesInterpersonales.familiaOrigen.disciplinaCastigo} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, disciplinaCastigo: e.target.value } } }))} />
                </Field>
                <Field label="Disciplinado por">
                  <Input value={data.relacionesInterpersonales.familiaOrigen.disciplinadoPor} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, disciplinadoPor: e.target.value } } }))} />
                </Field>
                <Field label="Características familiares (comunicación, afectos, disciplina)">
                  <Textarea rows={2} value={data.relacionesInterpersonales.familiaOrigen.caracteristicasFamiliares} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, familiaOrigen: { ...d.relacionesInterpersonales.familiaOrigen, caracteristicasFamiliares: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
            <Sub title="Amistades">
              <div className="grid gap-4 sm:grid-cols-2">
                <BoolRow label="¿Hace amigos fácilmente?" checked={data.relacionesInterpersonales.amistades.haceAmigosFacilmente} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, amistades: { ...d.relacionesInterpersonales.amistades, haceAmigosFacilmente: v } } }))} />
                <BoolRow label="¿Conserva la amistad?" checked={data.relacionesInterpersonales.amistades.conservaAmistad} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, amistades: { ...d.relacionesInterpersonales.amistades, conservaAmistad: v } } }))} />
                <Field label="Expresa sentimientos directamente">
                  <Input value={data.relacionesInterpersonales.amistades.expresaSentimientos} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, amistades: { ...d.relacionesInterpersonales.amistades, expresaSentimientos: e.target.value } } }))} />
                </Field>
                <Field label="Amigos íntimos">
                  <Textarea rows={2} value={data.relacionesInterpersonales.amistades.amigosIntimos} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, amistades: { ...d.relacionesInterpersonales.amistades, amigosIntimos: e.target.value } } }))} />
                </Field>
                <Field label="Conflictos en amistades">
                  <Textarea rows={2} value={data.relacionesInterpersonales.amistades.conflictosAmistades} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, amistades: { ...d.relacionesInterpersonales.amistades, conflictosAmistades: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
            <Sub title="Sexualidad">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Abordaje en familia de origen">
                  <Textarea rows={2} value={data.relacionesInterpersonales.sexualidad.abordajeFamiliaOrigen} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, sexualidad: { ...d.relacionesInterpersonales.sexualidad, abordajeFamiliaOrigen: e.target.value } } }))} />
                </Field>
                <Field label="Abordaje en hogar actual">
                  <Textarea rows={2} value={data.relacionesInterpersonales.sexualidad.abordajeHogarActual} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, sexualidad: { ...d.relacionesInterpersonales.sexualidad, abordajeHogarActual: e.target.value } } }))} />
                </Field>
                <BoolRow label="¿Ansiedad o culpa sexual?" checked={data.relacionesInterpersonales.sexualidad.ansiedadOCulpa} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, sexualidad: { ...d.relacionesInterpersonales.sexualidad, ansiedadOCulpa: v } } }))} />
                <Field label="Explicación">
                  <Input value={data.relacionesInterpersonales.sexualidad.explicacionAnsiedadCulpa} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, sexualidad: { ...d.relacionesInterpersonales.sexualidad, explicacionAnsiedadCulpa: e.target.value } } }))} />
                </Field>
                <Field label="Preocupaciones actuales">
                  <Textarea rows={2} value={data.relacionesInterpersonales.sexualidad.preocupacionesActuales} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, sexualidad: { ...d.relacionesInterpersonales.sexualidad, preocupacionesActuales: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
            <Sub title="Matrimonio o pareja">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Historia de la relación">
                  <Textarea rows={2} value={data.relacionesInterpersonales.pareja.historiaMatrimonio} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, pareja: { ...d.relacionesInterpersonales.pareja, historiaMatrimonio: e.target.value } } }))} />
                </Field>
                <Field label="Comunicación">
                  <Textarea rows={2} value={data.relacionesInterpersonales.pareja.comunicacion} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, pareja: { ...d.relacionesInterpersonales.pareja, comunicacion: e.target.value } } }))} />
                </Field>
                <Field label="Dificultades y resolución">
                  <Textarea rows={2} value={data.relacionesInterpersonales.pareja.dificultadesYResolucion} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, pareja: { ...d.relacionesInterpersonales.pareja, dificultadesYResolucion: e.target.value } } }))} />
                </Field>
                <Field label="Cambios con el tiempo">
                  <Textarea rows={2} value={data.relacionesInterpersonales.pareja.cambiosConTiempo} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, pareja: { ...d.relacionesInterpersonales.pareja, cambiosConTiempo: e.target.value } } }))} />
                </Field>
                <Field label="Distribución de roles">
                  <Textarea rows={2} value={data.relacionesInterpersonales.pareja.rolesHogar} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, pareja: { ...d.relacionesInterpersonales.pareja, rolesHogar: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
            <Sub title="Violencia">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Qué sabe sobre la violencia y sus tipos">
                  <Textarea rows={2} value={data.relacionesInterpersonales.violencia.conceptoViolencia} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, violencia: { ...d.relacionesInterpersonales.violencia, conceptoViolencia: e.target.value } } }))} />
                </Field>
                <BoolRow label="¿Ha sufrido violencia?" checked={data.relacionesInterpersonales.violencia.haSufridoViolencia} onChange={(v) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, violencia: { ...d.relacionesInterpersonales.violencia, haSufridoViolencia: v } } }))} />
                <Field label="Descripción y agresor">
                  <Textarea rows={2} value={data.relacionesInterpersonales.violencia.descripcionAgresor} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, violencia: { ...d.relacionesInterpersonales.violencia, descripcionAgresor: e.target.value } } }))} />
                </Field>
                <Field label="Apoyo recibido">
                  <Input value={data.relacionesInterpersonales.violencia.apoyoRecibido} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, violencia: { ...d.relacionesInterpersonales.violencia, apoyoRecibido: e.target.value } } }))} />
                </Field>
                <Field label="Redes de apoyo">
                  <Input value={data.relacionesInterpersonales.violencia.redesApoyo} onChange={(e) => setData((d) => ({ ...d, relacionesInterpersonales: { ...d.relacionesInterpersonales, violencia: { ...d.relacionesInterpersonales.violencia, redesApoyo: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
          </section>
        );
      case 3:
        return (
          <section className="space-y-6">
            <Chips label="Sentimientos frecuentes" options={SENTIMIENTOS} selected={data.factoresEmocionales.sentimientosFrecuentes} onToggle={(v) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, sentimientosFrecuentes: toggleChip(d.factoresEmocionales.sentimientosFrecuentes, v) } }))} />
            <Chips label="Pensamientos automáticos" options={PENSAMIENTOS} selected={data.factoresEmocionales.pensamientosAutomaticos} onToggle={(v) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, pensamientosAutomaticos: toggleChip(d.factoresEmocionales.pensamientosAutomaticos, v) } }))} />
            <Sub title="Ayuda psicológica / psiquiátrica previa">
              <div className="grid gap-4 sm:grid-cols-2">
                <BoolRow label="¿Recibió ayuda previa?" checked={data.factoresEmocionales.ayudaPrevia.recibio} onChange={(v) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, ayudaPrevia: { ...d.factoresEmocionales.ayudaPrevia, recibio: v } } }))} />
                <Field label="Motivo">
                  <Input value={data.factoresEmocionales.ayudaPrevia.motivo} onChange={(e) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, ayudaPrevia: { ...d.factoresEmocionales.ayudaPrevia, motivo: e.target.value } } }))} />
                </Field>
                <BoolRow label="¿Recibió tratamiento?" checked={data.factoresEmocionales.ayudaPrevia.tratamiento} onChange={(v) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, ayudaPrevia: { ...d.factoresEmocionales.ayudaPrevia, tratamiento: v } } }))} />
                <Field label="¿Cuál?">
                  <Input value={data.factoresEmocionales.ayudaPrevia.cualTratamiento} onChange={(e) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, ayudaPrevia: { ...d.factoresEmocionales.ayudaPrevia, cualTratamiento: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
            <Sub title="Autolesión">
              <div className="grid gap-4 sm:grid-cols-2">
                <BoolRow label="¿Ha intentado autolesionarse?" checked={data.factoresEmocionales.autolesion.realizo} onChange={(v) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, autolesion: { ...d.factoresEmocionales.autolesion, realizo: v } } }))} />
                <Field label="¿Cuál?">
                  <Input value={data.factoresEmocionales.autolesion.cual} onChange={(e) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, autolesion: { ...d.factoresEmocionales.autolesion, cual: e.target.value } } }))} />
                </Field>
                <Field label="¿Cuándo?">
                  <Input value={data.factoresEmocionales.autolesion.cuando} onChange={(e) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, autolesion: { ...d.factoresEmocionales.autolesion, cuando: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
            <Sub title="Ideación / actos suicidas">
              <div className="grid gap-4 sm:grid-cols-2">
                <BoolRow label="¿Pensamiento o acto suicida?" checked={data.factoresEmocionales.suicidio.pensamientoOActo} onChange={(v) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, suicidio: { ...d.factoresEmocionales.suicidio, pensamientoOActo: v } } }))} />
                <Field label="¿Hace cuánto tiempo?">
                  <Input value={data.factoresEmocionales.suicidio.haceCuanto} onChange={(e) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, suicidio: { ...d.factoresEmocionales.suicidio, haceCuanto: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
            <Sub title="Pérdida de conocimiento / letargo">
              <div className="grid gap-4 sm:grid-cols-2">
                <BoolRow label="¿Ha sufrido pérdida de conocimiento?" checked={data.factoresEmocionales.perdidaConocimiento.sufrio} onChange={(v) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, perdidaConocimiento: { ...d.factoresEmocionales.perdidaConocimiento, sufrio: v } } }))} />
                <Field label="¿Cuándo sucedió?">
                  <Input value={data.factoresEmocionales.perdidaConocimiento.cuando} onChange={(e) => setData((d) => ({ ...d, factoresEmocionales: { ...d.factoresEmocionales, perdidaConocimiento: { ...d.factoresEmocionales.perdidaConocimiento, cuando: e.target.value } } }))} />
                </Field>
              </div>
            </Sub>
          </section>
        );
      case 4:
        return (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <BoolRow label="¿Preocupación por la salud general?" checked={data.factoresBiologicos.preocupacionSalud} onChange={(v) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, preocupacionSalud: v } }))} />
              <Field label="Especifique">
                <Input value={data.factoresBiologicos.especificacionSalud} onChange={(e) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, especificacionSalud: e.target.value } }))} />
              </Field>
              <Field label="Medicamentos actuales (últimos 6 meses)">
                <Textarea rows={2} value={data.factoresBiologicos.medicamentos} onChange={(e) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, medicamentos: e.target.value } }))} />
              </Field>
              <BoolRow label="¿Actividad deportiva o relajante?" checked={data.factoresBiologicos.actividadDeportiva} onChange={(v) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, actividadDeportiva: v } }))} />
              <Field label="Frecuencia">
                <Input value={data.factoresBiologicos.frecuenciaDeporte} onChange={(e) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, frecuenciaDeporte: e.target.value } }))} />
              </Field>
              <Field label="Horas de sueño diarias">
                <Num value={data.factoresBiologicos.horasSueno} onChange={(v) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, horasSueno: v } }))} />
              </Field>
            </div>
            <Chips label="Somatizaciones" options={SOMATIZACIONES} selected={data.factoresBiologicos.somatizaciones} onToggle={(v) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, somatizaciones: toggleChip(d.factoresBiologicos.somatizaciones, v) } }))} />
            <Chips label="Antecedentes heredofamiliares" options={HEREDOFAMILIARES} selected={data.factoresBiologicos.antecedentesHeredofamiliares} onToggle={(v) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, antecedentesHeredofamiliares: toggleChip(d.factoresBiologicos.antecedentesHeredofamiliares, v) } }))} />
            <Field label="Otros antecedentes">
              <Input value={data.factoresBiologicos.otrosAntecedentes} onChange={(e) => setData((d) => ({ ...d, factoresBiologicos: { ...d.factoresBiologicos, otrosAntecedentes: e.target.value } }))} />
            </Field>
          </section>
        );
      case 5:
        return (
          <section className="space-y-6">
            <BoolRow label="¿Consumo de sustancias ilícitas?" checked={data.adicciones.consumoSustanciasIlicitas} onChange={(v) => setData((d) => ({ ...d, adicciones: { ...d.adicciones, consumoSustanciasIlicitas: v } }))} />
            <Field label="Edad de inicio">
              <Num value={data.adicciones.edadInicioIlicitas} onChange={(v) => setData((d) => ({ ...d, adicciones: { ...d.adicciones, edadInicioIlicitas: v } }))} />
            </Field>
            <ConsumoLista items={data.adicciones.tablaConsumo} onChange={(tablaConsumo) => setData((d) => ({ ...d, adicciones: { ...d.adicciones, tablaConsumo } }))} />
          </section>
        );
      case 6:
        return (
          <section className="space-y-6">
            <Escolar title="Guardería" e={data.antecedentesEscolares.guarderia} onChange={(v) => setData((d) => ({ ...d, antecedentesEscolares: { ...d.antecedentesEscolares, guarderia: { asistio: v.asistio, anos: v.anos } } }))} />
            <Escolar title="Primaria" e={data.antecedentesEscolares.primaria} onChange={(v) => setData((d) => ({ ...d, antecedentesEscolares: { ...d.antecedentesEscolares, primaria: { asistio: v.asistio, anos: v.anos, vivencia: v.vivencia ?? "" } } }))} />
            <Escolar title="Secundaria" e={data.antecedentesEscolares.secundaria} onChange={(v) => setData((d) => ({ ...d, antecedentesEscolares: { ...d.antecedentesEscolares, secundaria: { asistio: v.asistio, anos: v.anos, reprobo: v.reprobo ?? false, vivencia: v.vivencia ?? "" } } }))} />
            <Escolar title="Preparatoria" e={data.antecedentesEscolares.preparatoria} onChange={(v) => setData((d) => ({ ...d, antecedentesEscolares: { ...d.antecedentesEscolares, preparatoria: { asistio: v.asistio, anos: v.anos, reprobo: v.reprobo ?? false, rendimientoConducta: v.rendimientoConducta ?? "" } } }))} />
            <Field label="Expulsiones o abandono escolar (motivos)">
              <Textarea rows={2} value={data.antecedentesEscolares.expulsionOAbandono} onChange={(e) => setData((d) => ({ ...d, antecedentesEscolares: { ...d.antecedentesEscolares, expulsionOAbandono: e.target.value } }))} />
            </Field>
          </section>
        );
      case 7:
        return (
          <section className="grid gap-4 sm:grid-cols-2">
            <BoolRow label="¿Ha realizado actividad laboral?" checked={data.antecedentesLaborales.haTrabajado} onChange={(v) => setData((d) => ({ ...d, antecedentesLaborales: { ...d.antecedentesLaborales, haTrabajado: v } }))} />
            <Field label="Horas de trabajo al día">
              <Num value={data.antecedentesLaborales.horasAlDia} onChange={(v) => setData((d) => ({ ...d, antecedentesLaborales: { ...d.antecedentesLaborales, horasAlDia: v } }))} />
            </Field>
            <Field label="Descripción de funciones">
              <Textarea rows={2} value={data.antecedentesLaborales.funciones} onChange={(e) => setData((d) => ({ ...d, antecedentesLaborales: { ...d.antecedentesLaborales, funciones: e.target.value } }))} />
            </Field>
            <Field label="Uso de sus ingresos">
              <Input value={data.antecedentesLaborales.usoIngreso} onChange={(e) => setData((d) => ({ ...d, antecedentesLaborales: { ...d.antecedentesLaborales, usoIngreso: e.target.value } }))} />
            </Field>
            <Field label="Historial de trabajos anteriores">
              <Textarea rows={2} value={data.antecedentesLaborales.trabajosAnteriores} onChange={(e) => setData((d) => ({ ...d, antecedentesLaborales: { ...d.antecedentesLaborales, trabajosAnteriores: e.target.value } }))} />
            </Field>
          </section>
        );
      case 8:
        return (
          <section className="grid gap-4">
            <Field label="Naturaleza y duración de las principales dificultades (motivo de consulta)">
              <Textarea rows={3} value={data.situacionActual.descripcionDificultades} onChange={(e) => setData((d) => ({ ...d, situacionActual: { ...d.situacionActual, descripcionDificultades: e.target.value } }))} />
            </Field>
            <Field label="Escala de gravedad (1 a 10)">
              <Num value={data.situacionActual.escalaGravedad} onChange={(v) => setData((d) => ({ ...d, situacionActual: { ...d.situacionActual, escalaGravedad: v } }))} />
            </Field>
            <Field label="Inicio de las dificultades">
              <Input value={data.situacionActual.inicioDificultades} onChange={(e) => setData((d) => ({ ...d, situacionActual: { ...d.situacionActual, inicioDificultades: e.target.value } }))} />
            </Field>
            <Field label="A qué atribuye sus dificultades">
              <Input value={data.situacionActual.atribucionCausas} onChange={(e) => setData((d) => ({ ...d, situacionActual: { ...d.situacionActual, atribucionCausas: e.target.value } }))} />
            </Field>
            <Field label="Eventos desencadenantes">
              <Textarea rows={2} value={data.situacionActual.eventosDesencadenantes} onChange={(e) => setData((d) => ({ ...d, situacionActual: { ...d.situacionActual, eventosDesencadenantes: e.target.value } }))} />
            </Field>
            <Field label="Intentos previos de resolución">
              <Textarea rows={2} value={data.situacionActual.intentosResolucion} onChange={(e) => setData((d) => ({ ...d, situacionActual: { ...d.situacionActual, intentosResolucion: e.target.value } }))} />
            </Field>
          </section>
        );
      case 9:
        return (
          <section className="space-y-4">
            <Field label="Agregado del paciente">
              <Textarea rows={4} placeholder="“Quiero que se agregue a mi historial clínico que…”" value={data.agregadoPaciente} onChange={(e) => setData((d) => ({ ...d, agregadoPaciente: e.target.value }))} />
            </Field>
          </section>
        );
      case 10:
        return (
          <section className="space-y-4">
            <Field label="Observaciones generales del terapeuta">
              <Textarea rows={5} value={data.observacionesGenerales} onChange={(e) => setData((d) => ({ ...d, observacionesGenerales: e.target.value }))} />
            </Field>
            <div className="rounded-md border p-3 text-sm space-y-2">
              <p className="font-medium">Aviso de privacidad</p>
              <p className="text-muted-foreground">
                La información registrada es confidencial y está protegida por
                las políticas de privacidad y el Código Ético del Psicólogo.
              </p>
              <BoolRow label="He leído y acepto el aviso de privacidad" checked={data.avisoPrivacidadAceptado} onChange={(v) => setData((d) => ({ ...d, avisoPrivacidadAceptado: v }))} />
            </div>
          </section>
        );
      default:
        return null;
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="space-y-2 md:sticky md:top-20 md:self-start">
        {SECCIONES.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setActive(i)}
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-sm transition-colors",
              i === active
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted text-muted-foreground",
            )}
          >
            <span>{s}</span>
            {computeProgress(seccionData[i]) > 0 && (
              <span className={cn("text-xs", i === active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {computeProgress(seccionData[i])}%
              </span>
            )}
          </button>
        ))}
      </aside>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{SECCIONES[active]}</h2>
            <p className="text-xs text-muted-foreground">
              {active + 1} de {SECCIONES.length} · progreso total {progress}%
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {status === "guardando"
              ? "Guardando…"
              : status === "error"
                ? "Error al guardar"
                : "Guardado"}
          </span>
        </div>

        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>

        {renderSection()}

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={active === 0}
            onClick={() => setActive((i) => i - 1)}
          >
            Anterior
          </Button>
          {active < SECCIONES.length - 1 ? (
            <Button type="button" onClick={() => setActive((i) => i + 1)}>
              Siguiente
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                skipNextSave.current = true;
                save(data);
              }}
            >
              Guardar ahora
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function BoolRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4"
      />
      {label}
    </label>
  );
}

function Num({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <Input
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  );
}

function Chips({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

type PersonaT = { nombre: string; edad: number | null; ocupacion: string; direccionDiferente: string };

function Persona({ title, p, onChange }: { title: string; p: PersonaT; onChange: (p: PersonaT) => void }) {
  return (
    <Sub title={title}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nombre">
          <Input value={p.nombre} onChange={(e) => onChange({ ...p, nombre: e.target.value })} />
        </Field>
        <Field label="Edad">
          <Num value={p.edad} onChange={(v) => onChange({ ...p, edad: v })} />
        </Field>
        <Field label="Ocupación">
          <Input value={p.ocupacion} onChange={(e) => onChange({ ...p, ocupacion: e.target.value })} />
        </Field>
        <Field label="Dirección (si es diferente)">
          <Input value={p.direccionDiferente} onChange={(e) => onChange({ ...p, direccionDiferente: e.target.value })} />
        </Field>
      </div>
    </Sub>
  );
}

function PersonaLista({
  title,
  items,
  onChange,
}: {
  title: string;
  items: { nombre: string; edad: number | null }[];
  onChange: (items: { nombre: string; edad: number | null }[]) => void;
}) {
  return (
    <Sub title={title}>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label>Nombre</Label>
              <Input value={item.nombre} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))} />
            </div>
            <div className="w-24 space-y-1.5">
              <Label>Edad</Label>
              <Num value={item.edad} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, edad: v } : x)))} />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              Quitar
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { nombre: "", edad: null }])}>
          + Agregar
        </Button>
      </div>
    </Sub>
  );
}

type EscolarItem = {
  asistio: boolean;
  anos: number | null;
  reprobo?: boolean;
  vivencia?: string;
  rendimientoConducta?: string;
};

function Escolar({
  title,
  e,
  onChange,
}: {
  title: string;
  e: EscolarItem;
  onChange: (e: EscolarItem) => void;
}) {
  return (
    <Sub title={title}>
      <div className="grid gap-3 sm:grid-cols-2">
        <BoolRow label="¿Asistió?" checked={e.asistio} onChange={(v) => onChange({ ...e, asistio: v })} />
        <Field label="Años">
          <Num value={e.anos} onChange={(v) => onChange({ ...e, anos: v })} />
        </Field>
        {"reprobo" in e && (
          <BoolRow label="¿Reprobó?" checked={e.reprobo ?? false} onChange={(v) => onChange({ ...e, reprobo: v })} />
        )}
        {"vivencia" in e && (
          <Field label="Descripción de su vida en esta etapa">
            <Textarea rows={2} value={e.vivencia ?? ""} onChange={(ev) => onChange({ ...e, vivencia: ev.target.value })} />
          </Field>
        )}
        {"rendimientoConducta" in e && (
          <Field label="Rendimiento y conducta">
            <Textarea rows={2} value={e.rendimientoConducta ?? ""} onChange={(ev) => onChange({ ...e, rendimientoConducta: ev.target.value })} />
          </Field>
        )}
      </div>
    </Sub>
  );
}

type ConsumoItem = {
  sustancia: string;
  edadInicio: number | null;
  cantidad: string;
  fechaUltimoUso: string;
  patronConsumo: string;
};

function ConsumoLista({
  items,
  onChange,
}: {
  items: ConsumoItem[];
  onChange: (items: ConsumoItem[]) => void;
}) {
  return (
    <Sub title="Registro de consumo">
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Input
                placeholder="Sustancia (tabaco, alcohol, marihuana…)"
                value={item.sustancia}
                onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, sustancia: e.target.value } : x)))}
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(items.filter((_, j) => j !== i))}>
                Quitar
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Edad de inicio">
                <Num value={item.edadInicio} onChange={(v) => onChange(items.map((x, j) => (j === i ? { ...x, edadInicio: v } : x)))} />
              </Field>
              <Field label="Cantidad">
                <Input value={item.cantidad} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, cantidad: e.target.value } : x)))} />
              </Field>
              <Field label="Fecha último uso">
                <Input value={item.fechaUltimoUso} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, fechaUltimoUso: e.target.value } : x)))} />
              </Field>
              <Field label="Patrón de consumo">
                <Input value={item.patronConsumo} onChange={(e) => onChange(items.map((x, j) => (j === i ? { ...x, patronConsumo: e.target.value } : x)))} />
              </Field>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...items, { sustancia: "", edadInicio: null, cantidad: "", fechaUltimoUso: "", patronConsumo: "" }])}
        >
          + Agregar sustancia
        </Button>
      </div>
    </Sub>
  );
}

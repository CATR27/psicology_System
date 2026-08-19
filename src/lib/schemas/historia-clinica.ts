export type EstadoCivil =
  | "Soltero"
  | "Separado"
  | "Viudo"
  | "Divorciado"
  | "Casado"
  | "UnionLibre"
  | null;

type Persona = { nombre: string; edad: number | null; ocupacion: string; direccionDiferente: string };
type PersonaSimple = { nombre: string; edad: number | null };

export const emptyHistoriaClinica = {
  identificacion: {
    apodo: "",
    lugarElaboracion: "",
    fechaElaboracion: "",
    sexo: "",
    lugarNacimiento: "",
    direccionActual: "",
    escolaridad: "",
    ocupacionActual: "",
    estadoCivil: null as EstadoCivil,
    vueltoACasar: false,
    vecesVueltoACasar: null as number | null,
    viviendaAdecuada: false,
    habitantesVivienda: "",
  },
  historiaFamiliar: {
    padre: { nombre: "", edad: null as number | null, ocupacion: "", direccionDiferente: "" } as Persona,
    madre: { nombre: "", edad: null as number | null, ocupacion: "", direccionDiferente: "" } as Persona,
    madrastraPadrastro: "",
    hermanos: [] as PersonaSimple[],
    pareja: { nombre: "", edad: null as number | null } as PersonaSimple,
    hijos: [] as PersonaSimple[],
    tutoresAbuelos: "",
    antecedentesInfancia: [] as string[],
  },
  relacionesInterpersonales: {
    familiaOrigen: {
      crioConPadres: false,
      conQuienCrio: "",
      desdeEdad: null as number | null,
      cuantoTiempo: "",
      relacionPadre: "",
      relacionMadre: "",
      relacionHermanos: "",
      cuidarHermanos: false,
      cuidarHermanosDesdeEdad: null as number | null,
      trabajar: false,
      trabajarDesdeEdad: null as number | null,
      quehacerHogar: false,
      disciplinaCastigo: "",
      disciplinadoPor: "",
      caracteristicasFamiliares: "",
    },
    amistades: {
      haceAmigosFacilmente: false,
      conservaAmistad: false,
      expresaSentimientos: "",
      amigosIntimos: "",
      conflictosAmistades: "",
    },
    sexualidad: {
      abordajeFamiliaOrigen: "",
      abordajeHogarActual: "",
      ansiedadOCulpa: false,
      explicacionAnsiedadCulpa: "",
      preocupacionesActuales: "",
    },
    pareja: {
      historiaMatrimonio: "",
      comunicacion: "",
      dificultadesYResolucion: "",
      cambiosConTiempo: "",
      rolesHogar: "",
    },
    violencia: {
      conceptoViolencia: "",
      haSufridoViolencia: false,
      descripcionAgresor: "",
      apoyoRecibido: "",
      redesApoyo: "",
    },
  },
  factoresEmocionales: {
    sentimientosFrecuentes: [] as string[],
    pensamientosAutomaticos: [] as string[],
    ayudaPrevia: {
      recibio: false,
      motivo: "",
      tratamiento: false,
      cualTratamiento: "",
    },
    autolesion: { realizo: false, cual: "", cuando: "" },
    suicidio: { pensamientoOActo: false, haceCuanto: "" },
    perdidaConocimiento: { sufrio: false, cuando: "" },
  },
  factoresBiologicos: {
    preocupacionSalud: false,
    especificacionSalud: "",
    medicamentos: "",
    actividadDeportiva: false,
    frecuenciaDeporte: "",
    horasSueno: null as number | null,
    somatizaciones: [] as string[],
    antecedentesHeredofamiliares: [] as string[],
    otrosAntecedentes: "",
  },
  adicciones: {
    consumoSustanciasIlicitas: false,
    edadInicioIlicitas: null as number | null,
    tablaConsumo: [] as {
      sustancia: string;
      edadInicio: number | null;
      cantidad: string;
      fechaUltimoUso: string;
      patronConsumo: string;
    }[],
  },
  antecedentesEscolares: {
    guarderia: { asistio: false, anos: null as number | null },
    primaria: { asistio: false, anos: null as number | null, vivencia: "" },
    secundaria: { asistio: false, anos: null as number | null, reprobo: false, vivencia: "" },
    preparatoria: { asistio: false, anos: null as number | null, reprobo: false, rendimientoConducta: "" },
    expulsionOAbandono: "",
  },
  antecedentesLaborales: {
    haTrabajado: false,
    funciones: "",
    horasAlDia: null as number | null,
    usoIngreso: "",
    trabajosAnteriores: "",
  },
  situacionActual: {
    descripcionDificultades: "",
    escalaGravedad: null as number | null,
    inicioDificultades: "",
    atribucionCausas: "",
    eventosDesencadenantes: "",
    intentosResolucion: "",
  },
  agregadoPaciente: "",
  observacionesGenerales: "",
  avisoPrivacidadAceptado: false,
};

export type HistoriaClinica = typeof emptyHistoriaClinica;

function countFields(obj: unknown): { filled: number; total: number } {
  if (typeof obj === "string") {
    return { filled: obj.trim() !== "" ? 1 : 0, total: 1 };
  }
  if (typeof obj === "number") return { filled: 1, total: 1 };
  if (typeof obj === "boolean") return { filled: obj ? 1 : 0, total: 1 };
  if (!obj || typeof obj !== "object") return { filled: 0, total: 0 };

  let filled = 0;
  let total = 0;
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      total += 1;
      if (v.length > 0) filled += 1;
    } else if (v && typeof v === "object") {
      const sub = countFields(v);
      filled += sub.filled;
      total += sub.total;
    } else if (typeof v === "string") {
      total += 1;
      if (v.trim() !== "") filled += 1;
    } else if (typeof v === "number") {
      total += 1;
      filled += 1;
    } else if (typeof v === "boolean") {
      total += 1;
      if (v === true) filled += 1;
    } else {
      total += 1;
    }
  }
  return { filled, total };
}

export function computeProgress(seccion: unknown): number {
  const { filled, total } = countFields(seccion);
  return total === 0 ? 0 : Math.round((filled / total) * 100);
}

export function computeHistoriaProgress(data: HistoriaClinica): number {
  return computeProgress(data);
}

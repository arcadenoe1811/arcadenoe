/**
 * Error con forma unica para toda la app. Los componentes solo muestran
 * `mensaje` (y opcionalmente marcan `campo` en un formulario).
 */
export class ErrorNormalizado extends Error {
  /**
   * @param {{ mensaje: string, codigo?: string, campo?: string|null, detalle?: string|null, errores?: Record<string, string> }} datos
   */
  constructor({ mensaje, codigo = 'desconocido', campo = null, detalle = null, errores = {} }) {
    super(mensaje);
    this.name = 'ErrorNormalizado';
    this.mensaje = mensaje;
    this.codigo = codigo;
    this.campo = campo;
    this.detalle = detalle;
    /** Errores por campo (validacion). Incluye `campo` si viene de la base. */
    this.errores = campo && !errores[campo] ? { ...errores, [campo]: mensaje } : errores;
  }
}

/** Restricciones UNIQUE conocidas -> campo y mensaje legible. */
const RESTRICCIONES_UNICAS = {
  cuellos_codigo_key: { campo: 'codigo', mensaje: 'Ya existe un cuello con ese código.' },
  catalogo_colores_nombre_key: { campo: 'nombre', mensaje: 'Ese color ya está en el catálogo.' },
};

/** Codigos de PostgreSQL / PostgREST -> mensaje legible. */
const MENSAJES_POR_CODIGO = {
  '23503': 'El registro está relacionado con otro que no existe.',
  '23514': 'Algún dato no cumple las reglas de la base de datos.',
  '22P02': 'Algún dato tiene un formato inválido.',
  '22003': 'Algún número está fuera de rango.',
  '42501': 'No hay permisos para esta operación. ¿Expiró la sesión?',
  PGRST301: 'La sesión expiró. Vuelve a iniciar sesión.',
  PGRST303: 'La sesión expiró. Vuelve a iniciar sesión.',
  P0002: 'No se encontró el registro.',
  PGRST116: 'No se encontró el registro.',
  PGRST202: 'La función no existe en la base. ¿Se aplicaron las migraciones?',
  '42P01': 'La tabla no existe en la base. ¿Se aplicaron las migraciones?',
};

/**
 * Convierte cualquier error (de supabase-js, de red o propio) en un
 * ErrorNormalizado.
 * @param {unknown} error
 * @returns {ErrorNormalizado}
 */
export function normalizarError(error) {
  if (error instanceof ErrorNormalizado) return error;

  /** @type {any} */
  const e = error ?? {};
  const texto = String(e.message ?? e ?? '');

  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(texto)) {
    return new ErrorNormalizado({
      mensaje: 'No se pudo conectar con Supabase. ¿Está levantado el stack local?',
      codigo: 'red',
      detalle: texto,
    });
  }

  if (e.code === '23505') {
    const restriccion = Object.keys(RESTRICCIONES_UNICAS).find((nombre) =>
      `${e.message ?? ''} ${e.details ?? ''}`.includes(nombre),
    );
    const conocido = restriccion ? RESTRICCIONES_UNICAS[restriccion] : null;
    return new ErrorNormalizado({
      mensaje: conocido?.mensaje ?? 'Ya existe un registro con esos datos.',
      codigo: 'duplicado',
      campo: conocido?.campo ?? null,
      detalle: e.details ?? texto,
    });
  }

  if (e.code && MENSAJES_POR_CODIGO[e.code]) {
    return new ErrorNormalizado({
      mensaje: MENSAJES_POR_CODIGO[e.code],
      codigo: String(e.code),
      detalle: e.details ?? texto,
    });
  }

  return new ErrorNormalizado({
    mensaje: 'Ocurrió un error inesperado.',
    codigo: e.code ? String(e.code) : 'desconocido',
    detalle: texto || null,
  });
}

/**
 * Lanza el error normalizado si la respuesta de supabase-js trae error;
 * si no, devuelve los datos.
 * @template T
 * @param {{ data: T, error: unknown }} respuesta
 * @returns {T}
 */
export function verificarRespuesta({ data, error }) {
  if (error) throw normalizarError(error);
  return data;
}

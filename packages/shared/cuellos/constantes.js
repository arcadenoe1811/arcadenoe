/** Tipos base (la lista completa vive en la tabla tipos_cuello). */
export const TIPOS_CUELLO = ['liso', 'tubular', 'gaspeado', 'otro']

/**
 * Valores del enum zona_color (deben coincidir con la migracion).
 * @type {import('../tipos/index.js').ZonaColor[]}
 */
export const ZONAS_COLOR = ['tubular', 'cuerpo', 'borde', 'otro']

export const ETIQUETAS_TIPO = {
  liso: 'Liso',
  tubular: 'Tubular',
  gaspeado: 'Gaspeado',
  otro: 'Otro',
}

export const ETIQUETAS_ZONA = {
  tubular: 'Tubular',
  cuerpo: 'Cuerpo',
  borde: 'Borde',
  otro: 'Otro',
}

/** Limites numericos (iguales a los CHECK de la migracion). */
export const LIMITES = {
  codigo: { maximo: 40 },
  tipo: { maximo: 40 },
  cantidad_hilos: { minimo: 1, maximo: 99 },
  colores_cuerpo: { minimo: 0, maximo: 30 },
  posicion_cuerpo: { minimo: 0, maximo: 999 },
  posicion_tubular: { minimo: 0, maximo: 999 },
  pasadas_tubular: { minimo: 0, maximo: 999 },
  medida: { minimo: 1, maximo: 99 },
  orden: { minimo: 0, maximo: 999 },
  codigo_color: { maximo: 20 },
}

/** Medidas que se ofrecen como casillas en el formulario (de menor a mayor). */
export const MEDIDAS_COMUNES = [12, 13, 14, 15, 16, 17, 18, 19, 20]

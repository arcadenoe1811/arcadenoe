/** Valores de los enums de la base (deben coincidir con la migracion). */

/** @type {import('../tipos/index.js').TipoCuello[]} */
export const TIPOS_CUELLO = ['liso', 'tubular', 'gaspeado', 'otro'];

/** @type {import('../tipos/index.js').ZonaColor[]} */
export const ZONAS_COLOR = ['tubular', 'cuerpo', 'borde', 'otro'];

export const ETIQUETAS_TIPO = {
  liso: 'Liso',
  tubular: 'Tubular',
  gaspeado: 'Gaspeado',
  otro: 'Otro',
};

export const ETIQUETAS_ZONA = {
  tubular: 'Tubular',
  cuerpo: 'Cuerpo',
  borde: 'Borde',
  otro: 'Otro',
};

/** Limites numericos (iguales a los CHECK de la migracion). */
export const LIMITES = {
  codigo: { maximo: 40 },
  cantidad_hilos: { minimo: 1, maximo: 99 },
  posicion_cuerpo: { minimo: 0, maximo: 999 },
  posicion_tubular: { minimo: 0, maximo: 999 },
  pasadas_tubular: { minimo: 0, maximo: 999 },
  medida: { minimo: 1, maximo: 99 },
  orden: { minimo: 0, maximo: 999 },
};

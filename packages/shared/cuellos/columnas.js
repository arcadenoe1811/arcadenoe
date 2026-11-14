import {
  formatearMedidas,
  formatearPosicionesCuerpo,
  formatearTipo,
} from '../formato/index.js'

/**
 * Columnas para mostrar cuellos en tabla o lista.
 * `obtener` devuelve el texto ya formateado de la celda.
 *
 * @typedef {Object} DescriptorColumna
 * @property {string} clave
 * @property {string} etiqueta
 * @property {(cuello: import('../tipos/index.js').Cuello) => string} obtener
 * @property {'izquierda'|'derecha'|'centro'} [alineacion]
 */

const guion = (valor) =>
  valor === null || valor === undefined || valor === '' ? '—' : String(valor)

/** @type {DescriptorColumna[]} */
export const COLUMNAS_CUELLO = [
  { clave: 'codigo', etiqueta: 'Código', obtener: (c) => c.codigo },
  { clave: 'nombre', etiqueta: 'Nombre', obtener: (c) => guion(c.nombre) },
  { clave: 'tipo', etiqueta: 'Tipo', obtener: (c) => formatearTipo(c.tipo) },
  {
    clave: 'cantidad_hilos',
    etiqueta: 'Hilos',
    obtener: (c) => guion(c.cantidad_hilos),
    alineacion: 'derecha',
  },
  { clave: 'medidas', etiqueta: 'Medidas', obtener: (c) => formatearMedidas(c.medidas) },
]

/** Columnas que pide el listado a la base (evita traer notas largas). */
export const COLUMNAS_LISTADO =
  'id, codigo, nombre, tipo, cantidad_hilos, medidas, imagen_url, diseno'

/** Datos tecnicos que se muestran en la ficha. */
export const DATOS_FICHA = [
  { clave: 'tipo', etiqueta: 'Tipo', obtener: (c) => formatearTipo(c.tipo) },
  {
    clave: 'cantidad_hilos',
    etiqueta: 'Cantidad de hilos',
    obtener: (c) => guion(c.cantidad_hilos),
  },
  {
    clave: 'posiciones_cuerpo',
    etiqueta: 'Posiciones del cuerpo',
    obtener: (c) => formatearPosicionesCuerpo(c.posiciones_cuerpo, c.colores),
  },
  { clave: 'medidas', etiqueta: 'Medidas', obtener: (c) => formatearMedidas(c.medidas) },
]

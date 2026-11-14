/**
 * Piezas de la prenda (cuello, puno) y tallas del puno.
 *
 * El `codigo` de una pieza es el codigo del DISENO (ej: maz4t5). El codigo
 * que usa la maquina lleva la talla delante:
 *   cuello talla 16  -> 16maz4t5
 *   puno talla pg    -> pgmaz4t5
 *
 * @typedef {'cuello'|'puno'} Pieza
 * @typedef {'pp'|'pg'|'pee'|'pex'} TallaPuno
 */

/** Valores de cuellos.pieza (deben coincidir con la migracion 00007). */
export const PIEZAS = /** @type {const} */ (['cuello', 'puno'])

export const ETIQUETAS_PIEZA = { cuello: 'Cuello', puno: 'Puño' }
export const ETIQUETAS_PIEZA_PLURAL = { cuello: 'Cuellos', puno: 'Puños' }

/** Segmento de URL de cada pieza (/cuellos/..., /punos/...). */
export const RUTAS_PIEZA = { cuello: 'cuellos', puno: 'punos' }

/**
 * Tallas del puno de menor a mayor, con las medidas de cuello a las que
 * corresponden.
 * @type {{ valor: TallaPuno, medidas: number[], alias: string[] }[]}
 */
export const TALLAS_PUNO = [
  { valor: 'pp', medidas: [12, 13], alias: [] },
  { valor: 'pg', medidas: [14, 15, 16], alias: [] },
  { valor: 'pee', medidas: [17], alias: ['pe'] },
  { valor: 'pex', medidas: [18], alias: [] },
]

const VALORES_TALLA = TALLAS_PUNO.map((t) => t.valor)

/** @param {unknown} pieza @returns {Pieza} */
export function normalizarPieza(pieza) {
  return pieza === 'puno' ? 'puno' : 'cuello'
}

/** @param {unknown} pieza */
export function formatearPieza(pieza) {
  return ETIQUETAS_PIEZA[normalizarPieza(pieza)]
}

/**
 * Talla de puno normalizada ("PE" -> "pee"). null si no es una talla.
 * @param {unknown} talla
 * @returns {TallaPuno|null}
 */
export function normalizarTalla(talla) {
  const texto = String(talla ?? '')
    .trim()
    .toLowerCase()
  const encontrada = TALLAS_PUNO.find((t) => t.valor === texto || t.alias.includes(texto))
  return encontrada ? encontrada.valor : null
}

/**
 * Lista de tallas unicas, normalizadas y en orden de menor a mayor.
 * @param {unknown} valor  arreglo o texto "pg, pex"
 * @returns {{ tallas: TallaPuno[]|null, invalidas: string[] }}
 */
export function interpretarTallas(valor) {
  const partes = Array.isArray(valor)
    ? valor.map((v) => String(v))
    : String(valor ?? '')
        .split(/[\s,;]+/)
        .filter(Boolean)
  const invalidas = []
  const tallas = new Set()
  for (const parte of partes) {
    const talla = normalizarTalla(parte)
    if (talla) tallas.add(talla)
    else invalidas.push(parte)
  }
  const ordenadas = VALORES_TALLA.filter((t) => tallas.has(t))
  return { tallas: ordenadas.length ? ordenadas : null, invalidas }
}

/**
 * Talla de puno que corresponde a una medida de cuello (16 -> 'pg').
 * @param {number} medida
 * @returns {TallaPuno|null}
 */
export function tallaPunoDeMedida(medida) {
  return TALLAS_PUNO.find((t) => t.medidas.includes(Number(medida)))?.valor ?? null
}

/**
 * Tallas de puno que corresponden a las medidas de un cuello.
 * @param {number[]|null|undefined} medidas
 * @returns {TallaPuno[]}
 */
export function tallasDeMedidas(medidas) {
  const tallas = new Set((medidas ?? []).map(tallaPunoDeMedida).filter(Boolean))
  return VALORES_TALLA.filter((t) => tallas.has(t))
}

/** "pg (14–16)". @param {TallaPuno} talla */
export function etiquetaTalla(talla) {
  const datos = TALLAS_PUNO.find((t) => t.valor === talla)
  if (!datos) return String(talla)
  const { medidas } = datos
  const rango =
    medidas.length > 1 ? `${medidas[0]}–${medidas[medidas.length - 1]}` : `${medidas[0]}`
  return `${talla} (${rango})`
}

/** @param {string[]|null|undefined} tallas */
export function formatearTallas(tallas) {
  return tallas && tallas.length ? tallas.map(etiquetaTalla).join(' · ') : '—'
}

/**
 * Codigos de maquina de una pieza: talla + codigo del diseno.
 * Cuello maz4t5 con medidas [18,16] -> ['16maz4t5', '18maz4t5'].
 * Puno maz4t5 con tallas ['pg'] -> ['pgmaz4t5'].
 * @param {{ pieza?: string, codigo: string, medidas?: number[]|null, tallas?: string[]|null }} pieza
 * @returns {string[]}
 */
export function codigosMaquina({ pieza, codigo, medidas, tallas }) {
  if (!codigo) return []
  if (normalizarPieza(pieza) === 'puno') {
    return (tallas ?? []).map((t) => `${t}${codigo}`)
  }
  return [...(medidas ?? [])].sort((a, b) => a - b).map((m) => `${m}${codigo}`)
}

/**
 * Pieza de la que puede heredar `pieza`: la herencia siempre cruza
 * (cuello <- puno, puno <- cuello), nunca cuello <- cuello ni puno <- puno.
 * @param {unknown} pieza
 * @returns {Pieza}
 */
export function piezaPadrePermitida(pieza) {
  return normalizarPieza(pieza) === 'puno' ? 'cuello' : 'puno'
}

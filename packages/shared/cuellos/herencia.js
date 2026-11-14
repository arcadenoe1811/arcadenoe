import { ZONAS_COLOR } from './constantes.js'
import { disenoPorDefecto, validarDiseno } from './diseno.js'

/**
 * Herencia de disenos entre piezas (padre -> hijo).
 *
 * - Una pieza INDEPENDIENTE guarda su propio `diseno`.
 * - Una pieza HIJA guarda `padre_id` + `overrides` (y `diseno` en null).
 *   Su diseno efectivo se calcula asi:
 *     1. Se toma el diseno efectivo del padre (el padre puede ser hijo de
 *        otro: la cadena se resuelve hacia arriba).
 *     2. Sus colores se traducen POR POSICION de la paleta del padre a la
 *        paleta del hijo: el color N del padre pasa a ser el color N del
 *        hijo. Asi un diseno "liso" se reutiliza cambiando solo colores.
 *     3. Se aplican los overrides del hijo, campo por campo.
 *   Si el padre cambia, el hijo lo refleja salvo en los campos que
 *   sobrescribio.
 * - Una PLANTILLA no crea vinculo: se copia el diseno efectivo (con los
 *   colores ya traducidos) como diseno propio.
 *
 * La paleta de una pieza son los tonos (hex) de "Colores por zona", sin
 * repetir, en el orden de la base: zona, color del cuerpo y orden.
 */

/** Campos del diseno que un hijo puede sobrescribir, en orden de pantalla. */
export const CAMPOS_HEREDABLES = /** @type {const} */ ([
  'texto',
  'fondo',
  'color_texto',
  'desplazamiento',
  'debajo',
  'arriba',
  'medio',
])

export const ETIQUETAS_HEREDABLES = {
  texto: 'Texto',
  fondo: 'Fondo',
  color_texto: 'Color de letras',
  desplazamiento: 'Posición del texto',
  debajo: 'Líneas de abajo',
  arriba: 'Líneas de arriba',
  medio: 'Líneas del medio',
  mapa_colores: 'Mapa de colores',
}

/** Maximo de colores de una paleta (igual que colores del cuerpo). */
const MAXIMO_COLORES = 30

const ZONAS_LINEA = ['debajo', 'arriba', 'medio']
const PATRON_HEX = /^#[0-9a-f]{6}$/
const normalizarHex = (hex) => String(hex ?? '').toLowerCase()

/**
 * Ordena colores como la base: zona, color del cuerpo (posicion) y orden.
 * @template {{ zona?: string, posicion?: number|null, orden?: number|null }} T
 * @param {T[]} colores
 * @returns {T[]}
 */
export function ordenarColores(colores = []) {
  return [...colores].sort(
    (a, b) =>
      ZONAS_COLOR.indexOf(/** @type {any} */ (a.zona)) -
        ZONAS_COLOR.indexOf(/** @type {any} */ (b.zona)) ||
      (a.posicion ?? 0) - (b.posicion ?? 0) ||
      (a.orden ?? Number.MAX_SAFE_INTEGER) - (b.orden ?? Number.MAX_SAFE_INTEGER),
  )
}

/**
 * Paleta de una pieza: tonos unicos de sus colores, en orden canonico.
 * @param {Array<{ zona?: string, posicion?: number|null, orden?: number|null, hex?: string|null }>} [colores]
 * @returns {string[]}
 */
export function paletaDiseno(colores = []) {
  return paletaConNombres(colores).map((c) => c.hex)
}

/**
 * Igual que paletaDiseno, con el nombre del color (el de la primera fila
 * que tiene ese tono). Para mostrar "Color 2 · rojo".
 * @param {Array<{ zona?: string, posicion?: number|null, orden?: number|null, hex?: string|null, color?: string|null }>} [colores]
 * @returns {{ hex: string, nombre: string }[]}
 */
export function paletaConNombres(colores = []) {
  /** @type {{ hex: string, nombre: string }[]} */
  const paleta = []
  for (const color of ordenarColores(colores ?? [])) {
    const hex = normalizarHex(color.hex)
    if (PATRON_HEX.test(hex) && !paleta.some((c) => c.hex === hex)) {
      paleta.push({ hex, nombre: String(color.color ?? '').trim() || hex })
    }
  }
  return paleta
}

/**
 * Como mapearColoresDiseno, pero sobre un diseno parcial (overrides):
 * solo toca los campos que existen.
 * @template {Record<string, any>} T
 * @param {T} parcial
 * @param {(hex: string) => string} fn
 * @returns {T}
 */
export function mapearColoresParcial(parcial, fn) {
  /** @type {Record<string, any>} */
  const resultado = { ...parcial }
  if ('fondo' in parcial) resultado.fondo = fn(parcial.fondo)
  if ('color_texto' in parcial) resultado.color_texto = fn(parcial.color_texto)
  for (const zona of ZONAS_LINEA) {
    if (Array.isArray(parcial[zona])) {
      resultado[zona] = parcial[zona].map((l) => ({ ...l, color: fn(l.color) }))
    }
  }
  return /** @type {T} */ (resultado)
}

/**
 * Traduce los colores de un diseno por posicion: el color N de `origen`
 * pasa a ser el color N de `destino`. Los tonos que no estan en `origen`,
 * o cuya posicion no existe en `destino`, se quedan igual.
 * @template {Record<string, any>|null|undefined} T
 * @param {T} diseno
 * @param {string[]} origen
 * @param {string[]} destino
 * @returns {T}
 */
export function traducirColores(diseno, origen, destino, mapa = {}) {
  if (!diseno) return diseno
  const desde = origen.map(normalizarHex)
  return mapearColoresParcial(diseno, (hex) => {
    const indice = desde.indexOf(normalizarHex(hex))
    if (indice < 0) return hex
    const pareja = destinoColor(indice + 1, mapa, destino.length)
    return pareja ? destino[pareja - 1] : hex
  })
}

/**
 * Mapa de colores de un hijo: { "N del padre": M del hijo } (desde 1).
 * Solo se guardan las parejas que NO son la misma posicion; lo que falta
 * va por posicion (1->1, 2->2...). Asi un padre con 3 colores puede ir a
 * un hijo con 2 (dos colores del padre al mismo del hijo) o con 4 (el
 * hijo usa su color extra en los campos que sobrescribe).
 *
 * Color del hijo que recibe el color `posicion` del padre, o null si no
 * tiene pareja (el hijo tiene menos colores o la pareja elegida ya no
 * existe).
 * @param {number} posicion  color del padre (desde 1)
 * @param {Record<string, number>|null|undefined} mapa
 * @param {number} cantidadHijo  colores en la paleta del hijo
 * @returns {number|null}
 */
export function destinoColor(posicion, mapa, cantidadHijo) {
  const elegido = mapa?.[String(posicion)]
  if (elegido !== undefined && elegido !== null) {
    return Number.isInteger(elegido) && elegido >= 1 && elegido <= cantidadHijo
      ? elegido
      : null
  }
  return posicion <= cantidadHijo ? posicion : null
}

/**
 * Posiciones (desde 1) de la paleta del padre que su diseno USA.
 * @param {Record<string, any>|null|undefined} disenoPadre
 * @param {string[]} paletaPadre
 * @returns {number[]}
 */
export function coloresUsados(disenoPadre, paletaPadre) {
  if (!disenoPadre) return []
  const usados = new Set()
  mapearColoresParcial(disenoPadre, (hex) => {
    usados.add(normalizarHex(hex))
    return hex
  })
  return paletaPadre
    .map((hex, i) => (usados.has(normalizarHex(hex)) ? i + 1 : null))
    .filter((n) => n !== null)
}

/**
 * Colores que el diseno del padre usa y que no tienen pareja en el hijo.
 * Mientras haya alguno, el hijo no se puede guardar.
 * @param {{ disenoPadre: any, paletaPadre: string[], paletaHijo: string[], mapa?: Record<string, number>|null }} datos
 * @returns {number[]} posiciones del padre (desde 1)
 */
export function coloresSinPareja({ disenoPadre, paletaPadre, paletaHijo, mapa }) {
  return coloresUsados(disenoPadre, paletaPadre).filter(
    (n) => destinoColor(n, mapa, paletaHijo.length) === null,
  )
}

/**
 * Cambia la pareja de un color del padre. Elegir la misma posicion borra
 * la entrada (vuelve a "por posicion").
 * @param {Record<string, number>|null|undefined} mapa
 * @param {number} posicionPadre
 * @param {number} posicionHijo
 * @returns {Record<string, number>}
 */
export function cambiarPareja(mapa, posicionPadre, posicionHijo) {
  const { [String(posicionPadre)]: _anterior, ...resto } = mapa ?? {}
  return posicionPadre === posicionHijo
    ? resto
    : { ...resto, [String(posicionPadre)]: posicionHijo }
}

/**
 * Overrides con el mapa de colores (o sin el, si queda vacio).
 * @param {Record<string, any>} overrides  campos del diseno
 * @param {Record<string, number>|null|undefined} mapa
 */
export function conMapaColores(overrides, mapa) {
  const { mapa_colores: _viejo, ...resto } = overrides ?? {}
  return mapa && Object.keys(mapa).length ? { ...resto, mapa_colores: mapa } : resto
}

/**
 * Limpia un mapa de colores: claves y valores enteros 1..30, sin parejas
 * a la misma posicion.
 * @param {unknown} valor
 * @returns {{ valido: boolean, datos: Record<string, number> }}
 */
export function validarMapaColores(valor) {
  if (valor === null || valor === undefined) return { valido: true, datos: {} }
  if (typeof valor !== 'object' || Array.isArray(valor))
    return { valido: false, datos: {} }
  /** @type {Record<string, number>} */
  const datos = {}
  let valido = true
  const enRango = (n) => Number.isInteger(n) && n >= 1 && n <= MAXIMO_COLORES
  for (const [clave, destino] of Object.entries(valor)) {
    const origen = Number(clave)
    if (!/^\d+$/.test(clave) || !enRango(origen) || !enRango(destino)) {
      valido = false
      continue
    }
    if (origen !== destino) datos[String(origen)] = destino
  }
  return { valido, datos }
}

/** Linea comparable (ignora orden de claves, mayusculas del hex, etc.). */
const claveLinea = (l) =>
  [
    l?.tipo,
    Number(l?.pasadas),
    normalizarHex(l?.color),
    Number(l?.desplazamiento ?? 0),
  ].join('|')

/**
 * ¿Dos valores de un campo heredable son iguales?
 * @param {string} campo
 * @param {any} a
 * @param {any} b
 */
export function igualCampo(campo, a, b) {
  if (ZONAS_LINEA.includes(campo)) {
    const x = a ?? []
    const y = b ?? []
    return x.length === y.length && x.every((l, i) => claveLinea(l) === claveLinea(y[i]))
  }
  if (campo === 'fondo' || campo === 'color_texto') {
    return normalizarHex(a) === normalizarHex(b)
  }
  if (campo === 'desplazamiento') return Number(a ?? 0) === Number(b ?? 0)
  return (a ?? '') === (b ?? '')
}

/**
 * Campos en los que `editado` difiere de `base` (lo que se guarda como
 * overrides). Si el usuario deja un campo igual al del padre, deja de ser
 * override solo.
 * @param {Record<string, any>|null|undefined} base
 * @param {Record<string, any>} editado
 * @returns {Record<string, any>}
 */
export function calcularOverrides(base, editado) {
  /** @type {Record<string, any>} */
  const overrides = {}
  for (const campo of CAMPOS_HEREDABLES) {
    if (!(campo in (editado ?? {}))) continue
    if (!igualCampo(campo, base?.[campo], editado[campo])) {
      overrides[campo] = editado[campo]
    }
  }
  return overrides
}

/**
 * Aplica los overrides sobre un diseno base.
 * @param {Record<string, any>} base
 * @param {Record<string, any>|null|undefined} overrides
 */
export function aplicarOverrides(base, overrides) {
  const resultado = { ...base }
  for (const campo of CAMPOS_HEREDABLES) {
    if (overrides && campo in overrides) resultado[campo] = overrides[campo]
  }
  return resultado
}

/**
 * Diseno de un hijo a partir del diseno (ya efectivo) de su padre.
 * `base` es lo que heredaria sin overrides (para calcular overrides al
 * editar); `efectivo` es lo que se dibuja.
 * @param {{
 *   disenoPadre: import('./diseno.js').DisenoCuello|null|undefined,
 *   paletaPadre: string[],
 *   paletaHijo: string[],
 *   overrides?: Record<string, any>|null,
 * }} datos
 */
export function disenoHeredado({ disenoPadre, paletaPadre, paletaHijo, overrides }) {
  if (!disenoPadre) return { base: null, efectivo: null }
  const base = traducirColores(
    disenoPadre,
    paletaPadre,
    paletaHijo,
    overrides?.mapa_colores ?? {},
  )
  return { base, efectivo: aplicarOverrides(base, overrides) }
}

/**
 * Valida y limpia los overrides: solo campos heredables, con las mismas
 * reglas que un diseno completo.
 * @param {unknown} valor
 * @returns {{ valido: boolean, error: string|null, datos: Record<string, any> }}
 */
export function validarOverrides(valor) {
  if (valor === null || valor === undefined)
    return { valido: true, error: null, datos: {} }
  if (typeof valor !== 'object' || Array.isArray(valor)) {
    return { valido: false, error: 'Los cambios del diseño no son válidos.', datos: {} }
  }
  const campos = CAMPOS_HEREDABLES.filter((c) => c in valor)
  // Se validan sobre un diseno completo por defecto (que ya es valido):
  // cualquier error viene de los overrides.
  const resultado = validarDiseno({
    ...disenoPorDefecto(),
    .../** @type {Record<string, any>} */ (valor),
  })
  /** @type {Record<string, any>} */
  const datos = {}
  for (const campo of campos) datos[campo] = resultado.datos?.[campo]

  const mapa = validarMapaColores(/** @type {any} */ (valor).mapa_colores)
  if (Object.keys(mapa.datos).length) datos.mapa_colores = mapa.datos
  const problemas = [
    resultado.error,
    mapa.valido ? null : 'El mapa de colores no es válido.',
  ]
    .filter(Boolean)
    .join(' ')
  return {
    valido: resultado.valido && mapa.valido,
    error: problemas || null,
    datos,
  }
}

/**
 * @typedef {Object} PiezaHeredable
 * @property {string} id
 * @property {string|null} [padre_id]
 * @property {import('./diseno.js').DisenoCuello|null} [diseno]
 * @property {Record<string, any>|null} [overrides]
 * @property {Array<{ zona?: string, posicion?: number|null, orden?: number|null, hex?: string|null }>} [colores]
 */

/**
 * Ids de padres que hacen falta para resolver estas piezas y no estan en
 * la lista.
 * @param {PiezaHeredable[]} piezas
 * @returns {string[]}
 */
export function padresFaltantes(piezas) {
  const ids = new Set(piezas.map((p) => p.id))
  const faltan = new Set()
  for (const p of piezas) {
    if (p.padre_id && !ids.has(p.padre_id)) faltan.add(p.padre_id)
  }
  return [...faltan]
}

/**
 * Diseno efectivo de cada pieza. `piezas` debe incluir a todos los
 * ancestros (ver padresFaltantes). Un ciclo o un padre ausente deja al
 * hijo sin diseno (null) en vez de colgarse.
 * @param {PiezaHeredable[]} piezas
 * @returns {Map<string, import('./diseno.js').DisenoCuello|null>}
 */
export function calcularDisenosEfectivos(piezas) {
  const porId = new Map(piezas.map((p) => [p.id, p]))
  /** @type {Map<string, any>} */
  const memo = new Map()

  const resolver = (id, visitados) => {
    if (memo.has(id)) return memo.get(id)
    const pieza = porId.get(id)
    if (!pieza) return null
    let diseno = pieza.diseno ?? null
    if (pieza.padre_id) {
      const padre = porId.get(pieza.padre_id)
      if (!padre || visitados.has(pieza.padre_id)) {
        diseno = null
      } else {
        const disenoPadre = resolver(pieza.padre_id, new Set([...visitados, id]))
        diseno = disenoHeredado({
          disenoPadre,
          paletaPadre: paletaDiseno(padre.colores),
          paletaHijo: paletaDiseno(pieza.colores),
          overrides: pieza.overrides,
        }).efectivo
      }
    }
    memo.set(id, diseno)
    return diseno
  }

  for (const pieza of piezas) resolver(pieza.id, new Set())
  return memo
}

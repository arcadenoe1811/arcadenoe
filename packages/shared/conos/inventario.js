import {
  ESTADOS_CONO,
  ETIQUETAS_ESTADO_CONO,
  ETIQUETAS_FAMILIA,
  FAMILIAS_COLOR,
} from './constantes.js'

/**
 * Logica del inventario sobre listas de conos ya cargadas. Son pocos cientos
 * de filas como mucho, asi que filtrar y agrupar en el cliente es inmediato.
 */

/** Minusculas y sin acentos, para comparar textos. */
export function textoComparable(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Estado del stock (igual que la columna generada de la base).
 * @param {{ stock_actual: number, stock_minimo: number }} cono
 * @returns {'disponible'|'bajo'|'agotado'}
 */
export function estadoCono({ stock_actual, stock_minimo }) {
  if (stock_actual <= 0) return 'agotado'
  if (stock_actual <= stock_minimo) return 'bajo'
  return 'disponible'
}

/**
 * @typedef {Object} FiltrosConos
 * @property {string} [termino]   codigo, nombre, numero de color, hex o notas
 * @property {string} [familia]
 * @property {string} [material]
 * @property {string} [proveedor]
 * @property {string} [estado]
 * @property {boolean} [inactivos] incluir conos desactivados
 */

/**
 * @template {Record<string, any>} T
 * @param {T[]} conos
 * @param {FiltrosConos} filtros
 * @returns {T[]}
 */
export function filtrarConos(conos, filtros = {}) {
  const termino = textoComparable(filtros.termino)
  const material = textoComparable(filtros.material)
  const proveedor = textoComparable(filtros.proveedor)
  return conos.filter((c) => {
    if (!filtros.inactivos && c.activo === false) return false
    if (filtros.familia && c.familia_color !== filtros.familia) return false
    if (filtros.estado && estadoCono(c) !== filtros.estado) return false
    if (material && textoComparable(c.material) !== material) return false
    if (proveedor && textoComparable(c.proveedor) !== proveedor) return false
    if (termino) {
      const pajar = textoComparable(
        [c.codigo, c.nombre_color, c.codigo_color, c.hex, c.titulo_hilo, c.notas].join(
          ' ',
        ),
      )
      if (!termino.split(/\s+/).every((parte) => pajar.includes(parte))) return false
    }
    return true
  })
}

/** Etiqueta del grupo de un cono segun el criterio. */
function claveGrupo(cono, criterio) {
  switch (criterio) {
    case 'familia_color':
      return cono.familia_color
    case 'estado':
      return estadoCono(cono)
    case 'material':
      return textoComparable(cono.material) || '—'
    case 'proveedor':
      return textoComparable(cono.proveedor) || '—'
    default:
      return ''
  }
}

/**
 * Agrupa conos por familia, material, proveedor o estado. Las familias y
 * los estados siguen su orden natural; material y proveedor, alfabetico.
 * Dentro de cada grupo se ordena por codigo de color y nombre.
 * @template {Record<string, any>} T
 * @param {T[]} conos
 * @param {string} criterio  '' = un solo grupo
 * @returns {{ clave: string, etiqueta: string, hex?: string, conos: T[] }[]}
 */
export function agruparConos(conos, criterio) {
  const ordenados = [...conos].sort(
    (a, b) =>
      textoComparable(a.nombre_color).localeCompare(textoComparable(b.nombre_color)) ||
      String(a.codigo).localeCompare(String(b.codigo)),
  )
  if (!criterio) return [{ clave: '', etiqueta: '', conos: ordenados }]

  /** @type {Map<string, T[]>} */
  const grupos = new Map()
  for (const cono of ordenados) {
    const clave = claveGrupo(cono, criterio)
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(cono)
  }

  const etiqueta = (clave) => {
    if (criterio === 'familia_color') return ETIQUETAS_FAMILIA[clave]
    if (criterio === 'estado') return ETIQUETAS_ESTADO_CONO[clave]
    // Material/proveedor: el texto tal como se escribio.
    const valor = grupos.get(clave)?.[0]?.[criterio]
    return valor ? valor.charAt(0).toUpperCase() + valor.slice(1) : 'Sin especificar'
  }

  let orden
  if (criterio === 'familia_color') orden = FAMILIAS_COLOR.map((f) => f.valor)
  else if (criterio === 'estado') orden = ['agotado', 'bajo', 'disponible']
  else {
    // Alfabetico, con "sin especificar" al final.
    const peso = (clave) => (clave === '—' ? 1 : 0)
    orden = [...grupos.keys()].sort((a, b) => peso(a) - peso(b) || a.localeCompare(b))
  }

  return orden
    .filter((clave) => grupos.has(clave))
    .map((clave) => ({
      clave,
      etiqueta: etiqueta(clave),
      ...(criterio === 'familia_color'
        ? { hex: FAMILIAS_COLOR.find((f) => f.valor === clave)?.hex }
        : {}),
      conos: grupos.get(clave),
    }))
}

/**
 * Valores distintos de un campo (para los filtros de material y proveedor).
 * @param {Record<string, any>[]} conos
 * @param {'material'|'proveedor'} campo
 * @returns {string[]}
 */
export function valoresDistintos(conos, campo) {
  const vistos = new Map()
  for (const c of conos) {
    const valor = c[campo]
    if (valor && !vistos.has(textoComparable(valor)))
      vistos.set(textoComparable(valor), valor)
  }
  return [...vistos.values()].sort((a, b) =>
    textoComparable(a).localeCompare(textoComparable(b)),
  )
}

/**
 * Totales para el resumen. Solo cuenta conos activos.
 * @param {Record<string, any>[]} conos
 */
export function resumenInventario(conos) {
  const activos = conos.filter((c) => c.activo !== false)
  const porEstado = Object.fromEntries(ESTADOS_CONO.map((e) => [e.valor, []]))
  let totalConos = 0
  let valorTotal = 0
  let pesoTotalG = 0
  let sinCosto = 0
  for (const c of activos) {
    porEstado[estadoCono(c)].push(c)
    totalConos += c.stock_actual
    if (c.costo_por_cono === null || c.costo_por_cono === undefined) {
      if (c.stock_actual > 0) sinCosto += 1
    } else {
      valorTotal += c.stock_actual * Number(c.costo_por_cono)
    }
    if (c.peso_por_cono_g) pesoTotalG += c.stock_actual * Number(c.peso_por_cono_g)
  }
  const porFaltante = (a, b) =>
    a.stock_actual - a.stock_minimo - (b.stock_actual - b.stock_minimo) ||
    String(a.codigo).localeCompare(String(b.codigo))
  return {
    tipos: activos.length,
    totalConos,
    valorTotal: Math.round(valorTotal * 100) / 100,
    pesoTotalG,
    /** Conos con stock y sin costo: el valor total no los incluye. */
    sinCosto,
    bajo: porEstado.bajo.sort(porFaltante),
    agotados: porEstado.agotado.sort(porFaltante),
  }
}

/**
 * Busca los conos que corresponden a un color del disenador (cuello/puno).
 * Prioridad: numero de color del cono (colores_cuello.codigo), luego el
 * color del catalogo, luego el hex exacto y por ultimo el nombre.
 *
 * Pensado para la integracion con el disenador: al elegir un color se
 * puede mostrar si hay existencia.
 *
 * @template {Record<string, any>} T
 * @param {T[]} conos
 * @param {{ codigo?: string|null, color_catalogo_id?: string|null, hex?: string|null, nombre?: string|null }} color
 * @returns {{ conos: T[], stock: number, estado: 'disponible'|'bajo'|'agotado'|'sin_cono' }}
 */
export function existenciaDeColor(conos, color) {
  const activos = conos.filter((c) => c.activo !== false)
  const codigo = textoComparable(color.codigo)
  const hex = textoComparable(color.hex)
  const nombre = textoComparable(color.nombre)

  const criterios = [
    codigo && ((c) => textoComparable(c.codigo_color) === codigo),
    color.color_catalogo_id && ((c) => c.color_catalogo_id === color.color_catalogo_id),
    hex && ((c) => textoComparable(c.hex) === hex),
    nombre && ((c) => textoComparable(c.nombre_color) === nombre),
  ].filter(Boolean)

  let encontrados = []
  for (const criterio of criterios) {
    encontrados = activos.filter(criterio)
    if (encontrados.length) break
  }

  const stock = encontrados.reduce((suma, c) => suma + c.stock_actual, 0)
  let estado = 'sin_cono'
  if (encontrados.length) {
    if (stock <= 0) estado = 'agotado'
    else if (encontrados.every((c) => estadoCono(c) !== 'disponible')) estado = 'bajo'
    else estado = 'disponible'
  }
  return { conos: encontrados, stock, estado }
}

/**
 * Rangos de fechas del dashboard y los reportes. Todo en texto YYYY-MM-DD
 * (sin zonas horarias): las fechas de los registros son `date` en la base.
 */

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/
const PATRON_MES = /^\d{4}-\d{2}$/
const dos = (n) => String(n).padStart(2, '0')

/** Maximo de dias de un rango (igual que fn_validar_rango). */
export const MAXIMO_DIAS_RANGO = 1100

const aUTC = (fecha) => {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}
const aISO = (date) =>
  `${date.getUTCFullYear()}-${dos(date.getUTCMonth() + 1)}-${dos(date.getUTCDate())}`

/** true si es una fecha YYYY-MM-DD que existe. */
export function esFechaValida(fecha) {
  if (!PATRON_FECHA.test(String(fecha ?? ''))) return false
  return aISO(aUTC(fecha)) === fecha
}

/** @param {string} fecha @param {number} dias */
export function sumarDias(fecha, dias) {
  const d = aUTC(fecha)
  d.setUTCDate(d.getUTCDate() + dias)
  return aISO(d)
}

/** Dias entre dos fechas (0 si son la misma). */
export function diasEntre(desde, hasta) {
  return Math.round((aUTC(hasta) - aUTC(desde)) / 86400000)
}

/** "2026-11-16" -> "2026-11". */
export function mesDe(fecha) {
  return String(fecha).slice(0, 7)
}

/** "2026-11" -> { desde: "2026-11-01", hasta: "2026-11-30" }. null si no es un mes. */
export function rangoDeMes(mes) {
  if (!PATRON_MES.test(String(mes ?? ''))) return null
  const [a, m] = mes.split('-').map(Number)
  if (m < 1 || m > 12) return null
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate()
  return { desde: `${mes}-01`, hasta: `${mes}-${dos(ultimo)}` }
}

/** El mes completo que cubre exactamente el rango, o null. */
export function mesDelRango({ desde, hasta }) {
  const rango = rangoDeMes(mesDe(desde))
  return rango && rango.desde === desde && rango.hasta === hasta ? mesDe(desde) : null
}

/**
 * Mensaje de error del rango, o null si es valido.
 * @param {{ desde: string, hasta: string }} rango
 */
export function errorRango({ desde, hasta }) {
  if (!esFechaValida(desde) || !esFechaValida(hasta)) return 'Elige las dos fechas.'
  if (desde > hasta) return 'La fecha inicial es posterior a la final.'
  if (diasEntre(desde, hasta) > MAXIMO_DIAS_RANGO) return 'El rango máximo es de 3 años.'
  return null
}

/**
 * Periodo anterior para comparar: si el rango es un mes completo, el mes
 * anterior; si no, los mismos dias inmediatamente antes.
 * @param {{ desde: string, hasta: string }} rango
 */
export function periodoAnterior(rango) {
  if (mesDelRango(rango)) {
    const [a, m] = rango.desde.split('-').map(Number)
    const previo = new Date(Date.UTC(a, m - 2, 1))
    return rangoDeMes(`${previo.getUTCFullYear()}-${dos(previo.getUTCMonth() + 1)}`)
  }
  const dias = diasEntre(rango.desde, rango.hasta) + 1
  return { desde: sumarDias(rango.desde, -dias), hasta: sumarDias(rango.desde, -1) }
}

const MESES_CORTOS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]
const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/** "2026-11" -> "Noviembre 2026". */
export function nombreMes(mes) {
  const [a, m] = String(mes).split('-').map(Number)
  return `${MESES[m - 1] ?? ''} ${a}`.trim()
}

/**
 * Etiqueta de un punto de una serie segun su agrupacion.
 * day: "16 nov" · week: "sem. 9 nov" · month: "nov 2026"
 * @param {string} periodo  YYYY-MM-DD (inicio del dia, semana o mes)
 * @param {'day'|'week'|'month'} grano
 */
export function etiquetaPeriodo(periodo, grano) {
  const [a, m, d] = String(periodo).slice(0, 10).split('-').map(Number)
  const mes = MESES_CORTOS[m - 1] ?? ''
  if (grano === 'month') return `${mes} ${a}`
  return grano === 'week' ? `sem. ${d} ${mes}` : `${d} ${mes}`
}

/** "1 – 30 nov 2026", "Noviembre 2026" o "16 nov 2026". */
export function describirRango(rango) {
  const mes = mesDelRango(rango)
  if (mes) return nombreMes(mes)
  const corta = (f) => {
    const [a, m, d] = f.split('-').map(Number)
    return `${d} ${MESES_CORTOS[m - 1]} ${a}`
  }
  return rango.desde === rango.hasta
    ? corta(rango.desde)
    : `${corta(rango.desde)} – ${corta(rango.hasta)}`
}

/**
 * Variacion porcentual respecto al periodo anterior. null si el anterior
 * es 0 (no hay base para comparar).
 */
export function variacion(actual, anterior) {
  const a = Number(actual) || 0
  const b = Number(anterior) || 0
  if (b === 0) return null
  return Math.round(((a - b) / Math.abs(b)) * 1000) / 10
}

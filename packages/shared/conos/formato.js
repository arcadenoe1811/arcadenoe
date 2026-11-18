import { MONEDA } from './constantes.js'

const DOS_DECIMALES = new Intl.NumberFormat('es', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const HASTA_UN_DECIMAL = new Intl.NumberFormat('es', { maximumFractionDigits: 1 })
const ENTERO = new Intl.NumberFormat('es', { maximumFractionDigits: 0 })

/** @param {number|string|null|undefined} valor */
export function formatearMoneda(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  return `${MONEDA} ${DOS_DECIMALES.format(Number(valor))}`
}

/** Gramos -> "850 g" o "1,5 kg". */
export function formatearPeso(gramos) {
  if (gramos === null || gramos === undefined || gramos === '') return '—'
  const g = Number(gramos)
  return g >= 1000 ? `${HASTA_UN_DECIMAL.format(g / 1000)} kg` : `${ENTERO.format(g)} g`
}

/** 1 -> "1 cono", 3 -> "3 conos". */
export function formatearConos(cantidad) {
  const n = Number(cantidad ?? 0)
  return `${ENTERO.format(n)} ${Math.abs(n) === 1 ? 'cono' : 'conos'}`
}

/** Numero entero con separador de miles. */
export function formatearEntero(n) {
  return ENTERO.format(Number(n ?? 0))
}

/** "2026-11-14" -> "14 nov 2026" (sin desfase de zona horaria). */
export function formatearDia(fecha) {
  if (!fecha) return '—'
  const [a, m, d] = String(fecha).slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(
    new Date(a, m - 1, d),
  )
}

/** Fecha de hoy en formato YYYY-MM-DD, segun la hora local. */
export function hoyISO() {
  const ahora = new Date()
  const dos = (n) => String(n).padStart(2, '0')
  return `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`
}

/**
 * Cantidad con signo segun el tipo de movimiento: +5, -3, +2 / -1 (ajuste).
 * @param {{ tipo: string, cantidad: number }} movimiento
 */
export function cantidadConSigno({ tipo, cantidad }) {
  const delta = tipo === 'salida' ? -cantidad : cantidad
  return `${delta > 0 ? '+' : '−'}${ENTERO.format(Math.abs(delta))}`
}

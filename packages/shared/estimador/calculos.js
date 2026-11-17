import { leerDecimal, leerEntero } from '../conos/validaciones.js'

const redondear = (n, decimales = 2) => Math.round(n * 10 ** decimales) / 10 ** decimales

/**
 * Costo promedio por cono segun el inventario: promedio ponderado por las
 * existencias de los conos activos con costo. Si no hay existencias, el
 * promedio simple de los costos. 0 si ningun cono tiene costo.
 * @param {Array<{ activo?: boolean, stock_actual: number, costo_por_cono: number|string|null }>} conos
 */
export function costoPromedioCono(conos) {
  const conCosto = (conos ?? []).filter(
    (c) =>
      c.activo !== false && c.costo_por_cono !== null && c.costo_por_cono !== undefined,
  )
  if (!conCosto.length) return 0
  const unidades = conCosto.reduce((s, c) => s + Math.max(0, c.stock_actual), 0)
  if (unidades > 0) {
    const valor = conCosto.reduce(
      (s, c) => s + Math.max(0, c.stock_actual) * Number(c.costo_por_cono),
      0,
    )
    return redondear(valor / unidades)
  }
  return redondear(
    conCosto.reduce((s, c) => s + Number(c.costo_por_cono), 0) / conCosto.length,
  )
}

/** Numero >= 0 o 0 si esta vacio / es invalido. */
const numero = (valor) => {
  const n = leerDecimal(valor)
  return n === null || n === undefined || n < 0 ? 0 : n
}

/**
 * Calcula una estimacion (lo mismo que fn_guardar_estimacion en la base).
 * Las lineas incompletas cuentan como cero, para poder calcular mientras
 * se escribe.
 * @param {Array<Record<string, any>>} lineas { cantidad, conos_por_unidad, minutos_por_unidad }
 * @param {{ costoCono: number|string, tarifaHora: number|string }} parametros
 */
export function calcularEstimacion(lineas, { costoCono, tarifaHora }) {
  let unidades = 0
  let conos = 0
  let minutos = 0
  for (const linea of lineas ?? []) {
    const cantidad = leerEntero(linea.cantidad)
    if (!cantidad || cantidad < 0) continue
    unidades += cantidad
    conos += cantidad * numero(linea.conos_por_unidad)
    minutos += cantidad * numero(linea.minutos_por_unidad)
  }
  const costoMaterial = redondear(conos * numero(costoCono))
  const costoManoObra = redondear((minutos / 60) * numero(tarifaHora))
  const costoTotal = redondear(costoMaterial + costoManoObra)
  return {
    unidades,
    conos: redondear(conos, 3),
    minutos: redondear(minutos),
    costoMaterial,
    costoManoObra,
    costoTotal,
    costoPorUnidad: unidades > 0 ? redondear(costoTotal / unidades) : 0,
  }
}

/** 250 -> "4 h 10 min"; 45 -> "45 min"; 120 -> "2 h". */
export function formatearDuracion(minutos) {
  const total = Math.max(0, Math.round(Number(minutos) || 0))
  const horas = Math.floor(total / 60)
  const resto = total % 60
  if (!horas) return `${resto} min`
  return resto ? `${horas} h ${resto} min` : `${horas} h`
}

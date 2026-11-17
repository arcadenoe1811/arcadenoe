import { obtenerCliente } from '../api/cliente.js'
import { ErrorNormalizado, verificarRespuesta } from '../api/errores.js'
import { errorRango, periodoAnterior } from './periodos.js'

/**
 * Dashboard y reportes. Las cifras las agrega la base (funciones fn_*) con
 * el rango como parametro; RLS sigue aplicando a cada tabla.
 */

const GRANOS = ['day', 'week', 'month']

const exigirRango = (rango) => {
  const error = errorRango(rango)
  if (error)
    throw new ErrorNormalizado({ mensaje: error, codigo: 'validacion', campo: 'fecha' })
}

const llamar = async (funcion, { desde, hasta }, grano) => {
  exigirRango({ desde, hasta })
  const parametros = { p_desde: desde, p_hasta: hasta }
  // Solo viaja un valor de la lista; cualquier otro se ignora (automatico).
  if (grano !== undefined) parametros.p_grano = GRANOS.includes(grano) ? grano : null
  return verificarRespuesta(await obtenerCliente().rpc(funcion, parametros))
}

/** @param {{ desde: string, hasta: string }} rango */
export const obtenerDashboard = (rango) => llamar('fn_dashboard', rango)

/** Ultimos movimientos, ventas y producciones. @param {number} [limite] */
export async function listarActividadReciente(limite = 10) {
  return (
    verificarRespuesta(
      await obtenerCliente().rpc('fn_actividad_reciente', { p_limite: limite }),
    ) ?? []
  )
}

export const obtenerReporteInventario = (rango, grano = '') =>
  llamar('fn_reporte_inventario', rango, grano)
export const obtenerReporteProduccion = (rango, grano = '') =>
  llamar('fn_reporte_produccion', rango, grano)
export const obtenerReporteVentas = (rango, grano = '') =>
  llamar('fn_reporte_ventas', rango, grano)

/**
 * Resumen ejecutivo: el periodo pedido y el anterior, para comparar.
 * @param {{ desde: string, hasta: string }} rango
 */
export async function obtenerResumenEjecutivo(rango) {
  exigirRango(rango)
  const anterior = periodoAnterior(rango)
  const [actual, previo] = await Promise.all([
    llamar('fn_resumen_periodo', rango),
    llamar('fn_resumen_periodo', anterior),
  ])
  return { actual, anterior: previo }
}

/** Margen bruto de un resumen: ventas - costo estimado de lo vendido. */
export function margenDe(resumen) {
  return (
    Math.round(
      (Number(resumen.ventas.total) - Number(resumen.costo_estimado_vendido)) * 100,
    ) / 100
  )
}

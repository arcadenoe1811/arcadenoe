import { obtenerCliente } from '../api/cliente.js'
import { ErrorNormalizado, verificarRespuesta } from '../api/errores.js'
import { hoyISO } from '../conos/formato.js'
import { errorRango } from '../reportes/periodos.js'
import {
  validarPrecioBase,
  validarProduccion,
  validarProduccionDirigida,
  validarVenta,
} from './validaciones.js'

/**
 * Ventas, produccion y precios. Las ventas y producciones se registran con
 * funciones SQL que validan todo de nuevo y calculan los totales en la
 * base; aqui solo se anticipan los errores para marcarlos en el formulario.
 */

/** Tope de filas que devuelve la API (PGRST_DB_MAX_ROWS). */
export const LIMITE_FILAS = 1000

const errorValidacion = (errores) =>
  new ErrorNormalizado({
    mensaje: 'Revisa los campos marcados.',
    codigo: 'validacion',
    errores,
  })

const exigirRango = (rango) => {
  const error = errorRango(rango)
  if (error) throw errorValidacion({ fecha: error })
}

const COLUMNAS_DISENO =
  'id, pieza, codigo, nombre, tipo, medidas, tallas, precio_base, imagen_url, diseno, ' +
  'colores:colores_cuello(zona, posicion, orden, color, hex)'

/**
 * Disenos (cuellos y punos activos) con su precio base y colores, para los
 * selectores de ventas, estimador y produccion.
 */
export async function listarDisenos() {
  return (
    verificarRespuesta(
      await obtenerCliente()
        .from('cuellos')
        .select(COLUMNAS_DISENO)
        .eq('activo', true)
        .order('codigo')
        .order('pieza'),
    ) ?? []
  )
}

/**
 * Cambia el precio base de un diseno (solo admin: la base responde 403 a
 * un operador). No afecta a las ventas ya registradas.
 * @param {string} id
 * @param {string|number|null} precio  vacio = sin precio
 */
export async function fijarPrecioBase(id, precio) {
  const { valido, errores, datos } = validarPrecioBase(precio)
  if (!valido) throw errorValidacion(errores)
  verificarRespuesta(
    await obtenerCliente().from('cuellos').update({ precio_base: datos }).eq('id', id),
  )
  return datos
}

/**
 * Vendido y producido por diseno y medida. Se trabaja bajo pedido: lo
 * vendido que aun no se produjo es el pendiente de producir.
 */
export async function listarStockCuellos() {
  return (
    verificarRespuesta(await obtenerCliente().from('v_stock_cuellos').select('*')) ?? []
  )
}

/**
 * @param {Record<string, any>} formulario
 * @param {Array<Record<string, any>>} lineas
 * @returns {Promise<string>} id de la venta
 */
export async function registrarVenta(formulario, lineas) {
  const { valido, errores, datos } = validarVenta(formulario, lineas, hoyISO())
  if (!valido) throw errorValidacion(errores)
  return verificarRespuesta(
    await obtenerCliente().rpc('fn_registrar_venta', {
      p_venta: datos.venta,
      p_lineas: datos.lineas,
    }),
  )
}

/**
 * Ventas de un rango de fechas con sus lineas, de la mas reciente a la mas
 * antigua. El filtro por diseno se aplica en la pantalla.
 * @param {{ desde: string, hasta: string, metodo?: string }} filtros
 */
export async function listarVentas({ desde, hasta, metodo = '' }) {
  exigirRango({ desde, hasta })
  let consulta = obtenerCliente()
    .from('ventas')
    .select(
      'id, fecha, cliente, metodo_pago, notas, total_unidades, total, created_at, ' +
        'entregado, entrega_parcial, entregado_en, ' +
        'lineas:venta_lineas(id, cuello_id, diseno_codigo, pieza, talla, cantidad, precio_unitario, subtotal, orden)',
    )
    .gte('fecha', desde)
    .lte('fecha', hasta)
  if (metodo) consulta = consulta.eq('metodo_pago', metodo)
  const ventas =
    verificarRespuesta(
      await consulta
        .order('fecha', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(LIMITE_FILAS),
    ) ?? []
  if (ventas.length === 0) return ventas

  // Estado (derivado de la producción) y avance por línea, en dos consultas
  // más (las vistas no tienen un vínculo que PostgREST pueda incrustar).
  const ids = ventas.map((v) => v.id)
  const [estados, lineas] = await Promise.all([
    obtenerCliente().from('v_estado_ventas').select('*').in('id', ids),
    obtenerCliente()
      .from('v_lineas_asignadas')
      .select('id, venta_id, asignado, pendiente')
      .in('venta_id', ids),
  ])
  const estadoPorVenta = new Map(
    (verificarRespuesta(estados) ?? []).map((e) => [e.id, e]),
  )
  const avancePorLinea = new Map((verificarRespuesta(lineas) ?? []).map((l) => [l.id, l]))
  for (const venta of ventas) {
    venta.lineas = [...(venta.lineas ?? [])]
      .sort((a, b) => a.orden - b.orden)
      .map((l) => ({
        ...l,
        ...(avancePorLinea.get(l.id) ?? { asignado: 0, pendiente: l.cantidad }),
      }))
    const e = estadoPorVenta.get(venta.id)
    venta.estado = e?.estado ?? 'pendiente'
    venta.producido = e?.producido ?? 0
    venta.pendiente = e?.pendiente ?? venta.total_unidades
  }
  return ventas
}

/**
 * Marca (o desmarca) la entrega de una venta. Lo demás del estado se calcula
 * solo según la producción.
 * @param {string} id
 * @param {'entregado'|'parcial'|'ninguno'} modo
 */
export async function marcarEntrega(id, modo) {
  verificarRespuesta(
    await obtenerCliente().rpc('fn_marcar_entrega', { p_venta: id, p_modo: modo }),
  )
}

/** Elimina una venta y sus lineas (solo admin). @param {string} id */
export async function eliminarVenta(id) {
  verificarRespuesta(await obtenerCliente().from('ventas').delete().eq('id', id))
}

/**
 * Resumen de una lista de ventas ya filtrada.
 * @param {Array<{ total: number|string, total_unidades: number }>} ventas
 */
export function resumenVentas(ventas) {
  const total = ventas.reduce((s, v) => s + Number(v.total), 0)
  const unidades = ventas.reduce((s, v) => s + v.total_unidades, 0)
  return {
    ventas: ventas.length,
    unidades,
    total: Math.round(total * 100) / 100,
    ticketPromedio: ventas.length ? Math.round((total / ventas.length) * 100) / 100 : 0,
  }
}

/** @param {Record<string, any>} formulario @returns {Promise<string>} */
export async function registrarProduccion(formulario) {
  const { valido, errores, datos } = validarProduccion(formulario, hoyISO())
  if (!valido) throw errorValidacion(errores)
  return verificarRespuesta(
    await obtenerCliente().rpc('fn_registrar_produccion', { p_produccion: datos }),
  )
}

/**
 * Últimas producciones con las ventas a las que se asignó cada una (FIFO).
 * Trae también las notas, uniéndolas por id (la función no las devuelve).
 * @param {number} [limite]
 */
export async function listarProducciones(limite = 50) {
  const [asignadas, notas] = await Promise.all([
    obtenerCliente().rpc('fn_produccion_asignada', { p_limite: limite }),
    obtenerCliente()
      .from('producciones')
      .select('id, notas')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limite),
  ])
  const lista = verificarRespuesta(asignadas) ?? []
  const notaPorId = new Map((verificarRespuesta(notas) ?? []).map((p) => [p.id, p.notas]))
  return lista.map((p) => ({ ...p, notas: notaPorId.get(p.id) ?? null }))
}

/**
 * Registra producción DIRIGIDA a una línea de venta concreta (botón del
 * desglose): esas unidades van a esa venta, saltándose el FIFO.
 * @param {Record<string, any>} formulario { venta_linea_id, fecha, cantidad, notas }
 * @returns {Promise<string>}
 */
export async function registrarProduccionDirigida(formulario) {
  const { valido, errores, datos } = validarProduccionDirigida(formulario, hoyISO())
  if (!valido) throw errorValidacion(errores)
  return verificarRespuesta(
    await obtenerCliente().rpc('fn_registrar_produccion', { p_produccion: datos }),
  )
}

/**
 * Pendiente de producir por diseño y medida, con la venta más antigua y el
 * desglose por cliente (quién pidió qué y hace cuántos días).
 * @returns {Promise<Array<Record<string, any>>>}
 */
export async function listarPendientesProduccion() {
  return verificarRespuesta(await obtenerCliente().rpc('fn_pendientes_produccion')) ?? []
}

/** Elimina una produccion (solo admin). @param {string} id */
export async function eliminarProduccion(id) {
  verificarRespuesta(await obtenerCliente().from('producciones').delete().eq('id', id))
}

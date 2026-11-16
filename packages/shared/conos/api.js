import { obtenerCliente } from '../api/cliente.js'
import { ErrorNormalizado, normalizarError, verificarRespuesta } from '../api/errores.js'
import { validarCono, validarMovimiento } from './validaciones.js'

const COLUMNAS_MOVIMIENTO =
  'id, cono_id, tipo, cantidad, fecha, referencia, lote, proveedor, costo_unitario, ' +
  'stock_resultante, notas, created_at, pieza:cuellos(id, codigo, pieza)'

/** @returns {Promise<import('../tipos/index.js').Cono[]>} */
export async function listarConos() {
  return (
    verificarRespuesta(
      await obtenerCliente().from('conos').select('*').order('codigo'),
    ) ?? []
  )
}

/**
 * @param {string} id
 * @returns {Promise<import('../tipos/index.js').Cono & { color_catalogo: { nombre: string, hex: string|null }|null }>}
 */
export async function obtenerCono(id) {
  return verificarRespuesta(
    await obtenerCliente()
      .from('conos')
      .select('*, color_catalogo:catalogo_colores(nombre, hex)')
      .eq('id', id)
      .single(),
  )
}

const errorValidacion = (errores) =>
  new ErrorNormalizado({
    mensaje: 'Revisa los campos marcados.',
    codigo: 'validacion',
    errores,
  })

/**
 * Crea (sin id) o actualiza (con id) un cono. Al crear, `stock_inicial`
 * se registra como una entrada en la misma transaccion.
 * @param {Record<string, any>} formulario
 * @returns {Promise<import('../tipos/index.js').Cono>}
 */
export async function guardarCono(formulario) {
  const { valido, errores, datos, stockInicial } = validarCono(formulario)
  if (!valido) throw errorValidacion(errores)
  return verificarRespuesta(
    await obtenerCliente().rpc('fn_guardar_cono', {
      p_cono: datos,
      p_stock_inicial: stockInicial,
    }),
  )
}

/** @param {string} id @param {boolean} activo */
export async function cambiarActivoCono(id, activo) {
  verificarRespuesta(await obtenerCliente().from('conos').update({ activo }).eq('id', id))
}

/** Solo se puede eliminar un cono sin movimientos; si tiene, se desactiva. */
export async function eliminarCono(id) {
  const { error } = await obtenerCliente().from('conos').delete().eq('id', id)
  if (error && /** @type {any} */ (error).code === '23503') {
    throw new ErrorNormalizado({
      mensaje:
        'Este cono tiene movimientos registrados. Desactívalo en vez de eliminarlo.',
      codigo: '23503',
    })
  }
  if (error) throw normalizarError(error)
}

/**
 * Movimientos de un cono (historial) o de todos (ultimos registrados).
 * @param {{ conoId?: string, limite?: number }} [opciones]
 * @returns {Promise<import('../tipos/index.js').MovimientoCono[]>}
 */
export async function listarMovimientos({ conoId, limite = 200 } = {}) {
  let consulta = obtenerCliente().from('movimientos_cono')
  if (conoId) {
    consulta = consulta
      .select(COLUMNAS_MOVIMIENTO)
      .eq('cono_id', conoId)
      .order('fecha', { ascending: false })
  } else {
    consulta = consulta.select(
      `${COLUMNAS_MOVIMIENTO}, cono:conos(id, codigo, nombre_color, hex)`,
    )
  }
  return (
    verificarRespuesta(
      await consulta.order('created_at', { ascending: false }).limit(limite),
    ) ?? []
  )
}

/**
 * Registra una entrada, salida o ajuste. La base actualiza el stock.
 * @param {Record<string, any>} formulario
 * @param {number} stockActual  stock que se ve en pantalla (para validar y calcular ajustes)
 */
export async function registrarMovimiento(formulario, stockActual) {
  const { valido, errores, datos } = validarMovimiento(formulario, stockActual)
  if (!valido) throw errorValidacion(errores)
  return verificarRespuesta(
    await obtenerCliente()
      .from('movimientos_cono')
      .insert(datos)
      .select(COLUMNAS_MOVIMIENTO)
      .single(),
  )
}

/**
 * Cuellos y punos activos, para asociar una salida a la pieza producida.
 * @returns {Promise<{ id: string, codigo: string, nombre: string|null, pieza: string }[]>}
 */
export async function listarPiezasParaSalida() {
  return (
    verificarRespuesta(
      await obtenerCliente()
        .from('cuellos')
        .select('id, codigo, nombre, pieza')
        .eq('activo', true)
        .order('codigo'),
    ) ?? []
  )
}

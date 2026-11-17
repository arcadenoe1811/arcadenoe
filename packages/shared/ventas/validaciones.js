import { leerDecimal, leerEntero } from '../conos/validaciones.js'
import { TALLAS_PUNO } from '../cuellos/piezas.js'
import { LIMITES_VENTA, MEDIDAS_VENTA, METODOS_PAGO } from './constantes.js'

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/
const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const L = LIMITES_VENTA

/** Talla en mayusculas y sin espacios de mas ("  m " -> "M"). */
export function normalizarTallaVenta(valor) {
  return String(valor ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
}

/** Tallas posibles de un puno (PP, PG, PEE, PEX), en orden. */
const TALLAS_PUNO_MAY = TALLAS_PUNO.map((t) => t.valor.toUpperCase())

/**
 * Medidas propias de un diseno (las que de verdad teje): las medidas del
 * cuello (10..20) o las tallas del puno, normalizadas. [] si no hay diseno.
 * @param {{ pieza?: string, medidas?: number[]|null, tallas?: string[]|null }|null|undefined} diseno
 * @returns {string[]}
 */
export function medidasDelDiseno(diseno) {
  if (!diseno) return []
  if (diseno.pieza === 'puno')
    return [...new Set((diseno.tallas ?? []).map(normalizarTallaVenta))]
  return [...new Set([...(diseno.medidas ?? [])].sort((a, b) => a - b).map(String))]
}

/**
 * Medidas que se ofrecen para un diseno: primero las suyas y despues el
 * resto de las posibles (10..20 en cuellos; PP..PEX en punos), por si se
 * vende una medida que todavia no se teje. Sin diseno, de la 10 a la 20.
 * @param {{ pieza?: string, medidas?: number[]|null, tallas?: string[]|null }|null|undefined} diseno
 * @returns {string[]}
 */
export function tallasSugeridas(diseno) {
  const base = diseno?.pieza === 'puno' ? TALLAS_PUNO_MAY : [...MEDIDAS_VENTA]
  const propias = medidasDelDiseno(diseno)
  return [...propias, ...base.filter((m) => !propias.includes(m))]
}

/**
 * Indica si la medida es una de las del diseno (no hay que "hacerla").
 * @param {object|null|undefined} diseno
 * @param {string} medida
 */
export function medidaEnDiseno(diseno, medida) {
  return medidasDelDiseno(diseno).includes(normalizarTallaVenta(medida))
}

/**
 * Lineas cuya medida NO es una de las del diseno: hay que tejer esa medida
 * bajo pedido. Es solo un aviso; la venta se registra igual. Varias lineas
 * del mismo diseno y medida se muestran una vez.
 * @param {Array<Record<string, any>>} lineas
 * @param {Map<string, object>} disenoPorId
 * @returns {{ cuello_id: string, codigo: string, pieza: string, talla: string }[]}
 */
export function medidasNoDisponibles(lineas, disenoPorId) {
  const obtener = (id) =>
    typeof disenoPorId?.get === 'function' ? disenoPorId.get(id) : disenoPorId?.[id]
  const fuera = new Map()
  for (const linea of lineas ?? []) {
    const medida = normalizarTallaVenta(linea.talla)
    const diseno = linea.cuello_id ? obtener(linea.cuello_id) : null
    if (!medida || !diseno || medidaEnDiseno(diseno, medida)) continue
    const clave = `${linea.cuello_id}|${medida}`
    if (!fuera.has(clave))
      fuera.set(clave, {
        cuello_id: linea.cuello_id,
        codigo: diseno.codigo,
        pieza: diseno.pieza,
        talla: medida,
      })
  }
  return [...fuera.values()]
}

/** Fecha YYYY-MM-DD real y no futura. @returns {string|null} mensaje de error */
export function errorFechaRegistro(fecha, hoy) {
  const texto = String(fecha ?? '')
  if (!PATRON_FECHA.test(texto)) return 'Elige la fecha.'
  const [a, m, d] = texto.split('-').map(Number)
  const real = new Date(Date.UTC(a, m - 1, d))
  if (real.getUTCMonth() !== m - 1 || real.getUTCDate() !== d)
    return 'La fecha no existe.'
  if (texto > hoy) return 'La fecha no puede ser futura.'
  if (a < 2000) return 'La fecha no es válida.'
  return null
}

/** Texto opcional recortado; error si pasa del maximo. */
function textoOpcional(valor, maximo, errores, campo) {
  const texto = String(valor ?? '').trim()
  if (texto.length > maximo) errores[campo] = `Máximo ${maximo} caracteres.`
  return texto || null
}

/**
 * Valida diseno, talla y cantidad de una linea (comunes a ventas y
 * estimaciones) y anota los errores con el prefijo `lineas.<i>.`.
 */
function validarLineaBase(linea, i, errores) {
  const cuello_id = String(linea.cuello_id ?? '')
  const talla = normalizarTallaVenta(linea.talla)
  const cantidad = leerEntero(linea.cantidad)

  if (!PATRON_UUID.test(cuello_id)) errores[`lineas.${i}.cuello_id`] = 'Elige el diseño.'
  if (!talla) errores[`lineas.${i}.talla`] = 'Escribe la talla.'
  else if (talla.length > L.talla)
    errores[`lineas.${i}.talla`] = `Máximo ${L.talla} caracteres.`
  if (cantidad === null) errores[`lineas.${i}.cantidad`] = 'Escribe la cantidad.'
  else if (cantidad === undefined || cantidad < 1 || cantidad > L.cantidad)
    errores[`lineas.${i}.cantidad`] = 'Debe ser un entero mayor que cero.'

  return { cuello_id, talla, cantidad }
}

/** Numero decimal >= 0 y <= maximo; anota el error en `clave`. */
function decimalNoNegativo(valor, maximo, errores, clave, { requerido = true } = {}) {
  const n = leerDecimal(valor)
  if (n === null) {
    if (requerido) errores[clave] = 'Escribe un número.'
    return null
  }
  if (n === undefined || n < 0) {
    errores[clave] = 'Debe ser un número no negativo.'
    return null
  }
  if (n > maximo) {
    errores[clave] = 'El número es demasiado grande.'
    return null
  }
  return n
}

function validarCantidadLineas(lineas, errores) {
  if (!Array.isArray(lineas) || lineas.length === 0)
    errores.lineas = 'Agrega al menos una línea.'
  else if (lineas.length > L.lineas) errores.lineas = `Máximo ${L.lineas} líneas.`
}

/**
 * Valida el formulario de venta y lo convierte en los parametros de
 * fn_registrar_venta. La base repite estas reglas y calcula los totales.
 * @param {Record<string, any>} formulario  { fecha, cliente, metodo_pago, notas }
 * @param {Array<Record<string, any>>} lineas { cuello_id, talla, cantidad, precio_unitario }
 * @param {string} hoy  YYYY-MM-DD
 */
export function validarVenta(formulario, lineas, hoy) {
  /** @type {Record<string, string>} */
  const errores = {}

  const errorFecha = errorFechaRegistro(formulario.fecha, hoy)
  if (errorFecha) errores.fecha = errorFecha
  const metodo_pago = formulario.metodo_pago || 'efectivo'
  if (!METODOS_PAGO.some((m) => m.valor === metodo_pago))
    errores.metodo_pago = 'Elige un método de pago.'
  const cliente = textoOpcional(formulario.cliente, L.cliente, errores, 'cliente')
  const notas = textoOpcional(formulario.notas, L.notas, errores, 'notas')

  validarCantidadLineas(lineas, errores)
  const datosLineas = (Array.isArray(lineas) ? lineas : []).map((linea, i) => ({
    ...validarLineaBase(linea, i, errores),
    precio_unitario: decimalNoNegativo(
      linea.precio_unitario,
      L.precio,
      errores,
      `lineas.${i}.precio_unitario`,
    ),
  }))

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: {
      venta: { fecha: formulario.fecha, cliente, metodo_pago, notas },
      lineas: datosLineas,
    },
  }
}

/**
 * Totales de una venta mientras se escribe. Las lineas incompletas o
 * invalidas cuentan como cero.
 * @param {Array<Record<string, any>>} lineas
 */
export function totalesVenta(lineas) {
  let unidades = 0
  let total = 0
  const subtotales = (lineas ?? []).map((linea) => {
    const cantidad = leerEntero(linea.cantidad)
    const precio = leerDecimal(linea.precio_unitario)
    if (
      !cantidad ||
      cantidad < 0 ||
      precio === null ||
      precio === undefined ||
      precio < 0
    )
      return 0
    unidades += cantidad
    const subtotal = Math.round(cantidad * precio * 100) / 100
    total += subtotal
    return subtotal
  })
  return { unidades, total: Math.round(total * 100) / 100, subtotales }
}

/**
 * Valida el registro de produccion (parametro de fn_registrar_produccion).
 * @param {Record<string, any>} formulario { fecha, cuello_id, talla, cantidad, notas }
 * @param {string} hoy
 */
export function validarProduccion(formulario, hoy) {
  /** @type {Record<string, string>} */
  const errores = {}
  const errorFecha = errorFechaRegistro(formulario.fecha, hoy)
  if (errorFecha) errores.fecha = errorFecha
  /** @type {Record<string, string>} */
  const deLinea = {}
  const base = validarLineaBase(formulario, 0, deLinea)
  for (const [clave, mensaje] of Object.entries(deLinea))
    errores[clave.replace('lineas.0.', '')] = mensaje
  const notas = textoOpcional(formulario.notas, L.notas, errores, 'notas')
  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: { fecha: formulario.fecha, ...base, notas },
  }
}

/**
 * Valida una producción DIRIGIDA a una línea de venta (atajo del desglose).
 * El diseño y la medida no se piden: salen de la línea en la base.
 * @param {Record<string, any>} formulario { venta_linea_id, fecha, cantidad, notas }
 * @param {string} hoy
 */
export function validarProduccionDirigida(formulario, hoy) {
  /** @type {Record<string, string>} */
  const errores = {}
  const errorFecha = errorFechaRegistro(formulario.fecha, hoy)
  if (errorFecha) errores.fecha = errorFecha

  const cantidad = leerEntero(formulario.cantidad)
  if (cantidad === null) errores.cantidad = 'Escribe la cantidad.'
  else if (cantidad === undefined || cantidad < 1 || cantidad > L.cantidad)
    errores.cantidad = 'Debe ser un entero mayor que cero.'

  const venta_linea_id = String(formulario.venta_linea_id ?? '')
  if (!PATRON_UUID.test(venta_linea_id))
    errores.venta_linea_id = 'Línea de venta no válida.'

  const notas = textoOpcional(formulario.notas, L.notas, errores, 'notas')
  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: { venta_linea_id, fecha: formulario.fecha, cantidad, notas },
  }
}

/**
 * Valida una estimacion (parametros de fn_guardar_estimacion).
 * @param {Record<string, any>} formulario { nombre, notas, tarifa_hora, costo_cono }
 * @param {Array<Record<string, any>>} lineas { cuello_id, talla, cantidad, conos_por_unidad, minutos_por_unidad }
 */
export function validarEstimacion(formulario, lineas) {
  /** @type {Record<string, string>} */
  const errores = {}
  const nombre = textoOpcional(formulario.nombre, L.nombre, errores, 'nombre')
  const notas = textoOpcional(formulario.notas, L.notas, errores, 'notas')
  const tarifa_hora = decimalNoNegativo(
    formulario.tarifa_hora,
    L.tarifa_hora,
    errores,
    'tarifa_hora',
  )
  const costo_cono = decimalNoNegativo(
    formulario.costo_cono,
    L.precio,
    errores,
    'costo_cono',
  )

  validarCantidadLineas(lineas, errores)
  const datosLineas = (Array.isArray(lineas) ? lineas : []).map((linea, i) => ({
    ...validarLineaBase(linea, i, errores),
    conos_por_unidad: decimalNoNegativo(
      linea.conos_por_unidad,
      L.conos_por_unidad,
      errores,
      `lineas.${i}.conos_por_unidad`,
    ),
    minutos_por_unidad: decimalNoNegativo(
      linea.minutos_por_unidad,
      L.minutos_por_unidad,
      errores,
      `lineas.${i}.minutos_por_unidad`,
    ),
  }))

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: {
      estimacion: { nombre, notas, tarifa_hora, costo_cono },
      lineas: datosLineas,
    },
  }
}

/** Precio base: numero >= 0, o null para dejar el diseno sin precio. */
export function validarPrecioBase(valor) {
  /** @type {Record<string, string>} */
  const errores = {}
  const precio = decimalNoNegativo(valor, L.precio, errores, 'precio_base', {
    requerido: false,
  })
  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: precio === null ? null : Math.round(precio * 100) / 100,
  }
}

import { FAMILIAS_COLOR, LIMITES_CONO } from './constantes.js'

const PATRON_HEX = /^#[0-9a-f]{6}$/
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/
const PATRON_UUID = /^[0-9a-f-]{36}$/i

/** Recorta y colapsa espacios; '' si no hay texto. */
const limpiar = (valor) =>
  String(valor ?? '')
    .trim()
    .replace(/\s+/g, ' ')

/** "ff0000", "#FF0000" -> "#ff0000"; '' si no hay texto. */
export function normalizarHex(valor) {
  const texto = String(valor ?? '')
    .trim()
    .toLowerCase()
  if (!texto) return ''
  return texto.startsWith('#') ? texto : `#${texto}`
}

/** Codigo del cono en mayusculas y sin espacios (ej: "con-1" -> "CON-1"). */
export function normalizarCodigoCono(valor) {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

/**
 * Convierte texto a numero aceptando coma o punto decimal.
 * @returns {number|null|undefined} null si esta vacio, undefined si no es un numero
 */
export function leerDecimal(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : undefined
  const texto = String(valor ?? '')
    .trim()
    .replace(/\s/g, '')
  if (!texto) return null
  const normalizado = texto.includes('.')
    ? texto.replace(/,/g, '')
    : texto.replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(normalizado)) return undefined
  return Number(normalizado)
}

/** @returns {number|null|undefined} entero >= 0, null si vacio, undefined si invalido */
export function leerEntero(valor) {
  const n = leerDecimal(valor)
  if (n === null || n === undefined) return n
  return Number.isInteger(n) ? n : undefined
}

const redondear = (n, decimales) => Math.round(n * 10 ** decimales) / 10 ** decimales

/**
 * Valida el formulario del cono y lo convierte a la fila de `conos`.
 *
 * El peso se escribe en g o kg (`unidad_peso`) y se guarda en gramos. El
 * costo se escribe por cono, por docena o por kilo (`modo_costo`); se guarda
 * siempre por cono y la base calcula el costo por kilo.
 *
 * @param {Record<string, any>} formulario
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: Record<string, any>, stockInicial: number }}
 */
export function validarCono(formulario) {
  /** @type {Record<string, string>} */
  const errores = {}
  const L = LIMITES_CONO

  const codigo = normalizarCodigoCono(formulario.codigo)
  const nombre_color = limpiar(formulario.nombre_color)
  const hex = normalizarHex(formulario.hex)
  const codigo_color = limpiar(formulario.codigo_color)
  const material = limpiar(formulario.material).toLowerCase()
  const titulo_hilo = limpiar(formulario.titulo_hilo)
  const proveedor = limpiar(formulario.proveedor)
  const imagen_url = String(formulario.imagen_url ?? '').trim()
  const notas = String(formulario.notas ?? '').trim()
  const familia_color = formulario.familia_color || 'neutros'
  const color_catalogo_id = formulario.color_catalogo_id || null

  if (codigo.length > L.codigo) errores.codigo = `Máximo ${L.codigo} caracteres.`

  if (!nombre_color) errores.nombre_color = 'Escribe el nombre del color.'
  else if (nombre_color.length > L.nombre_color)
    errores.nombre_color = `Máximo ${L.nombre_color} caracteres.`

  if (!hex) errores.hex = 'Elige el color (hex).'
  else if (!PATRON_HEX.test(hex)) errores.hex = 'Usa el formato #RRGGBB.'

  if (codigo_color.length > L.codigo_color)
    errores.codigo_color = `Máximo ${L.codigo_color} caracteres.`

  if (!FAMILIAS_COLOR.some((f) => f.valor === familia_color))
    errores.familia_color = 'Elige una familia de color.'

  if (!material) errores.material = 'Escribe el material.'
  else if (material.length > L.material)
    errores.material = `Máximo ${L.material} caracteres.`

  if (titulo_hilo.length > L.titulo_hilo)
    errores.titulo_hilo = `Máximo ${L.titulo_hilo} caracteres.`
  if (proveedor.length > L.proveedor)
    errores.proveedor = `Máximo ${L.proveedor} caracteres.`

  // Peso -> gramos
  const peso = leerDecimal(formulario.peso_por_cono)
  let peso_por_cono_g = null
  if (peso === undefined) errores.peso_por_cono = 'Escribe un número.'
  else if (peso !== null) {
    peso_por_cono_g = redondear(formulario.unidad_peso === 'kg' ? peso * 1000 : peso, 1)
    if (peso_por_cono_g < 1 || peso_por_cono_g > L.peso)
      errores.peso_por_cono = 'Peso fuera de rango.'
  }

  // Costo -> por cono
  const costo = leerDecimal(formulario.costo)
  let costo_por_cono = null
  if (costo === undefined) errores.costo = 'Escribe un número.'
  else if (costo !== null) {
    if (formulario.modo_costo === 'kilo') {
      if (!peso_por_cono_g) errores.costo = 'Para calcular desde el kilo, indica el peso.'
      else costo_por_cono = redondear((costo * peso_por_cono_g) / 1000, 2)
    } else if (formulario.modo_costo === 'docena') {
      costo_por_cono = redondear(costo / 12, 2)
    } else {
      costo_por_cono = redondear(costo, 2)
    }
    if (costo_por_cono !== null && costo_por_cono > L.costo)
      errores.costo = 'Costo fuera de rango.'
  }

  const stock_minimo = leerEntero(formulario.stock_minimo)
  if (stock_minimo === undefined) errores.stock_minimo = 'Escribe un número entero.'
  else if (stock_minimo !== null && stock_minimo > L.stock)
    errores.stock_minimo = 'Número fuera de rango.'

  const stockInicial = formulario.id ? 0 : leerEntero(formulario.stock_inicial)
  if (stockInicial === undefined) errores.stock_inicial = 'Escribe un número entero.'
  else if (stockInicial !== null && stockInicial > L.stock)
    errores.stock_inicial = 'Número fuera de rango.'

  if (imagen_url && !/^https?:\/\//i.test(imagen_url))
    errores.imagen_url = 'La URL debe empezar con http:// o https://'
  if (notas.length > L.notas) errores.notas = `Máximo ${L.notas} caracteres.`

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    stockInicial: stockInicial ?? 0,
    datos: {
      ...(formulario.id ? { id: formulario.id } : {}),
      codigo: codigo || null,
      nombre_color,
      hex,
      color_catalogo_id,
      codigo_color: codigo_color || null,
      familia_color,
      material,
      titulo_hilo: titulo_hilo || null,
      proveedor: proveedor || null,
      peso_por_cono_g,
      costo_por_cono,
      stock_minimo: stock_minimo ?? 0,
      imagen_url: imagen_url || null,
      notas: notas || null,
      activo: formulario.activo ?? true,
    },
  }
}

/**
 * Valida un movimiento y lo convierte a la fila de `movimientos_cono`.
 *
 * En un ajuste se escribe el conteo fisico (`conteo`) y se guarda la
 * diferencia con el stock actual.
 *
 * @param {Record<string, any>} formulario
 * @param {number} stockActual
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: Record<string, any> }}
 */
export function validarMovimiento(formulario, stockActual) {
  /** @type {Record<string, string>} */
  const errores = {}
  const L = LIMITES_CONO
  const tipo = formulario.tipo

  if (!['entrada', 'salida', 'ajuste'].includes(tipo)) errores.tipo = 'Tipo inválido.'
  if (!formulario.cono_id || !PATRON_UUID.test(formulario.cono_id))
    errores.cono_id = 'Elige el cono.'

  let cantidad = null
  if (tipo === 'ajuste') {
    const conteo = leerEntero(formulario.conteo)
    if (conteo === null) errores.conteo = 'Escribe cuántos conos hay realmente.'
    else if (conteo === undefined) errores.conteo = 'Escribe un número entero.'
    else if (conteo > L.stock) errores.conteo = 'Número fuera de rango.'
    else if (conteo === stockActual)
      errores.conteo = 'El conteo es igual al stock actual.'
    else cantidad = conteo - stockActual
  } else {
    const n = leerEntero(formulario.cantidad)
    if (n === null || n === 0) errores.cantidad = 'Indica cuántos conos.'
    else if (n === undefined) errores.cantidad = 'Escribe un número entero.'
    else if (n > L.stock) errores.cantidad = 'Número fuera de rango.'
    else if (tipo === 'salida' && n > stockActual)
      errores.cantidad =
        stockActual === 0
          ? 'No hay conos en stock.'
          : `Solo hay ${stockActual} ${stockActual === 1 ? 'cono' : 'conos'} en stock.`
    else cantidad = n
  }

  const fecha = String(formulario.fecha ?? '').trim()
  if (fecha && !PATRON_FECHA.test(fecha)) errores.fecha = 'Fecha inválida.'

  const referencia = limpiar(formulario.referencia)
  if (referencia.length > L.referencia)
    errores.referencia = `Máximo ${L.referencia} caracteres.`
  const notas = String(formulario.notas ?? '').trim()
  if (notas.length > L.notas_movimiento)
    errores.notas = `Máximo ${L.notas_movimiento} caracteres.`

  const datos = {
    cono_id: formulario.cono_id,
    tipo,
    cantidad,
    ...(fecha ? { fecha } : {}),
    referencia: referencia || null,
    notas: notas || null,
  }

  if (tipo === 'entrada') {
    const lote = limpiar(formulario.lote)
    const proveedor = limpiar(formulario.proveedor)
    const costo = leerDecimal(formulario.costo_unitario)
    if (lote.length > L.lote) errores.lote = `Máximo ${L.lote} caracteres.`
    if (proveedor.length > L.proveedor)
      errores.proveedor = `Máximo ${L.proveedor} caracteres.`
    if (costo === undefined) errores.costo_unitario = 'Escribe un número.'
    else if (
      costo !== null &&
      costo > L.costo * (formulario.modo_costo === 'docena' ? 12 : 1)
    )
      errores.costo_unitario = 'Costo fuera de rango.'
    datos.lote = lote || null
    datos.proveedor = proveedor || null
    // El costo se puede escribir por docena; se guarda por cono.
    const porCono = formulario.modo_costo === 'docena' ? costo / 12 : costo
    datos.costo_unitario =
      costo === null || costo === undefined ? null : redondear(porCono, 2)
  }

  if (tipo === 'salida') datos.pieza_id = formulario.pieza_id || null

  return { valido: Object.keys(errores).length === 0, errores, datos }
}

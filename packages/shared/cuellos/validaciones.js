import { LIMITES, ZONAS_COLOR } from './constantes.js'
import { normalizarNombreTipo } from './tipos.js'
import { leerZonaColor } from './campos.js'

/**
 * Reglas de validacion de cuellos y sus colores. Reciben los valores tal
 * como vienen del formulario (strings) y devuelven los datos normalizados
 * listos para enviar a la base.
 */

const PATRON_CODIGO = /^[a-z0-9][a-z0-9._#\-/]*$/
const PATRON_URL = /^https?:\/\/\S+$/i
const PATRON_HEX = /^#[0-9a-f]{6}$/i

/** @param {unknown} valor */
function textoOpcional(valor) {
  const texto = String(valor ?? '').trim()
  return texto === '' ? null : texto
}

/**
 * Convierte un valor del formulario en entero o null.
 * @param {unknown} valor
 * @returns {{ numero: number|null, invalido: boolean }}
 */
function enteroOpcional(valor) {
  const texto = String(valor ?? '').trim()
  if (texto === '') return { numero: null, invalido: false }
  if (!/^-?\d+$/.test(texto)) return { numero: null, invalido: true }
  return { numero: Number(texto), invalido: false }
}

/**
 * Convierte "18, 17 16" o [18, 17, 16] en un arreglo de enteros unicos
 * ordenado de mayor a menor.
 * @param {unknown} valor
 * @returns {{ medidas: number[]|null, invalidas: string[] }}
 */
export function interpretarMedidas(valor) {
  const partes = Array.isArray(valor)
    ? valor.map((v) => String(v))
    : String(valor ?? '')
        .split(/[\s,;]+/)
        .filter(Boolean)

  const invalidas = []
  const numeros = new Set()
  for (const parte of partes) {
    const { numero, invalido } = enteroOpcional(parte)
    if (
      invalido ||
      numero === null ||
      numero < LIMITES.medida.minimo ||
      numero > LIMITES.medida.maximo
    ) {
      invalidas.push(parte)
    } else {
      numeros.add(numero)
    }
  }
  const medidas = [...numeros].sort((a, b) => b - a)
  return { medidas: medidas.length ? medidas : null, invalidas }
}

/**
 * Normaliza un codigo: sin espacios a los lados y en minusculas.
 * @param {unknown} codigo
 */
export function normalizarCodigo(codigo) {
  return String(codigo ?? '')
    .trim()
    .toLowerCase()
}

/**
 * @param {Record<string, unknown>} formulario
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: Partial<import('../tipos/index.js').Cuello> }}
 */
export function validarCuello(formulario) {
  /** @type {Record<string, string>} */
  const errores = {}
  /** @type {Record<string, any>} */
  const datos = {}

  if (formulario.id) datos.id = formulario.id

  // codigo
  const codigo = normalizarCodigo(formulario.codigo)
  if (!codigo) {
    errores.codigo = 'El código es obligatorio.'
  } else if (codigo.length > LIMITES.codigo.maximo) {
    errores.codigo = `El código no puede tener más de ${LIMITES.codigo.maximo} caracteres.`
  } else if (!PATRON_CODIGO.test(codigo)) {
    errores.codigo = 'Usa letras, números y los símbolos . _ - # / (sin espacios).'
  }
  datos.codigo = codigo

  // tipo (la base comprueba que exista en tipos_cuello)
  const tipo = normalizarNombreTipo(formulario.tipo)
  if (!tipo) {
    errores.tipo = 'Elige el tipo de cuello.'
  } else if (tipo.length > LIMITES.tipo.maximo) {
    errores.tipo = `El tipo no puede tener más de ${LIMITES.tipo.maximo} caracteres.`
  }
  datos.tipo = tipo

  // textos opcionales
  datos.nombre = textoOpcional(formulario.nombre)
  datos.notas = textoOpcional(formulario.notas)

  // numeros opcionales
  for (const campo of ['cantidad_hilos']) {
    const { numero, invalido } = enteroOpcional(formulario[campo])
    const { minimo, maximo } = LIMITES[campo]
    if (invalido) {
      errores[campo] = 'Debe ser un número entero.'
    } else if (numero !== null && (numero < minimo || numero > maximo)) {
      errores[campo] = `Debe estar entre ${minimo} y ${maximo}.`
    }
    datos[campo] = numero
  }

  // posiciones del cuerpo (una por color)
  const posiciones = validarPosicionesCuerpo(formulario.posiciones_cuerpo)
  Object.assign(errores, posiciones.errores)
  datos.posiciones_cuerpo = posiciones.datos

  // medidas
  const { medidas, invalidas } = interpretarMedidas(formulario.medidas)
  if (invalidas.length) {
    errores.medidas = `Medidas inválidas: ${invalidas.join(', ')}. Usa enteros entre ${LIMITES.medida.minimo} y ${LIMITES.medida.maximo}.`
  }
  datos.medidas = medidas

  // imagen
  const imagen = textoOpcional(formulario.imagen_url)
  if (imagen && !PATRON_URL.test(imagen)) {
    errores.imagen_url = 'Debe ser una URL que empiece por http:// o https://'
  }
  datos.imagen_url = imagen

  if (typeof formulario.activo === 'boolean') datos.activo = formulario.activo

  return { valido: Object.keys(errores).length === 0, errores, datos }
}

/**
 * Valida las posiciones del cuerpo. Cada fila es { posicion, letra }; la
 * posicion puede quedar vacia (se guarda null) para no perder el numero
 * de colores. Errores con clave `posiciones_cuerpo.${indice}`.
 * @param {unknown} posiciones
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: import('../tipos/index.js').PosicionCuerpo[] }}
 */
export function validarPosicionesCuerpo(posiciones) {
  /** @type {Record<string, string>} */
  const errores = {}
  const filas = Array.isArray(posiciones) ? posiciones : []
  const { minimo, maximo } = LIMITES.posicion_cuerpo

  if (filas.length > LIMITES.colores_cuerpo.maximo) {
    errores.posiciones_cuerpo = `Máximo ${LIMITES.colores_cuerpo.maximo} colores.`
  }

  const datos = filas.slice(0, LIMITES.colores_cuerpo.maximo).map((fila, indice) => {
    const { numero, invalido } = enteroOpcional(fila?.posicion)
    if (invalido) {
      errores[`posiciones_cuerpo.${indice}`] = 'Debe ser un número entero.'
    } else if (numero !== null && (numero < minimo || numero > maximo)) {
      errores[`posiciones_cuerpo.${indice}`] = `Entre ${minimo} y ${maximo}.`
    }
    return { posicion: invalido ? null : numero, letra: Boolean(fila?.letra) }
  })

  return { valido: Object.keys(errores).length === 0, errores, datos }
}

/**
 * Valida la lista de colores del formulario. Los errores usan la clave
 * `${indice}.${campo}`. Las filas totalmente vacias se descartan.
 *
 * - `zona` puede traer el color del cuerpo ("cuerpo@2", ver leerZonaColor).
 * - Si la fila tiene `hilos_auto`, usa `hilosPorDefecto` (cantidad de
 *   hilos del cuello).
 * - El orden se calcula: lugar de la fila dentro de su zona.
 *
 * @param {Array<Record<string, unknown>>} colores
 * @param {{ hilosPorDefecto?: unknown, cantidadPosiciones?: number }} [opciones]
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: import('../tipos/index.js').ColorCuello[] }}
 */
export function validarColoresCuello(colores = [], opciones = {}) {
  const { hilosPorDefecto = null, cantidadPosiciones = Infinity } = opciones
  /** @type {Record<string, string>} */
  const errores = {}
  /** @type {import('../tipos/index.js').ColorCuello[]} */
  const datos = []
  /** @type {Record<string, number>} */
  const ordenPorZona = {}
  const { minimo, maximo } = LIMITES.cantidad_hilos

  colores.forEach((fila, indice) => {
    const color = textoOpcional(fila.color)
    const codigo = textoOpcional(String(fila.codigo ?? '').replace(/^\s*#/, ''))
    const hilos = enteroOpcional(fila.hilos_auto ? hilosPorDefecto : fila.cantidad_hilos)

    const sinHilosPropios =
      Boolean(fila.hilos_auto) || (hilos.numero === null && !hilos.invalido)
    if (!color && !codigo && sinHilosPropios) return

    const { zona, posicion } = leerZonaColor(/** @type {string} */ (fila.zona))
    if (!ZONAS_COLOR.includes(/** @type {any} */ (zona))) {
      errores[`${indice}.zona`] = 'Elige la zona.'
    } else if (posicion !== null && posicion > cantidadPosiciones) {
      errores[`${indice}.zona`] = 'Ese color del cuerpo ya no existe.'
    }
    if (!color) {
      errores[`${indice}.color`] = 'Escribe el color.'
    }
    const hex = textoOpcional(fila.hex)
    if (hex && !PATRON_HEX.test(hex)) {
      errores[`${indice}.hex`] = 'Tono inválido.'
    }
    if (codigo && codigo.length > LIMITES.codigo_color.maximo) {
      errores[`${indice}.codigo`] = `Máximo ${LIMITES.codigo_color.maximo} caracteres.`
    }
    if (hilos.invalido) {
      errores[`${indice}.cantidad_hilos`] = 'Debe ser un entero.'
    } else if (
      hilos.numero !== null &&
      (hilos.numero < minimo || hilos.numero > maximo)
    ) {
      errores[`${indice}.cantidad_hilos`] = `Entre ${minimo} y ${maximo}.`
    }

    const grupo = `${zona}@${posicion ?? ''}`
    ordenPorZona[grupo] = (ordenPorZona[grupo] ?? 0) + 1

    datos.push({
      zona: /** @type {any} */ (zona),
      posicion,
      color: color ?? '',
      codigo,
      hex: hex && PATRON_HEX.test(hex) ? hex.toLowerCase() : null,
      cantidad_hilos: hilos.invalido ? null : hilos.numero,
      orden: ordenPorZona[grupo],
    })
  })

  return { valido: Object.keys(errores).length === 0, errores, datos }
}

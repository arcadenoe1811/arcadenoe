import { obtenerCliente } from '../api/cliente.js'
import { ErrorNormalizado, verificarRespuesta } from '../api/errores.js'
import { formatearTipo } from '../formato/index.js'
import { LIMITES, TIPOS_CUELLO } from './constantes.js'

/**
 * Catalogo de tipos de cuello (tabla tipos_cuello). Un tipo es solo un
 * nombre en minusculas; la etiqueta visible se deriva de el.
 */

/** Normaliza el nombre de un tipo (minusculas, espacios simples). */
export function normalizarNombreTipo(nombre) {
  return String(nombre ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
}

/**
 * @param {{ nombre?: unknown }} formulario
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: { nombre: string } }}
 */
export function validarTipoCuello(formulario) {
  /** @type {Record<string, string>} */
  const errores = {}
  const nombre = normalizarNombreTipo(formulario.nombre)
  if (!nombre) errores.nombre = 'Escribe el nombre del tipo.'
  else if (nombre.length > LIMITES.tipo.maximo)
    errores.nombre = `Máximo ${LIMITES.tipo.maximo} caracteres.`
  return { valido: Object.keys(errores).length === 0, errores, datos: { nombre } }
}

/**
 * Opciones para un <select>: los tipos de la base (o los base si aun no
 * cargan), asegurando que `actual` aparezca aunque no este en la lista.
 * @param {string[]} [tipos]
 * @param {string} [actual]
 */
export function opcionesTipo(tipos = TIPOS_CUELLO, actual) {
  const lista = [...new Set([...(tipos.length ? tipos : TIPOS_CUELLO)])]
  if (actual && !lista.includes(actual)) lista.push(actual)
  return lista.map((valor) => ({ valor, etiqueta: formatearTipo(valor) }))
}

/** @returns {Promise<string[]>} nombres de los tipos, base primero y luego alfabetico */
export async function listarTipos() {
  const filas =
    verificarRespuesta(
      await obtenerCliente().from('tipos_cuello').select('nombre').order('nombre'),
    ) ?? []
  const nombres = filas.map((fila) => fila.nombre)
  const base = TIPOS_CUELLO.filter((t) => nombres.includes(t) && t !== 'otro')
  const extra = nombres.filter((t) => !TIPOS_CUELLO.includes(t))
  return [...base, ...extra, ...(nombres.includes('otro') ? ['otro'] : [])]
}

/**
 * Agrega un tipo al catalogo y devuelve su nombre normalizado.
 * @param {{ nombre: string }} formulario
 */
export async function crearTipo(formulario) {
  const { valido, errores, datos } = validarTipoCuello(formulario)
  if (!valido) {
    throw new ErrorNormalizado({
      mensaje: 'Revisa los campos marcados.',
      codigo: 'validacion',
      errores,
    })
  }
  const fila = verificarRespuesta(
    await obtenerCliente().from('tipos_cuello').insert(datos).select('nombre').single(),
  )
  return fila.nombre
}

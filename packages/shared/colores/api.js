import { obtenerCliente } from '../api/cliente.js'
import { ErrorNormalizado, verificarRespuesta } from '../api/errores.js'
import { validarColorCatalogo } from './validaciones.js'

/** @returns {Promise<import('../tipos/index.js').ColorCatalogo[]>} */
export async function listarColores() {
  return (
    verificarRespuesta(
      await obtenerCliente()
        .from('catalogo_colores')
        .select('id, nombre, hex')
        .order('nombre'),
    ) ?? []
  )
}

/**
 * Crea (sin id) o actualiza (con id) un color del catalogo.
 * @param {{ id?: string, nombre: string, hex?: string }} formulario
 * @returns {Promise<import('../tipos/index.js').ColorCatalogo>}
 */
export async function guardarColor(formulario) {
  const { valido, errores, datos } = validarColorCatalogo(formulario)
  if (!valido) {
    throw new ErrorNormalizado({
      mensaje: 'Revisa los campos marcados.',
      codigo: 'validacion',
      errores,
    })
  }
  const tabla = obtenerCliente().from('catalogo_colores')
  const consulta = formulario.id
    ? tabla.update(datos).eq('id', formulario.id)
    : tabla.insert(datos)
  return verificarRespuesta(await consulta.select('id, nombre, hex').single())
}

/** @param {string} id */
export async function eliminarColor(id) {
  verificarRespuesta(
    await obtenerCliente().from('catalogo_colores').delete().eq('id', id),
  )
}

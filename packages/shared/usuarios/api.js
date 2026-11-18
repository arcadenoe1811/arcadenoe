import { obtenerCliente } from '../api/cliente.js'
import { ErrorNormalizado, verificarRespuesta } from '../api/errores.js'
import {
  validarCambioContrasena,
  validarContrasena,
  validarUsuario,
} from './validaciones.js'

/**
 * Gestion de usuarios. Todo pasa por funciones SQL que verifican en la
 * base que quien llama sea admin (un operador recibe 403): el navegador
 * nunca usa la llave de servicio.
 */

const errorValidacion = (errores) =>
  new ErrorNormalizado({
    mensaje: 'Revisa los campos marcados.',
    codigo: 'validacion',
    errores,
  })

/**
 * Perfil (nombre, rol, estado) del usuario con sesion. null si no tiene.
 * @param {string} id  id del usuario autenticado
 * @returns {Promise<import('../tipos/index.js').Perfil|null>}
 */
export async function obtenerMiPerfil(id) {
  return verificarRespuesta(
    await obtenerCliente()
      .from('perfiles')
      .select('id, nombre, rol, activo, debe_cambiar_contrasena')
      .eq('id', id)
      .maybeSingle(),
  )
}

/** @returns {Promise<import('../tipos/index.js').Usuario[]>} */
export async function listarUsuarios() {
  return verificarRespuesta(await obtenerCliente().rpc('fn_listar_usuarios')) ?? []
}

/**
 * Crea un usuario con contrasena temporal (debera cambiarla al entrar).
 * @param {{ nombre: string, email: string, rol: string, contrasena: string }} formulario
 * @returns {Promise<string>} id del usuario creado
 */
export async function crearUsuario(formulario) {
  const { valido, errores, datos } = validarUsuario(formulario, { conContrasena: true })
  if (!valido) throw errorValidacion(errores)
  return verificarRespuesta(
    await obtenerCliente().rpc('fn_crear_usuario', {
      p_nombre: datos.nombre,
      p_email: datos.email,
      p_contrasena: datos.contrasena,
      p_rol: datos.rol,
    }),
  )
}

/**
 * @param {string} id
 * @param {{ nombre: string, email: string, rol: string }} formulario
 */
export async function actualizarUsuario(id, formulario) {
  const { valido, errores, datos } = validarUsuario(formulario)
  if (!valido) throw errorValidacion(errores)
  verificarRespuesta(
    await obtenerCliente().rpc('fn_actualizar_usuario', {
      p_id: id,
      p_nombre: datos.nombre,
      p_email: datos.email,
      p_rol: datos.rol,
    }),
  )
}

/**
 * Habilita o deshabilita un usuario (nunca se eliminan).
 * @param {string} id
 * @param {boolean} activo
 */
export async function cambiarEstadoUsuario(id, activo) {
  verificarRespuesta(
    await obtenerCliente().rpc('fn_cambiar_estado_usuario', {
      p_id: id,
      p_activo: Boolean(activo),
    }),
  )
}

/**
 * El admin fija una contrasena temporal: cierra las sesiones del usuario
 * y lo obliga a cambiarla al volver a entrar.
 * @param {string} id
 * @param {string} contrasena
 */
export async function resetearContrasena(id, contrasena) {
  const error = validarContrasena(contrasena)
  if (error) throw errorValidacion({ contrasena: error })
  verificarRespuesta(
    await obtenerCliente().rpc('fn_resetear_contrasena', {
      p_id: id,
      p_contrasena: contrasena,
    }),
  )
}

/**
 * Cambia la contrasena del usuario con sesion (pide la actual).
 * @param {{ actual: string, contrasena: string, confirmacion: string }} formulario
 */
export async function cambiarMiContrasena(formulario) {
  const { valido, errores } = validarCambioContrasena(formulario)
  if (!valido) throw errorValidacion(errores)
  verificarRespuesta(
    await obtenerCliente().rpc('fn_cambiar_mi_contrasena', {
      p_actual: formulario.actual,
      p_nueva: formulario.contrasena,
    }),
  )
}

import { PATRON_EMAIL } from '../auth/sesion.js'
import { ROLES } from './permisos.js'

/**
 * Reglas de usuarios y contrasenas. Las mismas se repiten en la base
 * (fn_validar_contrasena y fn_validar_datos_usuario): el navegador avisa
 * rapido, la base es la que decide.
 */

export const LIMITES_USUARIO = {
  nombre: 80,
  email: 254,
  contrasena_minimo: 8,
  contrasena_maximo: 72, // limite de bcrypt
}

export const AYUDA_CONTRASENA =
  'Mínimo 8 caracteres, con al menos un número y una mayúscula.'

/**
 * @param {unknown} contrasena
 * @returns {string|null} mensaje de error, o null si cumple las reglas
 */
export function validarContrasena(contrasena) {
  const texto = typeof contrasena === 'string' ? contrasena : ''
  if (!texto) return 'Escribe la contraseña.'
  if (texto.length < LIMITES_USUARIO.contrasena_minimo)
    return `Debe tener al menos ${LIMITES_USUARIO.contrasena_minimo} caracteres.`
  if (texto.length > LIMITES_USUARIO.contrasena_maximo)
    return `Máximo ${LIMITES_USUARIO.contrasena_maximo} caracteres.`
  if (!/[0-9]/.test(texto)) return 'Debe incluir al menos un número.'
  if (!/[A-Z]/.test(texto)) return 'Debe incluir al menos una mayúscula (A-Z).'
  return null
}

/**
 * Valida el formulario de usuario. La contrasena solo se exige al crear.
 * @param {{ nombre?: unknown, email?: unknown, rol?: unknown, contrasena?: unknown }} formulario
 * @param {{ conContrasena?: boolean }} [opciones]
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: { nombre: string, email: string, rol: string, contrasena?: string } }}
 */
export function validarUsuario(formulario, { conContrasena = false } = {}) {
  /** @type {Record<string, string>} */
  const errores = {}
  const nombre = String(formulario.nombre ?? '')
    .trim()
    .replace(/\s+/g, ' ')
  const email = String(formulario.email ?? '')
    .trim()
    .toLowerCase()
  const rol = String(formulario.rol ?? '')

  if (!nombre) errores.nombre = 'Escribe el nombre.'
  else if (nombre.length > LIMITES_USUARIO.nombre)
    errores.nombre = `Máximo ${LIMITES_USUARIO.nombre} caracteres.`

  if (!email) errores.email = 'Escribe el correo.'
  else if (email.length > LIMITES_USUARIO.email || !PATRON_EMAIL.test(email))
    errores.email = 'El correo no es válido.'

  if (!ROLES.includes(/** @type {any} */ (rol))) errores.rol = 'Elige un rol.'

  const datos = { nombre, email, rol }
  if (conContrasena) {
    const error = validarContrasena(formulario.contrasena)
    if (error) errores.contrasena = error
    datos.contrasena = String(formulario.contrasena ?? '')
  }

  return { valido: Object.keys(errores).length === 0, errores, datos }
}

/**
 * Valida el cambio de la contrasena propia.
 * @param {{ actual?: unknown, contrasena?: unknown, confirmacion?: unknown }} formulario
 * @returns {import('../tipos/index.js').ResultadoValidacion}
 */
export function validarCambioContrasena(formulario) {
  /** @type {Record<string, string>} */
  const errores = {}
  const actual = typeof formulario.actual === 'string' ? formulario.actual : ''
  if (!actual) errores.actual = 'Escribe tu contraseña actual.'

  const error = validarContrasena(formulario.contrasena)
  if (error) errores.contrasena = error
  else if (formulario.contrasena === actual)
    errores.contrasena = 'La contraseña nueva debe ser distinta de la actual.'

  if (!errores.contrasena && formulario.confirmacion !== formulario.contrasena)
    errores.confirmacion = 'Las contraseñas no coinciden.'

  return { valido: Object.keys(errores).length === 0, errores }
}

import { normalizarError } from '../api/errores.js'

/**
 * Funciones de autenticacion compartidas (Supabase Auth, email + contrasena).
 * No lanzan: devuelven `{ ..., error }` con un mensaje listo para mostrar.
 */

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MENSAJE_CREDENCIALES = 'Credenciales incorrectas'

/**
 * Valida el formulario de inicio de sesion.
 * @param {{ email?: string, contrasena?: string }} formulario
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: { email: string, contrasena: string } }}
 */
export function validarInicioSesion({ email = '', contrasena = '' }) {
  /** @type {Record<string, string>} */
  const errores = {}
  const emailLimpio = String(email).trim().toLowerCase()
  if (!emailLimpio) errores.email = 'Escribe tu correo.'
  else if (!PATRON_EMAIL.test(emailLimpio)) errores.email = 'El correo no es válido.'
  if (!contrasena) errores.contrasena = 'Escribe tu contraseña.'
  return {
    valido: Object.keys(errores).length === 0,
    errores,
    datos: { email: emailLimpio, contrasena },
  }
}

/**
 * Traduce un error de Supabase Auth a un mensaje amigable. Nunca revela si
 * el correo existe o no.
 * @param {any} error
 */
function mensajeErrorAuth(error) {
  const codigo = error?.code ?? ''
  const estado = error?.status
  if (
    codigo === 'invalid_credentials' ||
    codigo === 'email_not_confirmed' ||
    estado === 400
  ) {
    return MENSAJE_CREDENCIALES
  }
  if (estado === 429 || codigo === 'over_request_rate_limit') {
    return 'Demasiados intentos. Espera un momento y vuelve a probar.'
  }
  const normalizado = normalizarError(error)
  return normalizado.codigo === 'red'
    ? normalizado.mensaje
    : 'No se pudo iniciar sesión. Inténtalo de nuevo.'
}

/**
 * Iniciar sesion con email y contrasena.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} email
 * @param {string} contrasena
 * @returns {Promise<{ usuario: import('@supabase/supabase-js').User|null, error: string|null }>}
 */
export async function iniciarSesion(supabase, email, contrasena) {
  const { valido, datos } = validarInicioSesion({ email, contrasena })
  if (!valido) return { usuario: null, error: MENSAJE_CREDENCIALES }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: datos.email,
      password: datos.contrasena,
    })
    if (error) return { usuario: null, error: mensajeErrorAuth(error) }
    return { usuario: data.user, error: null }
  } catch (error) {
    return { usuario: null, error: mensajeErrorAuth(error) }
  }
}

/**
 * Cerrar sesion. Si el servidor no responde, la sesion local se borra igual.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ error: string|null }>}
 */
export async function cerrarSesion(supabase) {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      await supabase.auth.signOut({ scope: 'local' })
      return { error: null }
    }
    return { error: null }
  } catch (error) {
    return { error: normalizarError(error).mensaje }
  }
}

/**
 * Obtener la sesion actual (la guardada en el navegador, renovada si hace falta).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ sesion: import('@supabase/supabase-js').Session|null, error: string|null }>}
 */
export async function obtenerSesion(supabase) {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) return { sesion: null, error: normalizarError(error).mensaje }
    return { sesion: data.session, error: null }
  } catch (error) {
    return { sesion: null, error: normalizarError(error).mensaje }
  }
}

/**
 * Escucha cambios de sesion (login, logout en otra pestana, expiracion...).
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {(sesion: import('@supabase/supabase-js').Session|null, evento: string) => void} alCambiar
 * @returns {() => void} funcion para dejar de escuchar
 */
export function escucharCambiosSesion(supabase, alCambiar) {
  const { data } = supabase.auth.onAuthStateChange((evento, sesion) =>
    alCambiar(sesion, evento),
  )
  return () => data.subscription.unsubscribe()
}

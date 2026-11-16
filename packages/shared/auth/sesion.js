import { normalizarError } from '../api/errores.js'

/**
 * Funciones de autenticacion compartidas (Supabase Auth, email + contrasena).
 * No lanzan: devuelven `{ ..., error }` con un mensaje listo para mostrar.
 */

/** Formato de correo; el mismo que valida la base (fn_validar_datos_usuario). */
export const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    // Limite por IP de GoTrue o bloqueo de la cuenta tras 5 fallos (hook
    // fn_hook_intento_contrasena, 15 minutos).
    return 'Demasiados intentos fallidos. Espera 15 minutos y vuelve a probar.'
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
 * Cerrar sesion: revoca los refresh tokens en el servidor (todas las
 * sesiones del usuario) y borra la sesion guardada en el navegador. Si el
 * servidor no responde, la sesion local se borra igual.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<{ error: string|null }>}
 */
export async function cerrarSesion(supabase) {
  let fallo = null
  try {
    const { error } = await supabase.auth.signOut({ scope: 'global' })
    fallo = error
  } catch (error) {
    fallo = error
  }
  if (fallo) {
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } catch {
      // Sin red y sin poder limpiar: quien llama borra el almacenamiento.
    }
  }
  return { error: null }
}

/** Minutos de inactividad tras los que la sesion se cierra sola (8 horas). */
export const MINUTOS_INACTIVIDAD_POR_DEFECTO = 480

/**
 * Lee el limite de inactividad configurado (minutos) y lo pasa a
 * milisegundos. Valores invalidos usan el valor por defecto.
 * @param {unknown} minutos
 */
export function limiteInactividadMs(minutos) {
  const n = Number(minutos)
  const validos = Number.isFinite(n) && n >= 1 && n <= 60 * 24 * 30
  return (validos ? n : MINUTOS_INACTIVIDAD_POR_DEFECTO) * 60 * 1000
}

/**
 * Indica si la sesion debe darse por vencida por inactividad. Sin registro
 * de actividad (o con uno invalido o del futuro) se considera vencida:
 * ante la duda, se pide iniciar sesion.
 * @param {unknown} ultimaActividad  marca de tiempo en ms (o su texto)
 * @param {number} ahora             Date.now()
 * @param {number} limiteMs
 */
export function sesionInactiva(ultimaActividad, ahora, limiteMs) {
  const ultima = Number(ultimaActividad)
  if (!ultimaActividad || !Number.isFinite(ultima) || ultima <= 0) return true
  if (ultima > ahora + 60 * 1000) return true
  return ahora - ultima >= limiteMs
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

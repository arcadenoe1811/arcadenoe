import { CLAVE_SESION, limiteInactividadMs, sesionInactiva } from '@inventario/shared'

/**
 * Estado de sesion que vive en el navegador: registro de la ultima
 * actividad (para cerrar la sesion por inactividad) y limpieza total al
 * salir. Todo acceso al almacenamiento va protegido: en modo privado o con
 * el almacenamiento bloqueado puede lanzar.
 */

const PREFIJO = 'inventario-'
const CLAVE_ACTIVIDAD = `${PREFIJO}ultima-actividad`
const CLAVE_AVISO = `${PREFIJO}aviso-acceso`

/** Configurable con VITE_SESION_INACTIVIDAD_MINUTOS (por defecto 480 = 8 horas). */
export const LIMITE_INACTIVIDAD_MS = limiteInactividadMs(
  import.meta.env.VITE_SESION_INACTIVIDAD_MINUTOS,
)

/** Mensajes que la pantalla de login muestra tras un cierre automatico. */
export const AVISOS_ACCESO = {
  inactividad: 'Tu sesión se cerró por inactividad. Vuelve a iniciar sesión.',
  deshabilitado: 'Tu usuario no tiene acceso. Consulta con un administrador.',
}

const leer = (almacen, clave) => {
  try {
    return almacen.getItem(clave)
  } catch {
    return null
  }
}

/** Anota "ahora" como ultima actividad del usuario (compartido entre pestanas). */
export function registrarActividad() {
  try {
    window.localStorage.setItem(CLAVE_ACTIVIDAD, String(Date.now()))
  } catch {
    // Sin almacenamiento no hay registro: la sesion se dara por vencida.
  }
}

/** true si hay una sesion guardada en este navegador. */
export function haySesionGuardada() {
  return leer(window.localStorage, CLAVE_SESION) !== null
}

/** true si paso el limite de inactividad desde la ultima actividad registrada. */
export function sesionVencida() {
  return sesionInactiva(
    leer(window.localStorage, CLAVE_ACTIVIDAD),
    Date.now(),
    LIMITE_INACTIVIDAD_MS,
  )
}

/**
 * Borra todo rastro local de la sesion: token guardado, registro de
 * actividad, sessionStorage y cualquier cookie del sitio accesible desde
 * JS. (La app no usa cookies: el token vive en localStorage.)
 */
export function limpiarDatosLocales() {
  try {
    const claves = []
    for (let i = 0; i < window.localStorage.length; i++) {
      const clave = window.localStorage.key(i)
      if (clave && (clave.startsWith(PREFIJO) || clave.startsWith('sb-')))
        claves.push(clave)
    }
    for (const clave of claves) window.localStorage.removeItem(clave)
  } catch {
    // almacenamiento no disponible
  }
  try {
    window.sessionStorage.clear()
  } catch {
    // almacenamiento no disponible
  }
  try {
    for (const cookie of document.cookie.split(';')) {
      const nombre = cookie.split('=')[0].trim()
      if (nombre) document.cookie = `${nombre}=; Max-Age=0; path=/`
    }
  } catch {
    // cookies no disponibles
  }
}

/**
 * Va a /login con una recarga completa: descarta los datos en memoria y
 * reemplaza la entrada actual del historial.
 */
export function recargarEnLogin() {
  window.location.replace('/login')
}

/** Deja un aviso para la pantalla de login (sobrevive a la recarga). */
export function guardarAviso(motivo) {
  try {
    window.sessionStorage.setItem(CLAVE_AVISO, motivo)
  } catch {
    // sin aviso
  }
}

/** Lee el aviso pendiente (sin borrarlo). @returns {string|null} */
export function leerAviso() {
  return AVISOS_ACCESO[leer(window.sessionStorage, CLAVE_AVISO) ?? ''] ?? null
}

export function borrarAviso() {
  try {
    window.sessionStorage.removeItem(CLAVE_AVISO)
  } catch {
    // nada que borrar
  }
}

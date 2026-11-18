import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  cerrarSesion as cerrarSesionSupabase,
  escucharCambiosSesion,
  iniciarSesion as iniciarSesionSupabase,
  obtenerCliente,
  obtenerMiPerfil,
  obtenerSesion,
  puede as rolPuede,
} from '@inventario/shared'
import { useConsulta } from '../hooks/useConsulta.js'
import {
  guardarAviso,
  haySesionGuardada,
  limpiarDatosLocales,
  recargarEnLogin,
  registrarActividad,
  sesionVencida,
} from '../utils/sesionLocal.js'

/**
 * @typedef {Object} ValorAuth
 * @property {import('@supabase/supabase-js').User|null} usuario
 * @property {import('@supabase/supabase-js').Session|null} sesion
 * @property {import('@inventario/shared').Perfil|null} perfil  nombre, rol y estado (tabla perfiles)
 * @property {import('@inventario/shared').Rol|null} rol
 * @property {(permiso: string) => boolean} puede  solo decide que se muestra; la base es la que autoriza
 * @property {boolean} cargando  true mientras se verifica la sesion guardada o se carga el perfil
 * @property {import('@inventario/shared').ErrorNormalizado|null} errorPerfil
 * @property {() => void} recargarPerfil
 * @property {(email: string, contrasena: string) => Promise<{ usuario: object|null, error: string|null }>} iniciarSesion
 * @property {() => Promise<void>} cerrarSesion
 */

/** @type {import('react').Context<ValorAuth|null>} */
export const ContextoAuth = createContext(null)

/** Cada cuanto se revisa la inactividad con la app abierta. */
const INTERVALO_REVISION_MS = 30 * 1000
/** La actividad se anota como mucho una vez cada tanto (no en cada tecla). */
const PAUSA_REGISTRO_MS = 15 * 1000
const EVENTOS_ACTIVIDAD = ['pointerdown', 'keydown', 'wheel', 'touchstart']

const sinPerfil = () => Promise.resolve(null)

/**
 * Provider de autenticacion.
 *
 * - Recupera la sesion guardada al arrancar y escucha onAuthStateChange
 *   (login, logout en otra pestana, token vencido o revocado).
 * - Cierra la sesion tras LIMITE_INACTIVIDAD_MS sin actividad, tambien si
 *   la app estuvo cerrada: al abrirla con una sesion vieja se pide login.
 * - Carga el perfil (rol y estado). Un usuario deshabilitado queda fuera.
 * - Cerrar sesion revoca los tokens en el servidor, borra todo lo local y
 *   recarga la pagina: no queda nada en memoria ni al volver "atras".
 */
export function ProveedorAuth({ children }) {
  const [sesion, setSesion] = useState(
    /** @type {import('@supabase/supabase-js').Session|null} */ (null),
  )
  const [verificando, setVerificando] = useState(true)
  const saliendo = useRef(false)

  const salir = useCallback(async (/** @type {string|null} */ motivo = null) => {
    if (saliendo.current) return
    saliendo.current = true
    await cerrarSesionSupabase(obtenerCliente())
    limpiarDatosLocales()
    if (motivo) guardarAviso(motivo)
    // Recarga completa: descarta los datos en memoria y el historial de la SPA.
    recargarEnLogin()
  }, [])

  // Sesion guardada + cambios de sesion
  useEffect(() => {
    // Una sesion guardada sin actividad reciente no se reutiliza.
    if (haySesionGuardada() && sesionVencida()) {
      salir('inactividad')
      return undefined
    }

    const cliente = obtenerCliente()
    let vigente = true

    obtenerSesion(cliente).then(({ sesion: guardada }) => {
      if (!vigente || saliendo.current) return
      setSesion(guardada)
      setVerificando(false)
    })

    const dejarDeEscuchar = escucharCambiosSesion(cliente, (nueva) => {
      if (!vigente || saliendo.current) return
      setSesion(nueva)
      setVerificando(false)
    })

    // Pagina restaurada desde la cache del navegador (boton "atras" tras
    // cerrar sesion): se recarga para volver a verificar la sesion.
    const alMostrar = (evento) => evento.persisted && window.location.reload()
    window.addEventListener('pageshow', alMostrar)

    return () => {
      vigente = false
      dejarDeEscuchar()
      window.removeEventListener('pageshow', alMostrar)
    }
  }, [salir])

  const usuario = sesion?.user ?? null
  const idUsuario = usuario?.id ?? null

  // Expiracion por inactividad con la app abierta
  useEffect(() => {
    if (!idUsuario) return undefined
    let ultimoRegistro = 0

    const revisar = () => {
      if (!sesionVencida()) return false
      salir('inactividad')
      return true
    }
    const alActuar = () => {
      // Primero se revisa: volver tras el limite NO renueva la sesion.
      if (revisar()) return
      const ahora = Date.now()
      if (ahora - ultimoRegistro < PAUSA_REGISTRO_MS) return
      ultimoRegistro = ahora
      registrarActividad()
    }
    const alVolver = () => document.visibilityState === 'visible' && revisar()

    const intervalo = window.setInterval(revisar, INTERVALO_REVISION_MS)
    for (const evento of EVENTOS_ACTIVIDAD)
      window.addEventListener(evento, alActuar, { passive: true })
    document.addEventListener('visibilitychange', alVolver)

    return () => {
      window.clearInterval(intervalo)
      for (const evento of EVENTOS_ACTIVIDAD) window.removeEventListener(evento, alActuar)
      document.removeEventListener('visibilitychange', alVolver)
    }
  }, [idUsuario, salir])

  // Perfil: se vuelve a leer con cada token nuevo (cada hora), asi un
  // cambio de rol o una baja se reflejan sin esperar a un nuevo login.
  const token = sesion?.access_token ?? null
  const cargarPerfil = useCallback(
    () => (idUsuario && token ? obtenerMiPerfil(idUsuario) : sinPerfil()),
    [idUsuario, token],
  )
  const consultaPerfil = useConsulta(cargarPerfil)
  const perfil =
    idUsuario && consultaPerfil.datos?.id === idUsuario ? consultaPerfil.datos : null
  const perfilResuelto = !consultaPerfil.cargando && !consultaPerfil.error

  // Sin perfil o deshabilitado: fuera.
  useEffect(() => {
    if (idUsuario && perfilResuelto && !perfil?.activo) salir('deshabilitado')
  }, [idUsuario, perfilResuelto, perfil, salir])

  const valor = useMemo(() => {
    const rol = perfil?.activo ? perfil.rol : null
    return {
      usuario,
      sesion,
      perfil,
      rol,
      puede: (permiso) => rolPuede(rol, permiso),
      cargando: verificando || Boolean(idUsuario && !perfil && consultaPerfil.cargando),
      errorPerfil: idUsuario && !perfil ? consultaPerfil.error : null,
      recargarPerfil: consultaPerfil.recargar,
      iniciarSesion: (email, contrasena) => {
        // El login cuenta como actividad: empieza una ventana nueva.
        registrarActividad()
        return iniciarSesionSupabase(obtenerCliente(), email, contrasena)
      },
      cerrarSesion: () => salir(null),
    }
  }, [
    usuario,
    sesion,
    perfil,
    verificando,
    idUsuario,
    consultaPerfil.cargando,
    consultaPerfil.error,
    consultaPerfil.recargar,
    salir,
  ])

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>
}

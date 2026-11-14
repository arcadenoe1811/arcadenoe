import { useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { validarInicioSesion } from '@inventario/shared'
import { useAuth } from '../hooks/useAuth.js'
import Boton from '../components/ui/Boton.jsx'
import CampoTexto from '../components/ui/CampoTexto.jsx'
import Tarjeta from '../components/ui/Tarjeta.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import MensajeError from '../components/ui/MensajeError.jsx'
import {
  IconoCandado,
  IconoCorreo,
  IconoOjo,
  IconoOjoTachado,
} from '../components/Iconos.jsx'
import './InicioSesion.css'

// Solo en desarrollo se pre-llenan las credenciales del .env.
const EMAIL_POR_DEFECTO = import.meta.env.DEV
  ? (import.meta.env.VITE_DEFAULT_EMAIL ?? '')
  : ''
const CONTRASENA_POR_DEFECTO = import.meta.env.DEV
  ? (import.meta.env.VITE_DEFAULT_PASSWORD ?? '')
  : ''

export default function InicioSesion() {
  const { usuario, cargando, iniciarSesion } = useAuth()
  const ubicacion = useLocation()
  const [email, setEmail] = useState(EMAIL_POR_DEFECTO)
  const [contrasena, setContrasena] = useState(CONTRASENA_POR_DEFECTO)
  const [verContrasena, setVerContrasena] = useState(false)
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [error, setError] = useState(/** @type {string|null} */ (null))
  const [enviando, setEnviando] = useState(false)
  const refEmail = useRef(/** @type {HTMLInputElement|null} */ (null))
  const refContrasena = useRef(/** @type {HTMLInputElement|null} */ (null))

  if (cargando) {
    return (
      <div className="acceso">
        <Spinner tamano="lg" etiqueta="Verificando sesión" className="acceso-spinner" />
      </div>
    )
  }

  // Con sesion activa (o recien iniciada) se entra directo a la app.
  if (usuario) {
    const destino = ubicacion.state?.desde?.pathname ?? '/'
    return <Navigate to={destino === '/login' ? '/' : destino} replace />
  }

  const limpiarMensajes = () => {
    if (error) setError(null)
    if (Object.keys(errores).length) setErrores({})
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    const validacion = validarInicioSesion({ email, contrasena })
    if (!validacion.valido) {
      setErrores(validacion.errores)
      ;(validacion.errores.email ? refEmail : refContrasena).current?.focus()
      return
    }

    setEnviando(true)
    setError(null)
    const resultado = await iniciarSesion(
      validacion.datos.email,
      validacion.datos.contrasena,
    )
    if (resultado.error) {
      setError(resultado.error)
      setEnviando(false)
      refContrasena.current?.select()
    }
    // Si sale bien, ContextoAuth recibe la sesion y este componente
    // redirige con <Navigate> en el siguiente render.
  }

  return (
    <div className="acceso">
      <header className="acceso-encabezado">
        <img src="/icono.svg" alt="" width="56" height="56" className="acceso-logo" />
        <h1>Inventario de Cuellos</h1>
        <p className="acceso-subtitulo">Tejedora industrial · inventario personal</p>
      </header>

      <Tarjeta padding="lg" className="acceso-tarjeta">
        <form className="acceso-formulario" onSubmit={enviar} noValidate>
          <CampoTexto
            ref={refEmail}
            etiqueta="Correo electrónico"
            tipo="email"
            name="email"
            autoComplete="username"
            inputMode="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="tu@correo.com"
            value={email}
            error={errores.email}
            icono_izquierdo={<IconoCorreo />}
            onChange={(e) => {
              setEmail(e.target.value)
              limpiarMensajes()
            }}
          />

          <CampoTexto
            ref={refContrasena}
            etiqueta="Contraseña"
            tipo={verContrasena ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={contrasena}
            error={errores.contrasena}
            icono_izquierdo={<IconoCandado />}
            icono_derecho={
              <button
                type="button"
                className="boton-ver-contrasena"
                onClick={() => setVerContrasena((v) => !v)}
                aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={verContrasena}
              >
                {verContrasena ? <IconoOjoTachado /> : <IconoOjo />}
              </button>
            }
            onChange={(e) => {
              setContrasena(e.target.value)
              limpiarMensajes()
            }}
          />

          <Boton
            type="submit"
            variante="primario"
            tamano="lg"
            ancho_completo
            cargando={enviando}
          >
            {enviando ? 'Ingresando…' : 'Iniciar Sesión'}
          </Boton>

          <div aria-live="assertive">
            <MensajeError mensaje={error} />
          </div>
        </form>
      </Tarjeta>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  AYUDA_CONTRASENA,
  cambiarMiContrasena,
  normalizarError,
  validarCambioContrasena,
} from '@inventario/shared'
import { useAuth } from '../hooks/useAuth.js'
import Boton from '../components/ui/Boton.jsx'
import CampoTexto from '../components/ui/CampoTexto.jsx'
import Tarjeta from '../components/ui/Tarjeta.jsx'
import MensajeError from '../components/ui/MensajeError.jsx'
import Aviso from '../components/Aviso.jsx'
import { IconoCandado } from '../components/Iconos.jsx'
import './InicioSesion.css'

const VACIO = { actual: '', contrasena: '', confirmacion: '' }

/**
 * Cambio de la contrasena propia. Es obligatorio (y la unica pantalla
 * disponible) cuando el usuario entra con una contrasena temporal.
 */
export default function PaginaCambiarContrasena() {
  const { perfil, recargarPerfil, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const obligatorio = Boolean(perfil?.debe_cambiar_contrasena)
  const [formulario, setFormulario] = useState(VACIO)
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [error, setError] = useState(/** @type {string|null} */ (null))
  const [enviando, setEnviando] = useState(false)

  const cambiar = (nombre) => (evento) => {
    setFormulario((previo) => ({ ...previo, [nombre]: evento.target.value }))
    setErrores((previos) => ({ ...previos, [nombre]: undefined }))
    setError(null)
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    const validacion = validarCambioContrasena(formulario)
    if (!validacion.valido) {
      setErrores(validacion.errores)
      return
    }
    setEnviando(true)
    setError(null)
    try {
      await cambiarMiContrasena(formulario)
      recargarPerfil()
      navegar('/', { replace: true })
    } catch (e) {
      const normalizado = normalizarError(e)
      setErrores(normalizado.errores ?? {})
      setError(normalizado.campo ? null : normalizado.mensaje)
      setEnviando(false)
    }
  }

  return (
    <div className="acceso">
      <header className="acceso-encabezado">
        <img
          src="/logo-emblema-claro.png"
          alt="Arca de Noé"
          width="80"
          height="80"
          className="acceso-logo"
        />
        <h1>Cambiar contraseña</h1>
        <p className="acceso-subtitulo">{perfil?.nombre}</p>
      </header>

      <Tarjeta padding="lg" className="acceso-tarjeta">
        <form className="acceso-formulario" onSubmit={enviar} noValidate>
          {obligatorio && (
            <Aviso tipo="info">
              Entraste con una contraseña temporal. Elige una nueva para continuar.
            </Aviso>
          )}

          <CampoTexto
            etiqueta={obligatorio ? 'Contraseña temporal' : 'Contraseña actual'}
            tipo="password"
            name="actual"
            autoComplete="current-password"
            value={formulario.actual}
            error={errores.actual}
            icono_izquierdo={<IconoCandado />}
            onChange={cambiar('actual')}
          />
          <CampoTexto
            etiqueta="Contraseña nueva"
            tipo="password"
            name="contrasena"
            autoComplete="new-password"
            maxLength={72}
            value={formulario.contrasena}
            error={errores.contrasena}
            icono_izquierdo={<IconoCandado />}
            onChange={cambiar('contrasena')}
          />
          <CampoTexto
            etiqueta="Repite la contraseña nueva"
            tipo="password"
            name="confirmacion"
            autoComplete="new-password"
            maxLength={72}
            value={formulario.confirmacion}
            error={errores.confirmacion}
            icono_izquierdo={<IconoCandado />}
            onChange={cambiar('confirmacion')}
          />
          <small className="campo-ayuda">{AYUDA_CONTRASENA}</small>

          <Boton
            type="submit"
            variante="primario"
            tamano="lg"
            ancho_completo
            cargando={enviando}
          >
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </Boton>

          {obligatorio ? (
            <Boton variante="fantasma" ancho_completo onClick={cerrarSesion}>
              Cerrar sesión
            </Boton>
          ) : (
            <Link to="/" className="boton boton-fantasma boton-md boton-ancho-completo">
              Cancelar
            </Link>
          )}

          <div aria-live="assertive">
            <MensajeError mensaje={error} />
          </div>
        </form>
      </Tarjeta>
    </div>
  )
}

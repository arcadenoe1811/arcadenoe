import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { IconoCerrar, IconoMenu, IconoSalir } from './Iconos.jsx'
import Spinner from './ui/Spinner.jsx'
import { RUTA_CAMBIAR_CONTRASENA } from './RutaProtegida.jsx'
import './LayoutPrincipal.css'

/** Cada enlace se muestra solo a quien tiene su permiso. */
const ENLACES = [
  { a: '/', texto: 'Buscar', fin: true, permiso: 'cuellos.ver' },
  { a: '/colores', texto: 'Colores', permiso: 'colores.ver' },
  { a: '/conos', texto: 'Conos', permiso: 'conos.ver' },
  { a: '/usuarios', texto: 'Usuarios', permiso: 'usuarios.gestionar' },
]

/**
 * Layout de las pantallas protegidas: barra superior fija + contenido.
 * Movil/tablet: menu hamburguesa. Escritorio (>= 1024px): enlaces y
 * "Cerrar sesion" visibles.
 */
export default function LayoutPrincipal() {
  const { usuario, perfil, puede, cerrarSesion } = useAuth()
  const enlaces = ENLACES.filter((enlace) => puede(enlace.permiso))
  const editaCuellos = puede('cuellos.editar')
  const ubicacion = useLocation()
  // El menu se abre "para" una ruta: al navegar a otra queda cerrado solo,
  // sin un efecto que haga setState.
  const [rutaMenu, setRutaMenu] = useState(/** @type {string|null} */ (null))
  const menuAbierto = rutaMenu === ubicacion.pathname
  const cerrarMenu = useCallback(() => setRutaMenu(null), [])
  const [saliendo, setSaliendo] = useState(false)

  // Cerrar el menu con Escape
  useEffect(() => {
    if (!menuAbierto) return undefined
    const alPresionar = (evento) => evento.key === 'Escape' && cerrarMenu()
    document.addEventListener('keydown', alPresionar)
    return () => document.removeEventListener('keydown', alPresionar)
  }, [menuAbierto, cerrarMenu])

  const salir = async () => {
    setSaliendo(true)
    // Revoca la sesion, borra lo guardado en el navegador y recarga en /login.
    await cerrarSesion()
  }

  const nombre = perfil?.nombre ?? usuario?.email ?? ''

  const botonSalir = (
    <button
      type="button"
      className="boton boton-secundario boton-sm"
      onClick={salir}
      disabled={saliendo}
    >
      {saliendo ? (
        <Spinner tamano="sm" etiqueta="Cerrando sesión" />
      ) : (
        <IconoSalir width="16" height="16" />
      )}
      Cerrar sesión
    </button>
  )

  return (
    <div className="layout">
      <header className="encabezado">
        <div className="contenedor encabezado-contenido">
          <NavLink to="/" className="marca" end>
            <img
              src="/logo-emblema-claro.png"
              alt=""
              width="34"
              height="34"
              className="marca-logo"
            />
            <span className="marca-corta">Arca de Noé</span>
            <span className="marca-larga">
              Arca de Noé <span className="marca-sub">· Inventario</span>
            </span>
          </NavLink>

          {/* Escritorio */}
          <nav className="navegacion-escritorio" aria-label="Principal">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                end={enlace.fin}
                className="enlace-navegacion"
              >
                {enlace.texto}
              </NavLink>
            ))}
            {editaCuellos && (
              <>
                <NavLink
                  to="/cuellos/nuevo"
                  className="boton boton-primario boton-sm boton-compacto"
                >
                  + Nuevo cuello
                </NavLink>
                <NavLink
                  to="/punos/nuevo"
                  className="boton boton-secundario boton-sm boton-compacto"
                >
                  + Nuevo puño
                </NavLink>
              </>
            )}
            <span className="separador" aria-hidden="true" />
            <NavLink
              to={RUTA_CAMBIAR_CONTRASENA}
              className="usuario"
              title={`${usuario?.email ?? ''} · Cambiar contraseña`}
            >
              {nombre}
            </NavLink>
            {botonSalir}
          </nav>

          {/* Movil y tablet */}
          <button
            type="button"
            className="boton-menu"
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setRutaMenu(menuAbierto ? null : ubicacion.pathname)}
          >
            {menuAbierto ? (
              <IconoCerrar width="24" height="24" />
            ) : (
              <IconoMenu width="24" height="24" />
            )}
          </button>
        </div>

        {menuAbierto && (
          <nav id="menu-movil" className="menu-movil" aria-label="Principal">
            <div className="contenedor menu-movil-contenido">
              {enlaces.map((enlace) => (
                <NavLink
                  key={enlace.a}
                  to={enlace.a}
                  end={enlace.fin}
                  className="enlace-menu"
                >
                  {enlace.texto}
                </NavLink>
              ))}
              {editaCuellos && (
                <>
                  <NavLink to="/cuellos/nuevo" className="enlace-menu">
                    + Nuevo cuello
                  </NavLink>
                  <NavLink to="/punos/nuevo" className="enlace-menu">
                    + Nuevo puño
                  </NavLink>
                </>
              )}
              <NavLink to={RUTA_CAMBIAR_CONTRASENA} className="enlace-menu">
                Cambiar contraseña
              </NavLink>
              <div className="menu-movil-pie">
                <span className="usuario">{nombre}</span>
                {botonSalir}
              </div>
            </div>
          </nav>
        )}
      </header>

      {menuAbierto && (
        <div className="velo-menu" onClick={cerrarMenu} aria-hidden="true" />
      )}

      <main className="contenedor principal">
        <Outlet />
      </main>
    </div>
  )
}

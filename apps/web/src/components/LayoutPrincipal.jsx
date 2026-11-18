import { useCallback, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { formatearRol } from '@inventario/shared'
import { useAuth } from '../hooks/useAuth.js'
import {
  IconoCalculadora,
  IconoCerrar,
  IconoContraer,
  IconoCuello,
  IconoInventario,
  IconoMenu,
  IconoPaleta,
  IconoReportes,
  IconoSalir,
  IconoTablero,
  IconoUsuarios,
  IconoVentas,
} from './Iconos.jsx'
import Spinner from './ui/Spinner.jsx'
import { RUTA_CAMBIAR_CONTRASENA } from './RutaProtegida.jsx'
import './LayoutPrincipal.css'

/** Preferencia de menu oculto (escritorio); sobrevive a recargas. */
const CLAVE_MENU = 'inventario-menu-oculto'

const leerMenuOculto = () => {
  try {
    return window.localStorage.getItem(CLAVE_MENU) === '1'
  } catch {
    return false
  }
}

/** true en escritorio, donde el menu va fijo al lado del contenido. */
const esEscritorio = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(min-width: 1024px)').matches

const empiezaCon = (ruta, base) => ruta === base || ruta.startsWith(`${base}/`)

/**
 * Menu lateral. Cada enlace se muestra solo a quien tiene su permiso (la
 * autorizacion real esta en la base). `activo` decide cuando se resalta;
 * por defecto, cuando la ruta empieza por `a`.
 *
 * @typedef {{ a: string, texto: string, permiso: string, activo?: (ruta: string) => boolean }} Enlace
 * @typedef {{ texto: string, icono: (props: object) => JSX.Element, hijos: Enlace[] }} Grupo
 * @type {((Enlace & { icono: (props: object) => JSX.Element }) | Grupo)[]}
 */
const MENU = [
  {
    a: '/',
    texto: 'Dashboard',
    icono: IconoTablero,
    permiso: 'dashboard.ver',
    activo: (ruta) => ruta === '/',
  },
  {
    texto: 'Inventario',
    icono: IconoInventario,
    hijos: [
      { a: '/conos/muestrario', texto: 'Muestrario de colores', permiso: 'conos.ver' },
      {
        a: '/conos',
        texto: 'Conos',
        permiso: 'conos.ver',
        activo: (ruta) =>
          empiezaCon(ruta, '/conos') &&
          ruta !== '/conos/muestrario' &&
          ruta !== '/conos/entrada' &&
          ruta !== '/conos/salida',
      },
      { a: '/conos/entrada', texto: 'Registrar entrada', permiso: 'conos.editar' },
      { a: '/conos/salida', texto: 'Registrar salida', permiso: 'conos.editar' },
    ],
  },
  { a: '/colores', texto: 'Colores', icono: IconoPaleta, permiso: 'colores.ver' },
  {
    texto: 'Cuellos',
    icono: IconoCuello,
    hijos: [
      {
        a: '/cuellos',
        texto: 'Catálogo de cuellos',
        permiso: 'cuellos.ver',
        activo: (ruta) => empiezaCon(ruta, '/cuellos') || empiezaCon(ruta, '/punos'),
      },
      { a: '/disenos', texto: 'Diseños', permiso: 'cuellos.ver' },
      { a: '/produccion', texto: 'Producción', permiso: 'produccion.registrar' },
    ],
  },
  {
    texto: 'Ventas',
    icono: IconoVentas,
    hijos: [
      { a: '/ventas/nueva', texto: 'Registrar venta', permiso: 'ventas.registrar' },
      {
        a: '/ventas',
        texto: 'Historial de ventas',
        permiso: 'ventas.ver',
        activo: (ruta) => ruta === '/ventas',
      },
    ],
  },
  {
    a: '/estimador',
    texto: 'Estimador de costos',
    icono: IconoCalculadora,
    permiso: 'estimador.usar',
  },
  {
    a: '/usuarios',
    texto: 'Usuarios',
    icono: IconoUsuarios,
    permiso: 'usuarios.gestionar',
  },
  { a: '/reportes', texto: 'Reportes', icono: IconoReportes, permiso: 'reportes.ver' },
]

/** @param {Enlace} enlace @param {string} ruta */
const estaActivo = (enlace, ruta) =>
  enlace.activo ? enlace.activo(ruta) : empiezaCon(ruta, enlace.a)

function EnlaceMenu({ enlace, ruta, hijo = false }) {
  const activo = estaActivo(enlace, ruta)
  const Icono = enlace.icono
  return (
    <Link
      to={enlace.a}
      className={`menu-enlace${hijo ? ' menu-enlace-hijo' : ''}${activo ? ' activo' : ''}`}
      aria-current={activo ? 'page' : undefined}
    >
      {Icono && <Icono width="20" height="20" className="menu-icono" />}
      <span>{enlace.texto}</span>
    </Link>
  )
}

/**
 * Layout de las pantallas protegidas: menu lateral fijo a la izquierda +
 * contenido. En movil/tablet (< 1024px) el menu es un cajon que se abre
 * con el boton de hamburguesa de la barra superior. En escritorio el menu
 * se puede ocultar (boton en su cabecera) para dar todo el ancho al
 * contenido; entonces aparece la barra superior con el boton para volver
 * a mostrarlo. La preferencia se recuerda.
 */
export default function LayoutPrincipal() {
  const { usuario, perfil, rol, puede, cerrarSesion } = useAuth()
  const ubicacion = useLocation()
  const ruta = ubicacion.pathname
  // El cajon se abre "para" una ruta: al navegar a otra queda cerrado solo,
  // sin un efecto que haga setState.
  const [rutaMenu, setRutaMenu] = useState(/** @type {string|null} */ (null))
  const menuAbierto = rutaMenu === ruta
  const cerrarMenu = useCallback(() => setRutaMenu(null), [])
  const [saliendo, setSaliendo] = useState(false)
  const [oculto, setOculto] = useState(leerMenuOculto)

  const cambiarOculto = (valor) => {
    setOculto(valor)
    try {
      window.localStorage.setItem(CLAVE_MENU, valor ? '1' : '0')
    } catch {
      // sin almacenamiento la preferencia dura hasta recargar
    }
  }
  // Un solo boton de hamburguesa: en escritorio muestra el menu oculto; en
  // movil abre o cierra el cajon.
  const alternarMenu = () => {
    if (esEscritorio()) cambiarOculto(false)
    else setRutaMenu(menuAbierto ? null : ruta)
  }

  // Cerrar el cajon con Escape
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

  const menu = MENU.map((item) =>
    'hijos' in item
      ? { ...item, hijos: item.hijos.filter((hijo) => puede(hijo.permiso)) }
      : item,
  ).filter((item) => ('hijos' in item ? item.hijos.length > 0 : puede(item.permiso)))

  const nombre = perfil?.nombre ?? usuario?.email ?? ''

  return (
    <div className={`layout${oculto ? ' layout-menu-oculto' : ''}`}>
      {/* Barra superior: solo movil y tablet */}
      <header className="barra-movil">
        <button
          type="button"
          className="boton-menu"
          aria-expanded={menuAbierto}
          aria-controls="menu-lateral"
          aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          onClick={alternarMenu}
        >
          {menuAbierto ? (
            <IconoCerrar width="24" height="24" />
          ) : (
            <IconoMenu width="24" height="24" />
          )}
        </button>
        <Link to="/" className="marca">
          <img
            src="/logo-emblema-claro.png"
            alt=""
            width="30"
            height="30"
            className="marca-logo"
          />
          <span>Arca de Noé</span>
        </Link>
      </header>

      {menuAbierto && (
        <div className="velo-menu" onClick={cerrarMenu} aria-hidden="true" />
      )}

      <aside
        id="menu-lateral"
        className={`lateral${menuAbierto ? ' lateral-abierto' : ''}`}
      >
        <Link to="/" className="marca lateral-marca">
          <img
            src="/logo-emblema-claro.png"
            alt=""
            width="36"
            height="36"
            className="marca-logo"
          />
          <span>
            Arca de Noé
            <span className="marca-sub">Inventario</span>
          </span>
        </Link>

        <button
          type="button"
          className="lateral-ocultar"
          onClick={() => cambiarOculto(true)}
          aria-label="Ocultar menú"
          title="Ocultar menú"
        >
          <IconoContraer width="20" height="20" />
        </button>

        <nav className="menu" aria-label="Principal">
          {menu.map((item) =>
            'hijos' in item ? (
              <div
                key={item.texto}
                className="menu-grupo"
                role="group"
                aria-label={item.texto}
              >
                <div
                  className={`menu-grupo-titulo${
                    item.hijos.some((hijo) => estaActivo(hijo, ruta)) ? ' activo' : ''
                  }`}
                >
                  <item.icono width="20" height="20" className="menu-icono" />
                  <span>{item.texto}</span>
                </div>
                {item.hijos.map((hijo) => (
                  <EnlaceMenu key={hijo.a} enlace={hijo} ruta={ruta} hijo />
                ))}
              </div>
            ) : (
              <EnlaceMenu key={item.a} enlace={item} ruta={ruta} />
            ),
          )}
        </nav>

        <div className="lateral-pie">
          <Link
            to={RUTA_CAMBIAR_CONTRASENA}
            className="lateral-usuario"
            title={`${usuario?.email ?? ''} · Cambiar contraseña`}
          >
            <span className="lateral-avatar" aria-hidden="true">
              {nombre.trim().charAt(0).toUpperCase() || '?'}
            </span>
            <span className="lateral-usuario-texto">
              <span className="lateral-usuario-nombre">{nombre}</span>
              <span className="lateral-usuario-rol">{formatearRol(rol)}</span>
            </span>
          </Link>
          <button
            type="button"
            className="lateral-salir"
            onClick={salir}
            disabled={saliendo}
          >
            {saliendo ? (
              <Spinner tamano="sm" etiqueta="Cerrando sesión" />
            ) : (
              <IconoSalir width="18" height="18" />
            )}
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="principal">
        <div className="contenedor">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

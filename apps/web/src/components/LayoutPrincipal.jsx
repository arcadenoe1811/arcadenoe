import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { usarAuth } from '../hooks/usarAuth.js';
import { IconoCerrar, IconoMenu, IconoSalir } from './Iconos.jsx';
import Spinner from './ui/Spinner.jsx';
import './LayoutPrincipal.css';

const ENLACES = [
  { a: '/', texto: 'Buscar', fin: true },
  { a: '/colores', texto: 'Colores' },
];

/**
 * Layout de las pantallas protegidas: barra superior fija + contenido.
 * Movil/tablet: menu hamburguesa. Escritorio (>= 1024px): enlaces y
 * "Cerrar sesion" visibles.
 */
export default function LayoutPrincipal() {
  const { usuario, cerrarSesion } = usarAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  // Cerrar el menu al cambiar de pantalla
  useEffect(() => setMenuAbierto(false), [ubicacion.pathname]);

  // Cerrar el menu con Escape
  useEffect(() => {
    if (!menuAbierto) return undefined;
    const alPresionar = (evento) => evento.key === 'Escape' && setMenuAbierto(false);
    document.addEventListener('keydown', alPresionar);
    return () => document.removeEventListener('keydown', alPresionar);
  }, [menuAbierto]);

  const salir = async () => {
    setSaliendo(true);
    await cerrarSesion();
    // Al perder la sesion RutaProtegida tambien redirige; esto lo hace explicito.
    navegar('/login', { replace: true });
  };

  const nombre = usuario?.user_metadata?.nombre ?? usuario?.email ?? '';

  const botonSalir = (
    <button type="button" className="boton boton-secundario boton-sm" onClick={salir} disabled={saliendo}>
      {saliendo ? <Spinner tamano="sm" etiqueta="Cerrando sesión" /> : <IconoSalir width="16" height="16" />}
      Cerrar sesión
    </button>
  );

  return (
    <div className="layout">
      <header className="encabezado">
        <div className="contenedor encabezado-contenido">
          <NavLink to="/" className="marca" end>
            <img src="/icono.svg" alt="" width="28" height="28" />
            <span className="marca-corta">Inventario</span>
            <span className="marca-larga">Inventario de cuellos</span>
          </NavLink>

          {/* Escritorio */}
          <nav className="navegacion-escritorio" aria-label="Principal">
            {ENLACES.map((enlace) => (
              <NavLink key={enlace.a} to={enlace.a} end={enlace.fin} className="enlace-navegacion">
                {enlace.texto}
              </NavLink>
            ))}
            <NavLink to="/cuellos/nuevo" className="boton boton-primario boton-sm boton-compacto">
              + Nuevo cuello
            </NavLink>
            <span className="separador" aria-hidden="true" />
            <span className="usuario" title={usuario?.email}>
              {nombre}
            </span>
            {botonSalir}
          </nav>

          {/* Movil y tablet */}
          <button
            type="button"
            className="boton-menu"
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            {menuAbierto ? <IconoCerrar width="24" height="24" /> : <IconoMenu width="24" height="24" />}
          </button>
        </div>

        {menuAbierto && (
          <nav id="menu-movil" className="menu-movil" aria-label="Principal">
            <div className="contenedor menu-movil-contenido">
              {ENLACES.map((enlace) => (
                <NavLink key={enlace.a} to={enlace.a} end={enlace.fin} className="enlace-menu">
                  {enlace.texto}
                </NavLink>
              ))}
              <NavLink to="/cuellos/nuevo" className="enlace-menu">
                + Nuevo cuello
              </NavLink>
              <div className="menu-movil-pie">
                <span className="usuario">{nombre}</span>
                {botonSalir}
              </div>
            </div>
          </nav>
        )}
      </header>

      {menuAbierto && <div className="velo-menu" onClick={() => setMenuAbierto(false)} aria-hidden="true" />}

      <main className="contenedor principal">
        <Outlet />
      </main>
    </div>
  );
}

import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import Spinner from './ui/Spinner.jsx'
import Aviso from './Aviso.jsx'
import './RutaProtegida.css'

export const RUTA_CAMBIAR_CONTRASENA = '/cuenta/contrasena'

/**
 * Wrapper de ruta que verifica autenticacion y, opcionalmente, un permiso.
 * - Cargando la sesion o el perfil -> spinner centrado
 * - Sin usuario -> /login (recordando a donde se queria ir)
 * - Usuario deshabilitado o sin perfil -> nada (ContextoAuth cierra la sesion)
 * - Contrasena temporal -> solo puede ir a cambiarla
 * - Sin el `permiso` pedido -> aviso de acceso denegado
 * - Todo en orden -> children (o las rutas hijas)
 *
 * Esto solo decide que se muestra. Quien de verdad autoriza es la base de
 * datos (RLS): un operador que llame a la API directamente recibe 403.
 *
 * @param {{ permiso?: string, children?: import('react').ReactNode }} props
 */
export default function RutaProtegida({ permiso, children }) {
  const { usuario, perfil, cargando, errorPerfil, recargarPerfil, cerrarSesion, puede } =
    useAuth()
  const ubicacion = useLocation()

  if (cargando) return <PantallaCarga etiqueta="Verificando sesión" />

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion }} />
  }

  if (errorPerfil) {
    return (
      <div className="pantalla-carga">
        <Aviso
          tipo="error"
          accion={
            <div className="pantalla-carga-acciones">
              <button
                type="button"
                className="boton boton-primario"
                onClick={recargarPerfil}
              >
                Reintentar
              </button>
              <button
                type="button"
                className="boton boton-secundario"
                onClick={cerrarSesion}
              >
                Cerrar sesión
              </button>
            </div>
          }
        >
          No se pudo verificar tu usuario. {errorPerfil.mensaje}
        </Aviso>
      </div>
    )
  }

  if (!perfil?.activo) return <PantallaCarga etiqueta="Cerrando sesión" />

  if (perfil.debe_cambiar_contrasena && ubicacion.pathname !== RUTA_CAMBIAR_CONTRASENA) {
    return <Navigate to={RUTA_CAMBIAR_CONTRASENA} replace />
  }

  if (permiso && !puede(permiso)) {
    return (
      <Aviso
        tipo="error"
        accion={
          <Link to="/" className="boton boton-secundario">
            Ir al inicio
          </Link>
        }
      >
        No tienes permiso para ver esta sección.
      </Aviso>
    )
  }

  return children ?? <Outlet />
}

function PantallaCarga({ etiqueta }) {
  return (
    <div className="pantalla-carga">
      <Spinner tamano="lg" etiqueta={etiqueta} />
    </div>
  )
}

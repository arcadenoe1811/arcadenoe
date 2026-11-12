import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usarAuth } from '../hooks/usarAuth.js';
import Spinner from './ui/Spinner.jsx';
import './RutaProtegida.css';

/**
 * Wrapper de ruta que verifica autenticacion.
 * - Cargando la sesion -> spinner centrado
 * - Sin usuario -> /login (recordando a donde se queria ir)
 * - Con usuario -> children (o las rutas hijas)
 */
export default function RutaProtegida({ children }) {
  const { usuario, cargando } = usarAuth();
  const ubicacion = useLocation();

  if (cargando) {
    return (
      <div className="pantalla-carga">
        <Spinner tamano="lg" etiqueta="Verificando sesión" />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace state={{ desde: ubicacion }} />;
  }

  return children ?? <Outlet />;
}

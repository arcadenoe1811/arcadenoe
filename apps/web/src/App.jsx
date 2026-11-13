import { Navigate, Route, Routes } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida.jsx'
import LayoutPrincipal from './components/LayoutPrincipal.jsx'
import InicioSesion from './pages/InicioSesion.jsx'
import PaginaInicio from './pages/PaginaInicio.jsx'
import PaginaFicha from './pages/PaginaFicha.jsx'
import PaginaFormulario from './pages/PaginaFormulario.jsx'
import PaginaColores from './pages/PaginaColores.jsx'

/**
 * Rutas:
 *   /login                 -> InicioSesion (publica)
 *   /                      -> busqueda e inventario      (protegida)
 *   /cuellos/nuevo         -> alta de cuello             (protegida)
 *   /cuellos/:id           -> ficha del cuello           (protegida)
 *   /cuellos/:id/editar    -> edicion del cuello         (protegida)
 *   /colores               -> catalogo de colores        (protegida)
 *   *                      -> redirige a /
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<InicioSesion />} />

      <Route
        element={
          <RutaProtegida>
            <LayoutPrincipal />
          </RutaProtegida>
        }
      >
        <Route index element={<PaginaInicio />} />
        <Route path="cuellos/nuevo" element={<PaginaFormulario />} />
        <Route path="cuellos/:id" element={<PaginaFicha />} />
        <Route path="cuellos/:id/editar" element={<PaginaFormulario />} />
        <Route path="colores" element={<PaginaColores />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

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
 *   /punos/nuevo           -> alta de puno               (protegida)
 *   /punos/:id             -> ficha del puno             (protegida)
 *   /punos/:id/editar      -> edicion del puno           (protegida)
 *   /colores               -> catalogo de colores        (protegida)
 *   *                      -> redirige a /
 *
 * Cuello y puno usan las mismas paginas. Las altas llevan `key` para que
 * pasar de /cuellos/nuevo a /punos/nuevo monte un formulario limpio.
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
        <Route
          path="cuellos/nuevo"
          element={<PaginaFormulario key="nuevo-cuello" pieza="cuello" />}
        />
        <Route path="cuellos/:id" element={<PaginaFicha />} />
        <Route path="cuellos/:id/editar" element={<PaginaFormulario />} />
        <Route
          path="punos/nuevo"
          element={<PaginaFormulario key="nuevo-puno" pieza="puno" />}
        />
        <Route path="punos/:id" element={<PaginaFicha />} />
        <Route path="punos/:id/editar" element={<PaginaFormulario />} />
        <Route path="colores" element={<PaginaColores />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

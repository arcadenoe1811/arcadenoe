import { Navigate, Route, Routes } from 'react-router-dom'
import RutaProtegida, { RUTA_CAMBIAR_CONTRASENA } from './components/RutaProtegida.jsx'
import LayoutPrincipal from './components/LayoutPrincipal.jsx'
import InicioSesion from './pages/InicioSesion.jsx'
import PaginaInicio from './pages/PaginaInicio.jsx'
import PaginaFicha from './pages/PaginaFicha.jsx'
import PaginaFormulario from './pages/PaginaFormulario.jsx'
import PaginaColores from './pages/PaginaColores.jsx'
import PaginaConos from './pages/PaginaConos.jsx'
import PaginaMuestrario from './pages/PaginaMuestrario.jsx'
import PaginaFichaCono from './pages/PaginaFichaCono.jsx'
import PaginaFormularioCono from './pages/PaginaFormularioCono.jsx'
import PaginaUsuarios from './pages/PaginaUsuarios.jsx'
import PaginaCambiarContrasena from './pages/PaginaCambiarContrasena.jsx'

/**
 * Rutas (todas exigen sesion salvo /login):
 *   /login                 -> InicioSesion (publica)
 *   /cuenta/contrasena     -> cambiar la contrasena propia
 *   /                      -> busqueda e inventario
 *   /cuellos/:id           -> ficha del cuello
 *   /punos/:id             -> ficha del puno
 *   /colores               -> catalogo de colores
 *   /conos                 -> resumen del inventario de conos
 *   /conos/muestrario      -> muestrario de colores/conos
 *   /conos/nuevo           -> alta de cono
 *   /conos/:id             -> ficha e historial del cono
 *   /conos/:id/editar      -> edicion del cono
 *   Solo admin:
 *   /cuellos/nuevo, /cuellos/:id/editar, /punos/nuevo, /punos/:id/editar
 *   /usuarios              -> gestion de usuarios
 *   *                      -> redirige a /
 *
 * RutaProtegida solo decide que se muestra; la autorizacion real esta en
 * la base (RLS por rol).
 *
 * Cuello y puno usan las mismas paginas. Las altas llevan `key` para que
 * pasar de /cuellos/nuevo a /punos/nuevo monte un formulario limpio.
 */
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<InicioSesion />} />

      <Route
        path={RUTA_CAMBIAR_CONTRASENA}
        element={
          <RutaProtegida>
            <PaginaCambiarContrasena />
          </RutaProtegida>
        }
      />

      <Route
        element={
          <RutaProtegida>
            <LayoutPrincipal />
          </RutaProtegida>
        }
      >
        <Route index element={<PaginaInicio />} />
        <Route path="cuellos/:id" element={<PaginaFicha />} />
        <Route path="punos/:id" element={<PaginaFicha />} />
        <Route path="colores" element={<PaginaColores />} />
        <Route path="conos" element={<PaginaConos />} />
        <Route path="conos/muestrario" element={<PaginaMuestrario />} />
        <Route path="conos/nuevo" element={<PaginaFormularioCono key="nuevo" />} />
        <Route path="conos/:id" element={<PaginaFichaCono />} />
        <Route path="conos/:id/editar" element={<PaginaFormularioCono />} />

        <Route element={<RutaProtegida permiso="cuellos.editar" />}>
          <Route
            path="cuellos/nuevo"
            element={<PaginaFormulario key="nuevo-cuello" pieza="cuello" />}
          />
          <Route path="cuellos/:id/editar" element={<PaginaFormulario />} />
          <Route
            path="punos/nuevo"
            element={<PaginaFormulario key="nuevo-puno" pieza="puno" />}
          />
          <Route path="punos/:id/editar" element={<PaginaFormulario />} />
        </Route>

        <Route element={<RutaProtegida permiso="usuarios.gestionar" />}>
          <Route path="usuarios" element={<PaginaUsuarios />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

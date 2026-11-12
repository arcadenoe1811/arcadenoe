import { NavLink, Route, Routes } from 'react-router-dom';
import PaginaInicio from './pages/PaginaInicio.jsx';
import PaginaFicha from './pages/PaginaFicha.jsx';
import PaginaFormulario from './pages/PaginaFormulario.jsx';
import PaginaColores from './pages/PaginaColores.jsx';
import PaginaNoEncontrada from './pages/PaginaNoEncontrada.jsx';

export default function App() {
  return (
    <>
      <header className="encabezado">
        <div className="contenedor encabezado-contenido">
          <NavLink to="/" className="marca" end>
            <img src="/icono.svg" alt="" width="28" height="28" />
            Inventario de cuellos
          </NavLink>
          <nav className="navegacion">
            <NavLink to="/" end>
              Buscar
            </NavLink>
            <NavLink to="/colores">Colores</NavLink>
            <NavLink to="/cuellos/nuevo" className="boton boton-primario">
              + Nuevo cuello
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="contenedor principal">
        <Routes>
          <Route path="/" element={<PaginaInicio />} />
          <Route path="/cuellos/nuevo" element={<PaginaFormulario />} />
          <Route path="/cuellos/:id" element={<PaginaFicha />} />
          <Route path="/cuellos/:id/editar" element={<PaginaFormulario />} />
          <Route path="/colores" element={<PaginaColores />} />
          <Route path="*" element={<PaginaNoEncontrada />} />
        </Routes>
      </main>
    </>
  );
}

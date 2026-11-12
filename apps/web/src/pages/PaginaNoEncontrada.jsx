import { Link } from 'react-router-dom';

export default function PaginaNoEncontrada() {
  return (
    <div className="vacio">
      <h1>Página no encontrada</h1>
      <Link to="/" className="boton boton-primario">
        Ir a la búsqueda
      </Link>
    </div>
  );
}

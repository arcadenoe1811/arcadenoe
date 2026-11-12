import { Link } from 'react-router-dom';
import { formatearMedidas } from '@inventario/shared';
import ImagenCuello from './ImagenCuello.jsx';
import EtiquetaTipo from './EtiquetaTipo.jsx';

export default function TarjetaCuello({ cuello }) {
  return (
    <Link to={`/cuellos/${cuello.id}`} className="tarjeta-cuello">
      <ImagenCuello url={cuello.imagen_url} alt={`Cuello ${cuello.codigo}`} />
      <div className="tarjeta-cuerpo">
        <div className="tarjeta-fila">
          <span className="codigo">{cuello.codigo}</span>
          <EtiquetaTipo tipo={cuello.tipo} />
        </div>
        {cuello.nombre && <div className="tarjeta-nombre">{cuello.nombre}</div>}
        <div className="tarjeta-medidas">Medidas: {formatearMedidas(cuello.medidas)}</div>
      </div>
    </Link>
  );
}

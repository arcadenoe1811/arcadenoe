import { Link } from 'react-router-dom'
import { formatearPieza, formatearTamanos, normalizarPieza } from '@inventario/shared'
import { rutaPieza } from '../utils/rutas.js'
import ImagenCuello from './ImagenCuello.jsx'
import EtiquetaTipo from './EtiquetaTipo.jsx'

/** Tarjeta de una pieza (cuello o puno) en el listado. */
export default function TarjetaCuello({ cuello }) {
  const esPuno = normalizarPieza(cuello.pieza) === 'puno'
  const pieza = formatearPieza(cuello.pieza)
  return (
    <Link to={rutaPieza(cuello.pieza, cuello.id)} className="tarjeta-cuello">
      <ImagenCuello
        url={cuello.imagen_url}
        diseno={cuello.diseno_efectivo ?? cuello.diseno}
        alt={`${pieza} ${cuello.codigo}`}
      />
      <div className="tarjeta-cuerpo">
        <div className="tarjeta-fila">
          <span className="codigo">{cuello.codigo}</span>
          <EtiquetaTipo tipo={cuello.tipo} />
        </div>
        {cuello.nombre && <div className="tarjeta-nombre">{cuello.nombre}</div>}
        <div className="tarjeta-medidas">
          <span className="insignia-posicion">{pieza}</span>
          {cuello.padre_id && <span className="insignia-posicion">hereda</span>}{' '}
          {esPuno ? 'Tallas' : 'Medidas'}: {formatearTamanos(cuello)}
        </div>
      </div>
    </Link>
  )
}

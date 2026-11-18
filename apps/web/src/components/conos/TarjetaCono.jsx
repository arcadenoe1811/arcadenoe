import { Link } from 'react-router-dom'
import { formatearEntero } from '@inventario/shared'
import MuestraCono from './MuestraCono.jsx'
import InsigniaEstadoCono from './InsigniaEstadoCono.jsx'
import ChipHex from './ChipHex.jsx'

/**
 * Tarjeta del muestrario: color, nombre, datos del hilo, stock y hex copiable.
 * El chip del hex queda fuera del enlace (no se anida un boton en un link).
 * @param {{ cono: import('@inventario/shared').Cono }} props
 */
export default function TarjetaCono({ cono }) {
  const detalle = [cono.material, cono.titulo_hilo].filter(Boolean).join(' · ')
  return (
    <article className={`tarjeta-cono${cono.activo ? '' : ' tarjeta-cono-inactiva'}`}>
      <Link to={`/conos/${cono.id}`} className="tarjeta-cono-enlace">
        <MuestraCono hex={cono.hex} texto={cono.codigo_color} />
        <div className="tarjeta-cono-cuerpo">
          <div className="tarjeta-cono-nombre">{cono.nombre_color}</div>
          <div className="tarjeta-cono-detalle">
            <code>{cono.codigo}</code>
            {detalle && <span> · {detalle}</span>}
          </div>
          {cono.proveedor && (
            <div className="tarjeta-cono-detalle tarjeta-cono-proveedor">
              {cono.proveedor}
            </div>
          )}
          <div className="tarjeta-cono-pie">
            <span className="tarjeta-cono-stock">
              <strong>{formatearEntero(cono.stock_actual)}</strong>{' '}
              {cono.stock_actual === 1 ? 'cono' : 'conos'}
            </span>
            {cono.activo ? (
              <InsigniaEstadoCono cono={cono} />
            ) : (
              <span className="insignia-estado insignia-inactivo">Inactivo</span>
            )}
          </div>
        </div>
      </Link>
      <div className="tarjeta-cono-hex">
        <ChipHex hex={cono.hex} />
      </div>
    </article>
  )
}

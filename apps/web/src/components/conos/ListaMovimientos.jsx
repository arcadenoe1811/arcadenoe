import { Link } from 'react-router-dom'
import {
  TIPOS_MOVIMIENTO,
  cantidadConSigno,
  formatearDia,
  formatearMoneda,
} from '@inventario/shared'
import MuestraCono from './MuestraCono.jsx'

/**
 * Lista de movimientos. Con `conCono` muestra a que cono corresponde cada
 * uno (resumen general); sin el, es el historial de un solo cono.
 * @param {{ movimientos: import('@inventario/shared').MovimientoCono[], conCono?: boolean }} props
 */
export default function ListaMovimientos({ movimientos, conCono = false }) {
  if (movimientos.length === 0) {
    return <p className="texto-suave">Todavía no hay movimientos registrados.</p>
  }

  return (
    <ul className="lista-movimientos">
      {movimientos.map((m) => {
        const detalles = [
          m.referencia,
          m.lote && `Lote ${m.lote}`,
          m.proveedor,
          m.costo_unitario !== null &&
            m.costo_unitario !== undefined &&
            `${formatearMoneda(m.costo_unitario)} c/u`,
        ].filter(Boolean)
        return (
          <li key={m.id} className={`movimiento movimiento-${m.tipo}`}>
            <span
              className="movimiento-cantidad"
              aria-label={TIPOS_MOVIMIENTO[m.tipo].etiqueta}
            >
              {cantidadConSigno(m)}
            </span>
            <div className="movimiento-cuerpo">
              <div className="movimiento-titulo">
                {conCono && m.cono ? (
                  <Link to={`/conos/${m.cono.id}`} className="movimiento-cono">
                    <MuestraCono hex={m.cono.hex} tamano="sm" />
                    {m.cono.nombre_color} <code>{m.cono.codigo}</code>
                  </Link>
                ) : (
                  <span className={`etiqueta-movimiento etiqueta-${m.tipo}`}>
                    {TIPOS_MOVIMIENTO[m.tipo].etiqueta}
                  </span>
                )}
                {m.pieza && (
                  <Link
                    to={`/${m.pieza.pieza === 'puno' ? 'punos' : 'cuellos'}/${m.pieza.id}`}
                    className="movimiento-pieza"
                  >
                    {m.pieza.pieza === 'puno' ? 'Puño' : 'Cuello'} {m.pieza.codigo}
                  </Link>
                )}
              </div>
              {detalles.length > 0 && (
                <div className="movimiento-detalle">{detalles.join(' · ')}</div>
              )}
              {m.notas && <div className="movimiento-detalle">{m.notas}</div>}
            </div>
            <div className="movimiento-fecha">
              <div>{formatearDia(m.fecha)}</div>
              {m.stock_resultante !== null && (
                <div className="texto-suave texto-pequeno">
                  Quedan {m.stock_resultante}
                </div>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

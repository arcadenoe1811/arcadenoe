import { formatearEstadoVenta, tonoEstadoVenta } from '@inventario/shared'

/**
 * Badge del estado de una venta (color + texto; nunca solo color).
 * @param {{ estado: string }} props
 */
export default function EstadoVenta({ estado }) {
  return (
    <span className={`badge-estado badge-${tonoEstadoVenta(estado)}`}>
      {formatearEstadoVenta(estado)}
    </span>
  )
}

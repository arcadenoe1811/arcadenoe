import { useId } from 'react'
import {
  describirRango,
  esFechaValida,
  hoyISO,
  mesDe,
  mesDelRango,
  rangoDeMes,
} from '@inventario/shared'

/**
 * Filtro temporal: por mes, por rango de fechas o "Hoy". Cada cambio
 * valido se aplica al momento.
 * @param {{
 *   rango: { desde: string, hasta: string },
 *   alCambiar: (rango: { desde: string, hasta: string }) => void,
 *   children?: import('react').ReactNode,  filtros extra de la pantalla
 * }} props
 */
export default function FiltroPeriodo({ rango, alCambiar, children }) {
  const id = useId()
  const hoy = hoyISO()
  const mes = mesDelRango(rango) ?? ''
  const esHoy = rango.desde === hoy && rango.hasta === hoy
  const esEsteMes = mes === mesDe(hoy)

  const cambiarDesde = (desde) => {
    if (!esFechaValida(desde)) return
    alCambiar({ desde, hasta: desde > rango.hasta ? desde : rango.hasta })
  }
  const cambiarHasta = (hasta) => {
    if (!esFechaValida(hasta)) return
    alCambiar({ desde: hasta < rango.desde ? hasta : rango.desde, hasta })
  }

  return (
    <div className="filtro-periodo tarjeta" role="group" aria-label="Período">
      <div className="campo">
        <label htmlFor={`${id}-mes`}>Mes</label>
        <input
          id={`${id}-mes`}
          type="month"
          value={mes}
          max={mesDe(hoy)}
          onChange={(e) => {
            const nuevo = rangoDeMes(e.target.value)
            if (nuevo) alCambiar(nuevo)
          }}
        />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-desde`}>Desde</label>
        <input
          id={`${id}-desde`}
          type="date"
          value={rango.desde}
          max={hoy}
          onChange={(e) => cambiarDesde(e.target.value)}
        />
      </div>
      <div className="campo">
        <label htmlFor={`${id}-hasta`}>Hasta</label>
        <input
          id={`${id}-hasta`}
          type="date"
          value={rango.hasta}
          onChange={(e) => cambiarHasta(e.target.value)}
        />
      </div>
      <div className="filtro-periodo-atajos">
        <button
          type="button"
          className="boton boton-secundario"
          aria-pressed={esHoy}
          onClick={() => alCambiar({ desde: hoy, hasta: hoy })}
        >
          Hoy
        </button>
        <button
          type="button"
          className="boton boton-secundario"
          aria-pressed={esEsteMes}
          onClick={() => alCambiar(rangoDeMes(mesDe(hoy)))}
        >
          Este mes
        </button>
      </div>
      {children}
      <p className="filtro-periodo-resumen" aria-live="polite">
        Mostrando: <strong>{describirRango(rango)}</strong>
      </p>
    </div>
  )
}

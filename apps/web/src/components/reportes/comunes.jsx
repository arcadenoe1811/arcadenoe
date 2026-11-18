import { ETIQUETAS_ESTADO_CONO, etiquetaPeriodo } from '@inventario/shared'
import Cargando from '../Cargando.jsx'
import Aviso from '../Aviso.jsx'

export const AGRUPACION = { day: 'por día', week: 'por semana', month: 'por mes' }

export const etiquetaPieza = (pieza) => (pieza === 'puno' ? 'Puño' : 'Cuello')
export const etiquetaEstado = (estado) => ETIQUETAS_ESTADO_CONO[estado] ?? estado

/** Puntos de una serie -> datos de GraficoBarras. */
export const aBarras = (serie, grano, campos) =>
  serie.map((p) => ({
    etiqueta: etiquetaPeriodo(p.periodo, grano),
    valores: campos.map((campo) => Number(p[campo])),
  }))

/** Selector de agrupacion de las series (diario, semanal, mensual). */
export function SelectorGrano({ id, valor, alCambiar }) {
  return (
    <div className="campo">
      <label htmlFor={id}>Agrupar por</label>
      <select id={id} value={valor} onChange={(e) => alCambiar(e.target.value)}>
        <option value="">Automático</option>
        <option value="day">Día</option>
        <option value="week">Semana</option>
        <option value="month">Mes</option>
      </select>
    </div>
  )
}

/** Estados de carga y error comunes a todos los reportes. */
export function EstadoReporte({ consulta }) {
  if (consulta.error)
    return (
      <Aviso
        tipo="error"
        accion={
          <button
            type="button"
            className="boton boton-secundario"
            onClick={consulta.recargar}
          >
            Reintentar
          </button>
        }
      >
        {consulta.error.mensaje}
      </Aviso>
    )
  if (consulta.cargando && !consulta.datos) return <Cargando />
  return null
}

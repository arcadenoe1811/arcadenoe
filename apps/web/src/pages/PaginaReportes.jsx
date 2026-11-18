import { useId } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { describirRango } from '@inventario/shared'
import { usePeriodo } from '../hooks/usePeriodo.js'
import FiltroPeriodo from '../components/FiltroPeriodo.jsx'
import { SelectorGrano } from '../components/reportes/comunes.jsx'
import ReporteInventario from '../components/reportes/ReporteInventario.jsx'
import ReporteProduccion from '../components/reportes/ReporteProduccion.jsx'
import ReporteVentas from '../components/reportes/ReporteVentas.jsx'
import ReporteResumen from '../components/reportes/ReporteResumen.jsx'

const REPORTES = [
  { valor: 'resumen', etiqueta: 'Resumen ejecutivo', Componente: ReporteResumen },
  { valor: 'inventario', etiqueta: 'Inventario', Componente: ReporteInventario },
  { valor: 'produccion', etiqueta: 'Producción', Componente: ReporteProduccion },
  { valor: 'ventas', etiqueta: 'Ventas', Componente: ReporteVentas },
]
const GRANOS = ['day', 'week', 'month']

/**
 * Reportes del negocio. El reporte, el rango y la agrupacion viven en la
 * URL. Son de solo lectura: los ven admin y operador. Cada tabla se exporta
 * a Excel (CSV) y el reporte completo se imprime o guarda como PDF.
 */
export default function PaginaReportes() {
  const id = useId()
  const { rango, cambiarRango } = usePeriodo()
  const [parametros, setParametros] = useSearchParams()
  const reporte = REPORTES.find((r) => r.valor === parametros.get('tipo')) ?? REPORTES[0]
  const grano = GRANOS.includes(parametros.get('grano')) ? parametros.get('grano') : ''

  const enlace = (tipo) => {
    const siguientes = new URLSearchParams(parametros)
    siguientes.set('tipo', tipo)
    return `?${siguientes}`
  }
  const cambiarGrano = (valor) =>
    setParametros(
      (previos) => {
        const siguientes = new URLSearchParams(previos)
        if (valor) siguientes.set('grano', valor)
        else siguientes.delete('grano')
        return siguientes
      },
      { replace: true },
    )

  return (
    <section className="pagina-modulo">
      <div className="encabezado-pagina">
        <div>
          <h1>Reportes</h1>
          <p className="solo-imprimir">
            {reporte.etiqueta} · {describirRango(rango)}
          </p>
        </div>
        <div className="acciones-pagina no-imprimir">
          <button
            type="button"
            className="boton boton-secundario"
            onClick={() => window.print()}
          >
            Imprimir / guardar PDF
          </button>
        </div>
      </div>

      <nav className="pestanas" aria-label="Tipo de reporte">
        {REPORTES.map((r) => (
          <Link
            key={r.valor}
            to={enlace(r.valor)}
            replace
            className="pestana"
            aria-current={r.valor === reporte.valor ? 'page' : undefined}
          >
            {r.etiqueta}
          </Link>
        ))}
      </nav>

      <FiltroPeriodo rango={rango} alCambiar={cambiarRango}>
        {reporte.valor !== 'resumen' && (
          <SelectorGrano id={`${id}-grano`} valor={grano} alCambiar={cambiarGrano} />
        )}
      </FiltroPeriodo>

      <reporte.Componente desde={rango.desde} hasta={rango.hasta} grano={grano} />
    </section>
  )
}

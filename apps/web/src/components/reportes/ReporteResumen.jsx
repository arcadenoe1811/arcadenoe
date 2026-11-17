import { useCallback } from 'react'
import {
  describirRango,
  formatearEntero,
  formatearMoneda,
  margenDe,
  obtenerResumenEjecutivo,
  variacion,
} from '@inventario/shared'
import { useConsulta } from '../../hooks/useConsulta.js'
import TarjetaKpi from '../conos/TarjetaKpi.jsx'
import TablaDatos from '../TablaDatos.jsx'
import { EstadoReporte } from './comunes.jsx'

/** Indicadores del resumen. `menosEsMejor`: una subida es desfavorable. */
const INDICADORES = [
  {
    titulo: 'Inversión en material',
    valor: (r) => Number(r.inversion_material),
    moneda: true,
    menosEsMejor: true,
  },
  { titulo: 'Conos comprados', valor: (r) => r.conos_comprados, neutro: true },
  { titulo: 'Conos utilizados', valor: (r) => r.conos_utilizados, neutro: true },
  {
    titulo: 'Costo del material utilizado',
    valor: (r) => Number(r.costo_material_utilizado),
    moneda: true,
    menosEsMejor: true,
  },
  { titulo: 'Cuellos producidos', valor: (r) => r.cuellos_producidos },
  { titulo: 'Ventas (cantidad)', valor: (r) => r.ventas.cantidad },
  { titulo: 'Cuellos vendidos', valor: (r) => r.ventas.unidades },
  { titulo: 'Ingresos por ventas', valor: (r) => Number(r.ventas.total), moneda: true },
  {
    titulo: 'Costo estimado de lo vendido',
    valor: (r) => Number(r.costo_estimado_vendido),
    moneda: true,
    menosEsMejor: true,
  },
  { titulo: 'Margen bruto estimado', valor: (r) => margenDe(r), moneda: true },
]

/** "▲ 12,5 %" con texto y color; el signo va siempre escrito. */
function Cambio({ fila }) {
  const cambio = variacion(fila.actual, fila.anterior)
  if (cambio === null)
    return <span className="texto-suave comparativa-cambio">Sin base para comparar</span>
  if (cambio === 0)
    return <span className="texto-suave comparativa-cambio">Sin cambio</span>
  const sube = cambio > 0
  let clase = 'texto-suave'
  if (!fila.neutro) clase = sube !== Boolean(fila.menosEsMejor) ? 'positivo' : 'negativo'
  return (
    <span className={`comparativa-cambio ${clase}`}>
      {sube ? '▲ +' : '▼ −'}
      {new Intl.NumberFormat('es', { maximumFractionDigits: 1 }).format(
        Math.abs(cambio),
      )}{' '}
      %
    </span>
  )
}

/** Resumen ejecutivo del periodo y comparativa con el periodo anterior. */
export default function ReporteResumen({ desde, hasta }) {
  const cargar = useCallback(
    () => obtenerResumenEjecutivo({ desde, hasta }),
    [desde, hasta],
  )
  const consulta = useConsulta(cargar)
  if (!consulta.datos) return <EstadoReporte consulta={consulta} />
  const { actual, anterior } = consulta.datos
  const margen = margenDe(actual)
  const nombreActual = describirRango(actual)
  const nombreAnterior = describirRango(anterior)

  const filas = INDICADORES.map((i) => ({
    ...i,
    actual: i.valor(actual),
    anterior: i.valor(anterior),
  }))
  const mostrar = (valor, fila) =>
    fila.moneda ? formatearMoneda(valor) : formatearEntero(valor)

  return (
    <>
      <EstadoReporte consulta={consulta} />
      <div className="kpis kpis-compactos">
        <TarjetaKpi
          icono="conos"
          valor={formatearMoneda(actual.inversion_material)}
          etiqueta="Inversión en material"
          detalle={`${formatearEntero(actual.conos_comprados)} conos comprados`}
        />
        <TarjetaKpi
          icono="cuello"
          valor={formatearEntero(actual.cuellos_producidos)}
          etiqueta="Cuellos producidos"
          detalle={`${formatearEntero(actual.conos_utilizados)} conos utilizados`}
        />
        <TarjetaKpi
          icono="valor"
          valor={formatearMoneda(actual.ventas.total)}
          etiqueta="Ventas"
          detalle={`${formatearEntero(actual.ventas.unidades)} cuellos vendidos`}
        />
        <TarjetaKpi
          icono={margen < 0 ? 'alerta' : 'ok'}
          estado={margen < 0 ? 'agotado' : 'ok'}
          valor={formatearMoneda(margen)}
          etiqueta="Margen bruto estimado"
          detalle="Ventas − costo estimado de lo vendido"
        />
      </div>

      <TablaDatos
        titulo={`${nombreActual} comparado con ${nombreAnterior}`}
        archivo={`resumen ${desde} a ${hasta}`}
        clave={(f) => f.titulo}
        filas={filas}
        columnas={[
          { titulo: 'Indicador', valor: (f) => f.titulo },
          { titulo: nombreActual, valor: (f) => f.actual, numero: true, mostrar },
          { titulo: nombreAnterior, valor: (f) => f.anterior, numero: true, mostrar },
          {
            titulo: 'Cambio (%)',
            valor: (f) => variacion(f.actual, f.anterior) ?? '',
            numero: true,
            mostrar: (_v, f) => <Cambio fila={f} />,
          },
        ]}
      />
      {actual.unidades_sin_costo > 0 && (
        <p className="nota">
          {formatearEntero(actual.unidades_sin_costo)} cuellos vendidos son de diseños sin
          estimación guardada: su costo no está restado del margen.
        </p>
      )}
    </>
  )
}

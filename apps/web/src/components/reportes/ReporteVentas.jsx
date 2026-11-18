import { useCallback } from 'react'
import {
  formatearEntero,
  formatearMetodoPago,
  formatearMoneda,
  obtenerReporteVentas,
} from '@inventario/shared'
import { useConsulta } from '../../hooks/useConsulta.js'
import TarjetaKpi from '../conos/TarjetaKpi.jsx'
import GraficoBarras from '../graficos/GraficoBarras.jsx'
import ListaBarras from '../graficos/ListaBarras.jsx'
import TablaDatos from '../TablaDatos.jsx'
import { AGRUPACION, EstadoReporte, aBarras, etiquetaPieza } from './comunes.jsx'

const margenDe = (d) =>
  d.costo_estimado === null ? null : Number(d.ingresos) - Number(d.costo_estimado)

const Margen = ({ valor }) =>
  valor === null || valor === '' ? (
    <span className="texto-suave">Sin estimación</span>
  ) : (
    <span className={valor < 0 ? 'negativo' : 'positivo'}>{formatearMoneda(valor)}</span>
  )

/** Ventas por periodo y por diseno, margen bruto, metodos de pago y clientes. */
export default function ReporteVentas({ desde, hasta, grano }) {
  const cargar = useCallback(
    () => obtenerReporteVentas({ desde, hasta }, grano),
    [desde, hasta, grano],
  )
  const consulta = useConsulta(cargar)
  const r = consulta.datos
  if (!r) return <EstadoReporte consulta={consulta} />

  const t = r.totales
  const conCosto = r.por_diseno.filter((d) => d.costo_estimado !== null)
  const ingresosConCosto = conCosto.reduce((s, d) => s + Number(d.ingresos), 0)
  const costoEstimado = conCosto.reduce((s, d) => s + Number(d.costo_estimado), 0)
  const margen = ingresosConCosto - costoEstimado
  const sinCosto = r.por_diseno.length - conCosto.length

  return (
    <>
      <EstadoReporte consulta={consulta} />
      <div className="kpis kpis-compactos">
        <TarjetaKpi
          icono="valor"
          valor={formatearMoneda(t.total)}
          etiqueta="Ingresos"
          detalle={`${formatearEntero(t.cantidad)} ${t.cantidad === 1 ? 'venta' : 'ventas'} · ${formatearEntero(t.unidades)} cuellos`}
        />
        <TarjetaKpi
          icono="conos"
          valor={conCosto.length ? formatearMoneda(costoEstimado) : '—'}
          etiqueta="Costo estimado"
          detalle={
            sinCosto
              ? `${sinCosto} ${sinCosto === 1 ? 'diseño' : 'diseños'} sin estimación guardada`
              : 'Según las estimaciones guardadas'
          }
        />
        <TarjetaKpi
          icono={margen < 0 ? 'alerta' : 'ok'}
          estado={margen < 0 ? 'agotado' : 'ok'}
          valor={conCosto.length ? formatearMoneda(margen) : '—'}
          etiqueta="Margen bruto"
          detalle={
            conCosto.length && ingresosConCosto > 0
              ? `${Math.round((margen / ingresosConCosto) * 100)} % de los ingresos con costo`
              : 'Guarda estimaciones para calcularlo'
          }
        />
      </div>

      <div className="rejilla-bloques">
        <section className="tarjeta bloque-ancho">
          <header className="bloque-encabezado">
            <h2>Ventas del período</h2>
            <span className="texto-suave texto-pequeno">Monto {AGRUPACION[r.grano]}</span>
          </header>
          <GraficoBarras
            titulo={`Ventas ${AGRUPACION[r.grano]}`}
            series={[{ nombre: 'Ventas' }]}
            datos={aBarras(r.serie, r.grano, ['total'])}
            formatear={formatearMoneda}
            tendencia
            vacio="Sin ventas en este período."
          />
        </section>

        <div className="bloque-ancho">
          <TablaDatos
            titulo="Ventas por diseño · ingresos vs. costo estimado"
            archivo={`ventas por diseno ${desde} a ${hasta}`}
            vacio="Sin ventas en este período."
            clave={(d) => `${d.pieza}-${d.codigo}`}
            filas={r.por_diseno}
            columnas={[
              { titulo: 'Diseño', valor: (d) => d.codigo },
              { titulo: 'Pieza', valor: (d) => etiquetaPieza(d.pieza) },
              {
                titulo: 'Unidades',
                valor: (d) => d.unidades,
                numero: true,
                mostrar: formatearEntero,
              },
              {
                titulo: 'Ingresos',
                valor: (d) => Number(d.ingresos),
                numero: true,
                mostrar: formatearMoneda,
              },
              {
                titulo: 'Costo estimado',
                valor: (d) => (d.costo_estimado === null ? '' : Number(d.costo_estimado)),
                numero: true,
                mostrar: (v) => (v === '' ? '—' : formatearMoneda(v)),
              },
              {
                titulo: 'Margen bruto',
                valor: (d) => margenDe(d) ?? '',
                numero: true,
                mostrar: (v) => <Margen valor={v} />,
              },
            ]}
            pie={
              <tr>
                <td colSpan={2}>Total</td>
                <td className="numero">{formatearEntero(t.unidades)}</td>
                <td className="numero">{formatearMoneda(t.total)}</td>
                <td className="numero">
                  {conCosto.length ? formatearMoneda(costoEstimado) : '—'}
                </td>
                <td className="numero">
                  <Margen valor={conCosto.length ? margen : null} />
                </td>
              </tr>
            }
          />
          <p className="nota">
            El costo estimado sale de las estimaciones guardadas en el Estimador (promedio
            por diseño). Los diseños sin estimación no entran en el margen.
          </p>
        </div>

        <section className="tarjeta">
          <header className="bloque-encabezado">
            <h2>Métodos de pago</h2>
          </header>
          <ListaBarras
            filas={r.por_metodo.map((m) => ({
              clave: m.metodo,
              etiqueta: formatearMetodoPago(m.metodo),
              detalle: `${formatearEntero(m.ventas)} ${m.ventas === 1 ? 'venta' : 'ventas'}`,
              valor: Number(m.total),
            }))}
            formatear={formatearMoneda}
            vacio="Sin ventas en este período."
          />
        </section>

        <TablaDatos
          titulo="Clientes frecuentes"
          archivo={`clientes ${desde} a ${hasta}`}
          vacio="Ninguna venta del período tiene cliente registrado."
          clave={(c) => c.cliente}
          filas={r.clientes}
          columnas={[
            { titulo: 'Cliente', valor: (c) => c.cliente },
            {
              titulo: 'Ventas',
              valor: (c) => c.ventas,
              numero: true,
              mostrar: formatearEntero,
            },
            {
              titulo: 'Cuellos',
              valor: (c) => c.unidades,
              numero: true,
              mostrar: formatearEntero,
            },
            {
              titulo: 'Total',
              valor: (c) => Number(c.total),
              numero: true,
              mostrar: formatearMoneda,
            },
          ]}
        />
      </div>
    </>
  )
}

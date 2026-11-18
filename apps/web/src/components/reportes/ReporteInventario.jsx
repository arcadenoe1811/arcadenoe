import { useCallback } from 'react'
import {
  formatearDia,
  formatearEntero,
  formatearMoneda,
  obtenerReporteInventario,
} from '@inventario/shared'
import { useConsulta } from '../../hooks/useConsulta.js'
import TarjetaKpi from '../conos/TarjetaKpi.jsx'
import GraficoBarras from '../graficos/GraficoBarras.jsx'
import ListaBarras from '../graficos/ListaBarras.jsx'
import TablaDatos from '../TablaDatos.jsx'
import { AGRUPACION, EstadoReporte, aBarras, etiquetaEstado } from './comunes.jsx'

const conSigno = (n) => `${n > 0 ? '+' : ''}${formatearEntero(n)}`

/** Stock valorizado, movimientos del periodo, conos mas usados y alertas. */
export default function ReporteInventario({ desde, hasta, grano }) {
  const cargar = useCallback(
    () => obtenerReporteInventario({ desde, hasta }, grano),
    [desde, hasta, grano],
  )
  const consulta = useConsulta(cargar)
  const r = consulta.datos
  if (!r) return <EstadoReporte consulta={consulta} />

  const conos = r.conos
  const valorTotal = conos.reduce((s, c) => s + Number(c.valor_stock), 0)
  const masUsados = [...conos]
    .filter((c) => c.salidas > 0)
    .sort((a, b) => b.salidas - a.salidas)
    .slice(0, 10)
  const atencion = conos.filter(
    (c) =>
      c.estado !== 'disponible' ||
      (c.entradas === 0 && c.salidas === 0 && c.ajustes === 0),
  )

  return (
    <>
      <EstadoReporte consulta={consulta} />
      <div className="kpis kpis-compactos">
        <TarjetaKpi
          icono="valor"
          valor={formatearMoneda(valorTotal)}
          etiqueta="Valor del inventario"
          detalle={`${conos.length} tipos de cono · a costo`}
        />
        <TarjetaKpi
          icono="conos"
          valor={formatearEntero(r.totales.entradas)}
          etiqueta="Conos que entraron"
          detalle={`Inversión: ${formatearMoneda(r.totales.inversion)}`}
        />
        <TarjetaKpi
          icono="salida"
          valor={formatearEntero(r.totales.salidas)}
          etiqueta="Conos que salieron"
          detalle={`Ajustes: ${conSigno(r.totales.ajustes)} conos`}
        />
      </div>

      <div className="rejilla-bloques">
        <section className="tarjeta">
          <header className="bloque-encabezado">
            <h2>Movimientos del período</h2>
            <span className="texto-suave texto-pequeno">Conos {AGRUPACION[r.grano]}</span>
          </header>
          <GraficoBarras
            titulo={`Entradas y salidas de conos ${AGRUPACION[r.grano]}`}
            series={[{ nombre: 'Entradas' }, { nombre: 'Salidas' }]}
            datos={aBarras(r.serie, r.grano, ['entradas', 'salidas'])}
            formatear={formatearEntero}
            vacio="Sin movimientos en este período."
          />
        </section>

        <section className="tarjeta">
          <header className="bloque-encabezado">
            <h2>Conos más utilizados</h2>
          </header>
          <ListaBarras
            numerada
            filas={masUsados.map((c) => ({
              clave: c.id,
              etiqueta: c.nombre_color,
              detalle: c.codigo,
              hex: c.hex,
              valor: c.salidas,
            }))}
            formatear={(n) => `${formatearEntero(n)} conos`}
            vacio="Sin salidas en este período."
          />
        </section>

        <div className="bloque-ancho">
          <TablaDatos
            titulo="Stock actual valorizado"
            archivo={`inventario de conos ${hasta}`}
            vacio="No hay conos activos."
            clave={(c) => c.id}
            filas={conos}
            columnas={[
              { titulo: 'Código', valor: (c) => c.codigo },
              { titulo: 'Color', valor: (c) => c.nombre_color },
              { titulo: 'Material', valor: (c) => c.material },
              {
                titulo: 'Stock',
                valor: (c) => c.stock_actual,
                numero: true,
                mostrar: formatearEntero,
              },
              {
                titulo: 'Mínimo',
                valor: (c) => c.stock_minimo,
                numero: true,
                mostrar: formatearEntero,
              },
              { titulo: 'Estado', valor: (c) => etiquetaEstado(c.estado) },
              {
                titulo: 'Costo por cono',
                valor: (c) => (c.costo_por_cono === null ? '' : Number(c.costo_por_cono)),
                numero: true,
                mostrar: (v) => formatearMoneda(v),
              },
              {
                titulo: 'Valor',
                valor: (c) => Number(c.valor_stock),
                numero: true,
                mostrar: formatearMoneda,
              },
              {
                titulo: 'Entradas',
                valor: (c) => c.entradas,
                numero: true,
                mostrar: formatearEntero,
              },
              {
                titulo: 'Salidas',
                valor: (c) => c.salidas,
                numero: true,
                mostrar: formatearEntero,
              },
              {
                titulo: 'Ajustes',
                valor: (c) => c.ajustes,
                numero: true,
                mostrar: conSigno,
              },
            ]}
            pie={
              <tr>
                <td colSpan={7}>Total</td>
                <td className="numero">{formatearMoneda(valorTotal)}</td>
                <td className="numero">{formatearEntero(r.totales.entradas)}</td>
                <td className="numero">{formatearEntero(r.totales.salidas)}</td>
                <td className="numero">{conSigno(r.totales.ajustes)}</td>
              </tr>
            }
          />
        </div>

        <div className="bloque-ancho">
          <TablaDatos
            titulo="Bajo stock o sin movimiento en el período"
            archivo={`conos por revisar ${hasta}`}
            vacio="Ningún cono necesita atención."
            clave={(c) => c.id}
            filas={atencion}
            columnas={[
              { titulo: 'Código', valor: (c) => c.codigo },
              { titulo: 'Color', valor: (c) => c.nombre_color },
              {
                titulo: 'Stock',
                valor: (c) => c.stock_actual,
                numero: true,
                mostrar: formatearEntero,
              },
              {
                titulo: 'Mínimo',
                valor: (c) => c.stock_minimo,
                numero: true,
                mostrar: formatearEntero,
              },
              { titulo: 'Estado', valor: (c) => etiquetaEstado(c.estado) },
              {
                titulo: 'Movimiento en el período',
                valor: (c) =>
                  c.entradas || c.salidas || c.ajustes ? 'Sí' : 'Sin movimiento',
              },
              {
                titulo: 'Último movimiento',
                valor: (c) => c.ultimo_movimiento ?? '',
                mostrar: (v) => (v ? formatearDia(v) : 'Nunca'),
              },
            ]}
          />
        </div>
      </div>
    </>
  )
}

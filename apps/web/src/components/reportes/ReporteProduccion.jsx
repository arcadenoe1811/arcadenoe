import { useCallback } from 'react'
import {
  formatearDuracion,
  formatearEntero,
  formatearMoneda,
  obtenerReporteProduccion,
} from '@inventario/shared'
import { useConsulta } from '../../hooks/useConsulta.js'
import TarjetaKpi from '../conos/TarjetaKpi.jsx'
import GraficoBarras from '../graficos/GraficoBarras.jsx'
import TablaDatos from '../TablaDatos.jsx'
import { AGRUPACION, EstadoReporte, aBarras, etiquetaPieza } from './comunes.jsx'

/** Cuellos producidos, consumo de conos por diseno y estimaciones guardadas. */
export default function ReporteProduccion({ desde, hasta, grano }) {
  const cargar = useCallback(
    () => obtenerReporteProduccion({ desde, hasta }, grano),
    [desde, hasta, grano],
  )
  const consulta = useConsulta(cargar)
  const r = consulta.datos
  if (!r) return <EstadoReporte consulta={consulta} />
  const e = r.estimaciones

  return (
    <>
      <EstadoReporte consulta={consulta} />
      <div className="kpis kpis-compactos">
        <TarjetaKpi
          icono="cuello"
          valor={formatearEntero(r.producido)}
          etiqueta="Cuellos producidos"
          detalle={`${r.por_diseno.length} ${r.por_diseno.length === 1 ? 'diseño' : 'diseños'}`}
        />
        <TarjetaKpi
          icono="valor"
          valor={e.costo_por_cuello === null ? '—' : formatearMoneda(e.costo_por_cuello)}
          etiqueta="Costo promedio por cuello"
          detalle={`Según ${e.cantidad} ${e.cantidad === 1 ? 'estimación' : 'estimaciones'} del período`}
        />
        <TarjetaKpi
          icono="conos"
          valor={formatearDuracion(e.minutos)}
          etiqueta="Tiempo estimado"
          detalle={`${formatearEntero(e.unidades)} cuellos estimados · ${formatearMoneda(e.costo_total)}`}
        />
      </div>

      <div className="rejilla-bloques">
        <section className="tarjeta bloque-ancho">
          <header className="bloque-encabezado">
            <h2>Cuellos producidos</h2>
            <span className="texto-suave texto-pequeno">
              Unidades {AGRUPACION[r.grano]}
            </span>
          </header>
          <GraficoBarras
            titulo={`Cuellos producidos ${AGRUPACION[r.grano]}`}
            series={[{ nombre: 'Cuellos' }]}
            datos={aBarras(r.serie, r.grano, ['unidades'])}
            formatear={formatearEntero}
            vacio="Sin producción registrada en este período."
          />
        </section>

        <TablaDatos
          titulo="Producción por diseño"
          archivo={`produccion por diseno ${desde} a ${hasta}`}
          vacio="Sin producción registrada en este período."
          clave={(d) => `${d.pieza}-${d.codigo}`}
          filas={r.por_diseno}
          columnas={[
            { titulo: 'Diseño', valor: (d) => d.codigo },
            { titulo: 'Pieza', valor: (d) => etiquetaPieza(d.pieza) },
            { titulo: 'Tallas', valor: (d) => d.tallas },
            {
              titulo: 'Unidades',
              valor: (d) => d.unidades,
              numero: true,
              mostrar: formatearEntero,
            },
          ]}
        />

        <div>
          <TablaDatos
            titulo="Consumo de conos por diseño"
            archivo={`consumo de conos por diseno ${desde} a ${hasta}`}
            vacio="Ninguna salida de conos está asociada a un diseño en este período."
            clave={(d) => `${d.pieza}-${d.codigo}`}
            filas={r.consumo_por_diseno}
            columnas={[
              { titulo: 'Diseño', valor: (d) => d.codigo },
              { titulo: 'Pieza', valor: (d) => etiquetaPieza(d.pieza) },
              {
                titulo: 'Conos',
                valor: (d) => d.conos,
                numero: true,
                mostrar: formatearEntero,
              },
              {
                titulo: 'Costo del material',
                valor: (d) => Number(d.costo),
                numero: true,
                mostrar: formatearMoneda,
              },
            ]}
          />
          {r.conos_sin_diseno > 0 && (
            <p className="nota">
              Además salieron {formatearEntero(r.conos_sin_diseno)} conos sin diseño
              asociado (al registrar una salida se puede indicar la pieza producida).
            </p>
          )}
        </div>
      </div>
    </>
  )
}

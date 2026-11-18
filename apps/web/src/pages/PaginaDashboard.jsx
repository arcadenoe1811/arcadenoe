import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  describirRango,
  etiquetaPeriodo,
  formatearDia,
  formatearEntero,
  formatearMoneda,
  formatearPeso,
  listarActividadReciente,
  obtenerDashboard,
} from '@inventario/shared'
import { useConsulta } from '../hooks/useConsulta.js'
import { usePeriodo } from '../hooks/usePeriodo.js'
import FiltroPeriodo from '../components/FiltroPeriodo.jsx'
import TarjetaKpi from '../components/conos/TarjetaKpi.jsx'
import GraficoBarras from '../components/graficos/GraficoBarras.jsx'
import ListaBarras from '../components/graficos/ListaBarras.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

const ETIQUETAS_ACTIVIDAD = {
  entrada: 'Entrada',
  salida: 'Salida',
  ajuste: 'Ajuste',
  venta: 'Venta',
  produccion: 'Producción',
}
const AGRUPACION = { day: 'por día', week: 'por semana', month: 'por mes' }

const cargarActividad = () => listarActividadReciente(10)

/** Cifra de una actividad: monto en ventas, conos o cuellos en el resto. */
function cifraActividad(a) {
  if (a.tipo === 'venta') return formatearMoneda(a.monto)
  const signo = a.tipo === 'salida' || (a.tipo === 'ajuste' && a.cantidad < 0) ? '−' : '+'
  const unidad = a.tipo === 'produccion' ? 'cuellos' : 'conos'
  return `${signo}${formatearEntero(Math.abs(a.cantidad))} ${unidad}`
}

/** Vista general del negocio para el período elegido. */
export default function PaginaDashboard() {
  const { rango, cambiarRango } = usePeriodo()
  const { desde, hasta } = rango
  const cargar = useCallback(() => obtenerDashboard({ desde, hasta }), [desde, hasta])
  const { datos, cargando, error, recargar } = useConsulta(cargar)
  const actividad = useConsulta(cargarActividad)

  const periodo = describirRango(rango)
  const etiqueta = (p) => etiquetaPeriodo(p, datos?.grano)

  return (
    <section className="pagina-modulo">
      <div className="encabezado-pagina">
        <h1>Dashboard</h1>
      </div>

      <FiltroPeriodo rango={rango} alCambiar={cambiarRango} />

      {error && (
        <Aviso
          tipo="error"
          accion={
            <button type="button" className="boton boton-secundario" onClick={recargar}>
              Reintentar
            </button>
          }
        >
          {error.mensaje}
        </Aviso>
      )}
      {cargando && !datos && <Cargando />}

      {datos && (
        <>
          <div className="kpis kpis-compactos" role="region" aria-label="Indicadores">
            <TarjetaKpi
              icono="conos"
              valor={formatearEntero(datos.inventario.conos)}
              etiqueta="Conos en inventario"
              detalle={`${datos.inventario.tipos} ${
                datos.inventario.tipos === 1 ? 'tipo' : 'tipos'
              }${datos.inventario.peso_g ? ` · ${formatearPeso(datos.inventario.peso_g)}` : ''}`}
              a="/conos"
            />
            <TarjetaKpi
              icono="salida"
              valor={formatearEntero(datos.conos.utilizados)}
              etiqueta="Conos utilizados"
              detalle={`${periodo} · entraron ${formatearEntero(datos.conos.entrados)}`}
            />
            <TarjetaKpi
              icono="cuello"
              valor={formatearEntero(datos.cuellos_producidos)}
              etiqueta="Cuellos producidos"
              detalle={periodo}
              a="/produccion"
            />
            <TarjetaKpi
              icono={datos.pendientes ? 'alerta' : 'ok'}
              estado={datos.pendientes ? 'bajo' : 'ok'}
              valor={formatearEntero(datos.pendientes)}
              etiqueta="Cuellos pendientes"
              detalle={
                datos.pendientes ? 'por producir (todos los pedidos)' : 'nada pendiente'
              }
              a="/produccion"
            />
            <TarjetaKpi
              icono="valor"
              valor={formatearMoneda(datos.ventas.total)}
              etiqueta="Ventas del período"
              detalle={`${formatearEntero(datos.ventas.cantidad)} ${
                datos.ventas.cantidad === 1 ? 'venta' : 'ventas'
              } · ${formatearEntero(datos.ventas.unidades)} cuellos`}
              a={`/ventas?desde=${desde}&hasta=${hasta}`}
            />
            <TarjetaKpi
              icono={datos.inventario.por_reponer ? 'alerta' : 'ok'}
              estado={datos.inventario.por_reponer ? 'agotado' : 'ok'}
              valor={formatearEntero(datos.inventario.por_reponer)}
              etiqueta="Por reponer"
              detalle={
                datos.inventario.por_reponer
                  ? `Conos bajo el mínimo${
                      datos.inventario.agotados
                        ? ` · ${datos.inventario.agotados} agotados`
                        : ''
                    }`
                  : 'Todo en orden'
              }
              a="/conos"
            />
          </div>

          <div className="rejilla-bloques">
            <section className="tarjeta">
              <header className="bloque-encabezado">
                <h2>Movimientos de inventario</h2>
                <span className="texto-suave texto-pequeno">
                  Conos {AGRUPACION[datos.grano]}
                </span>
              </header>
              <GraficoBarras
                titulo={`Entradas y salidas de conos ${AGRUPACION[datos.grano]}`}
                series={[{ nombre: 'Entradas' }, { nombre: 'Salidas' }]}
                datos={datos.serie_movimientos.map((p) => ({
                  etiqueta: etiqueta(p.periodo),
                  valores: [p.entradas, p.salidas],
                }))}
                formatear={formatearEntero}
                vacio="Sin entradas ni salidas en este período."
              />
            </section>

            <section className="tarjeta">
              <header className="bloque-encabezado">
                <h2>Ventas</h2>
                <span className="texto-suave texto-pequeno">
                  Monto {AGRUPACION[datos.grano]}
                </span>
              </header>
              <GraficoBarras
                titulo={`Ventas ${AGRUPACION[datos.grano]}`}
                series={[{ nombre: 'Ventas' }]}
                datos={datos.serie_ventas.map((p) => ({
                  etiqueta: etiqueta(p.periodo),
                  valores: [p.total],
                }))}
                formatear={formatearMoneda}
                tendencia
                vacio="Sin ventas en este período."
              />
            </section>

            <section className="tarjeta">
              <header className="bloque-encabezado">
                <h2>Consumo de conos por color</h2>
                <span className="texto-suave texto-pequeno">Los más usados</span>
              </header>
              <ListaBarras
                filas={datos.consumo_por_color.map((c) => ({
                  clave: c.id,
                  etiqueta: c.nombre,
                  detalle: c.codigo,
                  hex: c.hex,
                  valor: c.cantidad,
                }))}
                formatear={(n) => `${formatearEntero(n)} conos`}
                vacio="Sin salidas de conos en este período."
              />
            </section>

            <section className="tarjeta">
              <header className="bloque-encabezado">
                <h2>Top 5 diseños más vendidos</h2>
              </header>
              <ListaBarras
                numerada
                filas={datos.top_disenos.map((d) => ({
                  clave: `${d.pieza}-${d.codigo}`,
                  etiqueta: d.codigo,
                  detalle: `${d.pieza === 'puno' ? 'Puño' : 'Cuello'} · ${formatearMoneda(d.total)}`,
                  valor: d.unidades,
                }))}
                formatear={(n) => `${formatearEntero(n)} uds.`}
                vacio="Sin ventas en este período."
              />
            </section>
          </div>
        </>
      )}

      <section className="tarjeta">
        <header className="bloque-encabezado">
          <h2>Actividad reciente</h2>
          <span className="texto-suave texto-pequeno">Últimos 10 registros</span>
        </header>
        {actividad.error && <Aviso tipo="error">{actividad.error.mensaje}</Aviso>}
        {actividad.cargando && !actividad.datos && <Cargando />}
        {actividad.datos &&
          (actividad.datos.length === 0 ? (
            <p className="texto-suave">
              Todavía no hay movimientos, ventas ni producción.
            </p>
          ) : (
            <ul className="lista-actividad">
              {actividad.datos.map((a) => (
                <li key={`${a.tipo}-${a.id}`} className="actividad">
                  <span className={`actividad-tipo actividad-${a.tipo}`}>
                    {ETIQUETAS_ACTIVIDAD[a.tipo] ?? a.tipo}
                  </span>
                  <span className="actividad-detalle">
                    {a.detalle}
                    <span className="texto-suave texto-pequeno">
                      {' '}
                      · {formatearDia(a.fecha)} · {a.usuario}
                    </span>
                  </span>
                  <span className="actividad-cifra">{cifraActividad(a)}</span>
                </li>
              ))}
            </ul>
          ))}
        <p className="nota no-imprimir">
          <Link to="/reportes">Ver reportes completos →</Link>
        </p>
      </section>
    </section>
  )
}

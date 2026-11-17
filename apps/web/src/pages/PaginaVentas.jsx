import { Fragment, useCallback, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  LIMITE_FILAS,
  METODOS_PAGO,
  OPCIONES_ESTADO_VENTA,
  eliminarVenta,
  formatearDia,
  formatearEntero,
  formatearMetodoPago,
  formatearMoneda,
  listarVentas,
  marcarEntrega,
  normalizarError,
  pendienteDeEntregar,
  resumenVentas,
} from '@inventario/shared'
import { useAuth } from '../hooks/useAuth.js'
import { useConsulta } from '../hooks/useConsulta.js'
import { useDisenos } from '../hooks/useDisenos.js'
import { usePeriodo } from '../hooks/usePeriodo.js'
import { descargarCSV } from '../utils/descargar.js'
import FiltroPeriodo from '../components/FiltroPeriodo.jsx'
import TarjetaKpi from '../components/conos/TarjetaKpi.jsx'
import EstadoVenta from '../components/EstadoVenta.jsx'
import { SelectorDiseno } from '../components/lineas/CamposLinea.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

const VACIO = []
const METODOS_VALIDOS = METODOS_PAGO.map((m) => m.valor)
const ESTADOS_VALIDOS = OPCIONES_ESTADO_VENTA.map((e) => e.valor).filter(Boolean)

/** "maz4t5 ×3, cous2t ×1". */
const disenosDe = (venta) => {
  const porCodigo = new Map()
  for (const l of venta.lineas)
    porCodigo.set(l.diseno_codigo, (porCodigo.get(l.diseno_codigo) ?? 0) + l.cantidad)
  return [...porCodigo].map(([codigo, n]) => `${codigo} ×${n}`).join(', ')
}

/** Una fila por linea de venta, para exportar. */
const COLUMNAS_EXPORTAR = [
  { titulo: 'Fecha', valor: (f) => f.venta.fecha },
  { titulo: 'Cliente', valor: (f) => f.venta.cliente },
  { titulo: 'Método de pago', valor: (f) => formatearMetodoPago(f.venta.metodo_pago) },
  { titulo: 'Diseño', valor: (f) => f.linea.diseno_codigo },
  { titulo: 'Pieza', valor: (f) => f.linea.pieza },
  { titulo: 'Medida', valor: (f) => f.linea.talla },
  { titulo: 'Cantidad', valor: (f) => f.linea.cantidad },
  { titulo: 'Precio unitario', valor: (f) => Number(f.linea.precio_unitario) },
  { titulo: 'Subtotal', valor: (f) => Number(f.linea.subtotal) },
  { titulo: 'Total de la venta', valor: (f) => Number(f.venta.total) },
  { titulo: 'Notas', valor: (f) => f.venta.notas },
]

/** Historial de ventas con filtros, resumen y detalle de cada venta. */
export default function PaginaVentas() {
  const id = useId()
  const { puede } = useAuth()
  const { rango, cambiarRango } = usePeriodo()
  const { desde, hasta } = rango
  const [parametros, setParametros] = useSearchParams()
  // Los filtros de la URL solo se usan si son valores conocidos.
  const metodo = METODOS_VALIDOS.includes(parametros.get('metodo'))
    ? parametros.get('metodo')
    : ''
  const disenoId = parametros.get('diseno') ?? ''
  const estado = ESTADOS_VALIDOS.includes(parametros.get('estado'))
    ? parametros.get('estado')
    : ''
  const { disenos } = useDisenos()

  const cargar = useCallback(
    () => listarVentas({ desde, hasta, metodo }),
    [desde, hasta, metodo],
  )
  const { datos, cargando, error, recargar } = useConsulta(cargar)
  const [abierta, setAbierta] = useState(/** @type {string|null} */ (null))
  const [errorAccion, setErrorAccion] = useState(/** @type {string|null} */ (null))
  const [mensaje, setMensaje] = useState(/** @type {string|null} */ (null))

  const todas = datos ?? VACIO
  const ventas = todas.filter(
    (v) =>
      (!disenoId || v.lineas.some((l) => l.cuello_id === disenoId)) &&
      (!estado || v.estado === estado),
  )
  const resumen = resumenVentas(ventas)
  const porEntregar = ventas.filter((v) => pendienteDeEntregar(v.estado)).length

  const cambiarFiltro = (nombre, valor) =>
    setParametros(
      (previos) => {
        const siguientes = new URLSearchParams(previos)
        if (valor) siguientes.set(nombre, valor)
        else siguientes.delete(nombre)
        return siguientes
      },
      { replace: true },
    )

  const eliminar = async (venta) => {
    if (
      !window.confirm(
        `¿Eliminar la venta del ${formatearDia(venta.fecha)} por ${formatearMoneda(venta.total)}?`,
      )
    )
      return
    setErrorAccion(null)
    setMensaje(null)
    try {
      await eliminarVenta(venta.id)
      setMensaje('Venta eliminada.')
      recargar()
    } catch (e) {
      setErrorAccion(normalizarError(e).mensaje)
    }
  }

  const cambiarEntrega = async (venta, modo) => {
    setErrorAccion(null)
    setMensaje(null)
    try {
      await marcarEntrega(venta.id, modo)
      recargar()
    } catch (e) {
      setErrorAccion(normalizarError(e).mensaje)
    }
  }

  const exportar = () =>
    descargarCSV(
      `ventas ${desde} a ${hasta}`,
      COLUMNAS_EXPORTAR,
      ventas.flatMap((venta) => venta.lineas.map((linea) => ({ venta, linea }))),
    )

  return (
    <section className="pagina-modulo">
      <div className="encabezado-pagina">
        <h1>Historial de ventas</h1>
        <div className="acciones-pagina">
          {ventas.length > 0 && (
            <button type="button" className="boton boton-secundario" onClick={exportar}>
              Exportar a Excel
            </button>
          )}
          {puede('ventas.registrar') && (
            <Link to="/ventas/nueva" className="boton boton-primario boton-compacto">
              + Registrar venta
            </Link>
          )}
        </div>
      </div>

      <FiltroPeriodo rango={rango} alCambiar={cambiarRango}>
        <div className="campo">
          <label htmlFor={`${id}-diseno`}>Diseño</label>
          <SelectorDiseno
            id={`${id}-diseno`}
            valor={disenos.some((d) => d.id === disenoId) ? disenoId : ''}
            alCambiar={(v) => cambiarFiltro('diseno', v)}
            disenos={disenos}
            vacio="Todos"
          />
        </div>
        <div className="campo">
          <label htmlFor={`${id}-metodo`}>Método de pago</label>
          <select
            id={`${id}-metodo`}
            value={metodo}
            onChange={(e) => cambiarFiltro('metodo', e.target.value)}
          >
            <option value="">Todos</option>
            {METODOS_PAGO.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-estado`}>Estado</label>
          <select
            id={`${id}-estado`}
            value={estado}
            onChange={(e) => cambiarFiltro('estado', e.target.value)}
          >
            {OPCIONES_ESTADO_VENTA.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </FiltroPeriodo>

      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {(error || errorAccion) && (
        <Aviso
          tipo="error"
          accion={
            error && (
              <button type="button" className="boton boton-secundario" onClick={recargar}>
                Reintentar
              </button>
            )
          }
        >
          {errorAccion ?? error.mensaje}
        </Aviso>
      )}
      {cargando && !datos && <Cargando />}

      {datos && (
        <>
          <div
            className="kpis kpis-compactos"
            role="region"
            aria-label="Resumen del período"
          >
            <TarjetaKpi
              icono="valor"
              valor={formatearMoneda(resumen.total)}
              etiqueta="Total vendido"
              detalle={`${formatearEntero(resumen.ventas)} ${resumen.ventas === 1 ? 'venta' : 'ventas'}`}
            />
            <TarjetaKpi
              icono="cuello"
              valor={formatearEntero(resumen.unidades)}
              etiqueta="Cuellos vendidos"
            />
            <TarjetaKpi
              icono="valor"
              valor={formatearMoneda(resumen.ticketPromedio)}
              etiqueta="Ticket promedio"
              detalle="por venta"
            />
            <TarjetaKpi
              icono={porEntregar ? 'alerta' : 'ok'}
              estado={porEntregar ? 'bajo' : 'ok'}
              valor={formatearEntero(porEntregar)}
              etiqueta="Pendientes de entregar"
              detalle={porEntregar ? 'sin entregar al cliente' : 'todo entregado'}
            />
          </div>

          {todas.length >= LIMITE_FILAS && (
            <Aviso tipo="info">
              Se muestran las {LIMITE_FILAS} ventas más recientes del período. Acorta el
              rango de fechas para ver el resto; los totales exactos están en Reportes.
            </Aviso>
          )}

          <section className="tarjeta">
            {ventas.length === 0 ? (
              <div className="vacio">
                <p>No hay ventas con estos filtros.</p>
              </div>
            ) : (
              <div className="tabla-envoltura">
                <table className="tabla-datos">
                  <thead>
                    <tr>
                      <th scope="col">Fecha</th>
                      <th scope="col">Cliente</th>
                      <th scope="col">Diseños</th>
                      <th scope="col" className="numero">
                        Cantidad
                      </th>
                      <th scope="col" className="numero">
                        Total
                      </th>
                      <th scope="col">Pago</th>
                      <th scope="col">Estado</th>
                      <th scope="col">
                        <span className="solo-lector">Acciones</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ventas.map((v) => (
                      <Fragment key={v.id}>
                        <tr>
                          <td>{formatearDia(v.fecha)}</td>
                          <td>{v.cliente ?? '—'}</td>
                          <td>{disenosDe(v)}</td>
                          <td className="numero">{formatearEntero(v.total_unidades)}</td>
                          <td className="numero">{formatearMoneda(v.total)}</td>
                          <td>{formatearMetodoPago(v.metodo_pago)}</td>
                          <td>
                            <EstadoVenta estado={v.estado} />
                          </td>
                          <td className="celda-acciones">
                            <button
                              type="button"
                              className="boton boton-fantasma boton-sm"
                              aria-expanded={abierta === v.id}
                              onClick={() => setAbierta(abierta === v.id ? null : v.id)}
                            >
                              {abierta === v.id ? 'Ocultar' : 'Ver detalle'}
                            </button>
                            {puede('ventas.eliminar') && (
                              <button
                                type="button"
                                className="boton boton-fantasma boton-fantasma-peligro boton-sm"
                                onClick={() => eliminar(v)}
                              >
                                Eliminar
                              </button>
                            )}
                          </td>
                        </tr>
                        {abierta === v.id && (
                          <tr className="fila-detalle">
                            <td colSpan={8}>
                              <table className="tabla-datos">
                                <thead>
                                  <tr>
                                    <th scope="col">Diseño</th>
                                    <th scope="col">Medida</th>
                                    <th scope="col" className="numero">
                                      Cantidad
                                    </th>
                                    <th scope="col">Producido</th>
                                    <th scope="col" className="numero">
                                      Precio unitario
                                    </th>
                                    <th scope="col" className="numero">
                                      Subtotal
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {v.lineas.map((l) => {
                                    const hechos = l.asignado ?? 0
                                    const completo = hechos >= l.cantidad
                                    return (
                                      <tr key={l.id}>
                                        <td>
                                          {l.diseno_codigo}{' '}
                                          <span className="texto-suave texto-pequeno">
                                            {l.pieza === 'puno' ? 'Puño' : 'Cuello'}
                                          </span>
                                        </td>
                                        <td>{l.talla}</td>
                                        <td className="numero">
                                          {formatearEntero(l.cantidad)}
                                        </td>
                                        <td>
                                          <div className="progreso">
                                            <div
                                              className="progreso-pista"
                                              aria-hidden="true"
                                            >
                                              <div
                                                className={`progreso-relleno${completo ? ' completo' : ''}`}
                                                style={{
                                                  width: `${Math.min(100, (hechos / l.cantidad) * 100)}%`,
                                                }}
                                              />
                                            </div>
                                            <span className="progreso-texto">
                                              {formatearEntero(hechos)}/
                                              {formatearEntero(l.cantidad)}
                                            </span>
                                          </div>
                                        </td>
                                        <td className="numero">
                                          {formatearMoneda(l.precio_unitario)}
                                        </td>
                                        <td className="numero">
                                          {formatearMoneda(l.subtotal)}
                                        </td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                              {v.notas && <p className="nota notas">Notas: {v.notas}</p>}
                              {puede('ventas.registrar') && (
                                <div className="venta-entrega no-imprimir">
                                  {v.estado === 'listo' && (
                                    <>
                                      <button
                                        type="button"
                                        className="boton boton-primario boton-sm"
                                        onClick={() => cambiarEntrega(v, 'entregado')}
                                      >
                                        Marcar como entregado
                                      </button>
                                      <button
                                        type="button"
                                        className="boton boton-secundario boton-sm"
                                        onClick={() => cambiarEntrega(v, 'parcial')}
                                      >
                                        Entrega parcial
                                      </button>
                                    </>
                                  )}
                                  {v.estado === 'en_produccion' && (
                                    <button
                                      type="button"
                                      className="boton boton-secundario boton-sm"
                                      onClick={() => cambiarEntrega(v, 'parcial')}
                                    >
                                      Entrega parcial
                                    </button>
                                  )}
                                  {(v.estado === 'entregado' ||
                                    v.estado === 'entregado_parcial') && (
                                    <button
                                      type="button"
                                      className="boton boton-fantasma boton-sm"
                                      onClick={() => cambiarEntrega(v, 'ninguno')}
                                    >
                                      Quitar entrega
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  )
}

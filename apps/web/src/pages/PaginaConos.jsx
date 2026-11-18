import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  formatearConos,
  formatearEntero,
  formatearMoneda,
  formatearPeso,
  resumenInventario,
} from '@inventario/shared'
import { useConos, useMovimientosRecientes } from '../hooks/useConos.js'
import MuestraCono from '../components/conos/MuestraCono.jsx'
import InsigniaEstadoCono from '../components/conos/InsigniaEstadoCono.jsx'
import ListaMovimientos from '../components/conos/ListaMovimientos.jsx'
import ModalMovimiento from '../components/conos/ModalMovimiento.jsx'
import TarjetaKpi from '../components/conos/TarjetaKpi.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

/**
 * Resumen del inventario de conos: cifras, alertas y ultimos movimientos.
 * `abrir` (rutas /conos/entrada y /conos/salida del menu) muestra la pagina
 * con el registro de ese movimiento ya abierto.
 * @param {{ abrir?: 'entrada'|'salida' }} props
 */
export default function PaginaConos({ abrir: movimientoInicial }) {
  const navegar = useNavigate()
  const { conos, cargando, error, recargar } = useConos()
  const recientes = useMovimientosRecientes()
  const [modal, setModal] = useState(
    /** @type {null|{ tipo: 'entrada'|'salida', cono?: import('@inventario/shared').Cono }} */ (
      movimientoInicial ? { tipo: movimientoInicial } : null
    ),
  )
  // Al cerrar el registro abierto desde el menu se vuelve al resumen.
  const cerrarModal = () => {
    setModal(null)
    if (movimientoInicial) navegar('/conos', { replace: true })
  }
  const [mensaje, setMensaje] = useState(/** @type {string|null} */ (null))

  const abrir = (tipo, cono) => {
    setMensaje(null)
    setModal({ tipo, cono })
  }

  const r = resumenInventario(conos)
  const alertas = [...r.agotados, ...r.bajo]
  let estadoReponer = 'ok'
  if (r.agotados.length) estadoReponer = 'agotado'
  else if (r.bajo.length) estadoReponer = 'bajo'

  return (
    <section className="pagina-conos">
      <div className="encabezado-pagina">
        <h1>Inventario de conos</h1>
        <div className="acciones-pagina">
          <Link to="/conos/muestrario" className="boton boton-secundario boton-lg">
            Ver muestrario
          </Link>
          <Link to="/conos/nuevo" className="boton boton-secundario boton-lg">
            + Nuevo cono
          </Link>
        </div>
      </div>

      {conos.length > 0 && (
        <div className="kpis" role="region" aria-label="Resumen del inventario">
          <TarjetaKpi
            icono="conos"
            valor={formatearEntero(r.totalConos)}
            etiqueta="Conos en inventario"
            detalle={`${r.tipos} ${r.tipos === 1 ? 'tipo' : 'tipos'}${
              r.pesoTotalG ? ` · ${formatearPeso(r.pesoTotalG)}` : ''
            }`}
            a="/conos/muestrario"
          />
          <TarjetaKpi
            icono="valor"
            valor={formatearMoneda(r.valorTotal)}
            etiqueta="Valor del inventario"
            detalle={
              r.sinCosto
                ? `a costo · ${r.sinCosto} ${r.sinCosto === 1 ? 'cono sin costo' : 'conos sin costo'}`
                : 'a costo'
            }
          />
          <TarjetaKpi
            icono={alertas.length ? 'alerta' : 'ok'}
            estado={estadoReponer}
            valor={formatearEntero(alertas.length)}
            etiqueta="Por reponer"
            detalle={
              alertas.length === 0 ? (
                'Todo en orden'
              ) : (
                <>
                  {r.agotados.length > 0 && (
                    <Link to="/conos/muestrario?estado=agotado&agrupar=">
                      {r.agotados.length}{' '}
                      {r.agotados.length === 1 ? 'agotado' : 'agotados'}
                    </Link>
                  )}
                  {r.agotados.length > 0 && r.bajo.length > 0 && ' · '}
                  {r.bajo.length > 0 && (
                    <Link to="/conos/muestrario?estado=bajo&agrupar=">
                      {r.bajo.length} con stock bajo
                    </Link>
                  )}
                </>
              )
            }
          />
        </div>
      )}

      <div className="acciones-stock">
        <button
          type="button"
          className="boton boton-lg boton-movimiento boton-entrada"
          onClick={() => abrir('entrada')}
          disabled={conos.length === 0}
        >
          + Registrar entrada
        </button>
        <button
          type="button"
          className="boton boton-lg boton-movimiento boton-salida"
          onClick={() => abrir('salida')}
          disabled={conos.length === 0}
        >
          − Registrar salida
        </button>
      </div>

      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
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
      {cargando && conos.length === 0 && <Cargando />}

      {!cargando && !error && conos.length === 0 && (
        <div className="vacio">
          <p>Todavía no hay conos registrados.</p>
          <Link to="/conos/nuevo" className="boton boton-primario">
            Registrar el primer cono
          </Link>
        </div>
      )}

      {conos.length > 0 && (
        <>
          <div className="resumen-columnas">
            <div className="tarjeta" id="por-reponer">
              <h2>Por reponer</h2>
              {alertas.length === 0 ? (
                <p className="texto-suave">Ningún cono está bajo el mínimo.</p>
              ) : (
                <ul className="lista-alertas">
                  {alertas.map((c) => (
                    <li key={c.id}>
                      <Link to={`/conos/${c.id}`} className="alerta-cono">
                        <MuestraCono hex={c.hex} texto={c.codigo_color} tamano="sm" />
                        <span className="alerta-cono-texto">
                          <strong>{c.nombre_color}</strong>
                          <span className="texto-suave texto-pequeno">
                            {c.codigo} · quedan {formatearConos(c.stock_actual)} (mín.{' '}
                            {c.stock_minimo})
                          </span>
                        </span>
                        <InsigniaEstadoCono cono={c} />
                      </Link>
                      <button
                        type="button"
                        className="boton boton-contorno"
                        onClick={() => abrir('entrada', c)}
                      >
                        + Entrada
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="tarjeta">
              <h2>Últimos movimientos</h2>
              {recientes.error && <Aviso tipo="error">{recientes.error.mensaje}</Aviso>}
              {recientes.cargando && recientes.movimientos.length === 0 ? (
                <Cargando />
              ) : (
                <ListaMovimientos movimientos={recientes.movimientos} conCono />
              )}
            </div>
          </div>
        </>
      )}

      {modal && conos.length > 0 && (
        <ModalMovimiento
          tipoInicial={modal.tipo}
          cono={modal.cono}
          conos={conos}
          alCerrar={cerrarModal}
          alRegistrar={(texto) => {
            setModal(null)
            setMensaje(texto)
            recargar()
            recientes.recargar()
          }}
        />
      )}
    </section>
  )
}

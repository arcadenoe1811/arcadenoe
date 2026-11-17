import { Fragment, useId, useState } from 'react'
import {
  eliminarProduccion,
  formatearDia,
  formatearEntero,
  formatearFecha,
  formatearPieza,
  hoyISO,
  listarPendientesProduccion,
  listarProducciones,
  normalizarError,
  normalizarTallaVenta,
  registrarProduccion,
  registrarProduccionDirigida,
} from '@inventario/shared'
import { useAuth } from '../hooks/useAuth.js'
import { useConsulta } from '../hooks/useConsulta.js'
import { useDisenos } from '../hooks/useDisenos.js'
import {
  Campo,
  BuscadorDiseno,
  SelectorTalla,
} from '../components/lineas/CamposLinea.jsx'
import Modal from '../components/ui/Modal.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

const formularioVacio = () => ({
  fecha: hoyISO(),
  cuello_id: '',
  talla: '',
  cantidad: '',
  notas: '',
})

const cargarPendientes = () => listarPendientesProduccion()
const cargarRecientes = () => listarProducciones(50)

/** "hace 8 días" / "hoy". */
function haceDias(dias) {
  const n = Number(dias) || 0
  if (n <= 0) return 'hoy'
  return `hace ${n} ${n === 1 ? 'día' : 'días'}`
}

/** Texto de "Asignado a" para una producción (lista `asignado`). */
function resumenAsignado(asignado) {
  const lista = asignado ?? []
  if (lista.length === 0) return 'Sin asignar'
  if (lista.length === 1) return lista[0].cliente
  return `${lista[0].cliente} +${lista.length - 1}`
}

/**
 * Producción bajo pedido. Conecta con las ventas: lo pendiente se desglosa
 * por cliente (quién pidió, hace cuánto) y cada producción se asigna a las
 * ventas más antiguas (FIFO). No se lleva existencia de cuellos terminados.
 */
export default function PaginaProduccion() {
  const id = useId()
  const { puede } = useAuth()
  const { disenos, cargando } = useDisenos()
  const pend = useConsulta(cargarPendientes)
  const recientes = useConsulta(cargarRecientes)
  const [formulario, setFormulario] = useState(formularioVacio)
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [mensaje, setMensaje] = useState(/** @type {string|null} */ (null))
  const [errorGeneral, setErrorGeneral] = useState(/** @type {string|null} */ (null))
  const [guardando, setGuardando] = useState(false)
  const [detalle, setDetalle] = useState(/** @type {Record<string, any>|null} */ (null))
  const [expandida, setExpandida] = useState(/** @type {string|null} */ (null))
  // Mini-formulario de producción dirigida a una sub-línea del desglose.
  const [dirigida, setDirigida] = useState(/** @type {Record<string, any>|null} */ (null))
  // Orden de la tabla de pendientes por "Venta más antigua".
  const [orden, setOrden] = useState(/** @type {'asc'|'desc'} */ ('asc'))

  const disenoPorId = new Map(disenos.map((d) => [d.id, d]))
  const cambiar = (campo, valor) => setFormulario((f) => ({ ...f, [campo]: valor }))
  const recargarTodo = () => {
    pend.recargar()
    recientes.recargar()
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setMensaje(null)
    setErrorGeneral(null)
    setGuardando(true)
    try {
      await registrarProduccion(formulario)
      const codigo = disenoPorId.get(formulario.cuello_id)?.codigo ?? ''
      setMensaje(`Producción registrada: ${formulario.cantidad} × ${codigo}.`)
      setErrores({})
      // Se conservan fecha y diseño: lo habitual es registrar varias medidas seguidas.
      setFormulario((f) => ({ ...f, talla: '', cantidad: '', notas: '' }))
      recargarTodo()
    } catch (e) {
      const normalizado = normalizarError(e)
      setErrores(normalizado.errores)
      setErrorGeneral(normalizado.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (produccion) => {
    if (
      !window.confirm(
        `¿Eliminar la producción de ${produccion.cantidad} × ${produccion.diseno_codigo} medida ${produccion.talla}? Volverá a contar como pendiente.`,
      )
    )
      return
    setMensaje(null)
    setErrorGeneral(null)
    try {
      await eliminarProduccion(produccion.id)
      recargarTodo()
    } catch (e) {
      setErrorGeneral(normalizarError(e).mensaje)
    }
  }

  /** Abre el mini-formulario para producir directo a una venta (salta FIFO). */
  const abrirDirigida = (p, d) => {
    setMensaje(null)
    setErrorGeneral(null)
    setDirigida({
      venta_linea_id: d.venta_linea_id,
      cantidad: String(d.pendiente),
      fecha: hoyISO(),
      notas: '',
      guardando: false,
      error: null,
    })
  }

  const registrarDirigida = async (evento) => {
    evento.preventDefault()
    setDirigida((f) => f && { ...f, guardando: true, error: null })
    try {
      await registrarProduccionDirigida(dirigida)
      setDirigida(null)
      setMensaje('Producción registrada y asignada a esa venta.')
      recargarTodo()
    } catch (e) {
      const n = normalizarError(e)
      setDirigida(
        (f) =>
          f && {
            ...f,
            guardando: false,
            error: n.errores.cantidad ?? n.errores.fecha ?? n.mensaje,
          },
      )
    }
  }

  /** Lleva un pendiente al formulario general para registrarlo de una vez. */
  const prepararRegistro = (p) => {
    setMensaje(null)
    setErrorGeneral(null)
    setErrores({})
    setFormulario((f) => ({
      ...f,
      cuello_id: p.cuello_id,
      talla: p.talla,
      cantidad: String(p.pendiente),
    }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const pendientes = pend.datos ?? []
  const totalPendiente = pendientes.reduce((s, p) => s + p.pendiente, 0)
  const pendientesOrdenados = [...pendientes].sort((a, b) => {
    const cmp = String(a.venta_mas_antigua).localeCompare(String(b.venta_mas_antigua))
    return orden === 'asc' ? cmp : -cmp
  })

  // Mini resumen contextual del formulario (diseño + medida elegidos).
  const medidaForm = normalizarTallaVenta(formulario.talla)
  const resumenForm =
    formulario.cuello_id && medidaForm
      ? pendientes.find(
          (p) => p.cuello_id === formulario.cuello_id && p.talla === medidaForm,
        )
      : null

  if (cargando && disenos.length === 0) return <Cargando />

  return (
    <section className="pagina-modulo">
      <div className="encabezado-pagina">
        <div>
          <h1>Producción</h1>
          <p className="texto-suave">
            Se trabaja bajo pedido: la producción se asigna a las ventas más antiguas
            primero.
          </p>
        </div>
      </div>

      {mensaje && <Aviso tipo="exito">{mensaje}</Aviso>}
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

      <form className="tarjeta" onSubmit={enviar} noValidate>
        <h2>Registrar producción</h2>
        <div className="campos">
          <Campo id={`${id}-fecha`} etiqueta="Fecha" error={errores.fecha}>
            <input
              id={`${id}-fecha`}
              type="date"
              value={formulario.fecha}
              max={hoyISO()}
              onChange={(e) => cambiar('fecha', e.target.value)}
            />
          </Campo>
          <Campo id={`${id}-diseno`} etiqueta="Diseño" error={errores.cuello_id}>
            <BuscadorDiseno
              id={`${id}-diseno`}
              valor={formulario.cuello_id}
              alCambiar={(v) => cambiar('cuello_id', v)}
              disenos={disenos}
              invalido={Boolean(errores.cuello_id)}
            />
          </Campo>
          <Campo id={`${id}-talla`} etiqueta="Medida" error={errores.talla}>
            <SelectorTalla
              id={`${id}-talla`}
              valor={formulario.talla}
              alCambiar={(v) => cambiar('talla', v)}
              diseno={disenoPorId.get(formulario.cuello_id)}
              invalido={Boolean(errores.talla)}
            />
          </Campo>
          <Campo
            id={`${id}-cantidad`}
            etiqueta="Cantidad producida"
            error={errores.cantidad}
          >
            <input
              id={`${id}-cantidad`}
              inputMode="numeric"
              autoComplete="off"
              value={formulario.cantidad}
              onChange={(e) =>
                cambiar('cantidad', e.target.value.replace(/\D/g, '').slice(0, 5))
              }
            />
          </Campo>
          <div className="campo-area_texto">
            <Campo id={`${id}-notas`} etiqueta="Notas (opcional)" error={errores.notas}>
              <textarea
                id={`${id}-notas`}
                rows={2}
                maxLength={1000}
                value={formulario.notas}
                onChange={(e) => cambiar('notas', e.target.value)}
              />
            </Campo>
          </div>
        </div>

        {resumenForm && (
          <p className="resumen-contextual" role="status">
            Se necesitan <strong>{formatearEntero(resumenForm.pendiente)}</strong> de este
            tipo. Cliente más antiguo: <strong>{resumenForm.cliente_mas_antiguo}</strong>{' '}
            ({formatearDia(resumenForm.venta_mas_antigua)}, {haceDias(resumenForm.dias)}).
          </p>
        )}

        <div className="formulario-acciones margen-arriba">
          <button type="submit" className="boton boton-primario" disabled={guardando}>
            {guardando ? 'Registrando…' : 'Registrar producción'}
          </button>
        </div>
      </form>

      {/* Pendiente de producir, por diseño y medida, con desglose por cliente. */}
      <section className="tarjeta bloque-tabla">
        <header className="bloque-encabezado">
          <h2>
            Pendiente de producir
            {totalPendiente > 0 && (
              <span className="texto-suave">
                {' '}
                · {formatearEntero(totalPendiente)} cuellos
              </span>
            )}
          </h2>
        </header>
        {pend.error && <Aviso tipo="error">{pend.error.mensaje}</Aviso>}
        {pend.cargando && !pend.datos && <Cargando />}
        {pend.datos &&
          (pendientes.length === 0 ? (
            <p className="texto-suave">
              No hay pedidos pendientes: todo lo vendido ya se produjo.
            </p>
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla-datos">
                <thead>
                  <tr>
                    <th scope="col" className="columna-expandir">
                      <span className="solo-lector">Desglose</span>
                    </th>
                    <th scope="col">Diseño</th>
                    <th scope="col">Medida</th>
                    <th scope="col" className="numero">
                      Vendido
                    </th>
                    <th scope="col" className="numero">
                      Producido
                    </th>
                    <th scope="col" className="numero">
                      Pendiente
                    </th>
                    <th scope="col">
                      <button
                        type="button"
                        className="orden-columna"
                        onClick={() => setOrden((o) => (o === 'asc' ? 'desc' : 'asc'))}
                        aria-label={`Ordenar por venta más antigua (${orden === 'asc' ? 'ascendente' : 'descendente'})`}
                      >
                        Venta más antigua {orden === 'asc' ? '▲' : '▼'}
                      </button>
                    </th>
                    <th scope="col">
                      <span className="solo-lector">Acción</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendientesOrdenados.map((p) => {
                    const clave = `${p.cuello_id}|${p.talla}`
                    const abierta = expandida === clave
                    return (
                      <Fragment key={clave}>
                        <tr>
                          <td className="columna-expandir">
                            <button
                              type="button"
                              className="boton-expandir"
                              aria-expanded={abierta}
                              aria-label={
                                abierta ? 'Ocultar desglose' : 'Ver desglose por cliente'
                              }
                              onClick={() => setExpandida(abierta ? null : clave)}
                            >
                              {abierta ? '▾' : '▸'}
                            </button>
                          </td>
                          <td>{p.codigo}</td>
                          <td>{p.talla}</td>
                          <td className="numero">{formatearEntero(p.vendido)}</td>
                          <td className="numero">{formatearEntero(p.producido)}</td>
                          <td className="numero">
                            <strong>{formatearEntero(p.pendiente)}</strong>
                          </td>
                          <td>
                            {formatearDia(p.venta_mas_antigua)}
                            <span className="texto-suave">
                              {' '}
                              ({p.cliente_mas_antiguo})
                            </span>
                          </td>
                          <td className="celda-acciones">
                            {disenoPorId.has(p.cuello_id) && (
                              <button
                                type="button"
                                className="boton boton-fantasma boton-sm no-imprimir"
                                onClick={() => prepararRegistro(p)}
                              >
                                Registrar
                              </button>
                            )}
                          </td>
                        </tr>
                        {abierta && (
                          <tr className="fila-detalle">
                            <td colSpan={8}>
                              <strong>
                                {p.codigo} · {p.talla}
                              </strong>{' '}
                              — pendiente total {formatearEntero(p.pendiente)}
                              <ul className="desglose-clientes">
                                {p.detalle.map((d) => (
                                  <li key={d.venta_linea_id} className="desglose-item">
                                    <div className="desglose-fila">
                                      <span className="desglose-cliente">
                                        {d.cliente}
                                      </span>
                                      <span className="texto-suave">
                                        {formatearDia(d.fecha)} · {haceDias(d.dias)}
                                      </span>
                                      <span className="desglose-pendiente">
                                        {formatearEntero(d.pendiente)}{' '}
                                        {d.pendiente === 1 ? 'pendiente' : 'pendientes'}
                                      </span>
                                      {puede('produccion.registrar') && (
                                        <button
                                          type="button"
                                          className="boton boton-contorno boton-sm no-imprimir"
                                          onClick={() => abrirDirigida(p, d)}
                                        >
                                          Producir
                                        </button>
                                      )}
                                    </div>
                                    {d.nota && (
                                      <div className="desglose-nota" title={d.nota}>
                                        📝 {d.nota}
                                      </div>
                                    )}
                                    {dirigida?.venta_linea_id === d.venta_linea_id && (
                                      <form
                                        className="desglose-form no-imprimir"
                                        onSubmit={registrarDirigida}
                                      >
                                        <label>
                                          <span>Cantidad</span>
                                          <input
                                            inputMode="numeric"
                                            autoComplete="off"
                                            autoFocus
                                            value={dirigida.cantidad}
                                            aria-invalid={
                                              dirigida.error ? true : undefined
                                            }
                                            onChange={(e) =>
                                              setDirigida((f) => ({
                                                ...f,
                                                cantidad: e.target.value
                                                  .replace(/\D/g, '')
                                                  .slice(0, 5),
                                                error: null,
                                              }))
                                            }
                                          />
                                        </label>
                                        <label>
                                          <span>Fecha</span>
                                          <input
                                            type="date"
                                            value={dirigida.fecha}
                                            max={hoyISO()}
                                            onChange={(e) =>
                                              setDirigida((f) => ({
                                                ...f,
                                                fecha: e.target.value,
                                              }))
                                            }
                                          />
                                        </label>
                                        <label className="desglose-form-notas">
                                          <span>Notas</span>
                                          <input
                                            type="text"
                                            maxLength={1000}
                                            placeholder="Opcional"
                                            value={dirigida.notas}
                                            onChange={(e) =>
                                              setDirigida((f) => ({
                                                ...f,
                                                notas: e.target.value,
                                              }))
                                            }
                                          />
                                        </label>
                                        <div className="desglose-form-acciones">
                                          <button
                                            type="submit"
                                            className="boton boton-primario boton-sm"
                                            disabled={dirigida.guardando}
                                          >
                                            {dirigida.guardando
                                              ? 'Guardando…'
                                              : 'Registrar'}
                                          </button>
                                          <button
                                            type="button"
                                            className="boton boton-fantasma boton-sm"
                                            onClick={() => setDirigida(null)}
                                          >
                                            Cancelar
                                          </button>
                                        </div>
                                        {dirigida.error && (
                                          <small className="campo-error" role="alert">
                                            {dirigida.error}
                                          </small>
                                        )}
                                      </form>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
      </section>

      <section className="tarjeta">
        <header className="bloque-encabezado">
          <h2>Últimas producciones</h2>
        </header>
        {recientes.error && <Aviso tipo="error">{recientes.error.mensaje}</Aviso>}
        {recientes.cargando && !recientes.datos && <Cargando />}
        {recientes.datos &&
          (recientes.datos.length === 0 ? (
            <p className="texto-suave">Todavía no hay producción registrada.</p>
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla-datos">
                <thead>
                  <tr>
                    <th scope="col">Fecha</th>
                    <th scope="col">Diseño</th>
                    <th scope="col">Medida</th>
                    <th scope="col" className="numero">
                      Cantidad
                    </th>
                    <th scope="col">Asignado a</th>
                    {puede('produccion.eliminar') && (
                      <th scope="col">
                        <span className="solo-lector">Acciones</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {recientes.datos.map((p) => (
                    <tr
                      key={p.id}
                      className="fila-click"
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver detalle de ${p.diseno_codigo} medida ${p.talla}`}
                      onClick={() => setDetalle(p)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setDetalle(p)
                        }
                      }}
                    >
                      <td>
                        {formatearDia(p.fecha)}
                        {p.notas && (
                          <span className="texto-suave" title="Tiene nota">
                            {' '}
                            📝
                          </span>
                        )}
                      </td>
                      <td>{p.diseno_codigo}</td>
                      <td>{p.talla}</td>
                      <td className="numero">{formatearEntero(p.cantidad)}</td>
                      <td
                        title={(p.asignado ?? [])
                          .map((a) => `${a.cliente}: ${a.cantidad}`)
                          .join(' · ')}
                      >
                        {resumenAsignado(p.asignado)}
                      </td>
                      {puede('produccion.eliminar') && (
                        <td className="celda-acciones">
                          <button
                            type="button"
                            className="boton boton-fantasma boton-fantasma-peligro boton-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              eliminar(p)
                            }}
                          >
                            Eliminar
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>

      {detalle && (
        <Modal
          titulo="Detalle de producción"
          alCerrar={() => setDetalle(null)}
          acciones={
            <>
              {puede('produccion.eliminar') && (
                <button
                  type="button"
                  className="boton boton-fantasma boton-fantasma-peligro"
                  onClick={() => {
                    const p = detalle
                    setDetalle(null)
                    eliminar(p)
                  }}
                >
                  Eliminar
                </button>
              )}
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => setDetalle(null)}
              >
                Cerrar
              </button>
            </>
          }
        >
          <dl className="lista-datos">
            <div>
              <dt>Fecha</dt>
              <dd>{formatearDia(detalle.fecha)}</dd>
            </div>
            <div>
              <dt>Diseño</dt>
              <dd>
                {detalle.diseno_codigo}
                {disenoPorId.get(detalle.cuello_id)?.nombre && (
                  <span className="texto-suave">
                    {' '}
                    {disenoPorId.get(detalle.cuello_id).nombre}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Pieza</dt>
              <dd>{formatearPieza(detalle.pieza)}</dd>
            </div>
            <div>
              <dt>Medida</dt>
              <dd>{detalle.talla}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>{formatearEntero(detalle.cantidad)}</dd>
            </div>
            <div>
              <dt>Registrada</dt>
              <dd>{formatearFecha(detalle.created_at)}</dd>
            </div>
            <div className="modal-detalle-nota">
              <dt>Asignado a</dt>
              <dd>
                {(detalle.asignado ?? []).length === 0 ? (
                  <span className="texto-suave">Sin asignar (producción adelantada)</span>
                ) : (
                  <ul className="desglose-clientes">
                    {detalle.asignado.map((a, i) => (
                      <li key={`${a.cliente}-${i}`}>
                        <span className="desglose-cliente">{a.cliente}</span>
                        <span className="texto-suave">{formatearDia(a.fecha)}</span>
                        <span className="desglose-pendiente">
                          {formatearEntero(a.cantidad)} uds.
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </dd>
            </div>
            <div className="modal-detalle-nota">
              <dt>Notas</dt>
              <dd>{detalle.notas || '—'}</dd>
            </div>
          </dl>
        </Modal>
      )}
    </section>
  )
}

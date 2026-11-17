import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  METODOS_PAGO,
  formatearEntero,
  formatearMoneda,
  formatearPieza,
  hoyISO,
  medidasNoDisponibles,
  normalizarError,
  registrarVenta,
  totalesVenta,
} from '@inventario/shared'
import { useDisenos } from '../hooks/useDisenos.js'
import {
  Campo,
  BuscadorDiseno,
  SelectorTalla,
  nuevaClave,
} from '../components/lineas/CamposLinea.jsx'
import Cargando from '../components/Cargando.jsx'
import Aviso from '../components/Aviso.jsx'

const lineaVacia = () => ({
  clave: nuevaClave(),
  cuello_id: '',
  talla: '',
  cantidad: '1',
  precio_unitario: '',
})

const ventaVacia = () => ({
  fecha: hoyISO(),
  cliente: '',
  metodo_pago: 'efectivo',
  notas: '',
})

/**
 * Registrar una venta con varias lineas (diseno + medida). El precio se
 * llena con el precio base del diseno y se puede ajustar. Se trabaja bajo
 * pedido: no hay existencia que verificar; lo vendido queda como pendiente
 * de producir en la pantalla de Produccion.
 */
export default function PaginaRegistrarVenta() {
  const id = useId()
  const { disenos, cargando, error } = useDisenos()
  const [venta, setVenta] = useState(ventaVacia)
  const [lineas, setLineas] = useState(() => [lineaVacia()])
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [errorGeneral, setErrorGeneral] = useState(/** @type {string|null} */ (null))
  const [registrada, setRegistrada] = useState(
    /** @type {{ total: number, unidades: number }|null} */ (null),
  )
  const [guardando, setGuardando] = useState(false)

  const disenoPorId = new Map(disenos.map((d) => [d.id, d]))
  const totales = totalesVenta(lineas)
  // Medidas que el diseño todavía no teje: se avisan, pero la venta se hace.
  const porTejer = medidasNoDisponibles(lineas, disenoPorId)

  const cambiarVenta = (campo, valor) => setVenta((v) => ({ ...v, [campo]: valor }))
  const cambiarLinea = (clave, cambios) =>
    setLineas((previas) =>
      previas.map((l) => (l.clave === clave ? { ...l, ...cambios } : l)),
    )

  const elegirDiseno = (clave, idDiseno) => {
    const precio = disenoPorId.get(idDiseno)?.precio_base
    cambiarLinea(clave, {
      cuello_id: idDiseno,
      // El precio base del diseno; queda editable (descuento, precio especial).
      precio_unitario: precio === null || precio === undefined ? '' : String(precio),
    })
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setErrorGeneral(null)
    setRegistrada(null)
    setGuardando(true)
    try {
      await registrarVenta(venta, lineas)
      setRegistrada({ total: totales.total, unidades: totales.unidades })
      setErrores({})
      setVenta(ventaVacia())
      setLineas([lineaVacia()])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (e) {
      const normalizado = normalizarError(e)
      setErrores(normalizado.errores)
      setErrorGeneral(normalizado.errores.lineas ?? normalizado.mensaje)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando && disenos.length === 0) return <Cargando />

  return (
    <section className="pagina-modulo">
      <div className="encabezado-pagina">
        <h1>Registrar venta</h1>
        <div className="acciones-pagina">
          <Link to="/ventas" className="boton boton-secundario">
            Ver historial
          </Link>
        </div>
      </div>

      {error && <Aviso tipo="error">{error.mensaje}</Aviso>}
      {registrada && (
        <Aviso
          tipo="exito"
          accion={
            <Link to="/ventas" className="boton boton-secundario">
              Ver historial
            </Link>
          }
        >
          Venta registrada: {formatearEntero(registrada.unidades)}{' '}
          {registrada.unidades === 1 ? 'cuello' : 'cuellos'} por{' '}
          {formatearMoneda(registrada.total)}. Queda como pendiente en Producción.
        </Aviso>
      )}
      {errorGeneral && <Aviso tipo="error">{errorGeneral}</Aviso>}

      <form className="pagina-modulo" onSubmit={enviar} noValidate>
        <section className="tarjeta">
          <h2>Datos de la venta</h2>
          <div className="campos">
            <Campo id={`${id}-fecha`} etiqueta="Fecha de venta" error={errores.fecha}>
              <input
                id={`${id}-fecha`}
                type="date"
                value={venta.fecha}
                max={hoyISO()}
                onChange={(e) => cambiarVenta('fecha', e.target.value)}
              />
            </Campo>
            <Campo
              id={`${id}-cliente`}
              etiqueta="Cliente (opcional)"
              error={errores.cliente}
            >
              <input
                id={`${id}-cliente`}
                maxLength={120}
                autoComplete="off"
                value={venta.cliente}
                onChange={(e) => cambiarVenta('cliente', e.target.value)}
              />
            </Campo>
            <Campo
              id={`${id}-metodo`}
              etiqueta="Método de pago"
              error={errores.metodo_pago}
            >
              <select
                id={`${id}-metodo`}
                value={venta.metodo_pago}
                onChange={(e) => cambiarVenta('metodo_pago', e.target.value)}
              >
                {METODOS_PAGO.map((m) => (
                  <option key={m.valor} value={m.valor}>
                    {m.etiqueta}
                  </option>
                ))}
              </select>
            </Campo>
          </div>
        </section>

        <section className="tarjeta">
          <h2>Líneas de venta</h2>
          <div className="lineas">
            {lineas.map((linea, i) => {
              const e = (campo) => errores[`lineas.${i}.${campo}`]
              const base = `${id}-${linea.clave}`
              return (
                <div key={linea.clave} className="linea linea-venta">
                  <Campo
                    id={`${base}-diseno`}
                    etiqueta="Diseño"
                    error={e('cuello_id')}
                    className="linea-diseno"
                  >
                    <BuscadorDiseno
                      id={`${base}-diseno`}
                      valor={linea.cuello_id}
                      alCambiar={(v) => elegirDiseno(linea.clave, v)}
                      disenos={disenos}
                      invalido={Boolean(e('cuello_id'))}
                    />
                  </Campo>
                  <Campo id={`${base}-talla`} etiqueta="Medida" error={e('talla')}>
                    <SelectorTalla
                      id={`${base}-talla`}
                      valor={linea.talla}
                      alCambiar={(v) => cambiarLinea(linea.clave, { talla: v })}
                      diseno={disenoPorId.get(linea.cuello_id)}
                      invalido={Boolean(e('talla'))}
                    />
                  </Campo>
                  <Campo
                    id={`${base}-cantidad`}
                    etiqueta="Cantidad"
                    error={e('cantidad')}
                  >
                    <input
                      id={`${base}-cantidad`}
                      inputMode="numeric"
                      autoComplete="off"
                      value={linea.cantidad}
                      onChange={(ev) =>
                        cambiarLinea(linea.clave, {
                          cantidad: ev.target.value.replace(/\D/g, '').slice(0, 5),
                        })
                      }
                    />
                  </Campo>
                  <Campo
                    id={`${base}-precio`}
                    etiqueta="Precio unitario (Q.)"
                    error={e('precio_unitario')}
                  >
                    <input
                      id={`${base}-precio`}
                      inputMode="decimal"
                      autoComplete="off"
                      value={linea.precio_unitario}
                      onChange={(ev) =>
                        cambiarLinea(linea.clave, { precio_unitario: ev.target.value })
                      }
                    />
                  </Campo>
                  <div className="linea-subtotal">
                    <span>Subtotal</span>
                    <strong>{formatearMoneda(totales.subtotales[i])}</strong>
                  </div>
                  <div className="linea-quitar">
                    <button
                      type="button"
                      className="boton boton-fantasma boton-fantasma-peligro"
                      onClick={() =>
                        setLineas((previas) =>
                          previas.filter((l) => l.clave !== linea.clave),
                        )
                      }
                      disabled={lineas.length === 1}
                      aria-label={`Quitar línea ${i + 1}`}
                    >
                      × Quitar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lineas-pie margen-arriba">
            <button
              type="button"
              className="boton boton-contorno"
              onClick={() => setLineas((previas) => [...previas, lineaVacia()])}
              disabled={lineas.length >= 50}
            >
              + Agregar línea
            </button>
            <div className="total-venta" aria-live="polite">
              <span>
                Total ({formatearEntero(totales.unidades)}{' '}
                {totales.unidades === 1 ? 'cuello' : 'cuellos'})
              </span>
              <strong>{formatearMoneda(totales.total)}</strong>
            </div>
          </div>

          {porTejer.length > 0 && (
            <div className="aviso aviso-advertencia margen-arriba" role="status">
              <div>
                <strong>Hay medidas que este diseño todavía no teje.</strong> Puedes
                registrar la venta igual: quedan como pendientes de producir.
                <ul className="aviso-medidas">
                  {porTejer.map((m) => (
                    <li key={`${m.cuello_id}-${m.talla}`}>
                      {m.codigo} · {formatearPieza(m.pieza)} — medida{' '}
                      <strong>{m.talla}</strong>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        <section className="tarjeta">
          <Campo id={`${id}-notas`} etiqueta="Notas (opcional)" error={errores.notas}>
            <textarea
              id={`${id}-notas`}
              rows={2}
              maxLength={1000}
              value={venta.notas}
              onChange={(e) => cambiarVenta('notas', e.target.value)}
            />
          </Campo>
          <div className="formulario-acciones margen-arriba">
            <button
              type="submit"
              className="boton boton-primario boton-lg"
              disabled={guardando}
            >
              {guardando
                ? 'Registrando…'
                : `Registrar venta · ${formatearMoneda(totales.total)}`}
            </button>
          </div>
        </section>
      </form>
    </section>
  )
}

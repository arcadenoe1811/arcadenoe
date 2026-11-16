import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  REFERENCIAS_MOVIMIENTO,
  TIPOS_MOVIMIENTO,
  filtrarConos,
  formatearConos,
  formatearMoneda,
  hoyISO,
  leerDecimal,
  normalizarError,
  registrarMovimiento,
} from '@inventario/shared'
import { usePiezasSalida } from '../../hooks/useConos.js'
import { soloEnteros } from '../../utils/soloEnteros.js'
import MuestraCono from './MuestraCono.jsx'
import CampoSugerencias from '../ui/CampoSugerencias.jsx'

/** @typedef {import('@inventario/shared').Cono} Cono */
/** @typedef {'entrada'|'salida'|'ajuste'} TipoMovimiento */

/** Campo simple con etiqueta y error. */
function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className={`campo${error ? ' campo-con-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? (
        <small className="campo-error">{error}</small>
      ) : (
        ayuda && <small className="campo-ayuda">{ayuda}</small>
      )}
    </div>
  )
}

/** Cantidad con botones grandes de - y +. */
function SelectorCantidad({ id, valor, alCambiar, error, etiqueta, maximo }) {
  const n = Number(valor || 0)
  return (
    <div className={`campo selector-cantidad${error ? ' campo-con-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="selector-cantidad-controles">
        <button
          type="button"
          className="boton boton-secundario boton-cantidad"
          aria-label="Uno menos"
          disabled={n <= 0}
          onClick={() => alCambiar(String(Math.max(0, n - 1)))}
        >
          −
        </button>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          value={valor}
          aria-invalid={error ? true : undefined}
          onChange={(e) => alCambiar(soloEnteros(e.target.value, 5))}
        />
        <button
          type="button"
          className="boton boton-secundario boton-cantidad"
          aria-label="Uno más"
          disabled={maximo !== undefined && n >= maximo}
          onClick={() => alCambiar(String(n + 1))}
        >
          +
        </button>
      </div>
      {error && <small className="campo-error">{error}</small>}
    </div>
  )
}

/** Pieza producida (solo salidas). Se monta solo en salidas para no cargar piezas de mas. */
function CampoPieza({ id, valor, alCambiar }) {
  const { piezas } = usePiezasSalida()
  const [texto, setTexto] = useState('')
  const elegida = piezas.find((p) => p.id === valor)

  return (
    <Campo
      id={id}
      etiqueta="Pieza producida (opcional)"
      ayuda={
        elegida
          ? `${elegida.pieza === 'puno' ? 'Puño' : 'Cuello'} ${elegida.codigo}${elegida.nombre ? ` · ${elegida.nombre}` : ''}`
          : 'Código del cuello o puño'
      }
    >
      <CampoSugerencias
        id={id}
        placeholder="Ej: maz4t5"
        valor={elegida && !texto ? elegida.codigo : texto}
        alCambiar={(escrito) => {
          setTexto(escrito)
          const exacta = piezas.find(
            (p) => p.codigo.toLowerCase() === escrito.trim().toLowerCase(),
          )
          alCambiar(exacta?.id ?? '')
        }}
        sugerencias={piezas.map((p) => ({
          valor: p.codigo,
          descripcion: `${p.pieza === 'puno' ? 'Puño' : 'Cuello'}${p.nombre ? ` · ${p.nombre}` : ''}`,
        }))}
        vacio="Ninguna pieza con ese código."
      />
    </Campo>
  )
}

/** Buscador de conos: queda fijo arriba mientras la lista hace scroll. */
function BuscadorCono({ termino, alCambiar, idLista }) {
  return (
    <div className="campo">
      <label htmlFor="selector-cono-busqueda">¿Qué cono?</label>
      <input
        id="selector-cono-busqueda"
        type="search"
        autoFocus
        autoComplete="off"
        placeholder="Color, número o código…"
        aria-controls={idLista}
        value={termino}
        onChange={(e) => alCambiar(e.target.value)}
      />
    </div>
  )
}

/** Lista de conos con botones grandes (dentro del cuerpo con scroll). */
function ListaConos({ id, conos, alElegir }) {
  if (conos.length === 0) return <p className="texto-suave">Ningún cono coincide.</p>
  return (
    <ul id={id} className="selector-cono-lista" aria-label={`${conos.length} conos`}>
      {conos.map((c) => (
        <li key={c.id}>
          <button type="button" className="opcion-cono" onClick={() => alElegir(c)}>
            <MuestraCono hex={c.hex} texto={c.codigo_color} tamano="sm" />
            <span className="opcion-cono-texto">
              <strong>{c.nombre_color}</strong>
              <span className="texto-suave texto-pequeno">
                {c.codigo} · {[c.material, c.titulo_hilo].filter(Boolean).join(' ')}
              </span>
            </span>
            <span className="opcion-cono-stock">{formatearConos(c.stock_actual)}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * Zona con scroll propio. Muestra un degradado y un aviso abajo mientras
 * quede contenido por ver.
 */
function CuerpoConScroll({ className = '', children }) {
  const ref = useRef(/** @type {HTMLDivElement|null} */ (null))
  const [masAbajo, setMasAbajo] = useState(false)

  const medir = () => {
    const el = ref.current
    if (!el) return
    setMasAbajo(el.scrollHeight - el.scrollTop - el.clientHeight > 4)
  }
  // Se vuelve a medir en cada render: cambia al filtrar o al cambiar de pestaña.
  useLayoutEffect(medir)
  useEffect(() => {
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  return (
    <div className={`modal-cuerpo-envoltura${masAbajo ? ' hay-mas' : ''}`}>
      <div ref={ref} className={`modal-cuerpo ${className}`} onScroll={medir}>
        {children}
      </div>
      <span className="modal-cuerpo-mas" aria-hidden="true">
        Más abajo ↓
      </span>
    </div>
  )
}

/**
 * Registrar entrada, salida o ajuste de stock.
 * Si no se pasa `cono`, primero se elige de la lista `conos`.
 * @param {{
 *   tipoInicial?: TipoMovimiento,
 *   cono?: Cono|null,
 *   conos?: Cono[],
 *   alCerrar: () => void,
 *   alRegistrar: (resumen: string) => void,
 * }} props
 */
export default function ModalMovimiento({
  tipoInicial = 'entrada',
  cono: conoFijo = null,
  conos = [],
  alCerrar,
  alRegistrar,
}) {
  const refDialogo = useRef(/** @type {HTMLDialogElement|null} */ (null))
  const id = useId()
  const [tipo, setTipo] = useState(/** @type {TipoMovimiento} */ (tipoInicial))
  const [cono, setCono] = useState(conoFijo)
  const [formulario, setFormulario] = useState({
    cantidad: '1',
    conteo: '',
    fecha: hoyISO(),
    referencia: '',
    costo_unitario: '',
    modo_costo: 'cono',
    pieza_id: '',
    notas: '',
  })
  const [errores, setErrores] = useState(/** @type {Record<string, string>} */ ({}))
  const [errorGeneral, setErrorGeneral] = useState(/** @type {string|null} */ (null))
  const [guardando, setGuardando] = useState(false)
  const [termino, setTermino] = useState('')

  useEffect(() => {
    const dialogo = refDialogo.current
    if (dialogo && !dialogo.open) dialogo.showModal()
    return () => dialogo?.close()
  }, [])

  const cambiar = (nombre, valor) => {
    setFormulario((previo) => ({ ...previo, [nombre]: valor }))
    setErrores((previos) => ({ ...previos, [nombre]: undefined }))
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    evento.stopPropagation()
    if (!cono) return
    setGuardando(true)
    setErrorGeneral(null)
    try {
      const mov = await registrarMovimiento(
        {
          ...formulario,
          // La entrada lleva el proveedor del cono.
          proveedor: tipo === 'entrada' ? (cono.proveedor ?? '') : '',
          tipo,
          cono_id: cono.id,
        },
        cono.stock_actual,
      )
      const cambio =
        tipo === 'ajuste'
          ? `Stock ajustado a ${formatearConos(mov.stock_resultante)}`
          : `${TIPOS_MOVIMIENTO[tipo].etiqueta} de ${formatearConos(mov.cantidad)} registrada`
      alRegistrar(
        `${cambio} · ${cono.nombre_color} (${cono.codigo}). Quedan ${formatearConos(mov.stock_resultante)}.`,
      )
    } catch (e) {
      const normalizado = normalizarError(e)
      setErrores(normalizado.errores ?? {})
      // Los errores de un campo ya se muestran debajo de el.
      const deCampo = normalizado.codigo === 'validacion' || normalizado.campo
      setErrorGeneral(deCampo ? null : normalizado.mensaje)
      setGuardando(false)
    }
  }

  // Equivalencia cuando se escribe por docena + ultimo costo registrado.
  const costoEscrito = leerDecimal(formulario.costo_unitario)
  const ayudaCosto =
    [
      formulario.modo_costo === 'docena' && costoEscrito
        ? `= ${formatearMoneda(costoEscrito / 12)} por cono`
        : null,
      cono?.costo_por_cono !== null && cono?.costo_por_cono !== undefined
        ? `Último: ${formatearMoneda(cono.costo_por_cono)} por cono`
        : null,
    ]
      .filter(Boolean)
      .join(' · ') || undefined

  const cambiarTipo = (nuevo) => {
    setTipo(nuevo)
    setErrores({})
    setErrorGeneral(null)
    if (nuevo !== tipo) cambiar('referencia', '')
  }

  return createPortal(
    <dialog
      ref={refDialogo}
      className="modal modal-movimiento"
      aria-labelledby={`${id}-titulo`}
      onCancel={(evento) => {
        evento.preventDefault()
        alCerrar()
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar()
      }}
    >
      <form className="modal-caja" onSubmit={enviar} noValidate>
        <div className="modal-cabecera">
          <h2 id={`${id}-titulo`} className="modal-titulo">
            {TIPOS_MOVIMIENTO[tipo].verbo}
          </h2>

          <div
            className="pestanas-movimiento"
            role="group"
            aria-label="Tipo de movimiento"
          >
            {Object.entries(TIPOS_MOVIMIENTO).map(([valor, { etiqueta }]) => (
              <button
                key={valor}
                type="button"
                className={`pestana-movimiento pestana-${valor}`}
                aria-pressed={tipo === valor}
                onClick={() => cambiarTipo(/** @type {TipoMovimiento} */ (valor))}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          {!cono && (
            <BuscadorCono
              termino={termino}
              alCambiar={setTermino}
              idLista={`${id}-lista-conos`}
            />
          )}
        </div>

        {!cono ? (
          <CuerpoConScroll className="modal-cuerpo-lista">
            <ListaConos
              id={`${id}-lista-conos`}
              conos={filtrarConos(
                conos.filter((c) => c.activo),
                { termino },
              )}
              alElegir={setCono}
            />
          </CuerpoConScroll>
        ) : (
          <CuerpoConScroll>
            <div className="cono-elegido">
              <MuestraCono hex={cono.hex} texto={cono.codigo_color} />
              <div className="cono-elegido-texto">
                <strong>{cono.nombre_color}</strong>
                <span className="texto-suave texto-pequeno">
                  {cono.codigo} ·{' '}
                  {[cono.material, cono.titulo_hilo].filter(Boolean).join(' ')}
                </span>
                <span>
                  En stock: <strong>{formatearConos(cono.stock_actual)}</strong>
                </span>
              </div>
              {!conoFijo && (
                <button
                  type="button"
                  className="boton boton-fantasma"
                  onClick={() => setCono(null)}
                >
                  Cambiar
                </button>
              )}
            </div>

            {tipo === 'ajuste' ? (
              <SelectorCantidad
                id={`${id}-conteo`}
                etiqueta="¿Cuántos conos hay realmente?"
                valor={formulario.conteo}
                alCambiar={(v) => cambiar('conteo', v)}
                error={errores.conteo}
              />
            ) : (
              <SelectorCantidad
                id={`${id}-cantidad`}
                etiqueta={tipo === 'entrada' ? 'Conos que entran' : 'Conos que salen'}
                valor={formulario.cantidad}
                alCambiar={(v) => cambiar('cantidad', v)}
                error={errores.cantidad}
                maximo={tipo === 'salida' ? cono.stock_actual : undefined}
              />
            )}

            <div className="campos campos-movimiento">
              <Campo id={`${id}-fecha`} etiqueta="Fecha" error={errores.fecha}>
                <input
                  id={`${id}-fecha`}
                  type="date"
                  value={formulario.fecha}
                  max={hoyISO()}
                  onChange={(e) => cambiar('fecha', e.target.value)}
                />
              </Campo>
              <Campo
                id={`${id}-referencia`}
                etiqueta={
                  tipo === 'entrada' ? 'Referencia (factura, orden…)' : 'Motivo / orden'
                }
                error={errores.referencia}
              >
                <CampoSugerencias
                  id={`${id}-referencia`}
                  valor={formulario.referencia}
                  alCambiar={(v) => cambiar('referencia', v)}
                  sugerencias={REFERENCIAS_MOVIMIENTO[tipo]}
                  invalido={Boolean(errores.referencia)}
                />
              </Campo>

              {tipo === 'entrada' && (
                <>
                  <Campo
                    id={`${id}-costo`}
                    etiqueta="Costo"
                    error={errores.costo_unitario}
                    ayuda={ayudaCosto}
                  >
                    <div className="entrada-con-unidad">
                      <input
                        id={`${id}-costo`}
                        inputMode="decimal"
                        autoComplete="off"
                        value={formulario.costo_unitario}
                        onChange={(e) => cambiar('costo_unitario', e.target.value)}
                      />
                      <select
                        aria-label="El costo es"
                        value={formulario.modo_costo}
                        onChange={(e) => cambiar('modo_costo', e.target.value)}
                      >
                        <option value="cono">por cono</option>
                        <option value="docena">por docena</option>
                      </select>
                    </div>
                  </Campo>
                </>
              )}

              {tipo === 'salida' && (
                <CampoPieza
                  id={`${id}-pieza`}
                  valor={formulario.pieza_id}
                  alCambiar={(v) => cambiar('pieza_id', v)}
                />
              )}

              <div className="campo-area_texto">
                <Campo
                  id={`${id}-notas`}
                  etiqueta="Notas (opcional)"
                  error={errores.notas}
                >
                  <textarea
                    id={`${id}-notas`}
                    rows={2}
                    value={formulario.notas}
                    onChange={(e) => cambiar('notas', e.target.value)}
                  />
                </Campo>
              </div>
            </div>
            {errorGeneral && (
              <div className="aviso aviso-error" role="alert">
                {errorGeneral}
              </div>
            )}
          </CuerpoConScroll>
        )}

        <div className="modal-acciones">
          <button
            type="button"
            className="boton boton-secundario boton-lg"
            onClick={alCerrar}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`boton boton-lg boton-movimiento boton-${tipo}`}
            disabled={!cono || guardando}
          >
            {guardando ? 'Guardando…' : TIPOS_MOVIMIENTO[tipo].verbo}
          </button>
        </div>
      </form>
    </dialog>,
    document.body,
  )
}

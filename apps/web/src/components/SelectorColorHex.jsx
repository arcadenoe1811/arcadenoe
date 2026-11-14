import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { guardarColor, normalizarError } from '@inventario/shared'
import { useCatalogoColores } from '../hooks/useCatalogoColores.js'
import './SelectorColorHex.css'

const PATRON_HEX = /^#?[0-9a-f]{6}$/i

/** "#ABC123" o "abc123" -> "#abc123"; null si no es un hex de 6 digitos. */
export function leerHex(texto) {
  const limpio = String(texto ?? '').trim()
  if (!PATRON_HEX.test(limpio)) return null
  return `#${limpio.replace('#', '').toLowerCase()}`
}

/** #rrggbb -> { h: 0..360, s: 0..100, l: 0..100 } */
export function hexAHsl(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255
  const g = ((n >> 8) & 255) / 255
  const b = (n & 255) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0)
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

/** { h, s, l } -> #rrggbb */
export function hslAHex({ h, s, l }) {
  const sat = s / 100
  const lum = l / 100
  const k = (n) => (n + h / 30) % 12
  const a = sat * Math.min(lum, 1 - lum)
  const canal = (n) => {
    const v = lum - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
    return Math.round(v * 255)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${canal(0)}${canal(8)}${canal(4)}`
}

const limitar = (n, min, max) => Math.min(max, Math.max(min, n))

/** Arrastre con puntero: llama a `alMover(x, y)` en 0..1 dentro del elemento. */
function usarArrastre(alMover) {
  const leer = (evento) => {
    const r = evento.currentTarget.getBoundingClientRect()
    alMover(
      limitar((evento.clientX - r.left) / r.width, 0, 1),
      limitar((evento.clientY - r.top) / r.height, 0, 1),
    )
  }
  return {
    onPointerDown: (evento) => {
      evento.currentTarget.setPointerCapture?.(evento.pointerId)
      leer(evento)
    },
    onPointerMove: (evento) => {
      if (evento.currentTarget.hasPointerCapture?.(evento.pointerId)) leer(evento)
    },
  }
}

/**
 * Dialogo "Colores": espectro (matiz x saturacion), barra de luminosidad,
 * campo hexadecimal y comparacion Nuevo / Actual.
 */
function DialogoColor({ valor, actual, titulo, alAceptar, alCancelar, conCatalogo }) {
  const id = useId()
  const refHex = useRef(/** @type {HTMLInputElement|null} */ (null))
  // Se guarda HSL (no hex) para no perder el matiz al llegar a blanco/negro.
  const [hsl, setHsl] = useState(() => hexAHsl(valor))
  // El hex exacto elegido (lo escrito se respeta tal cual, sin redondeos).
  const [nuevo, setNuevo] = useState(valor)
  const [textoHex, setTextoHex] = useState(valor)

  const cambiarHsl = (cambios) => {
    const siguiente = { ...hsl, ...cambios }
    const hex = hslAHex(siguiente)
    setHsl(siguiente)
    setNuevo(hex)
    setTextoHex(hex)
  }
  const cambiarTexto = (texto) => {
    setTextoHex(texto)
    const hex = leerHex(texto)
    if (hex) {
      setHsl(hexAHsl(hex))
      setNuevo(hex)
    }
  }

  // Cuentagotas: escanea un color de la pantalla (Chrome / Edge).
  // En dos pasos: primero se oculta el dialogo para poder desplazarse por
  // la pagina hasta lo que se quiere escanear; luego "Tomar color" abre el
  // cuentagotas. Al terminar (o cancelar) vuelve el dialogo.
  const hayCuentagotas = typeof window !== 'undefined' && 'EyeDropper' in window
  const [escaneando, setEscaneando] = useState(false)
  const tomarColor = async () => {
    try {
      // @ts-ignore EyeDropper aun no esta en los tipos del DOM
      const { sRGBHex } = await new window.EyeDropper().open()
      cambiarTexto(sRGBHex)
      setEscaneando(false)
    } catch {
      // el usuario cancelo con Escape: sigue en modo escaneo
    }
  }

  // Colores guardados (catalogo) y alta rapida del color elegido.
  const { colores: catalogo, recargar } = useCatalogoColores()
  const guardados = conCatalogo ? catalogo.filter((c) => leerHex(c.hex)) : []
  const [nombreNuevo, setNombreNuevo] = useState(/** @type {string|null} */ (null))
  const [estadoGuardado, setEstadoGuardado] = useState({ guardando: false, mensaje: '' })
  const yaGuardado = guardados.find((c) => leerHex(c.hex) === nuevo)

  const guardarEnCatalogo = async () => {
    setEstadoGuardado({ guardando: true, mensaje: '' })
    try {
      await guardarColor({ nombre: nombreNuevo ?? '', hex: nuevo })
      setNombreNuevo(null)
      setEstadoGuardado({ guardando: false, mensaje: 'Color guardado.' })
      recargar()
    } catch (e) {
      const error = normalizarError(e)
      setEstadoGuardado({
        guardando: false,
        mensaje: error.errores?.nombre ?? error.errores?.hex ?? error.mensaje,
      })
    }
  }

  // Al abrir: foco en el campo hex con el texto seleccionado.
  useEffect(() => {
    refHex.current?.select()
  }, [])

  const espectro = usarArrastre((x, y) =>
    cambiarHsl({
      h: x * 360,
      s: (1 - y) * 100,
      l: hsl.l === 0 || hsl.l === 100 ? 50 : hsl.l,
    }),
  )
  const barra = usarArrastre((_, y) => cambiarHsl({ l: (1 - y) * 100 }))

  const teclasEspectro = (evento) => {
    const paso = evento.shiftKey ? 10 : 1
    const mapa = {
      ArrowLeft: { h: limitar(hsl.h - paso, 0, 360) },
      ArrowRight: { h: limitar(hsl.h + paso, 0, 360) },
      ArrowUp: { s: limitar(hsl.s + paso, 0, 100) },
      ArrowDown: { s: limitar(hsl.s - paso, 0, 100) },
    }
    if (mapa[evento.key]) {
      evento.preventDefault()
      cambiarHsl(mapa[evento.key])
    }
  }
  const teclasBarra = (evento) => {
    const paso = evento.shiftKey ? 10 : 1
    const delta = { ArrowUp: paso, ArrowRight: paso, ArrowDown: -paso, ArrowLeft: -paso }[
      evento.key
    ]
    if (delta) {
      evento.preventDefault()
      cambiarHsl({ l: limitar(hsl.l + delta, 0, 100) })
    }
  }

  const hexValido = Boolean(leerHex(textoHex))

  if (escaneando) {
    return createPortal(
      <div className="barra-escaneo" role="region" aria-label="Escanear color">
        <span className="barra-escaneo-texto">
          Desplázate hasta el color que quieres y pulsa <strong>Tomar color</strong>.
        </span>
        <span
          className="barra-escaneo-muestra"
          style={{ background: nuevo }}
          title={nuevo}
          aria-hidden="true"
        />
        <button
          type="button"
          className="boton boton-primario boton-sm boton-compacto"
          onClick={tomarColor}
        >
          Tomar color
        </button>
        <button
          type="button"
          className="boton boton-secundario boton-sm"
          onClick={() => setEscaneando(false)}
        >
          Volver
        </button>
      </div>,
      document.body,
    )
  }

  return createPortal(
    <div className="dialogo-color-fondo" onMouseDown={alCancelar}>
      <div
        className="dialogo-color"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-titulo`}
        onMouseDown={(evento) => evento.stopPropagation()}
        onKeyDown={(evento) => {
          if (evento.key === 'Escape') {
            evento.stopPropagation()
            alCancelar()
          }
        }}
      >
        <div className="dialogo-color-barra-titulo">
          <span id={`${id}-titulo`}>Colores · {titulo}</span>
          <button
            type="button"
            className="dialogo-color-cerrar"
            onClick={alCancelar}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="dialogo-color-cuerpo">
          <div className="dialogo-color-izquierda">
            <span className="dialogo-color-rotulo">Colores:</span>
            <div className="dialogo-color-selectores">
              <div
                className="dialogo-color-espectro"
                role="slider"
                tabIndex={0}
                aria-label="Matiz y saturación"
                aria-valuemin={0}
                aria-valuemax={360}
                aria-valuenow={Math.round(hsl.h)}
                aria-valuetext={`Matiz ${Math.round(hsl.h)}°, saturación ${Math.round(hsl.s)}%`}
                onKeyDown={teclasEspectro}
                {...espectro}
              >
                <span
                  className="dialogo-color-cruz"
                  style={{ left: `${(hsl.h / 360) * 100}%`, top: `${100 - hsl.s}%` }}
                />
              </div>
              <div
                className="dialogo-color-luminosidad"
                role="slider"
                tabIndex={0}
                aria-label="Luminosidad"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(hsl.l)}
                onKeyDown={teclasBarra}
                style={{
                  background: `linear-gradient(to bottom, #fff, hsl(${hsl.h} ${hsl.s}% 50%), #000)`,
                }}
                {...barra}
              >
                <span
                  className="dialogo-color-flecha"
                  style={{ top: `${100 - hsl.l}%` }}
                />
              </div>
            </div>

            <div className="dialogo-color-campos">
              <span>Modelo de color:</span>
              <span className="dialogo-color-modelo">Hexadecimal</span>
              <label htmlFor={`${id}-hex`}>Hex:</label>
              <input
                ref={refHex}
                id={`${id}-hex`}
                type="text"
                value={textoHex}
                maxLength={7}
                spellCheck={false}
                autoComplete="off"
                aria-invalid={!hexValido}
                onChange={(evento) => cambiarTexto(evento.target.value)}
                onKeyDown={(evento) => {
                  if (evento.key === 'Enter') {
                    evento.preventDefault()
                    if (hexValido) alAceptar(nuevo)
                  }
                }}
              />
            </div>
            {hayCuentagotas && (
              <button
                type="button"
                className="boton boton-contorno boton-sm dialogo-color-cuentagotas"
                onClick={() => setEscaneando(true)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M19.4 4.6a2 2 0 0 0-2.8 0l-2.7 2.7-1-1-1.4 1.4 1 1L5 16.2V19h2.8l7.5-7.5 1 1 1.4-1.4-1-1 2.7-2.7a2 2 0 0 0 0-2.8Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                  />
                </svg>
                Escanear color
              </button>
            )}
          </div>

          <div className="dialogo-color-derecha">
            <div className="dialogo-color-botones">
              <button
                type="button"
                className="boton boton-primario boton-sm"
                onClick={() => alAceptar(nuevo)}
              >
                Aceptar
              </button>
              <button
                type="button"
                className="boton boton-secundario boton-sm"
                onClick={alCancelar}
              >
                Cancelar
              </button>
            </div>
            <div className="dialogo-color-comparar">
              <span>Nuevo</span>
              <span className="dialogo-color-muestras">
                <span style={{ background: nuevo }} title={nuevo} />
                <span
                  className={actual ? undefined : 'sin-color'}
                  style={actual ? { background: actual } : undefined}
                  title={actual || 'Sin color'}
                />
              </span>
              <span>Actual</span>
            </div>
          </div>
        </div>

        {conCatalogo && (
          <div className="dialogo-color-guardados">
            <span className="dialogo-color-rotulo">Colores guardados:</span>
            {guardados.length > 0 ? (
              <div className="dialogo-color-paleta">
                {guardados.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={leerHex(c.hex) === nuevo ? 'activo' : undefined}
                    style={{ background: c.hex }}
                    title={`${c.nombre} (${c.hex})`}
                    aria-label={`${c.nombre} ${c.hex}`}
                    onClick={() => cambiarTexto(c.hex)}
                  />
                ))}
              </div>
            ) : (
              <span className="texto-suave">Aún no hay colores guardados.</span>
            )}

            {nombreNuevo === null ? (
              <button
                type="button"
                className="boton boton-secundario boton-sm"
                disabled={!hexValido || Boolean(yaGuardado)}
                onClick={() => {
                  setNombreNuevo('')
                  setEstadoGuardado({ guardando: false, mensaje: '' })
                }}
              >
                {yaGuardado
                  ? `Guardado como "${yaGuardado.nombre}"`
                  : `Guardar color ${nuevo}`}
              </button>
            ) : (
              <div className="dialogo-color-nombre">
                <input
                  type="text"
                  value={nombreNuevo}
                  placeholder="Nombre, ej. dorado"
                  aria-label="Nombre del color"
                  autoFocus
                  maxLength={60}
                  onChange={(evento) => setNombreNuevo(evento.target.value)}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter') {
                      evento.preventDefault()
                      guardarEnCatalogo()
                    }
                  }}
                />
                <button
                  type="button"
                  className="boton boton-primario boton-sm"
                  disabled={estadoGuardado.guardando || !nombreNuevo.trim()}
                  onClick={guardarEnCatalogo}
                >
                  Guardar
                </button>
                <button
                  type="button"
                  className="boton boton-fantasma boton-sm"
                  aria-label="Cancelar guardado"
                  onClick={() => setNombreNuevo(null)}
                >
                  ×
                </button>
              </div>
            )}
            {estadoGuardado.mensaje && (
              <small className="texto-suave" role="status">
                {estadoGuardado.mensaje}
              </small>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/**
 * Muestra de color con su codigo hex; al hacer clic abre el dialogo
 * "Colores". El cambio solo se aplica con "Aceptar".
 * - valor puede ser '' (sin color): la muestra se ve rayada.
 * - conCatalogo: muestra "Colores guardados" y el boton para guardar.
 * @param {{
 *   valor: string,
 *   etiqueta: string,
 *   alCambiar: (hex: string) => void,
 *   mostrarHex?: boolean,
 *   conCatalogo?: boolean,
 *   porDefecto?: string,
 * }} props
 */
export default function SelectorColorHex({
  valor,
  etiqueta,
  alCambiar,
  mostrarHex = true,
  conCatalogo = true,
  porDefecto = '#cccccc',
}) {
  const [abierto, setAbierto] = useState(false)
  const refBoton = useRef(/** @type {HTMLButtonElement|null} */ (null))
  const hex = leerHex(valor)

  const cerrar = () => {
    setAbierto(false)
    refBoton.current?.focus()
  }

  return (
    <span className="selector-color-hex">
      <button
        ref={refBoton}
        type="button"
        className={`muestra-hex${hex ? '' : ' sin-color'}`}
        style={hex ? { background: hex } : undefined}
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        title={`${etiqueta}: ${hex ?? 'sin color'}`}
      >
        <span className="solo-lector">
          {etiqueta}: {hex ?? 'sin color'}
        </span>
      </button>
      {mostrarHex && (
        <code className="codigo-hex" aria-hidden="true">
          {hex ?? '—'}
        </code>
      )}
      {abierto && (
        <DialogoColor
          valor={hex ?? porDefecto}
          actual={hex}
          titulo={etiqueta}
          conCatalogo={conCatalogo}
          alCancelar={cerrar}
          alAceptar={(nuevo) => {
            if (nuevo !== hex) alCambiar(nuevo)
            cerrar()
          }}
        />
      )}
    </span>
  )
}

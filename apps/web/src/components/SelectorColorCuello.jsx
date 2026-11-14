import { useEffect, useId, useRef, useState } from 'react'
import './SelectorColorCuello.css'

/**
 * @typedef {{ hex: string, nombre: string, detalle?: string }} OpcionColorCuello
 */

/**
 * Selector de color limitado a los colores del cuello ("Colores por zona").
 * Si el valor actual no esta en la lista (diseno antiguo o color cambiado),
 * se marca como "fuera de Colores por zona" para que se corrija.
 * @param {{
 *   valor: string,
 *   opciones: OpcionColorCuello[],
 *   etiqueta: string,
 *   alCambiar: (hex: string) => void,
 * }} props
 */
export default function SelectorColorCuello({ valor, opciones, etiqueta, alCambiar }) {
  const id = useId()
  const [abierto, setAbierto] = useState(false)
  const refRaiz = useRef(/** @type {HTMLSpanElement|null} */ (null))
  const refBoton = useRef(/** @type {HTMLButtonElement|null} */ (null))
  const actual = opciones.find((o) => o.hex.toLowerCase() === valor?.toLowerCase())

  // Cierra al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return undefined
    const alPulsar = (evento) => {
      if (!refRaiz.current?.contains(evento.target)) setAbierto(false)
    }
    document.addEventListener('mousedown', alPulsar)
    return () => document.removeEventListener('mousedown', alPulsar)
  }, [abierto])

  const cerrar = () => {
    setAbierto(false)
    refBoton.current?.focus()
  }

  return (
    <span
      ref={refRaiz}
      className="selector-color-cuello"
      onKeyDown={(evento) => {
        if (evento.key === 'Escape' && abierto) {
          evento.stopPropagation()
          cerrar()
        }
      }}
    >
      <button
        ref={refBoton}
        type="button"
        className={`selector-color-cuello-boton${actual ? '' : ' fuera-de-lista'}`}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        title={`${etiqueta}: ${actual?.nombre ?? 'fuera de Colores por zona'}`}
        onClick={() => setAbierto((a) => !a)}
      >
        <span
          className="selector-color-cuello-muestra"
          style={{ background: valor }}
          aria-hidden="true"
        />
        <span className="selector-color-cuello-nombre">
          <span className="solo-lector">{etiqueta}: </span>
          {actual?.nombre ?? 'Fuera de la lista'}
        </span>
        <span aria-hidden="true" className="selector-color-cuello-flecha">
          ▾
        </span>
      </button>

      {abierto && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-label={etiqueta}
          className="selector-color-cuello-lista"
        >
          {opciones.map((opcion, i) => {
            const elegido = opcion.hex.toLowerCase() === valor?.toLowerCase()
            return (
              <li key={opcion.hex} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={elegido}
                  className={elegido ? 'elegido' : undefined}
                  // Foco en la opcion elegida (o la primera) al abrir.
                  autoFocus={elegido || (!actual && i === 0)}
                  onClick={() => {
                    if (!elegido) alCambiar(opcion.hex)
                    cerrar()
                  }}
                >
                  <span
                    className="selector-color-cuello-muestra"
                    style={{ background: opcion.hex }}
                    aria-hidden="true"
                  />
                  <span className="selector-color-cuello-nombre">{opcion.nombre}</span>
                  {opcion.detalle && (
                    <span className="selector-color-cuello-detalle">
                      {opcion.detalle}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </span>
  )
}

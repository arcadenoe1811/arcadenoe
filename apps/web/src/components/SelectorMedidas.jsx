import { useId, useState } from 'react'
import { MEDIDAS_COMUNES } from '@inventario/shared'
import { soloEnteros } from '../utils/soloEnteros.js'

/**
 * Medidas como casillas (12–20) mas un campo para agregar otra suelta.
 * El valor es un arreglo de numeros.
 * @param {{
 *   descriptor: import('@inventario/shared').DescriptorCampo,
 *   valor: number[],
 *   error?: string,
 *   alCambiar: (nombre: string, valor: number[]) => void,
 * }} props
 */
export default function SelectorMedidas({ descriptor, valor, error, alCambiar }) {
  const id = useId()
  const { nombre, etiqueta, minimo = 1, maximo = 99 } = descriptor
  const seleccionadas = valor ?? []
  const [otra, setOtra] = useState('')
  const [errorOtra, setErrorOtra] = useState(/** @type {string|null} */ (null))

  // Las comunes siempre se muestran; las extra solo si estan elegidas.
  const visibles = [...new Set([...MEDIDAS_COMUNES, ...seleccionadas])].sort(
    (a, b) => a - b,
  )

  const fijar = (medidas) =>
    alCambiar(
      nombre,
      [...new Set(medidas)].sort((a, b) => a - b),
    )

  const alternar = (medida, marcada) =>
    fijar(
      marcada ? [...seleccionadas, medida] : seleccionadas.filter((m) => m !== medida),
    )

  const agregarOtra = () => {
    const texto = otra.trim()
    if (!texto) return
    const numero = Number(texto)
    if (!/^\d+$/.test(texto) || numero < minimo || numero > maximo) {
      setErrorOtra(`Usa un entero entre ${minimo} y ${maximo}.`)
      return
    }
    setErrorOtra(null)
    setOtra('')
    fijar([...seleccionadas, numero])
  }

  const todasComunes = MEDIDAS_COMUNES.every((m) => seleccionadas.includes(m))
  const rangoComunes = `${Math.min(...MEDIDAS_COMUNES)}–${Math.max(...MEDIDAS_COMUNES)}`
  const mensajeError = errorOtra ?? error

  return (
    <div
      className={`campo campo-medidas${mensajeError ? ' campo-con-error' : ''}`}
      role="group"
      aria-labelledby={`${id}-titulo`}
    >
      <div className="medidas-encabezado">
        <span id={`${id}-titulo`} className="campo-titulo">
          {etiqueta}
        </span>
        <span className="medidas-contador" aria-live="polite">
          {seleccionadas.length === 0
            ? 'Ninguna marcada'
            : `${seleccionadas.length} ${seleccionadas.length === 1 ? 'marcada' : 'marcadas'}`}
        </span>
      </div>
      <small className="campo-ayuda">Toca cada medida que le queda a este cuello.</small>

      <div className="medidas-opciones">
        {visibles.map((medida) => (
          <label key={medida} className="medida-chip">
            <input
              type="checkbox"
              checked={seleccionadas.includes(medida)}
              onChange={(evento) => alternar(medida, evento.target.checked)}
            />
            <span>{medida}</span>
          </label>
        ))}
      </div>

      <div className="medidas-acciones">
        <button
          type="button"
          className="boton boton-contorno boton-sm"
          aria-pressed={todasComunes}
          onClick={() =>
            fijar(
              todasComunes
                ? seleccionadas.filter((m) => !MEDIDAS_COMUNES.includes(m))
                : [...seleccionadas, ...MEDIDAS_COMUNES],
            )
          }
        >
          <span aria-hidden="true">{todasComunes ? '✕' : '✓'}</span>
          {todasComunes
            ? `Desmarcar todas (${rangoComunes})`
            : `Marcar todas (${rangoComunes})`}
        </button>
        <div className="medidas-otra">
          <label htmlFor={`${id}-otra`} className="medidas-otra-etiqueta">
            ¿Otra medida?
          </label>
          {/* type="text" + filtro: type="number" deja escribir "e", ".", "-"
              y la medida solo admite enteros. */}
          <input
            id={`${id}-otra`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={String(maximo).length}
            placeholder="Ej. 22"
            className={otra ? 'con-valor' : undefined}
            value={otra}
            onChange={(evento) => {
              setOtra(soloEnteros(evento.target.value, String(maximo).length))
              setErrorOtra(null)
            }}
            onKeyDown={(evento) => {
              // Enter agrega la medida en vez de enviar el formulario.
              if (evento.key === 'Enter') {
                evento.preventDefault()
                agregarOtra()
              }
            }}
          />
          <button
            type="button"
            // Verde (primario) en cuanto hay una medida lista para agregar.
            className={`boton boton-sm ${otra ? 'boton-primario boton-compacto' : 'boton-secundario'}`}
            onClick={agregarOtra}
            disabled={!otra}
          >
            Agregar
          </button>
        </div>
      </div>

      {mensajeError && <small className="campo-error">{mensajeError}</small>}
    </div>
  )
}

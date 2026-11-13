import { useId, useState } from 'react'
import { MEDIDAS_COMUNES } from '@inventario/shared'

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
  const mensajeError = errorOtra ?? error

  return (
    <div
      className={`campo campo-medidas${mensajeError ? ' campo-con-error' : ''}`}
      role="group"
      aria-labelledby={`${id}-titulo`}
    >
      <span id={`${id}-titulo`} className="campo-titulo">
        {etiqueta}
      </span>

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
          className="boton boton-fantasma boton-sm"
          onClick={() =>
            fijar(
              todasComunes
                ? seleccionadas.filter((m) => !MEDIDAS_COMUNES.includes(m))
                : [...seleccionadas, ...MEDIDAS_COMUNES],
            )
          }
        >
          {todasComunes ? 'Quitar 12–20' : 'Marcar 12–20'}
        </button>
        <div className="medidas-otra">
          <label htmlFor={`${id}-otra`} className="solo-lector">
            Otra medida
          </label>
          <input
            id={`${id}-otra`}
            type="number"
            inputMode="numeric"
            min={minimo}
            max={maximo}
            step="1"
            placeholder="Otra"
            value={otra}
            onChange={(evento) => setOtra(evento.target.value)}
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
            className="boton boton-secundario boton-sm"
            onClick={agregarOtra}
            disabled={!otra.trim()}
          >
            Agregar
          </button>
        </div>
      </div>

      {mensajeError && <small className="campo-error">{mensajeError}</small>}
    </div>
  )
}

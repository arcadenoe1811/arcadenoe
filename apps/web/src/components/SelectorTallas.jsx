import { useId } from 'react'
import { TALLAS_PUNO, etiquetaTalla } from '@inventario/shared'

/**
 * Tallas del puno como casillas (pp, pg, pee, pex), con la medida de
 * cuello a la que corresponden. El valor es un arreglo de tallas.
 * Usa los mismos estilos que SelectorMedidas.
 * @param {{
 *   descriptor: import('@inventario/shared').DescriptorCampo,
 *   valor: string[],
 *   error?: string,
 *   alCambiar: (nombre: string, valor: string[]) => void,
 * }} props
 */
export default function SelectorTallas({ descriptor, valor, error, alCambiar }) {
  const id = useId()
  const { nombre, etiqueta, ayuda } = descriptor
  const seleccionadas = valor ?? []

  const alternar = (talla, marcada) => {
    const nuevas = marcada
      ? [...seleccionadas, talla]
      : seleccionadas.filter((t) => t !== talla)
    // Siempre de menor a mayor.
    alCambiar(
      nombre,
      TALLAS_PUNO.map((t) => t.valor).filter((t) => nuevas.includes(t)),
    )
  }

  return (
    <div
      className={`campo campo-medidas${error ? ' campo-con-error' : ''}`}
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
      {ayuda && <small className="campo-ayuda">{ayuda}</small>}

      <div className="medidas-opciones">
        {TALLAS_PUNO.map(({ valor: talla }) => (
          <label key={talla} className="medida-chip" title={etiquetaTalla(talla)}>
            <input
              type="checkbox"
              checked={seleccionadas.includes(talla)}
              onChange={(evento) => alternar(talla, evento.target.checked)}
            />
            <span>{talla}</span>
          </label>
        ))}
      </div>

      {error && <small className="campo-error">{error}</small>}
    </div>
  )
}

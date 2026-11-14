import SelectorColorHex from './SelectorColorHex.jsx'

/**
 * Tono de un color: muestra con su codigo hex que abre el dialogo "Colores".
 * Sin tono se ve rayada. "quitar" deja el color sin tono.
 * @param {{ valor: string, error?: string, alCambiar: (hex: string) => void }} props
 */
export default function SelectorTono({ valor, error, alCambiar }) {
  return (
    <div className={`campo campo-tono${error ? ' campo-con-error' : ''}`}>
      <SelectorColorHex valor={valor ?? ''} etiqueta="Tono" alCambiar={alCambiar} />
      {valor && (
        <button
          type="button"
          className="boton-quitar-tono"
          onClick={() => alCambiar('')}
          aria-label="Quitar tono"
        >
          quitar
        </button>
      )}
      {error && <small className="campo-error">{error}</small>}
    </div>
  )
}

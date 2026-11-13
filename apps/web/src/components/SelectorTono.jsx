/**
 * Muestra del tono de un color; al hacer clic abre el selector del sistema.
 * Sin tono se ve rayada. "quitar" deja el color sin tono.
 * @param {{ valor: string, error?: string, alCambiar: (hex: string) => void }} props
 */
export default function SelectorTono({ valor, error, alCambiar }) {
  const hex = /^#[0-9a-f]{6}$/i.test(valor ?? '') ? valor : ''
  return (
    <div className={`campo campo-tono${error ? ' campo-con-error' : ''}`}>
      <label
        className={`selector-tono${hex ? '' : ' sin-tono'}`}
        style={hex ? { background: hex } : undefined}
        title={hex ? `Tono ${hex}` : 'Elegir tono'}
      >
        <span className="solo-lector">Tono</span>
        <input
          type="color"
          value={hex || '#cccccc'}
          onChange={(evento) => alCambiar(evento.target.value)}
        />
      </label>
      {hex && (
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

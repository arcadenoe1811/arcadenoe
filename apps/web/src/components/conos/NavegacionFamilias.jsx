import { FAMILIAS_COLOR } from '@inventario/shared'

/**
 * Lista vertical de familias de color (muestrario). En pantallas angostas
 * se muestra como una fila de chips con scroll horizontal.
 * @param {{
 *   conteos: Record<string, number>,
 *   total: number,
 *   activa: string,
 *   alElegir: (familia: string) => void,
 * }} props
 */
export default function NavegacionFamilias({ conteos, total, activa, alElegir }) {
  const opciones = [
    { valor: '', etiqueta: 'Todas', hex: null, cantidad: total },
    ...FAMILIAS_COLOR.map((f) => ({ ...f, cantidad: conteos[f.valor] ?? 0 })),
  ]
  return (
    <nav className="nav-familias" aria-label="Familias de color">
      <h2 className="nav-familias-titulo">Familias</h2>
      <ul>
        {opciones.map((op) => (
          <li key={op.valor || 'todas'}>
            <button
              type="button"
              className="nav-familia"
              aria-current={activa === op.valor ? 'true' : undefined}
              aria-label={`${op.etiqueta}: ${op.cantidad} ${op.cantidad === 1 ? 'tipo' : 'tipos'}`}
              disabled={op.cantidad === 0 && activa !== op.valor}
              onClick={() => alElegir(op.valor)}
            >
              {op.hex ? (
                <span className="chip-familia-muestra" style={{ background: op.hex }} />
              ) : (
                <span className="chip-familia-muestra chip-familia-todas" />
              )}
              <span className="nav-familia-nombre">{op.etiqueta}</span>
              <span className="nav-familia-cantidad">{op.cantidad}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

import { cambiarPareja, destinoColor } from '@inventario/shared'
import MuestraColor from './MuestraColor.jsx'

/**
 * Tabla "color del padre -> color de esta pieza". Por defecto va por
 * posicion (1->1, 2->2...); aqui se cambia cuando el hijo tiene menos
 * colores (dos del padre al mismo) o se quieren cruzar.
 * @param {{
 *   paletaPadre: { hex: string, nombre: string }[],
 *   paletaHijo: { hex: string, nombre: string }[],
 *   usados: number[],
 *   mapa: Record<string, number>,
 *   error?: string,
 *   alCambiar: (mapa: Record<string, number>) => void,
 * }} props
 */
export default function MapaColores({
  paletaPadre,
  paletaHijo,
  usados,
  mapa,
  error,
  alCambiar,
}) {
  if (!paletaPadre.length) return null
  const personalizado = Object.keys(mapa ?? {}).length > 0
  const extra = paletaHijo.length - paletaPadre.length

  return (
    <div className="mapa-colores">
      <div className="mapa-colores-cabecera">
        <span className="campo-titulo">Colores: padre → esta pieza</span>
        {personalizado && (
          <button
            type="button"
            className="boton boton-fantasma boton-sm"
            onClick={() => alCambiar({})}
          >
            Restablecer por posición
          </button>
        )}
      </div>
      <small className="campo-ayuda">
        El padre tiene {paletaPadre.length}{' '}
        {paletaPadre.length === 1 ? 'color' : 'colores'} y esta pieza {paletaHijo.length}.
        {extra > 0 &&
          ` Los ${extra} colores de más quedan libres: úsalos cambiando aquí abajo la línea, el fondo o las letras que quieras.`}
      </small>

      <ol className="mapa-colores-filas">
        {paletaPadre.map((color, i) => {
          const posicion = i + 1
          const usado = usados.includes(posicion)
          const destino = destinoColor(posicion, mapa, paletaHijo.length)
          const sinPareja = usado && destino === null
          return (
            <li
              key={posicion}
              className={`mapa-colores-fila${sinPareja ? ' mapa-colores-falta' : ''}`}
            >
              <span className="mapa-colores-origen">
                <MuestraColor hex={color.hex} />
                Color {posicion} · {color.nombre}
                {!usado && (
                  <span className="texto-suave texto-pequeno"> (no se usa)</span>
                )}
              </span>
              <span aria-hidden="true">→</span>
              <span className="mapa-colores-destino">
                <MuestraColor hex={destino ? paletaHijo[destino - 1].hex : null} />
                <select
                  value={destino ?? ''}
                  aria-label={`Color de esta pieza para el color ${posicion} del padre`}
                  onChange={(evento) =>
                    alCambiar(cambiarPareja(mapa, posicion, Number(evento.target.value)))
                  }
                >
                  {destino === null && <option value="">— Elige un color —</option>}
                  {paletaHijo.map((c, j) => (
                    <option key={c.hex} value={j + 1}>
                      Color {j + 1} · {c.nombre}
                    </option>
                  ))}
                </select>
              </span>
            </li>
          )
        })}
      </ol>

      {error && (
        <small className="campo-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}

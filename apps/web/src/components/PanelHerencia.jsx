import { Link } from 'react-router-dom'
import {
  CAMPOS_HEREDABLES,
  ETIQUETAS_HEREDABLES,
  formatearPieza,
} from '@inventario/shared'
import { rutaPieza } from '../utils/rutas.js'

/**
 * Resumen de la herencia de una pieza hija: de quien hereda, que campos
 * cambia respecto al padre (con "volver al del padre") y acciones.
 * @param {{
 *   padre: Record<string, any>|null,
 *   overrides: Record<string, any>,
 *   error?: string,
 *   alRestablecer: (campo: string) => void,
 *   alCambiarPadre: () => void,
 *   alDesvincular: () => void,
 * }} props
 */
export default function PanelHerencia({
  padre,
  overrides,
  error,
  alRestablecer,
  alCambiarPadre,
  alDesvincular,
}) {
  const cambiados = CAMPOS_HEREDABLES.filter((campo) => campo in (overrides ?? {}))

  return (
    <div className="panel-herencia">
      <p className="panel-herencia-titulo">
        Hereda el diseño de{' '}
        {padre ? (
          <Link to={rutaPieza(padre.pieza, padre.id)} target="_blank" rel="noreferrer">
            {formatearPieza(padre.pieza).toLowerCase()}{' '}
            <span className="codigo">{padre.codigo}</span>
            {padre.nombre ? ` (${padre.nombre})` : ''} ↗
          </Link>
        ) : (
          '…'
        )}
      </p>
      <p className="texto-pequeno texto-suave">
        Los colores se toman por posición: el color 1 del padre pasa a ser el color 1 de
        esta pieza, y así con todos. Si el padre cambia, esta pieza también cambia, menos
        en los campos que modifiques aquí.
      </p>

      {cambiados.length === 0 ? (
        <p className="texto-pequeno">Igual al padre en todo.</p>
      ) : (
        <div className="panel-herencia-cambios">
          <span className="texto-pequeno">Cambia respecto al padre:</span>
          <ul>
            {cambiados.map((campo) => (
              <li key={campo}>
                <span className="insignia-posicion">{ETIQUETAS_HEREDABLES[campo]}</span>
                <button
                  type="button"
                  className="disenador-boton-mini"
                  onClick={() => alRestablecer(campo)}
                  title="Volver al del padre"
                  aria-label={`Volver al del padre: ${ETIQUETAS_HEREDABLES[campo]}`}
                >
                  ↺
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <small className="campo-error" role="alert">
          {error}
        </small>
      )}

      <div className="panel-herencia-acciones">
        <button
          type="button"
          className="boton boton-contorno boton-sm"
          onClick={alCambiarPadre}
        >
          Cambiar padre
        </button>
        <button
          type="button"
          className="boton boton-contorno boton-sm"
          onClick={alDesvincular}
          title="Copia el diseño actual como propio y deja de seguir al padre"
        >
          Desvincular (copiar diseño)
        </button>
      </div>
    </div>
  )
}

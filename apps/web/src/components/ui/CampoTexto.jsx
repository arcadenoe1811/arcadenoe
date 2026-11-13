import { forwardRef, useId } from 'react'
import './CampoTexto.css'

/**
 * Entrada de texto con etiqueta encima, iconos opcionales y error debajo.
 * El resto de props (value, onChange, name, autoComplete...) va al <input>.
 *
 * @typedef {{
 *   etiqueta: string,
 *   tipo?: string,
 *   error?: string|null,
 *   icono_izquierdo?: import('react').ReactNode,
 *   icono_derecho?: import('react').ReactNode,
 *   placeholder?: string,
 *   id?: string,
 * } & import('react').InputHTMLAttributes<HTMLInputElement>} PropsCampoTexto
 */
const CampoTexto = forwardRef(
  /** @param {PropsCampoTexto} props */
  function CampoTexto(
    {
      etiqueta,
      tipo = 'text',
      error = null,
      icono_izquierdo,
      icono_derecho,
      placeholder,
      id,
      ...resto
    },
    ref,
  ) {
    const idGenerado = useId()
    const idCampo = id ?? idGenerado
    const idError = `${idCampo}-error`

    return (
      <div className={`campo-texto${error ? ' campo-texto-error' : ''}`}>
        <label htmlFor={idCampo} className="campo-texto-etiqueta">
          {etiqueta}
        </label>
        <div className="campo-texto-caja">
          {icono_izquierdo && (
            <span
              className="campo-texto-icono campo-texto-icono-izquierdo"
              aria-hidden="true"
            >
              {icono_izquierdo}
            </span>
          )}
          <input
            ref={ref}
            id={idCampo}
            type={tipo}
            placeholder={placeholder}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? idError : undefined}
            className={
              [
                icono_izquierdo && 'con-icono-izquierdo',
                icono_derecho && 'con-icono-derecho',
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
            {...resto}
          />
          {icono_derecho && (
            <span className="campo-texto-icono campo-texto-icono-derecho">
              {icono_derecho}
            </span>
          )}
        </div>
        {error && (
          <small id={idError} className="campo-texto-mensaje">
            {error}
          </small>
        )}
      </div>
    )
  },
)

export default CampoTexto

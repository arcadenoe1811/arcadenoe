import { useEffect, useRef, useState } from 'react'

/**
 * Codigo hex como chip: muestra el color y lo copia al portapapeles al tocarlo.
 * @param {{ hex: string, className?: string }} props
 */
export default function ChipHex({ hex, className = '' }) {
  const [copiado, setCopiado] = useState(false)
  const temporizador = useRef(
    /** @type {ReturnType<typeof setTimeout>|undefined} */ (undefined),
  )

  useEffect(() => () => clearTimeout(temporizador.current), [])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(hex)
      setCopiado(true)
      clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => setCopiado(false), 1500)
    } catch {
      // Sin permiso de portapapeles (p. ej. http): el hex sigue visible.
    }
  }

  return (
    <button
      type="button"
      className={`chip-hex${copiado ? ' chip-hex-copiado' : ''} ${className}`}
      onClick={copiar}
      title="Copiar código de color"
      aria-label={copiado ? `${hex} copiado` : `Copiar ${hex}`}
    >
      <span className="chip-hex-muestra" style={{ background: hex }} aria-hidden="true" />
      <span className="chip-hex-texto">{copiado ? 'Copiado' : hex}</span>
      <svg
        viewBox="0 0 24 24"
        width="13"
        height="13"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {copiado ? (
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
      </svg>
      <span className="solo-lector" aria-live="polite">
        {copiado ? 'Copiado' : ''}
      </span>
    </button>
  )
}

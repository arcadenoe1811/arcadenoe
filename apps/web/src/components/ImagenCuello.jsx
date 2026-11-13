import { useState } from 'react'
import { normalizarUrlImagen } from '@inventario/shared'

/**
 * Imagen externa del cuello con respaldo si no hay URL o no carga.
 * tamano: 'miniatura' | 'grande'
 */
export default function ImagenCuello({ url, alt, tamano = 'miniatura' }) {
  // Se recuerda QUE url fallo: al cambiar la url el error se "resetea" solo,
  // sin necesidad de un efecto.
  const [urlFallida, setUrlFallida] = useState(null)
  const fallo = urlFallida !== null && urlFallida === url

  const fuente = normalizarUrlImagen(url, tamano === 'grande' ? 1200 : 400)

  if (!fuente || fallo) {
    return (
      <div className={`imagen-cuello imagen-${tamano} imagen-vacia`} aria-label={alt}>
        <svg viewBox="0 0 48 48" aria-hidden="true">
          <path
            d="M8 18c5 9 27 9 32 0M8 26c5 9 27 9 32 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        {fallo && tamano === 'grande' && <span>No se pudo cargar la imagen</span>}
      </div>
    )
  }

  return (
    <img
      className={`imagen-cuello imagen-${tamano}`}
      src={fuente}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setUrlFallida(url)}
    />
  )
}

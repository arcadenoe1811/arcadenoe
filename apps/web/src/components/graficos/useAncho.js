import { useEffect, useRef, useState } from 'react'

/**
 * Ancho en px de un elemento, actualizado al cambiar de tamano.
 * @param {number} inicial  ancho supuesto hasta la primera medicion
 * @returns {[import('react').RefObject<HTMLDivElement>, number]}
 */
export function useAncho(inicial = 600) {
  const ref = useRef(/** @type {HTMLDivElement|null} */ (null))
  const [ancho, setAncho] = useState(inicial)

  useEffect(() => {
    const elemento = ref.current
    if (!elemento || typeof ResizeObserver === 'undefined') return undefined
    const observador = new ResizeObserver(([entrada]) => {
      const nuevo = Math.round(entrada.contentRect.width)
      if (nuevo > 0) setAncho(nuevo)
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  return [ref, ancho]
}

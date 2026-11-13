import { useEffect, useState } from 'react'

/**
 * Devuelve `valor` solo despues de que deje de cambiar durante `retrasoMs`.
 * Sirve para no consultar la base en cada tecla.
 * @template T
 * @param {T} valor
 * @param {number} [retrasoMs]
 * @returns {T}
 */
export function useDebounce(valor, retrasoMs = 300) {
  const [retrasado, setRetrasado] = useState(valor)

  useEffect(() => {
    const temporizador = setTimeout(() => setRetrasado(valor), retrasoMs)
    return () => clearTimeout(temporizador)
  }, [valor, retrasoMs])

  return retrasado
}

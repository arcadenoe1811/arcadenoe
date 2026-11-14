import { useCallback } from 'react'
import { listarHijos } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

/**
 * Piezas que heredan el diseno de `piezaId`.
 * @param {string|null|undefined} piezaId
 */
export function useHijos(piezaId) {
  const cargar = useCallback(
    () => (piezaId ? listarHijos(piezaId) : Promise.resolve([])),
    [piezaId],
  )
  const { datos, cargando, error } = useConsulta(cargar)
  return { hijos: datos ?? [], cargando, error }
}

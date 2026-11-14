import { useCallback } from 'react'
import { buscarCuellos } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

/**
 * Lista/busca piezas (cuellos y punos). Recibe los filtros como primitivos
 * para que las dependencias sean estables (nunca un objeto inline).
 * `cuellos` es null hasta la primera respuesta (distinto de lista vacia).
 * @param {{ termino?: string, tipo?: string, medida?: string, pieza?: string }} filtros
 */
export function useCuellos({ termino = '', tipo = '', medida = '', pieza = '' } = {}) {
  const cargar = useCallback(
    () => buscarCuellos({ termino, tipo, medida, pieza }),
    [termino, tipo, medida, pieza],
  )
  const { datos, cargando, error, recargar } = useConsulta(cargar)
  return { cuellos: datos, cargando, error, recargar }
}

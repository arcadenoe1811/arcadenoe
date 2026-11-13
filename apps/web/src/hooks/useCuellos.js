import { useCallback } from 'react'
import { buscarCuellos } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

/**
 * Lista/busca cuellos. Recibe los filtros como primitivos para que las
 * dependencias sean estables (nunca un objeto inline).
 * `cuellos` es null hasta la primera respuesta (distinto de lista vacia).
 * @param {{ termino?: string, tipo?: string, medida?: string }} filtros
 */
export function useCuellos({ termino = '', tipo = '', medida = '' } = {}) {
  const cargar = useCallback(
    () => buscarCuellos({ termino, tipo, medida }),
    [termino, tipo, medida],
  )
  const { datos, cargando, error, recargar } = useConsulta(cargar)
  return { cuellos: datos, cargando, error, recargar }
}

import { useCallback } from 'react'
import { obtenerCuello } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

/**
 * Un cuello individual. Con `cuelloId` nulo no consulta nada (en vez de
 * llamar el hook de forma condicional).
 * @param {string|null|undefined} cuelloId
 */
export function useCuello(cuelloId) {
  const cargar = useCallback(
    () => (cuelloId ? obtenerCuello(cuelloId) : Promise.resolve(null)),
    [cuelloId],
  )
  const { datos, cargando, error, recargar } = useConsulta(cargar)
  return { cuello: datos, cargando, error, recargar }
}

import { useCallback } from 'react'
import { listarCuellosDelPuno, obtenerPunoDelCuello } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

/**
 * Puno de un cuello (el vinculado o el de su mismo codigo).
 * Recibe primitivos para que las dependencias sean estables.
 * @param {string} cuelloId
 * @param {string} codigo
 * @param {string|null|undefined} punoId
 */
export function usePunoDelCuello(cuelloId, codigo, punoId) {
  const cargar = useCallback(
    () => obtenerPunoDelCuello({ id: cuelloId, codigo, puno_id: punoId ?? null }),
    [cuelloId, codigo, punoId],
  )
  const { datos, cargando, error } = useConsulta(cargar)
  return {
    puno: datos?.puno ?? null,
    vinculado: Boolean(datos?.vinculado),
    cargando,
    error,
  }
}

/**
 * Cuellos que usan este puno.
 * @param {string} punoId
 */
export function useCuellosDelPuno(punoId) {
  const cargar = useCallback(() => listarCuellosDelPuno(punoId), [punoId])
  const { datos, cargando } = useConsulta(cargar)
  return { cuellos: datos ?? [], cargando }
}

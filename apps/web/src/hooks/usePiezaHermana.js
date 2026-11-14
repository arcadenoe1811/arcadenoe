import { useCallback } from 'react'
import { obtenerPiezaPorCodigo } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

/**
 * La pieza de tipo `pieza` con el mismo `codigo` (ej: el puno del cuello).
 * @param {string} pieza
 * @param {string|null|undefined} codigo
 */
export function usePiezaHermana(pieza, codigo) {
  const cargar = useCallback(
    () => (codigo ? obtenerPiezaPorCodigo(pieza, codigo) : Promise.resolve(null)),
    [pieza, codigo],
  )
  const { datos, cargando, error } = useConsulta(cargar)
  return { hermana: datos, cargando, error }
}

import { useCallback } from 'react'
import {
  listarConos,
  listarMovimientos,
  listarPiezasParaSalida,
  obtenerCono,
} from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

const VACIO = []

/** Todos los conos (activos e inactivos). */
export function useConos() {
  // listarConos es una funcion de modulo: estable entre renders.
  const consulta = useConsulta(listarConos)
  return { ...consulta, conos: consulta.datos ?? VACIO }
}

/**
 * Un cono con su historial de movimientos.
 * @param {string|undefined} id
 */
export function useCono(id) {
  const cargar = useCallback(async () => {
    if (!id) return null
    const [cono, movimientos] = await Promise.all([
      obtenerCono(id),
      listarMovimientos({ conoId: id }),
    ])
    return { cono, movimientos }
  }, [id])
  const { datos, cargando, error, recargar } = useConsulta(cargar)
  return {
    cono: datos?.cono ?? null,
    movimientos: datos?.movimientos ?? VACIO,
    cargando,
    error,
    recargar,
  }
}

const cargarRecientes = () => listarMovimientos({ limite: 12 })

/** Ultimos movimientos de todos los conos (para el resumen). */
export function useMovimientosRecientes() {
  const consulta = useConsulta(cargarRecientes)
  return { ...consulta, movimientos: consulta.datos ?? VACIO }
}

/** Cuellos y punos activos, para asociar una salida. */
export function usePiezasSalida() {
  const consulta = useConsulta(listarPiezasParaSalida)
  return { ...consulta, piezas: consulta.datos ?? VACIO }
}

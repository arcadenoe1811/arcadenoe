import { listarDisenos, listarStockCuellos } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

const VACIO = []

/** Disenos activos (cuellos y punos) con precio base y colores. */
export function useDisenos() {
  // listarDisenos es una funcion de modulo: estable entre renders.
  const consulta = useConsulta(listarDisenos)
  return { ...consulta, disenos: consulta.datos ?? VACIO }
}

/** Vendido y producido por diseno y medida (para los pendientes de producir). */
export function useStockCuellos() {
  const consulta = useConsulta(listarStockCuellos)
  return { ...consulta, stock: consulta.datos ?? VACIO }
}

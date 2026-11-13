import { listarColores } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

const SIN_COLORES = []

/** Catalogo de colores (para autocompletar y la pantalla de colores). */
export function useCatalogoColores() {
  // listarColores es una funcion de modulo: estable entre renders.
  const consulta = useConsulta(listarColores)
  return { ...consulta, colores: consulta.datos ?? SIN_COLORES }
}

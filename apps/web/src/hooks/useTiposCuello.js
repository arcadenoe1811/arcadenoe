import { TIPOS_CUELLO, listarTipos } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

/** Tipos de cuello de la base (mientras cargan se usan los tipos base). */
export function useTiposCuello() {
  // listarTipos es una funcion de modulo: estable entre renders.
  const consulta = useConsulta(listarTipos)
  return { ...consulta, tipos: consulta.datos ?? TIPOS_CUELLO }
}

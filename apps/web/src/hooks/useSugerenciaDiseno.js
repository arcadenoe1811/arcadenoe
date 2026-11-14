import { useCallback } from 'react'
import { buscarCuellos } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

/**
 * Piezas con el MISMO codigo de diseno y con diseno (ej: al crear el puno
 * maz4t5, el cuello maz4t5). Sirve para sugerir heredar o usar plantilla.
 * Con `activo` en false no consulta.
 * @param {string} codigo  ya normalizado
 * @param {boolean} activo
 * @param {string} [excluir] id de la pieza que se esta editando
 */
export function useSugerenciaDiseno(codigo, activo, excluir = '') {
  const cargar = useCallback(async () => {
    if (!activo || !codigo) return []
    const piezas = await buscarCuellos({ termino: codigo })
    return piezas.filter(
      (p) => p.codigo === codigo && p.id !== excluir && p.diseno_efectivo,
    )
  }, [codigo, activo, excluir])
  const { datos } = useConsulta(cargar)
  return activo ? (datos ?? []) : []
}

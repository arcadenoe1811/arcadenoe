import { listarUsuarios } from '@inventario/shared'
import { useConsulta } from './useConsulta.js'

const VACIO = []

/** Todos los usuarios, activos y deshabilitados (solo admin). */
export function useUsuarios() {
  // listarUsuarios es una funcion de modulo: estable entre renders.
  const consulta = useConsulta(listarUsuarios)
  return { ...consulta, usuarios: consulta.datos ?? VACIO }
}

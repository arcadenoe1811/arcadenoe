import { useContext } from 'react'
import { ContextoAuth } from '../contextos/ContextoAuth.jsx'

/** Estado de autenticacion. Debe usarse dentro de <ProveedorAuth>. */
export function useAuth() {
  const valor = useContext(ContextoAuth)
  if (!valor) throw new Error('useAuth debe usarse dentro de <ProveedorAuth>')
  return valor
}

import { useContext } from 'react';
import { ContextoAuth } from '../contextos/ContextoAuth.jsx';

/** Estado de autenticacion. Debe usarse dentro de <ProveedorAuth>. */
export function usarAuth() {
  const valor = useContext(ContextoAuth);
  if (!valor) throw new Error('usarAuth debe usarse dentro de <ProveedorAuth>');
  return valor;
}

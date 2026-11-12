import { listarColores } from '@inventario/shared';
import { usarConsulta } from './usarConsulta.js';

/** Catalogo de colores (para autocompletar y la pantalla de colores). */
export function usarCatalogoColores() {
  const consulta = usarConsulta(listarColores, []);
  return { ...consulta, colores: consulta.datos ?? [] };
}

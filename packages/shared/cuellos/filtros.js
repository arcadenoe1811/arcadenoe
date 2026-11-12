import { OPCIONES_TIPO } from './campos.js';
import { LIMITES } from './constantes.js';

/**
 * Filtros de la pantalla de busqueda (ademas del termino de texto).
 */
export const FILTROS_CUELLO = [
  {
    nombre: 'tipo',
    etiqueta: 'Tipo',
    tipo: 'seleccion',
    opciones: [{ valor: '', etiqueta: 'Todos' }, ...OPCIONES_TIPO],
  },
  {
    nombre: 'medida',
    etiqueta: 'Medida',
    tipo: 'numero',
    placeholder: 'Ej: 16',
    minimo: LIMITES.medida.minimo,
    maximo: LIMITES.medida.maximo,
  },
];

/** @returns {import('../tipos/index.js').FiltrosCuellos} */
export function filtrosVacios() {
  return { termino: '', tipo: '', medida: '' };
}

/**
 * Limpia los filtros: quita vacios y convierte la medida en numero.
 * @param {import('../tipos/index.js').FiltrosCuellos} filtros
 */
export function normalizarFiltros(filtros = {}) {
  const termino = String(filtros.termino ?? '').trim();
  const tipo = filtros.tipo || null;
  const medidaTexto = String(filtros.medida ?? '').trim();
  const medida = /^\d+$/.test(medidaTexto) ? Number(medidaTexto) : null;
  return { termino, tipo, medida };
}

/**
 * Aplica tipo y medida sobre una consulta de supabase-js (tabla o rpc).
 * @template Q
 * @param {Q} consulta
 * @param {{ tipo: string|null, medida: number|null }} filtros
 * @returns {Q}
 */
export function aplicarFiltros(consulta, { tipo, medida }) {
  /** @type {any} */
  let q = consulta;
  if (tipo) q = q.eq('tipo', tipo);
  if (medida !== null && medida !== undefined) q = q.contains('medidas', [medida]);
  return q;
}

/** Indica si hay algun filtro activo (para mostrar "limpiar filtros"). */
export function hayFiltrosActivos(filtros = {}) {
  const { termino, tipo, medida } = normalizarFiltros(filtros);
  return Boolean(termino || tipo || medida !== null);
}

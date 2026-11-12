import { obtenerCliente } from '../api/cliente.js';
import { ErrorNormalizado, verificarRespuesta } from '../api/errores.js';
import { COLUMNAS_LISTADO } from './columnas.js';
import { aplicarFiltros, normalizarFiltros } from './filtros.js';
import { validarColoresCuello, validarCuello } from './validaciones.js';
import { ZONAS_COLOR } from './constantes.js';

const LIMITE_RESULTADOS = 300;

/**
 * Busca cuellos activos por codigo, nombre, notas o color, con filtros
 * opcionales de tipo y medida.
 * @param {import('../tipos/index.js').FiltrosCuellos} [filtros]
 * @returns {Promise<import('../tipos/index.js').Cuello[]>}
 */
export async function buscarCuellos(filtros = {}) {
  const { termino, tipo, medida } = normalizarFiltros(filtros);
  const consulta = obtenerCliente()
    .rpc('fn_buscar_cuellos', { termino })
    .select(COLUMNAS_LISTADO)
    .limit(LIMITE_RESULTADOS);
  return verificarRespuesta(await aplicarFiltros(consulta, { tipo, medida })) ?? [];
}

/**
 * Trae un cuello con sus colores ordenados por zona y orden.
 * @param {string} id
 * @returns {Promise<import('../tipos/index.js').CuelloConColores>}
 */
export async function obtenerCuello(id) {
  const cuello = verificarRespuesta(
    await obtenerCliente().from('cuellos').select('*, colores:colores_cuello(*)').eq('id', id).single(),
  );
  cuello.colores = ordenarColores(cuello.colores ?? []);
  return cuello;
}

/**
 * Crea o actualiza un cuello y reemplaza sus colores en una transaccion.
 * Valida antes de enviar; si algo falla lanza ErrorNormalizado con
 * `codigo: 'validacion'` y los errores por campo en `detalle`.
 * @param {Record<string, unknown>} formulario   valores del formulario
 * @param {Array<Record<string, unknown>>} colores filas del editor de colores
 * @returns {Promise<import('../tipos/index.js').Cuello>}
 */
export async function guardarCuello(formulario, colores = []) {
  const cuello = validarCuello(formulario);
  const listaColores = validarColoresCuello(colores);
  if (!cuello.valido || !listaColores.valido) {
    throw new ErrorNormalizado({
      mensaje: 'Revisa los campos marcados.',
      codigo: 'validacion',
      errores: { ...cuello.errores, ...prefijar(listaColores.errores, 'colores.') },
    });
  }
  return verificarRespuesta(
    await obtenerCliente().rpc('fn_guardar_cuello', {
      p_cuello: cuello.datos,
      p_colores: listaColores.datos,
    }),
  );
}

/**
 * "Elimina" un cuello marcandolo como inactivo (no borra datos).
 * @param {string} id
 */
export async function desactivarCuello(id) {
  verificarRespuesta(await obtenerCliente().from('cuellos').update({ activo: false }).eq('id', id));
}

/**
 * Vuelve a activar un cuello.
 * @param {string} id
 */
export async function reactivarCuello(id) {
  verificarRespuesta(await obtenerCliente().from('cuellos').update({ activo: true }).eq('id', id));
}

/**
 * Agrupa colores por zona respetando el orden de ZONAS_COLOR.
 * @param {import('../tipos/index.js').ColorCuello[]} colores
 * @returns {{ zona: import('../tipos/index.js').ZonaColor, colores: import('../tipos/index.js').ColorCuello[] }[]}
 */
export function agruparColoresPorZona(colores = []) {
  return ZONAS_COLOR.map((zona) => ({
    zona,
    colores: ordenarColores(colores.filter((c) => c.zona === zona)),
  })).filter((grupo) => grupo.colores.length > 0);
}

/** @param {import('../tipos/index.js').ColorCuello[]} colores */
function ordenarColores(colores) {
  return [...colores].sort(
    (a, b) =>
      ZONAS_COLOR.indexOf(a.zona) - ZONAS_COLOR.indexOf(b.zona) ||
      (a.orden ?? Number.MAX_SAFE_INTEGER) - (b.orden ?? Number.MAX_SAFE_INTEGER),
  );
}

/** @param {Record<string, string>} errores @param {string} prefijo */
function prefijar(errores, prefijo) {
  return Object.fromEntries(Object.entries(errores).map(([clave, valor]) => [prefijo + clave, valor]));
}

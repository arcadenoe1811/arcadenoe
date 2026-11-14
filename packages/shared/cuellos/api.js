import { obtenerCliente } from '../api/cliente.js'
import { ErrorNormalizado, verificarRespuesta } from '../api/errores.js'
import { COLUMNAS_LISTADO } from './columnas.js'
import { aplicarFiltros, normalizarFiltros } from './filtros.js'
import { validarColoresCuello, validarCuello } from './validaciones.js'
import { ZONAS_COLOR } from './constantes.js'
import { calcularDisenosEfectivos, ordenarColores, padresFaltantes } from './herencia.js'

const LIMITE_RESULTADOS = 300

/** Columnas minimas para resolver la herencia de un ancestro. */
const COLUMNAS_HERENCIA =
  'id, pieza, codigo, nombre, padre_id, diseno, overrides, ' +
  'colores:colores_cuello(zona, posicion, orden, hex)'

/** Maximo de niveles de herencia que se siguen (la base corta en 20). */
const MAXIMO_NIVELES = 20

/**
 * Busca piezas activas por codigo, nombre, notas o color, con filtros
 * opcionales de pieza, tipo y medida. Cada resultado trae
 * `diseno_efectivo` (el propio o el heredado).
 * @param {import('../tipos/index.js').FiltrosCuellos} [filtros]
 * @returns {Promise<import('../tipos/index.js').Cuello[]>}
 */
export async function buscarCuellos(filtros = {}) {
  const { termino, tipo, medida, pieza } = normalizarFiltros(filtros)
  const consulta = obtenerCliente()
    .rpc('fn_buscar_cuellos', { termino })
    .select(COLUMNAS_LISTADO)
    .limit(LIMITE_RESULTADOS)
  const piezas =
    verificarRespuesta(await aplicarFiltros(consulta, { tipo, medida, pieza })) ?? []
  await resolverDisenos(piezas)
  return piezas
}

/**
 * Trae una pieza con sus colores ordenados, su `diseno_efectivo` y, si
 * hereda, un resumen de su `padre` ({ id, pieza, codigo, nombre }).
 * @param {string} id
 * @returns {Promise<import('../tipos/index.js').CuelloConColores>}
 */
export async function obtenerCuello(id) {
  const cuello = verificarRespuesta(
    await obtenerCliente()
      .from('cuellos')
      .select('*, colores:colores_cuello(*)')
      .eq('id', id)
      .single(),
  )
  cuello.colores = ordenarColores(cuello.colores ?? [])
  const ancestros = await resolverDisenos([cuello])
  const padre = cuello.padre_id ? ancestros.get(cuello.padre_id) : null
  cuello.padre = padre
    ? { id: padre.id, pieza: padre.pieza, codigo: padre.codigo, nombre: padre.nombre }
    : null
  return cuello
}

/**
 * Calcula `diseno_efectivo` de cada pieza (muta los objetos). Trae de la
 * base los ancestros que falten, nivel por nivel.
 * @param {Array<Record<string, any>>} piezas  con id, padre_id, diseno, overrides y colores
 * @returns {Promise<Map<string, Record<string, any>>>} todas las piezas usadas, por id
 */
export async function resolverDisenos(piezas) {
  const todas = new Map(piezas.map((p) => [p.id, p]))
  for (let nivel = 0; nivel < MAXIMO_NIVELES; nivel++) {
    const faltan = padresFaltantes([...todas.values()])
    if (!faltan.length) break
    const padres =
      verificarRespuesta(
        await obtenerCliente().from('cuellos').select(COLUMNAS_HERENCIA).in('id', faltan),
      ) ?? []
    if (!padres.length) break
    for (const padre of padres) todas.set(padre.id, padre)
  }
  const disenos = calcularDisenosEfectivos([...todas.values()])
  for (const pieza of todas.values())
    pieza.diseno_efectivo = disenos.get(pieza.id) ?? null
  return todas
}

/**
 * La pieza de otro tipo con el mismo codigo (el puno del cuello abc es el
 * puno abc), con su diseno efectivo. null si no existe.
 * @param {string} pieza  'cuello' | 'puno'
 * @param {string} codigo
 */
export async function obtenerPiezaPorCodigo(pieza, codigo) {
  const encontrada = verificarRespuesta(
    await obtenerCliente()
      .from('cuellos')
      .select(COLUMNAS_LISTADO)
      .eq('pieza', pieza)
      .eq('codigo', codigo)
      .maybeSingle(),
  )
  if (!encontrada) return null
  const todas = await resolverDisenos([encontrada])
  const padre = encontrada.padre_id ? todas.get(encontrada.padre_id) : null
  encontrada.padre = padre
    ? { id: padre.id, pieza: padre.pieza, codigo: padre.codigo, nombre: padre.nombre }
    : null
  return encontrada
}

/**
 * Puno de un cuello: el que tiene vinculado (puno_id), o si no el puno
 * con su mismo codigo. `vinculado` indica cual de los dos es.
 * @param {{ id: string, codigo: string, puno_id?: string|null }} cuello
 * @returns {Promise<{ puno: Record<string, any>|null, vinculado: boolean }>}
 */
export async function obtenerPunoDelCuello(cuello) {
  if (cuello.puno_id) {
    const puno = verificarRespuesta(
      await obtenerCliente()
        .from('cuellos')
        .select(COLUMNAS_LISTADO)
        .eq('id', cuello.puno_id)
        .maybeSingle(),
    )
    if (puno) {
      await resolverDisenos([puno])
      return { puno, vinculado: true }
    }
  }
  return { puno: await obtenerPiezaPorCodigo('puno', cuello.codigo), vinculado: false }
}

/**
 * Hace que un cuello use un puno existente, con una nota que lo aclara
 * (ej: "mismo diseno que el puno maz4d3, con los colores de cous2t").
 * Con `punoId` null quita el vinculo.
 * @param {string} cuelloId
 * @param {string|null} punoId
 * @param {string|null} [nota]
 */
export async function vincularPuno(cuelloId, punoId, nota = null) {
  const texto = String(nota ?? '').trim()
  verificarRespuesta(
    await obtenerCliente()
      .from('cuellos')
      .update({
        puno_id: punoId,
        puno_nota: punoId && texto ? texto.slice(0, 500) : null,
      })
      .eq('id', cuelloId),
  )
}

/**
 * Cuellos activos que usan este puno (puno_id), con su nota.
 * @param {string} punoId
 */
export async function listarCuellosDelPuno(punoId) {
  const cuellos =
    verificarRespuesta(
      await obtenerCliente()
        .from('cuellos')
        .select(COLUMNAS_LISTADO + ', puno_nota')
        .eq('puno_id', punoId)
        .eq('activo', true)
        .order('codigo'),
    ) ?? []
  await resolverDisenos(cuellos)
  return cuellos
}

/**
 * Piezas activas que heredan directamente de `id`.
 * @param {string} id
 * @returns {Promise<Array<{ id: string, pieza: string, codigo: string, nombre: string|null, overrides: Record<string, any> }>>}
 */
export async function listarHijos(id) {
  return (
    verificarRespuesta(
      await obtenerCliente()
        .from('cuellos')
        .select('id, pieza, codigo, nombre, overrides')
        .eq('padre_id', id)
        .eq('activo', true)
        .order('pieza')
        .order('codigo'),
    ) ?? []
  )
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
  const cuello = validarCuello(formulario)
  const listaColores = validarColoresCuello(colores, opcionesColores(formulario))
  if (!cuello.valido || !listaColores.valido) {
    throw new ErrorNormalizado({
      mensaje: 'Revisa los campos marcados.',
      codigo: 'validacion',
      errores: { ...cuello.errores, ...prefijar(listaColores.errores, 'colores.') },
    })
  }
  return verificarRespuesta(
    await obtenerCliente().rpc('fn_guardar_cuello', {
      p_cuello: cuello.datos,
      p_colores: listaColores.datos,
    }),
  )
}

/**
 * "Elimina" un cuello marcandolo como inactivo (no borra datos).
 * @param {string} id
 */
export async function desactivarCuello(id) {
  verificarRespuesta(
    await obtenerCliente().from('cuellos').update({ activo: false }).eq('id', id),
  )
}

/**
 * Vuelve a activar un cuello.
 * @param {string} id
 */
export async function reactivarCuello(id) {
  verificarRespuesta(
    await obtenerCliente().from('cuellos').update({ activo: true }).eq('id', id),
  )
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
  })).filter((grupo) => grupo.colores.length > 0)
}

/**
 * Datos del cuello que necesitan las filas de color: hilos por defecto y
 * cuantos colores hay en "Posiciones del cuerpo".
 * @param {Record<string, any>} formulario
 */
export function opcionesColores(formulario) {
  return {
    hilosPorDefecto: formulario.cantidad_hilos,
    cantidadPosiciones: (formulario.posiciones_cuerpo ?? []).length,
  }
}

/** @param {Record<string, string>} errores @param {string} prefijo */
function prefijar(errores, prefijo) {
  return Object.fromEntries(
    Object.entries(errores).map(([clave, valor]) => [prefijo + clave, valor]),
  )
}

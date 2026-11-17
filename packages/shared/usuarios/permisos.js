/**
 * Roles y permisos. Esta tabla solo decide que MUESTRA la interfaz
 * (botones, enlaces, rutas). La proteccion real esta en la base de datos:
 * politicas RLS y funciones de supabase/migrations/00011_usuarios_roles_seguridad.sql
 * y 00012_ventas_estimador_reportes.sql.
 * Si se cambia un permiso aqui, hay que cambiarlo tambien alla.
 */

/** @typedef {'admin'|'operador'} Rol */

/** @type {Rol[]} */
export const ROLES = ['admin', 'operador']

export const ETIQUETAS_ROL = {
  admin: 'Administrador',
  operador: 'Operador',
}

export const OPCIONES_ROL = ROLES.map((valor) => ({
  valor,
  etiqueta: ETIQUETAS_ROL[valor],
}))

/**
 * Permiso -> roles que lo tienen.
 * @type {Record<string, Rol[]>}
 */
const PERMISOS = {
  'usuarios.gestionar': ['admin'],

  'cuellos.ver': ['admin', 'operador'],
  'cuellos.editar': ['admin'], // crear, editar, dar de baja, vincular puno, tipos

  'colores.ver': ['admin', 'operador'],
  'colores.editar': ['admin', 'operador'], // crear y editar
  'colores.eliminar': ['admin'],

  'conos.ver': ['admin', 'operador'],
  'conos.editar': ['admin', 'operador'], // crear, editar, entradas/salidas/ajustes
  'conos.eliminar': ['admin'], // eliminar y desactivar/reactivar

  'dashboard.ver': ['admin', 'operador'],
  'reportes.ver': ['admin', 'operador'],

  'ventas.ver': ['admin', 'operador'],
  'ventas.registrar': ['admin', 'operador'],
  'ventas.eliminar': ['admin'],

  'estimador.usar': ['admin', 'operador'], // calcular y guardar estimaciones
  'estimaciones.eliminar': ['admin'],

  'produccion.registrar': ['admin', 'operador'],
  'produccion.eliminar': ['admin'],

  'precios.editar': ['admin'], // precio base de cada diseno
  'configuracion.editar': ['admin'], // tarifa por hora predeterminada
}

/** @typedef {keyof typeof PERMISOS} Permiso */

/**
 * Indica si un rol tiene un permiso. Un rol o permiso desconocido nunca
 * tiene acceso.
 * @param {string|null|undefined} rol
 * @param {string} permiso
 */
export function puede(rol, permiso) {
  return Boolean(rol) && (PERMISOS[permiso] ?? []).includes(/** @type {Rol} */ (rol))
}

/** @param {string|null|undefined} rol */
export function formatearRol(rol) {
  return (rol && ETIQUETAS_ROL[rol]) || '—'
}

// Punto de entrada de @inventario/shared.
// Este paquete no depende de React DOM: solo de @supabase/supabase-js.

export { CLAVE_SESION, configurarCliente, obtenerCliente } from './api/cliente.js'
export { ErrorNormalizado, normalizarError, verificarRespuesta } from './api/errores.js'

export * from './auth/sesion.js'

export * from './cuellos/constantes.js'
export * from './cuellos/validaciones.js'
export * from './cuellos/campos.js'
export * from './cuellos/columnas.js'
export * from './cuellos/filtros.js'
export * from './cuellos/api.js'
export * from './cuellos/tipos.js'
export * from './cuellos/diseno.js'
export * from './cuellos/piezas.js'
export * from './cuellos/herencia.js'

export * from './colores/validaciones.js'
export * from './colores/api.js'

export * from './conos/constantes.js'
export * from './conos/familias.js'
export * from './conos/validaciones.js'
export * from './conos/inventario.js'
export * from './conos/formato.js'
export * from './conos/api.js'

export * from './usuarios/permisos.js'
export * from './usuarios/validaciones.js'
export * from './usuarios/api.js'

export * from './ventas/constantes.js'
export * from './ventas/validaciones.js'
export * from './ventas/api.js'

export * from './estimador/calculos.js'
export * from './estimador/api.js'

export * from './reportes/periodos.js'
export * from './reportes/exportar.js'
export * from './reportes/api.js'

export * from './formato/index.js'

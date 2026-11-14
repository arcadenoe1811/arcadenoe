// Punto de entrada de @inventario/shared.
// Este paquete no depende de React DOM: solo de @supabase/supabase-js.

export { configurarCliente, obtenerCliente } from './api/cliente.js'
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

export * from './formato/index.js'

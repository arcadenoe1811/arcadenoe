/**
 * Tipos del dominio (solo JSDoc, sin codigo en tiempo de ejecucion).
 */

/** Nombre de un tipo de la tabla tipos_cuello ('liso', 'tubular', ...). @typedef {string} TipoCuello */
/** @typedef {'tubular' | 'cuerpo' | 'borde' | 'otro'} ZonaColor */

/**
 * Fila de la tabla `cuellos`.
 * @typedef {Object} Cuello
 * @property {string} id
 * @property {import('../cuellos/piezas.js').Pieza} pieza   cuello | puno
 * @property {string} codigo   codigo del diseno (ej: maz4t5), unico por pieza
 * @property {string|null} nombre
 * @property {TipoCuello} tipo
 * @property {number|null} cantidad_hilos
 * @property {PosicionCuerpo[]} posiciones_cuerpo
 * @property {number|null} posicion_tubular
 * @property {number|null} pasadas_tubular
 * @property {number[]|null} medidas   medidas del cuello
 * @property {import('../cuellos/piezas.js').TallaPuno[]|null} [tallas]  tallas del puno
 * @property {string|null} notas
 * @property {string|null} imagen_url
 * @property {import('../cuellos/diseno.js').DisenoCuello|null} [diseno]  diseno Jacquard propio (null si hereda)
 * @property {string|null} [padre_id]   pieza de la que hereda el diseno
 * @property {Record<string, any>} [overrides]  campos del diseno que cambia respecto al padre
 * @property {import('../cuellos/diseno.js').DisenoCuello|null} [diseno_efectivo]  calculado en la app (propio o heredado)
 * @property {boolean} activo
 * @property {string} created_at
 * @property {string|null} updated_at
 */

/**
 * Posicion de un color del cuerpo; `letra` marca que ese color forma letras.
 * @typedef {Object} PosicionCuerpo
 * @property {number|null} posicion
 * @property {boolean} letra
 */

/**
 * Fila de la tabla `colores_cuello`.
 * @typedef {Object} ColorCuello
 * @property {string} [id]
 * @property {string} [cuello_id]
 * @property {ZonaColor} zona
 * @property {number|null} [posicion]  color N de posiciones_cuerpo (desde 1)
 * @property {string} color
 * @property {string|null} [codigo]    codigo del color segun el cono
 * @property {string|null} [hex]       tono de referencia (#rrggbb)
 * @property {number|null} cantidad_hilos
 * @property {number|null} orden
 */

/**
 * Cuello con sus colores (resultado de la ficha).
 * @typedef {Cuello & { colores: ColorCuello[] }} CuelloConColores
 */

/**
 * Fila de la tabla `catalogo_colores`.
 * @typedef {Object} ColorCatalogo
 * @property {string} id
 * @property {string} nombre
 * @property {string|null} hex
 */

/**
 * Filtros de la pantalla de busqueda.
 * @typedef {Object} FiltrosCuellos
 * @property {string} [termino]
 * @property {TipoCuello|''} [tipo]
 * @property {number|string|null} [medida]
 * @property {import('../cuellos/piezas.js').Pieza|''} [pieza]
 */

/**
 * Resultado de una validacion.
 * @typedef {Object} ResultadoValidacion
 * @property {boolean} valido
 * @property {Record<string, string>} errores   Mensaje por nombre de campo
 */

/**
 * Fila de la tabla `conos` (tipo de cono de hilo).
 * @typedef {Object} Cono
 * @property {string} id
 * @property {string} codigo             ej: CON-0001
 * @property {string} nombre_color       ej: Dorado oscuro
 * @property {string} hex                #rrggbb
 * @property {string|null} color_catalogo_id  color de catalogo_colores
 * @property {string|null} codigo_color  numero de color (= colores_cuello.codigo)
 * @property {string} familia_color      ver FAMILIAS_COLOR
 * @property {string} material
 * @property {string|null} titulo_hilo   ej: 2/32
 * @property {string|null} proveedor
 * @property {number|null} peso_por_cono_g
 * @property {number|null} costo_por_cono
 * @property {number|null} costo_por_kilo  calculado por la base
 * @property {number} stock_actual       solo lo cambian los movimientos
 * @property {number} stock_minimo
 * @property {'disponible'|'bajo'|'agotado'} estado  calculado por la base
 * @property {number} valor_stock        calculado por la base
 * @property {string|null} imagen_url
 * @property {string|null} notas
 * @property {boolean} activo
 * @property {string} created_at
 * @property {string|null} updated_at
 */

/**
 * Fila de la tabla `movimientos_cono`.
 * @typedef {Object} MovimientoCono
 * @property {string} id
 * @property {string} cono_id
 * @property {'entrada'|'salida'|'ajuste'} tipo
 * @property {number} cantidad           positivo; en ajustes, diferencia con signo
 * @property {string} fecha              YYYY-MM-DD
 * @property {string|null} referencia
 * @property {string|null} lote          solo entradas
 * @property {string|null} proveedor     solo entradas
 * @property {number|null} costo_unitario  solo entradas
 * @property {number|null} stock_resultante
 * @property {string|null} notas
 * @property {string} created_at
 * @property {{ id: string, codigo: string, pieza: string }|null} [pieza]  pieza producida (salidas)
 * @property {{ id: string, codigo: string, nombre_color: string, hex: string }|null} [cono]
 */

/**
 * Fila de la tabla `perfiles` (rol y estado del usuario con sesion).
 * @typedef {Object} Perfil
 * @property {string} id
 * @property {string} nombre
 * @property {import('../usuarios/permisos.js').Rol} rol
 * @property {boolean} activo
 * @property {boolean} debe_cambiar_contrasena  contrasena temporal pendiente de cambio
 */

/**
 * Usuario en la pantalla de gestion (fn_listar_usuarios).
 * @typedef {Perfil & { email: string, created_at: string, ultimo_acceso: string|null }} Usuario
 */

export {}

/**
 * Tipos del dominio (solo JSDoc, sin codigo en tiempo de ejecucion).
 */

/** Nombre de un tipo de la tabla tipos_cuello ('liso', 'tubular', ...). @typedef {string} TipoCuello */
/** @typedef {'tubular' | 'cuerpo' | 'borde' | 'otro'} ZonaColor */

/**
 * Fila de la tabla `cuellos`.
 * @typedef {Object} Cuello
 * @property {string} id
 * @property {string} codigo
 * @property {string|null} nombre
 * @property {TipoCuello} tipo
 * @property {number|null} cantidad_hilos
 * @property {PosicionCuerpo[]} posiciones_cuerpo
 * @property {number|null} posicion_tubular
 * @property {number|null} pasadas_tubular
 * @property {number[]|null} medidas
 * @property {string|null} notas
 * @property {string|null} imagen_url
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
 */

/**
 * Resultado de una validacion.
 * @typedef {Object} ResultadoValidacion
 * @property {boolean} valido
 * @property {Record<string, string>} errores   Mensaje por nombre de campo
 */

export {}

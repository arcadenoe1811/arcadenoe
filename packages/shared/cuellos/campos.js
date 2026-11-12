import { ETIQUETAS_TIPO, ETIQUETAS_ZONA, LIMITES, TIPOS_CUELLO, ZONAS_COLOR } from './constantes.js';

/**
 * Descriptores de formulario. La UI los recorre para pintar los campos;
 * asi el formulario no repite etiquetas, limites ni opciones.
 *
 * tipo: 'texto' | 'numero' | 'seleccion' | 'area_texto' | 'url' | 'lista_numeros'
 *
 * @typedef {Object} DescriptorCampo
 * @property {string} nombre
 * @property {string} etiqueta
 * @property {'texto'|'numero'|'seleccion'|'area_texto'|'url'|'lista_numeros'} tipo
 * @property {boolean} [requerido]
 * @property {string} [placeholder]
 * @property {string} [ayuda]
 * @property {number} [minimo]
 * @property {number} [maximo]
 * @property {number} [filas]
 * @property {string} [grupo]
 * @property {{ valor: string, etiqueta: string }[]} [opciones]
 */

export const OPCIONES_TIPO = TIPOS_CUELLO.map((valor) => ({ valor, etiqueta: ETIQUETAS_TIPO[valor] }));
export const OPCIONES_ZONA = ZONAS_COLOR.map((valor) => ({ valor, etiqueta: ETIQUETAS_ZONA[valor] }));

/** Grupos visuales del formulario, en orden. */
export const GRUPOS_CUELLO = [
  { clave: 'identificacion', titulo: 'Identificación' },
  { clave: 'tecnico', titulo: 'Datos técnicos' },
  { clave: 'detalle', titulo: 'Detalle e imagen' },
];

/** @type {DescriptorCampo[]} */
export const CAMPOS_CUELLO = [
  {
    nombre: 'codigo',
    etiqueta: 'Código',
    tipo: 'texto',
    requerido: true,
    placeholder: 'maz4t5',
    ayuda: 'Tal como lo usa la empresa. Se guarda en minúsculas.',
    grupo: 'identificacion',
  },
  { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', placeholder: 'Opcional', grupo: 'identificacion' },
  { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'seleccion', requerido: true, opciones: OPCIONES_TIPO, grupo: 'identificacion' },
  { nombre: 'cantidad_hilos', etiqueta: 'Cantidad de hilos', tipo: 'numero', ...rango('cantidad_hilos'), grupo: 'tecnico' },
  { nombre: 'posicion_cuerpo', etiqueta: 'Posición del cuerpo', tipo: 'numero', ...rango('posicion_cuerpo'), grupo: 'tecnico' },
  { nombre: 'posicion_tubular', etiqueta: 'Posición del tubular', tipo: 'numero', ...rango('posicion_tubular'), grupo: 'tecnico' },
  { nombre: 'pasadas_tubular', etiqueta: 'Pasadas del tubular', tipo: 'numero', ...rango('pasadas_tubular'), grupo: 'tecnico' },
  {
    nombre: 'medidas',
    etiqueta: 'Medidas compatibles',
    tipo: 'lista_numeros',
    placeholder: '18, 17, 16, 15, 14',
    ayuda: 'Separadas por comas o espacios.',
    grupo: 'tecnico',
  },
  {
    nombre: 'imagen_url',
    etiqueta: 'URL de la imagen',
    tipo: 'url',
    placeholder: 'https://i.ibb.co/...',
    ayuda: 'Pega un enlace público (ImgBB, Cloudinary, Google Drive compartido...).',
    grupo: 'detalle',
  },
  {
    nombre: 'notas',
    etiqueta: 'Notas',
    tipo: 'area_texto',
    filas: 8,
    placeholder: 'tubular blanco(4) azul(4) conusec. Cuerpo gaspeado: 1 negro, 1 celeste #34',
    ayuda: 'Todo lo que no cabe en los campos: colores, combinaciones, detalles del gaspeado...',
    grupo: 'detalle',
  },
];

/** Descriptores de cada fila del editor de colores. @type {DescriptorCampo[]} */
export const CAMPOS_COLOR = [
  { nombre: 'zona', etiqueta: 'Zona', tipo: 'seleccion', requerido: true, opciones: OPCIONES_ZONA },
  { nombre: 'color', etiqueta: 'Color', tipo: 'texto', requerido: true, placeholder: 'celeste #34' },
  { nombre: 'cantidad_hilos', etiqueta: 'Hilos', tipo: 'numero', ...rango('cantidad_hilos') },
  { nombre: 'orden', etiqueta: 'Orden', tipo: 'numero', ...rango('orden') },
];

/** @param {keyof typeof LIMITES} clave */
function rango(clave) {
  return { minimo: LIMITES[clave].minimo, maximo: LIMITES[clave].maximo };
}

/** @param {unknown} valor */
const aTexto = (valor) => (valor === null || valor === undefined ? '' : String(valor));

/**
 * Valores iniciales del formulario (todo como string) a partir de un
 * cuello existente o vacio para un alta.
 * @param {Partial<import('../tipos/index.js').Cuello>} [cuello]
 */
export function valoresInicialesCuello(cuello = {}) {
  return {
    id: cuello.id ?? '',
    codigo: aTexto(cuello.codigo),
    nombre: aTexto(cuello.nombre),
    tipo: cuello.tipo ?? 'liso',
    cantidad_hilos: aTexto(cuello.cantidad_hilos),
    posicion_cuerpo: aTexto(cuello.posicion_cuerpo),
    posicion_tubular: aTexto(cuello.posicion_tubular),
    pasadas_tubular: aTexto(cuello.pasadas_tubular),
    medidas: (cuello.medidas ?? []).join(', '),
    imagen_url: aTexto(cuello.imagen_url),
    notas: aTexto(cuello.notas),
  };
}

/**
 * Fila vacia (o a partir de un color existente) para el editor de colores.
 * @param {Partial<import('../tipos/index.js').ColorCuello>} [color]
 */
export function valoresInicialesColor(color = {}) {
  return {
    zona: color.zona ?? 'cuerpo',
    color: aTexto(color.color),
    cantidad_hilos: aTexto(color.cantidad_hilos),
    orden: aTexto(color.orden),
  };
}

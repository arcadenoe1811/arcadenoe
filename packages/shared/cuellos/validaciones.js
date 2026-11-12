import { LIMITES, TIPOS_CUELLO, ZONAS_COLOR } from './constantes.js';

/**
 * Reglas de validacion de cuellos y sus colores. Reciben los valores tal
 * como vienen del formulario (strings) y devuelven los datos normalizados
 * listos para enviar a la base.
 */

const PATRON_CODIGO = /^[a-z0-9][a-z0-9._#\-/]*$/;
const PATRON_URL = /^https?:\/\/\S+$/i;

/** @param {unknown} valor */
function textoOpcional(valor) {
  const texto = String(valor ?? '').trim();
  return texto === '' ? null : texto;
}

/**
 * Convierte un valor del formulario en entero o null.
 * @param {unknown} valor
 * @returns {{ numero: number|null, invalido: boolean }}
 */
function enteroOpcional(valor) {
  const texto = String(valor ?? '').trim();
  if (texto === '') return { numero: null, invalido: false };
  if (!/^-?\d+$/.test(texto)) return { numero: null, invalido: true };
  return { numero: Number(texto), invalido: false };
}

/**
 * Convierte "18, 17 16" o [18, 17, 16] en un arreglo de enteros unicos
 * ordenado de mayor a menor.
 * @param {unknown} valor
 * @returns {{ medidas: number[]|null, invalidas: string[] }}
 */
export function interpretarMedidas(valor) {
  const partes = Array.isArray(valor)
    ? valor.map((v) => String(v))
    : String(valor ?? '')
        .split(/[\s,;]+/)
        .filter(Boolean);

  const invalidas = [];
  const numeros = new Set();
  for (const parte of partes) {
    const { numero, invalido } = enteroOpcional(parte);
    if (invalido || numero === null || numero < LIMITES.medida.minimo || numero > LIMITES.medida.maximo) {
      invalidas.push(parte);
    } else {
      numeros.add(numero);
    }
  }
  const medidas = [...numeros].sort((a, b) => b - a);
  return { medidas: medidas.length ? medidas : null, invalidas };
}

/**
 * Normaliza un codigo: sin espacios a los lados y en minusculas.
 * @param {unknown} codigo
 */
export function normalizarCodigo(codigo) {
  return String(codigo ?? '').trim().toLowerCase();
}

/**
 * @param {Record<string, unknown>} formulario
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: Partial<import('../tipos/index.js').Cuello> }}
 */
export function validarCuello(formulario) {
  /** @type {Record<string, string>} */
  const errores = {};
  /** @type {Record<string, any>} */
  const datos = {};

  if (formulario.id) datos.id = formulario.id;

  // codigo
  const codigo = normalizarCodigo(formulario.codigo);
  if (!codigo) {
    errores.codigo = 'El código es obligatorio.';
  } else if (codigo.length > LIMITES.codigo.maximo) {
    errores.codigo = `El código no puede tener más de ${LIMITES.codigo.maximo} caracteres.`;
  } else if (!PATRON_CODIGO.test(codigo)) {
    errores.codigo = 'Usa letras, números y los símbolos . _ - # / (sin espacios).';
  }
  datos.codigo = codigo;

  // tipo
  if (!TIPOS_CUELLO.includes(/** @type {any} */ (formulario.tipo))) {
    errores.tipo = 'Elige el tipo de cuello.';
  }
  datos.tipo = formulario.tipo;

  // textos opcionales
  datos.nombre = textoOpcional(formulario.nombre);
  datos.notas = textoOpcional(formulario.notas);

  // numeros opcionales
  for (const campo of ['cantidad_hilos', 'posicion_cuerpo', 'posicion_tubular', 'pasadas_tubular']) {
    const { numero, invalido } = enteroOpcional(formulario[campo]);
    const { minimo, maximo } = LIMITES[campo];
    if (invalido) {
      errores[campo] = 'Debe ser un número entero.';
    } else if (numero !== null && (numero < minimo || numero > maximo)) {
      errores[campo] = `Debe estar entre ${minimo} y ${maximo}.`;
    }
    datos[campo] = numero;
  }

  // medidas
  const { medidas, invalidas } = interpretarMedidas(formulario.medidas);
  if (invalidas.length) {
    errores.medidas = `Medidas inválidas: ${invalidas.join(', ')}. Usa enteros entre ${LIMITES.medida.minimo} y ${LIMITES.medida.maximo}.`;
  }
  datos.medidas = medidas;

  // imagen
  const imagen = textoOpcional(formulario.imagen_url);
  if (imagen && !PATRON_URL.test(imagen)) {
    errores.imagen_url = 'Debe ser una URL que empiece por http:// o https://';
  }
  datos.imagen_url = imagen;

  if (typeof formulario.activo === 'boolean') datos.activo = formulario.activo;

  return { valido: Object.keys(errores).length === 0, errores, datos };
}

/**
 * Valida la lista de colores del formulario. Los errores usan la clave
 * `${indice}.${campo}`. Las filas totalmente vacias se descartan.
 * @param {Array<Record<string, unknown>>} colores
 * @returns {import('../tipos/index.js').ResultadoValidacion & { datos: import('../tipos/index.js').ColorCuello[] }}
 */
export function validarColoresCuello(colores = []) {
  /** @type {Record<string, string>} */
  const errores = {};
  /** @type {import('../tipos/index.js').ColorCuello[]} */
  const datos = [];

  colores.forEach((fila, indice) => {
    const color = textoOpcional(fila.color);
    const hilos = enteroOpcional(fila.cantidad_hilos);
    const orden = enteroOpcional(fila.orden);

    const vacia = !color && hilos.numero === null && !hilos.invalido && orden.numero === null && !orden.invalido;
    if (vacia) return;

    if (!ZONAS_COLOR.includes(/** @type {any} */ (fila.zona))) {
      errores[`${indice}.zona`] = 'Elige la zona.';
    }
    if (!color) {
      errores[`${indice}.color`] = 'Escribe el color.';
    }
    if (hilos.invalido) {
      errores[`${indice}.cantidad_hilos`] = 'Debe ser un entero.';
    } else if (
      hilos.numero !== null &&
      (hilos.numero < LIMITES.cantidad_hilos.minimo || hilos.numero > LIMITES.cantidad_hilos.maximo)
    ) {
      errores[`${indice}.cantidad_hilos`] = `Entre ${LIMITES.cantidad_hilos.minimo} y ${LIMITES.cantidad_hilos.maximo}.`;
    }
    if (orden.invalido) {
      errores[`${indice}.orden`] = 'Debe ser un entero.';
    } else if (orden.numero !== null && (orden.numero < LIMITES.orden.minimo || orden.numero > LIMITES.orden.maximo)) {
      errores[`${indice}.orden`] = `Entre ${LIMITES.orden.minimo} y ${LIMITES.orden.maximo}.`;
    }

    datos.push({
      zona: /** @type {any} */ (fila.zona),
      color: color ?? '',
      cantidad_hilos: hilos.numero,
      orden: orden.numero,
    });
  });

  return { valido: Object.keys(errores).length === 0, errores, datos };
}

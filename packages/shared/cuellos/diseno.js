/**
 * Diseno Jacquard del cuello (reemplaza la imagen).
 *
 * En la base solo se guarda un JSON pequeno con la "receta" del diseno
 * (texto, colores y lineas); la grilla de 100x80 se calcula al vuelo con
 * calcularDiseno(). Asi un cuello ocupa unos cientos de bytes en vez de
 * una imagen.
 *
 * Convencion de filas: la fila 1 es la de abajo y la 80 la de arriba (como
 * en la maquina). Internamente la grilla se recorre de arriba (indice 0)
 * hacia abajo. Los desplazamientos guardados son "positivo = sube".
 *
 * @typedef {'tubular'|'linea'} TipoLinea
 * @typedef {{ tipo: TipoLinea, pasadas: number, color: string }} LineaDiseno
 * @typedef {LineaDiseno & { desplazamiento: number }} LineaMedio
 * @typedef {Object} DisenoCuello
 * @property {number} v                version del formato
 * @property {string} texto            nombre de marca (en mayusculas)
 * @property {string} fondo            color de fondo (#rrggbb)
 * @property {string} color_texto      color de las letras (#rrggbb)
 * @property {number} desplazamiento   filas que sube (+) o baja (-) el texto
 * @property {LineaDiseno[]} debajo    lineas desde la fila 1 hacia arriba
 * @property {LineaDiseno[]} arriba    lineas encima del texto
 * @property {LineaMedio[]} medio      lineas que cruzan el texto (lo saltan)
 */

export const DISENO_COLUMNAS = 100
export const DISENO_FILAS = 80
export const FILAS_FUENTE = 9
export const VERSION_DISENO = 1

export const TIPOS_LINEA = ['tubular', 'linea']
export const ETIQUETAS_LINEA = { tubular: 'Tubular', linea: 'Línea' }

/** Zonas de lineas, en el orden en que se muestran en el editor. */
export const ZONAS_LINEA = [
  { clave: 'debajo', titulo: 'Líneas debajo del texto (desde la fila 1)' },
  { clave: 'arriba', titulo: 'Líneas arriba del texto' },
  { clave: 'medio', titulo: 'Líneas en medio del texto' },
]

export const LIMITES_DISENO = {
  texto: { maximo: 18 },
  pasadas: { minimo: 1, maximo: 20 },
  desplazamiento: { minimo: -DISENO_FILAS, maximo: DISENO_FILAS },
  lineas_por_zona: { maximo: 20 },
}

const PATRON_HEX = /^#[0-9a-f]{6}$/i

/* ------------------------------------------------------------------ */
/* Fuente bitmap de 9 filas                                            */
/* ------------------------------------------------------------------ */

/** Cada letra son 9 cadenas; "#" = punto del color del texto. */
// prettier-ignore
const FUENTE_TEXTO = {
  A: ['..###..', '.#...#.', '#.....#', '#.....#', '#######', '#.....#', '#.....#', '#.....#', '#.....#'],
  B: ['#####.', '#....#', '#....#', '#####.', '#....#', '#....#', '#....#', '#....#', '#####.'],
  C: ['.####.', '#....#', '#.....', '#.....', '#.....', '#.....', '#.....', '#....#', '.####.'],
  D: ['####..', '#...#.', '#....#', '#....#', '#....#', '#....#', '#....#', '#...#.', '####..'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....', '#....', '#....'],
  G: ['.####.', '#....#', '#.....', '#.....', '#..###', '#....#', '#....#', '#....#', '.####.'],
  H: ['#....#', '#....#', '#....#', '######', '#....#', '#....#', '#....#', '#....#', '#....#'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '#####'],
  J: ['....#', '....#', '....#', '....#', '....#', '....#', '#...#', '#...#', '.###.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '##...', '#.#..', '#..#.', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#.....#', '##...##', '#.#.#.#', '#..#..#', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#'],
  N: ['#....#', '##...#', '#.#..#', '#..#.#', '#...##', '#....#', '#....#', '#....#', '#....#'],
  Ñ: ['.##..#', '#..##.', '#....#', '##...#', '#.#..#', '#..#.#', '#...##', '#....#', '#....#'],
  O: ['.####.', '#....#', '#....#', '#....#', '#....#', '#....#', '#....#', '#....#', '.####.'],
  P: ['#####.', '#....#', '#....#', '#....#', '#####.', '#.....', '#.....', '#.....', '#.....'],
  Q: ['.####.', '#....#', '#....#', '#....#', '#....#', '#..#.#', '#...#.', '.####.', '.....#'],
  R: ['#####.', '#....#', '#....#', '#....#', '#####.', '#..#..', '#...#.', '#....#', '#....#'],
  S: ['.####', '#....', '#....', '.##..', '...#.', '....#', '....#', '#...#', '.###.'],
  T: ['#######', '...#...', '...#...', '...#...', '...#...', '...#...', '...#...', '...#...', '...#...'],
  U: ['#....#', '#....#', '#....#', '#....#', '#....#', '#....#', '#....#', '#....#', '.####.'],
  V: ['#.....#', '#.....#', '#.....#', '.#...#.', '.#...#.', '..#.#..', '..#.#..', '...#...', '...#...'],
  W: ['#.....#', '#.....#', '#.....#', '#.....#', '#..#..#', '#.#.#.#', '##...##', '#.....#', '#.....#'],
  X: ['#....#', '#....#', '.#..#.', '..##..', '..##..', '.#..#.', '#....#', '#....#', '#....#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  Z: ['######', '....#.', '...#..', '...#..', '..#...', '.#....', '.#....', '#.....', '######'],
  0: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  1: ['..#.', '.##.', '..#.', '..#.', '..#.', '..#.', '..#.', '..#.', '.###'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#....', '#....', '#####'],
  3: ['.###.', '#...#', '....#', '..##.', '....#', '....#', '....#', '#...#', '.###.'],
  4: ['#...#', '#...#', '#...#', '#####', '....#', '....#', '....#', '....#', '....#'],
  5: ['#####', '#....', '#....', '####.', '....#', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '...#.', '..#..', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '#...#', '.####', '....#', '....#', '....#', '.###.'],
  '-': ['....', '....', '....', '....', '####', '....', '....', '....', '....'],
  '.': ['..', '..', '..', '..', '..', '..', '..', '##', '##'],
  ' ': ['..', '..', '..', '..', '..', '..', '..', '..', '..'],
}

/** Fuente como matrices de 0/1 (formato del disenador original). */
export const FUENTE = Object.fromEntries(
  Object.entries(FUENTE_TEXTO).map(([letra, filas]) => [
    letra,
    filas.map((fila) => [...fila].map((punto) => (punto === '#' ? 1 : 0))),
  ]),
)

/** Caracteres que la fuente sabe dibujar. */
export const CARACTERES_FUENTE = Object.keys(FUENTE).join('')

/**
 * Normaliza el texto de marca: mayusculas, sin tildes (salvo la Ñ) y solo
 * caracteres de la fuente (el resto se vuelve espacio).
 * @param {unknown} texto
 */
export function normalizarTextoDiseno(texto) {
  return [...String(texto ?? '').toUpperCase()]
    .map((c) => (c === 'Ñ' ? c : c.normalize('NFD').charAt(0)))
    .map((c) => (FUENTE[c] ? c : ' '))
    .join('')
    .slice(0, LIMITES_DISENO.texto.maximo)
}

/**
 * Mapa de bits (FILAS_FUENTE filas) del texto, con una columna de
 * separacion entre letras. Texto vacio => [].
 * @param {string} texto
 * @returns {number[][]}
 */
export function mapaTexto(texto) {
  const letras = [...normalizarTextoDiseno(texto)]
  if (!letras.length) return []
  return Array.from({ length: FILAS_FUENTE }, (_, fila) =>
    letras.flatMap((letra, i) => [
      ...FUENTE[letra][fila],
      ...(i < letras.length - 1 ? [0] : []),
    ]),
  )
}

/* ------------------------------------------------------------------ */
/* Diseno por defecto y calculo de la grilla                           */
/* ------------------------------------------------------------------ */

/**
 * Diseno inicial para un cuello nuevo.
 * @param {{ texto?: string }} [opciones]
 * @returns {DisenoCuello}
 */
export function disenoPorDefecto({ texto = '' } = {}) {
  return {
    v: VERSION_DISENO,
    texto: normalizarTextoDiseno(texto),
    fondo: '#1a1a2e',
    color_texto: '#f1c40f',
    desplazamiento: 0,
    debajo: [
      { tipo: 'tubular', pasadas: 12, color: '#c8a415' },
      { tipo: 'linea', pasadas: 4, color: '#c8a415' },
    ],
    arriba: [{ tipo: 'linea', pasadas: 4, color: '#c8a415' }],
    medio: [],
  }
}

/** Linea nueva para una zona. @param {'debajo'|'arriba'|'medio'} zona */
export function lineaNueva(zona) {
  const linea = { tipo: 'linea', pasadas: 4, color: '#c8a415' }
  return zona === 'medio' ? { ...linea, desplazamiento: 0 } : linea
}

const etiquetaLinea = (linea) => `${linea.tipo} (${linea.pasadas}p)`

/**
 * Calcula la grilla del diseno. El texto se pinta al final, asi siempre
 * queda completo encima de las lineas.
 * @param {DisenoCuello} diseno
 * @returns {{ celdas: string[][], anotaciones: string[], filaTexto: number }}
 *   celdas[fila][columna] con fila 0 = arriba (fila DISENO_FILAS de la maquina).
 */
export function calcularDiseno(diseno) {
  const COLS = DISENO_COLUMNAS
  const FILAS = DISENO_FILAS
  const fondo = diseno?.fondo ?? '#ffffff'
  const debajo = diseno?.debajo ?? []
  const arriba = diseno?.arriba ?? []
  const medio = diseno?.medio ?? []

  const mapa = mapaTexto(diseno?.texto ?? '')
  const anchoTexto = mapa.length ? mapa[0].length : 0
  const columnaTexto = Math.floor((COLS - anchoTexto) / 2)
  // Las lineas del medio dejan una columna libre a cada lado del texto.
  const saltoIzquierda = columnaTexto - 1
  const saltoDerecha = columnaTexto + anchoTexto

  const celdas = Array.from({ length: FILAS }, () => Array(COLS).fill(fondo))
  const anotaciones = Array(FILAS).fill('')
  const pintarFila = (fila, color, desde = 0, hasta = COLS - 1) => {
    if (fila < 0 || fila >= FILAS) return
    for (let c = Math.max(0, desde); c <= Math.min(COLS - 1, hasta); c++) {
      celdas[fila][c] = color
    }
  }
  const anotar = (fila, linea) => {
    if (fila >= 0 && fila < FILAS) anotaciones[fila] = etiquetaLinea(linea)
  }

  // Lineas de abajo: desde la fila 1 (ultima del arreglo) hacia arriba.
  let actual = FILAS
  for (const linea of debajo) {
    for (let p = 0; p < linea.pasadas; p++) pintarFila(actual - 1 - p, linea.color)
    anotar(actual - linea.pasadas, linea)
    actual -= linea.pasadas
  }
  const finCuerpo = actual - 1

  // Texto: a media altura del cuerpo libre, mas el desplazamiento del usuario.
  const base = Math.max(0, Math.floor((finCuerpo + 1) * 0.5))
  let filaTexto = base - (diseno?.desplazamiento ?? 0)
  if (filaTexto + FILAS_FUENTE - 1 > finCuerpo) {
    filaTexto = Math.max(0, finCuerpo - FILAS_FUENTE + 1)
  }
  if (filaTexto < 0) filaTexto = 0

  // Lineas del medio: siguen al texto y saltan su zona horizontal.
  for (const linea of medio) {
    const inicio = filaTexto + 4 - (linea.desplazamiento ?? 0)
    for (let p = 0; p < linea.pasadas; p++) {
      if (mapa.length) {
        pintarFila(inicio + p, linea.color, 0, saltoIzquierda - 1)
        pintarFila(inicio + p, linea.color, saltoDerecha + 1, COLS - 1)
      } else {
        pintarFila(inicio + p, linea.color)
      }
    }
    anotar(inicio, linea)
  }

  // Lineas de arriba: dejan una fila de separacion sobre el texto.
  let cursor = filaTexto - 2
  for (let i = arriba.length - 1; i >= 0; i--) {
    const linea = arriba[i]
    for (let p = 0; p < linea.pasadas; p++) pintarFila(cursor - p, linea.color)
    anotar(cursor - linea.pasadas + 1, linea)
    cursor -= linea.pasadas
  }

  // Texto al final: siempre encima y completo.
  const colorTexto = diseno?.color_texto ?? '#000000'
  for (let f = 0; f < mapa.length; f++) {
    for (let c = 0; c < anchoTexto; c++) {
      const fila = filaTexto + f
      const columna = columnaTexto + c
      if (mapa[f][c] && fila >= 0 && fila < FILAS && columna >= 0 && columna < COLS) {
        celdas[fila][columna] = colorTexto
      }
    }
  }

  return { celdas, anotaciones, filaTexto }
}

/* ------------------------------------------------------------------ */
/* Validacion                                                          */
/* ------------------------------------------------------------------ */

function entero(valor, { minimo, maximo }, porDefecto) {
  const numero = Number(valor)
  if (!Number.isInteger(numero)) return { numero: porDefecto, invalido: true }
  if (numero < minimo || numero > maximo) {
    return { numero: Math.min(maximo, Math.max(minimo, numero)), invalido: true }
  }
  return { numero, invalido: false }
}

/**
 * Valida y limpia un diseno (solo deja las claves conocidas). null/undefined
 * significa "sin diseno".
 * @param {unknown} valor
 * @returns {{ valido: boolean, error: string|null, datos: DisenoCuello|null }}
 */
export function validarDiseno(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return { valido: true, error: null, datos: null }
  }
  if (typeof valor !== 'object' || Array.isArray(valor)) {
    return { valido: false, error: 'El diseño no es válido.', datos: null }
  }
  const d = /** @type {Record<string, any>} */ (valor)
  const problemas = []

  const texto = String(d.texto ?? '')
  if (texto.length > LIMITES_DISENO.texto.maximo) {
    problemas.push(`El texto admite hasta ${LIMITES_DISENO.texto.maximo} caracteres`)
  }

  const hex = (color, nombre) => {
    if (PATRON_HEX.test(String(color ?? ''))) return String(color).toLowerCase()
    problemas.push(`Color inválido en ${nombre}`)
    return '#000000'
  }

  const desplazamiento = entero(d.desplazamiento ?? 0, LIMITES_DISENO.desplazamiento, 0)
  if (desplazamiento.invalido) problemas.push('Posición del texto fuera de rango')

  const lineas = (zona, titulo) => {
    const lista = Array.isArray(d[zona]) ? d[zona] : []
    if (lista.length > LIMITES_DISENO.lineas_por_zona.maximo) {
      problemas.push(
        `Máximo ${LIMITES_DISENO.lineas_por_zona.maximo} ${titulo.toLowerCase()}`,
      )
    }
    return lista.slice(0, LIMITES_DISENO.lineas_por_zona.maximo).map((l, i) => {
      const nombre = `${titulo.toLowerCase()} ${i + 1}`
      const tipo = TIPOS_LINEA.includes(l?.tipo) ? l.tipo : 'linea'
      if (tipo !== l?.tipo) problemas.push(`Tipo inválido en ${nombre}`)
      const pasadas = entero(l?.pasadas, LIMITES_DISENO.pasadas, 4)
      if (pasadas.invalido) {
        problemas.push(
          `Pasadas de ${nombre}: entre ${LIMITES_DISENO.pasadas.minimo} y ${LIMITES_DISENO.pasadas.maximo}`,
        )
      }
      const limpia = { tipo, pasadas: pasadas.numero, color: hex(l?.color, nombre) }
      if (zona === 'medio') {
        const mover = entero(l?.desplazamiento ?? 0, LIMITES_DISENO.desplazamiento, 0)
        if (mover.invalido) problemas.push(`Posición de ${nombre} fuera de rango`)
        limpia.desplazamiento = mover.numero
      }
      return limpia
    })
  }

  const datos = {
    v: VERSION_DISENO,
    texto: normalizarTextoDiseno(texto),
    fondo: hex(d.fondo, 'el fondo'),
    color_texto: hex(d.color_texto, 'el texto'),
    desplazamiento: desplazamiento.numero,
    debajo: lineas('debajo', 'Líneas de abajo'),
    arriba: lineas('arriba', 'Líneas de arriba'),
    medio: lineas('medio', 'Líneas del medio'),
  }

  if (problemas.length) {
    return { valido: false, error: `${problemas.join('. ')}.`, datos }
  }
  return { valido: true, error: null, datos }
}

/* ---------- Colores del diseno <-> "Colores por zona" ---------- */

const normalizarHex = (hex) => String(hex ?? '').toLowerCase()

/**
 * Aplica `fn` a cada color del diseno (fondo, letras y cada linea) y
 * devuelve un diseno nuevo.
 * @param {DisenoCuello} diseno
 * @param {(hex: string) => string} fn
 * @returns {DisenoCuello}
 */
export function mapearColoresDiseno(diseno, fn) {
  const lineas = (lista) => (lista ?? []).map((l) => ({ ...l, color: fn(l.color) }))
  return {
    ...diseno,
    fondo: fn(diseno.fondo),
    color_texto: fn(diseno.color_texto),
    debajo: lineas(diseno.debajo),
    arriba: lineas(diseno.arriba),
    medio: lineas(diseno.medio),
  }
}

/**
 * Colores del diseno que NO estan entre los permitidos (los tonos de
 * "Colores por zona"). Vacio = el diseno solo usa colores del cuello.
 * @param {DisenoCuello|null|undefined} diseno
 * @param {string[]} permitidos  hex #rrggbb
 * @returns {string[]}
 */
export function coloresFueraDeLista(diseno, permitidos) {
  if (!diseno) return []
  const lista = new Set(permitidos.map(normalizarHex))
  const fuera = new Set()
  mapearColoresDiseno(diseno, (hex) => {
    if (!lista.has(normalizarHex(hex))) fuera.add(normalizarHex(hex))
    return hex
  })
  return [...fuera]
}

/**
 * Diseno inicial que ya usa los colores del cuello: fondo = primer color,
 * letras = el color marcado como letra (o el segundo), lineas = el
 * tercero (o el ultimo disponible).
 * @param {{ texto?: string, colores: string[], indiceLetra?: number }} opciones
 * @returns {DisenoCuello}
 */
export function disenoConColores({ texto = '', colores, indiceLetra = -1 }) {
  const base = disenoPorDefecto({ texto })
  if (!colores.length) return base
  const fondo = colores[0]
  const letras =
    indiceLetra > 0 && colores[indiceLetra] ? colores[indiceLetra] : (colores[1] ?? fondo)
  const resto = colores.filter((c) => c !== fondo && c !== letras)
  const linea = resto[0] ?? letras
  return { ...mapearColoresDiseno(base, () => linea), fondo, color_texto: letras }
}

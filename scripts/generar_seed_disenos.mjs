// Genera supabase/seed_disenos.sql: 40 piezas de ejemplo (cuellos y punos)
// que muestran todas las formas de diseno: propio, heredado (siempre entre
// cuello y puno), mapa de colores, cambios del hijo y plantillas.
//
// Cada pieza se valida con las mismas reglas de la app (packages/shared).
// Uso: node scripts/generar_seed_disenos.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const importar = (ruta) => import(pathToFileURL(join(raiz, ruta)).href)
const { validarCuello, validarColoresCuello } = await importar(
  'packages/shared/cuellos/validaciones.js',
)
const { calcularDisenosEfectivos, coloresSinPareja, paletaDiseno } = await importar(
  'packages/shared/cuellos/herencia.js',
)
const { coloresFueraDeLista } = await importar('packages/shared/cuellos/diseno.js')
const { tallasDeMedidas, piezaPadrePermitida } = await importar(
  'packages/shared/cuellos/piezas.js',
)

/* ---------------- Colores (nombre, codigo de cono, tono) ---------------- */
const C = {
  azul: ['azul', '30', '#1f4fa3'],
  marino: ['azul marino', '3', '#0e1a4a'],
  blanco: ['blanco', '1', '#ffffff'],
  rojo: ['rojo', '40', '#c62828'],
  negro: ['negro', '2', '#1a1a1a'],
  corinto: ['corinto', '16', '#8e0d42'],
  dorado: ['dorado', '27', '#f1c40f'],
  mostaza: ['mostaza', '28', '#c8a415'],
  verde: ['verde', '52', '#2d6a4f'],
  limon: ['verde limón', '56', '#95d5b2'],
  celeste: ['celeste', '34', '#7ec8e3'],
  gris: ['gris', '8', '#9e9e9e'],
  naranja: ['naranja', '33', '#f4a261'],
  vino: ['vino', '44', '#6d1a36'],
  crema: ['crema', '4', '#f3e9d2'],
  turquesa: ['turquesa', '53', '#2a9d8f'],
  carbon: ['carbón', '5', '#264653'],
  coral: ['coral', '41', '#e76f51'],
  morado: ['morado', '60', '#5b2a86'],
  rosado: ['rosado', '62', '#e7a1b0'],
  amarillo: ['amarillo', '29', '#ffd166'],
  cafe: ['café', '70', '#6f4e37'],
}

/* ---------------- Estilos de diseno ----------------
 * Reciben los tonos por posicion: h[0] fondo, h[1] letras/detalle, h[2] lineas. */
const L = (tipo, pasadas, color, extra = {}) => ({ tipo, pasadas, color, ...extra })
const ESTILOS = {
  // Texto grande con un tubular grueso abajo (como cous2t)
  texto: (h, texto) => ({
    texto,
    fondo: h[0],
    color_texto: h[1],
    desplazamiento: -1,
    debajo: [L('tubular', 20, h[2])],
    arriba: [],
    medio: [],
  }),
  // Solo el nombre, sin lineas (como cpg)
  'solo-texto': (h, texto) => ({
    texto,
    fondo: h[0],
    color_texto: h[1],
    desplazamiento: -7,
    debajo: [],
    arriba: [],
    medio: [],
  }),
  clasico: (h, texto) => ({
    texto,
    fondo: h[0],
    color_texto: h[1],
    desplazamiento: -2,
    debajo: [L('tubular', 10, h[2]), L('linea', 4, h[1])],
    arriba: [L('linea', 4, h[2])],
    medio: [],
  }),
  // Doble linea despues del tubular, sin texto (como maz4d3)
  'doble-linea': (h) => ({
    texto: '',
    fondo: h[0],
    color_texto: h[1],
    desplazamiento: 0,
    debajo: [
      L('tubular', 12, h[1]),
      L('linea', 3, h[2]),
      L('linea', 3, h[1]),
      L('linea', 3, h[2]),
    ],
    arriba: [L('linea', 3, h[2]), L('linea', 3, h[1])],
    medio: [],
  }),
  'linea-media': (h, texto) => ({
    texto,
    fondo: h[0],
    color_texto: h[1],
    desplazamiento: 0,
    debajo: [L('tubular', 12, h[2]), L('linea', 4, h[2])],
    arriba: [L('linea', 4, h[2])],
    medio: [L('linea', 2, h[2], { desplazamiento: 0 })],
  }),
  franjas: (h, texto) => ({
    texto,
    fondo: h[0],
    color_texto: h[1],
    desplazamiento: 0,
    debajo: [L('tubular', 10, h[2]), L('linea', 2, h[1]), L('linea', 2, h[2])],
    arriba: [L('linea', 2, h[2]), L('linea', 2, h[1]), L('linea', 2, h[2])],
    medio: [],
  }),
  // Liso: sin texto, solo el tubular
  liso: (h) => ({
    texto: '',
    fondo: h[0],
    color_texto: h[1],
    desplazamiento: 0,
    debajo: [L('tubular', 14, h[1])],
    arriba: [],
    medio: [],
  }),
  rayas: (h) => ({
    texto: '',
    fondo: h[0],
    color_texto: h[1],
    desplazamiento: 0,
    debajo: [
      L('tubular', 8, h[1]),
      L('linea', 2, h[2]),
      L('linea', 2, h[1]),
      L('linea', 2, h[2]),
      L('linea', 2, h[1]),
    ],
    arriba: [L('linea', 2, h[2]), L('linea', 2, h[1]), L('linea', 2, h[2])],
    medio: [],
  }),
}

/* ---------------- Piezas ----------------
 * colores: claves de C, en orden de posicion (1, 2, 3...).
 * letra: posicion (desde 1) del color que forma letras.
 * estilo/texto: diseno propio. padre: [pieza, codigo] para heredar.
 * Los punos sin `tallas` usan las equivalentes a las medidas de su cuello. */
const PIEZAS = [
  // ===== Cuellos con diseno propio =====
  {
    pieza: 'cuello',
    codigo: 'cous2t',
    nombre: 'Conusec mitad',
    tipo: 'con nombre',
    medidas: [18, 17, 16, 15],
    colores: ['marino', 'blanco', 'rojo'],
    letra: 2,
    estilo: 'texto',
    texto: 'CONUSEC',
    notas: 'Texto CONUSEC con tubular rojo de 20 pasadas.',
    usaPuno: [
      'maz4d3',
      'Mismo diseño que el puño maz4d3, tejido con los colores de cous2t (azul marino, blanco, rojo).',
    ],
  },
  {
    pieza: 'cuello',
    codigo: 'cpg',
    nombre: 'CPG',
    tipo: 'con nombre',
    medidas: [16, 15],
    colores: ['corinto', 'blanco'],
    letra: 2,
    estilo: 'solo-texto',
    texto: 'CPG',
    notas: 'Solo el nombre, sin líneas.',
    usaPuno: [
      'maz4d3',
      'Mismo diseño que el puño maz4d3 con los colores de cpg. Solo hay 2 colores: lo rojo del puño va en blanco.',
    ],
  },
  {
    pieza: 'cuello',
    codigo: 'maz4d3',
    nombre: 'Doble línea después del tubular',
    tipo: 'doble linea despues del tubular',
    medidas: [18, 17, 16, 15],
    colores: ['azul', 'blanco', 'rojo'],
    estilo: 'doble-linea',
    notas: 'Diseño base de líneas que usan varios puños de otros productos.',
  },
  {
    pieza: 'cuello',
    codigo: 'maz4t5',
    nombre: 'Maza tubular',
    tipo: 'tubular',
    medidas: [18, 17, 16],
    colores: ['marino', 'blanco'],
    estilo: 'liso',
    notas: 'Liso con tubular blanco.',
  },
  {
    pieza: 'cuello',
    codigo: 'ven01',
    nombre: 'Venecia',
    tipo: 'con nombre',
    medidas: [18, 17, 16],
    colores: ['marino', 'dorado', 'mostaza'],
    letra: 2,
    estilo: 'clasico',
    texto: 'VENECIA',
  },
  {
    pieza: 'cuello',
    codigo: 'aur02',
    nombre: 'Aurora',
    tipo: 'doble linea despues del tubular',
    medidas: [16, 15, 14],
    colores: ['turquesa', 'amarillo', 'carbon'],
    letra: 2,
    estilo: 'franjas',
    texto: 'AURORA',
  },
  {
    pieza: 'cuello',
    codigo: 'atl03',
    nombre: 'Atlas',
    tipo: 'con nombre',
    medidas: [18, 17, 16],
    colores: ['verde', 'blanco', 'limon'],
    letra: 2,
    estilo: 'linea-media',
    texto: 'ATLAS',
  },
  {
    pieza: 'cuello',
    codigo: 'fen04',
    nombre: 'Fénix',
    tipo: 'con nombre',
    medidas: [17, 16, 15],
    colores: ['vino', 'crema', 'coral'],
    letra: 2,
    estilo: 'clasico',
    texto: 'FENIX',
  },
  {
    pieza: 'cuello',
    codigo: 'con05',
    nombre: 'Cóndor',
    tipo: 'con nombre',
    medidas: [18, 17],
    colores: ['negro', 'dorado', 'gris'],
    letra: 2,
    estilo: 'texto',
    texto: 'CONDOR',
  },
  {
    pieza: 'cuello',
    codigo: 'gal06',
    nombre: 'Galaxia',
    tipo: 'con nombre',
    medidas: [16, 15, 14, 13],
    colores: ['morado', 'blanco', 'celeste'],
    letra: 2,
    estilo: 'linea-media',
    texto: 'GALAXIA',
  },
  {
    pieza: 'cuello',
    codigo: 'ray07',
    nombre: 'Rayas',
    tipo: 'gaspeado',
    medidas: [18, 17, 16, 15, 14],
    colores: ['azul', 'blanco', 'rojo'],
    estilo: 'rayas',
    notas: 'Rayas alternadas blanco y rojo.',
  },
  {
    pieza: 'cuello',
    codigo: 'lis08',
    nombre: 'Liso azul',
    tipo: 'liso',
    medidas: [18, 17, 16, 15, 14, 13, 12],
    colores: ['azul', 'blanco'],
    estilo: 'liso',
    notas: 'Liso base: varios puños lo usan con sus propios colores.',
  },
  {
    pieza: 'cuello',
    codigo: 'sol09',
    nombre: 'Solar',
    tipo: 'con nombre',
    medidas: [16, 15, 14],
    colores: ['naranja', 'blanco', 'carbon'],
    letra: 2,
    estilo: 'texto',
    texto: 'SOLAR',
    usaPuno: [
      'ray07',
      'Las rayas del puño ray07 con los colores de Solar (naranja, blanco, carbón).',
    ],
  },
  {
    pieza: 'cuello',
    codigo: 'zaf10',
    nombre: 'Zafiro',
    tipo: 'con nombre',
    medidas: [18, 17, 16],
    colores: ['marino', 'celeste', 'blanco'],
    letra: 2,
    estilo: 'franjas',
    texto: 'ZAFIRO',
  },
  {
    pieza: 'cuello',
    codigo: 'inc11',
    nombre: 'Inca',
    tipo: 'con nombre',
    medidas: [17, 16],
    colores: ['cafe', 'amarillo', 'rojo'],
    letra: 2,
    estilo: 'clasico',
    texto: 'INCA',
    usaPuno: [
      'lis08',
      'Puño liso de lis08 en café y amarillo; a veces se pide con el tubular rojo.',
    ],
  },
  {
    pieza: 'cuello',
    codigo: 'luna12',
    nombre: 'Luna',
    tipo: 'con nombre',
    medidas: [15, 14, 13],
    colores: ['carbon', 'crema'],
    letra: 2,
    estilo: 'solo-texto',
    texto: 'LUNA',
  },
  {
    pieza: 'cuello',
    codigo: 'ros13',
    nombre: 'Rosa',
    tipo: 'doble linea despues del tubular',
    medidas: [16, 15, 14],
    colores: ['rosado', 'blanco', 'vino'],
    estilo: 'doble-linea',
  },
  {
    pieza: 'cuello',
    codigo: 'roma17',
    nombre: 'Roma',
    tipo: 'con nombre',
    medidas: [17, 16, 15],
    colores: ['vino', 'crema', 'mostaza'],
    letra: 2,
    estilo: 'clasico',
    texto: 'ROMA',
    notas: 'Copiado de Venecia como PLANTILLA: si Venecia cambia, Roma no cambia.',
  },

  {
    pieza: 'cuello',
    codigo: 'nor18',
    nombre: 'Norte',
    tipo: 'con nombre',
    medidas: [18, 17, 16],
    colores: ['negro', 'celeste', 'blanco'],
    letra: 2,
    estilo: 'linea-media',
    texto: 'NORTE',
  },
  {
    pieza: 'cuello',
    codigo: 'bri19',
    nombre: 'Brisa',
    tipo: 'con nombre',
    medidas: [16, 15, 14],
    colores: ['turquesa', 'blanco', 'carbon'],
    letra: 2,
    estilo: 'solo-texto',
    texto: 'BRISA',
    usaPuno: [
      'maz4d3',
      'Mismo diseño que el puño maz4d3, tejido con los colores de bri19 (turquesa, blanco, carbón).',
    ],
  },
  {
    pieza: 'cuello',
    codigo: 'pac20',
    nombre: 'Pacífico',
    tipo: 'con nombre',
    medidas: [18, 17],
    colores: ['marino', 'blanco', 'celeste'],
    letra: 2,
    estilo: 'texto',
    texto: 'PACIFICO',
    usaPuno: [
      'zaf10',
      'Usa el puño de Zafiro tal cual (mismos colores): no lleva el nombre PACIFICO.',
    ],
  },

  // ===== Punos =====
  {
    pieza: 'puno',
    codigo: 'maz4d3',
    padre: ['cuello', 'maz4d3'],
    de: 'maz4d3',
    notas: 'Igual a su cuello.',
  },
  {
    pieza: 'puno',
    codigo: 'maz4t5',
    padre: ['cuello', 'maz4t5'],
    de: 'maz4t5',
    notas: 'Igual a su cuello.',
  },
  {
    pieza: 'puno',
    codigo: 'ven01',
    padre: ['cuello', 'ven01'],
    de: 'ven01',
    notas: 'Igual a su cuello.',
  },
  {
    pieza: 'puno',
    codigo: 'aur02',
    padre: ['cuello', 'aur02'],
    de: 'aur02',
    overrides: { texto: 'AUR' },
    notas: 'Mismo diseño, texto corto AUR porque el puño es más pequeño.',
  },
  {
    pieza: 'puno',
    codigo: 'atl03',
    padre: ['cuello', 'atl03'],
    de: 'atl03',
    colores: ['verde', 'blanco', 'limon', 'amarillo'],
    letra: 4,
    overrides: { color_texto: '#ffd166' },
    notas: 'Tiene un 4.º color: letras amarillas en vez de blancas.',
  },
  {
    pieza: 'puno',
    codigo: 'fen04',
    padre: ['cuello', 'fen04'],
    de: 'fen04',
    overrides: { texto: 'FNX' },
    notas: 'Texto abreviado FNX.',
  },
  {
    pieza: 'puno',
    codigo: 'con05',
    padre: ['cuello', 'con05'],
    de: 'con05',
    colores: ['negro', 'dorado'],
    mapa: { 3: 2 },
    notas: 'Solo 2 colores: el tubular gris del cuello sale dorado.',
  },
  {
    pieza: 'puno',
    codigo: 'gal06',
    padre: ['cuello', 'gal06'],
    de: 'gal06',
    notas: 'Igual a su cuello.',
  },
  {
    pieza: 'puno',
    codigo: 'ray07',
    padre: ['cuello', 'ray07'],
    de: 'ray07',
    notas: 'Igual a su cuello.',
  },
  {
    pieza: 'puno',
    codigo: 'lis08',
    padre: ['cuello', 'lis08'],
    de: 'lis08',
    notas: 'Igual a su cuello.',
  },
  {
    pieza: 'puno',
    codigo: 'zaf10',
    padre: ['cuello', 'zaf10'],
    de: 'zaf10',
    mapa: { 2: 3, 3: 2 },
    notas: 'Colores cruzados: letras blancas y líneas celestes (al revés que el cuello).',
  },
  {
    pieza: 'puno',
    codigo: 'nor18',
    padre: ['cuello', 'nor18'],
    de: 'nor18',
    overrides: { texto: 'NOR' },
    notas: 'Texto corto NOR.',
  },
  {
    pieza: 'puno',
    codigo: 'luna12',
    nombre: 'Luna (puño)',
    tipo: 'liso',
    tallas: ['pp', 'pg'],
    colores: ['carbon', 'crema'],
    estilo: 'liso',
    notas: 'Mismo código que el cuello Luna, pero diseño propio (no hereda).',
  },
  {
    pieza: 'puno',
    codigo: 'ros13',
    padre: ['cuello', 'ros13'],
    de: 'ros13',
    notas: 'Igual a su cuello.',
  },
  {
    pieza: 'puno',
    codigo: 'roma17',
    padre: ['cuello', 'roma17'],
    de: 'roma17',
    notas: 'Igual a su cuello.',
  },

  // ===== Cuello que hereda de un puno (y cadena puno -> cuello -> puno) =====
  {
    pieza: 'puno',
    codigo: 'zig15',
    nombre: 'Zigzag',
    tipo: 'tubular',
    tallas: ['pp', 'pg', 'pee'],
    colores: ['carbon', 'coral', 'blanco'],
    estilo: 'rayas',
    notas: 'Diseño nacido como puño; el cuello zig15 lo hereda.',
  },
  {
    pieza: 'cuello',
    codigo: 'zig15',
    padre: ['puno', 'zig15'],
    de: 'zig15',
    medidas: [16, 15, 14],
    notas: 'Cuello que hereda de su puño.',
  },
  {
    pieza: 'cuello',
    codigo: 'zig16',
    nombre: 'Zigzag nocturno',
    tipo: 'tubular',
    padre: ['puno', 'zig15'],
    medidas: [18, 17],
    colores: ['marino', 'amarillo', 'celeste'],
    notas: 'Hereda del puño zig15 con otros colores.',
  },
  {
    pieza: 'puno',
    codigo: 'zig16',
    padre: ['cuello', 'zig16'],
    de: 'zig16',
    notas:
      'Cadena de 3: puño zig15 → cuello zig16 → este puño. Cambia el puño zig15 y se ve aquí.',
  },
]

/* ---------------- Armado y validacion ---------------- */
const clave = (pieza, codigo) => `${pieza}:${codigo}`
const porClave = new Map()
for (const p of PIEZAS) {
  // `de`: hereda los datos tecnicos/colores de esa pieza (su cuello o puno).
  const base = p.de
    ? (porClave.get(clave(p.pieza === 'puno' ? 'cuello' : 'puno', p.de)) ??
      porClave.get(clave('cuello', p.de)))
    : null
  const datos = {
    nombre: base?.nombre,
    tipo: base?.tipo,
    medidas: base?.medidas,
    colores: base?.coloresClaves,
    letra: base?.letra,
    ...p,
  }
  if (datos.pieza === 'puno' && !datos.tallas)
    datos.tallas = tallasDeMedidas(base?.medidas ?? datos.medidas)
  if (datos.pieza === 'puno') datos.medidas = null
  datos.coloresClaves = datos.colores
  datos.hex = datos.colores.map((c) => C[c][2])
  porClave.set(clave(p.pieza, p.codigo), datos)
}

const efectivos = calcularDisenosEfectivos(
  [...porClave.values()].map((p) => ({
    id: clave(p.pieza, p.codigo),
    padre_id: p.padre ? clave(...p.padre) : null,
    diseno: p.estilo ? { v: 1, ...ESTILOS[p.estilo](p.hex, p.texto ?? '') } : null,
    overrides: { ...(p.overrides ?? {}), ...(p.mapa ? { mapa_colores: p.mapa } : {}) },
    colores: p.hex.map((hex, i) => ({ zona: 'cuerpo', posicion: i + 1, orden: 1, hex })),
  })),
)

const sql = [
  '-- 40 piezas de ejemplo (cuellos y puños) con diseño Jacquard.',
  '-- Muestran: diseño propio, herencia (siempre cuello <-> puño), mapa de',
  '-- colores (padre e hijo con distinta cantidad), cambios del hijo (texto,',
  '-- color, líneas), plantillas, una cadena puño -> cuello -> puño y cuellos',
  '-- que usan un puño existente de otro producto (con nota).',
  '--',
  '-- GENERADO con scripts/generar_seed_disenos.mjs y validado con las reglas',
  '-- de packages/shared. No editar a mano: cambia el script y regenera.',
  '-- Se puede ejecutar varias veces: salta las piezas que ya existen.',
  '',
  'insert into public.tipos_cuello (nombre) values',
  "  ('con nombre'), ('doble linea despues del tubular'), ('gaspeado'), ('liso'), ('tubular')",
  'on conflict (nombre) do nothing;',
  '',
]

let n = 0
for (const p of porClave.values()) {
  const id = clave(p.pieza, p.codigo)
  n += 1
  const posiciones = p.colores.map((_, i) => ({
    posicion: 2 * i + 2,
    letra: p.letra === i + 1,
  }))
  const colores = p.colores.map((k, i) => ({
    zona: 'cuerpo@' + (i + 1),
    color: C[k][0],
    codigo: C[k][1],
    hex: C[k][2],
    cantidad_hilos: '',
    hilos_auto: true,
  }))
  const formulario = {
    pieza: p.pieza,
    codigo: p.codigo,
    nombre: p.nombre,
    tipo: p.tipo,
    cantidad_hilos: '3',
    posiciones_cuerpo: posiciones,
    medidas: p.medidas ?? [],
    tallas: p.tallas ?? [],
    notas: p.notas ?? '',
    diseno: p.estilo ? { v: 1, ...ESTILOS[p.estilo](p.hex, p.texto ?? '') } : null,
    padre_id: p.padre ? '00000000-0000-0000-0000-000000000000' : '',
    overrides: { ...(p.overrides ?? {}), ...(p.mapa ? { mapa_colores: p.mapa } : {}) },
  }
  const v = validarCuello(formulario)
  const c = validarColoresCuello(colores, {
    hilosPorDefecto: 3,
    cantidadPosiciones: colores.length,
  })
  if (!v.valido || !c.valido)
    throw new Error(`${id}: ${JSON.stringify({ ...v.errores, ...c.errores })}`)

  const efectivo = efectivos.get(id)
  if (!efectivo) throw new Error(`${id}: sin diseño efectivo`)
  if (coloresFueraDeLista(efectivo, p.hex).length) {
    throw new Error(
      `${id}: usa colores fuera de su paleta ${coloresFueraDeLista(efectivo, p.hex)}`,
    )
  }
  if (p.padre) {
    if (p.padre[0] !== piezaPadrePermitida(p.pieza))
      throw new Error(`${id}: la herencia debe cruzar de pieza`)
    const padre = porClave.get(clave(...p.padre))
    const falta = coloresSinPareja({
      disenoPadre: efectivos.get(clave(...p.padre)),
      paletaPadre: paletaDiseno(
        padre.hex.map((hex, i) => ({ zona: 'cuerpo', posicion: i + 1, hex })),
      ),
      paletaHijo: p.hex,
      mapa: p.mapa,
    })
    if (falta.length) throw new Error(`${id}: colores ${falta} sin pareja`)
  }

  const { padre_id: _sinPadre, ...datos } = v.datos
  const json = JSON.stringify(datos).replaceAll("'", "''")
  const jsonColores = JSON.stringify(c.datos).replaceAll("'", "''")
  const conPadre = p.padre
    ? ` || jsonb_build_object('padre_id', (select id from public.cuellos where pieza = '${p.padre[0]}' and codigo = '${p.padre[1]}'))`
    : ''
  const origen = p.padre ? `hereda de ${p.padre[0]} ${p.padre[1]}` : 'diseño propio'
  sql.push(
    `-- ${String(n).padStart(2, '0')}. ${p.pieza} ${p.codigo} (${origen})`,
    'select public.fn_guardar_cuello(',
    `  '${json}'::jsonb${conPadre},`,
    `  '${jsonColores}'::jsonb`,
    ')',
    `where not exists (select 1 from public.cuellos where pieza = '${p.pieza}' and codigo = '${p.codigo}');`,
    '',
  )
}

// Cuellos que usan un puno existente (de otro producto), con su nota.
const vinculos = [...porClave.values()].filter((p) => p.usaPuno)
if (vinculos.length) sql.push('-- ===== Cuellos que usan un puño existente =====', '')
for (const p of vinculos) {
  const [codigoPuno, nota] = p.usaPuno
  if (p.pieza !== 'cuello') throw new Error(`${p.codigo}: solo un cuello usa un puño`)
  if (!porClave.has(clave('puno', codigoPuno))) {
    throw new Error(`${p.codigo}: no existe el puño ${codigoPuno}`)
  }
  sql.push(
    `-- cuello ${p.codigo} usa el puño ${codigoPuno}`,
    'update public.cuellos set',
    `  puno_id = (select id from public.cuellos where pieza = 'puno' and codigo = '${codigoPuno}'),`,
    `  puno_nota = '${nota.replaceAll("'", "''")}'`,
    `where pieza = 'cuello' and codigo = '${p.codigo}' and puno_id is null;`,
    '',
  )
}

writeFileSync(join(raiz, 'supabase/seed_disenos.sql'), sql.join('\n'), 'utf8')
console.log(`OK: ${n} piezas validadas -> supabase/seed_disenos.sql`)

import { useEffect, useMemo, useRef } from 'react'
import { DISENO_COLUMNAS, DISENO_FILAS, calcularDiseno } from '@inventario/shared'
import './LienzoDiseno.css'

/*
 * Dibuja un diseno Jacquard en un <canvas> (8000 celdas en DOM serian
 * demasiado). Modos:
 * - 'grilla':    cuadricula con numeracion de filas (1 abajo) y columnas,
 *                y la anotacion de cada linea a la izquierda.
 * - 'tejido':    vista previa del cuello tejido (puntos ovalados). Es la
 *                misma imagen en el formulario, la ficha y el listado.
 */

const TEJIDO = { ancho: 5, alto: 3, escala: 2 }
const GRILLA = { celda: 10, numeros: 26, anotacion: 82, cabecera: 18 }

/** Agrupa celdas seguidas del mismo color: una fila lisa = un solo rect. */
function tramos(fila) {
  const lista = []
  let inicio = 0
  for (let c = 1; c <= fila.length; c++) {
    if (c === fila.length || fila[c] !== fila[inicio]) {
      lista.push({ inicio, largo: c - inicio, color: fila[inicio] })
      inicio = c
    }
  }
  return lista
}

function prepararLienzo(lienzo, ancho, alto, escala) {
  lienzo.width = Math.round(ancho * escala)
  lienzo.height = Math.round(alto * escala)
  const ctx = lienzo.getContext('2d')
  if (!ctx) return null
  ctx.setTransform(escala, 0, 0, escala, 0, 0)
  return ctx
}

/**
 * Textura de un punto de tejido: sombra en las esquinas y el ovalo
 * transparente. Se repite sobre todo el lienzo con un solo fillRect, asi
 * dibujar muchos cuellos (listado) sigue siendo barato.
 */
let texturaPunto = null
function obtenerTexturaPunto(ctx) {
  if (!texturaPunto) {
    const { ancho, alto, escala } = TEJIDO
    const tile = document.createElement('canvas')
    tile.width = ancho * escala
    tile.height = alto * escala
    const t = tile.getContext('2d')
    if (!t) return null
    t.fillStyle = 'rgba(0, 0, 0, 0.22)'
    t.fillRect(0, 0, tile.width, tile.height)
    t.globalCompositeOperation = 'destination-out'
    t.beginPath()
    t.ellipse(
      tile.width / 2,
      tile.height / 2,
      tile.width / 2,
      tile.height / 2,
      0,
      0,
      Math.PI * 2,
    )
    t.fill()
    texturaPunto = tile
  }
  return ctx.createPattern(texturaPunto, 'repeat')
}

/** Vista del cuello tejido (la misma en el formulario, la ficha y el listado). */
function dibujarTejido(lienzo, { celdas }) {
  const { ancho: w, alto: h, escala } = TEJIDO
  const ctx = prepararLienzo(lienzo, DISENO_COLUMNAS * w, DISENO_FILAS * h, escala)
  if (!ctx) return
  celdas.forEach((fila, f) => {
    for (const t of tramos(fila)) {
      ctx.fillStyle = t.color
      ctx.fillRect(t.inicio * w, f * h, t.largo * w, h)
    }
  })
  const textura = obtenerTexturaPunto(ctx)
  if (!textura) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = textura
  ctx.fillRect(0, 0, lienzo.width, lienzo.height)
}

function dibujarGrilla(lienzo, { celdas, anotaciones }) {
  const { celda, numeros, anotacion, cabecera } = GRILLA
  const x0 = numeros + anotacion
  const ancho = x0 + DISENO_COLUMNAS * celda
  const alto = cabecera + DISENO_FILAS * celda
  const escala = Math.min(window.devicePixelRatio || 1, 2)
  const ctx = prepararLienzo(lienzo, ancho, alto, escala)
  if (!ctx) return
  lienzo.style.width = `${ancho}px`
  lienzo.style.height = `${alto}px`

  const estilo = getComputedStyle(lienzo)
  const colorTexto = estilo.color || '#555'
  const colorFondo = estilo.getPropertyValue('--diseno-regla').trim() || '#eee'

  ctx.fillStyle = colorFondo
  ctx.fillRect(0, 0, ancho, alto)

  // celdas
  celdas.forEach((fila, f) => {
    for (const t of tramos(fila)) {
      ctx.fillStyle = t.color
      ctx.fillRect(x0 + t.inicio * celda, cabecera + f * celda, t.largo * celda, celda)
    }
  })

  // lineas de la cuadricula (mas marcadas cada 10)
  for (let c = 0; c <= DISENO_COLUMNAS; c++) {
    ctx.fillStyle = c % 10 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'
    ctx.fillRect(x0 + c * celda, cabecera, c % 10 === 0 ? 1 : 0.5, DISENO_FILAS * celda)
  }
  for (let f = 0; f <= DISENO_FILAS; f++) {
    const marcada = (DISENO_FILAS - f) % 10 === 0
    ctx.fillStyle = marcada ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)'
    ctx.fillRect(x0, cabecera + f * celda, DISENO_COLUMNAS * celda, marcada ? 1 : 0.5)
  }

  // numeracion y anotaciones
  ctx.fillStyle = colorTexto
  ctx.textBaseline = 'middle'
  ctx.font = '8px system-ui, sans-serif'
  ctx.textAlign = 'center'
  for (let c = 0; c < DISENO_COLUMNAS; c++) {
    const n = c + 1
    if (n === 1 || n % 5 === 0) {
      ctx.fillText(String(n), x0 + c * celda + celda / 2, cabecera / 2)
    }
  }
  for (let f = 0; f < DISENO_FILAS; f++) {
    const y = cabecera + f * celda + celda / 2
    ctx.textAlign = 'center'
    ctx.fillText(String(DISENO_FILAS - f), numeros / 2, y)
    if (anotaciones[f]) {
      ctx.textAlign = 'right'
      ctx.fillText(anotaciones[f], x0 - 4, y, anotacion - 6)
    }
  }
}

/**
 * @param {{
 *   diseno: import('@inventario/shared').DisenoCuello,
 *   modo?: 'grilla'|'tejido',
 *   className?: string,
 *   etiqueta?: string,
 * }} props
 */
export default function LienzoDiseno({
  diseno,
  modo = 'tejido',
  className = '',
  etiqueta,
}) {
  const ref = useRef(/** @type {HTMLCanvasElement|null} */ (null))
  const grilla = useMemo(() => calcularDiseno(diseno), [diseno])

  useEffect(() => {
    const lienzo = ref.current
    if (!lienzo) return
    if (modo === 'grilla') dibujarGrilla(lienzo, grilla)
    else dibujarTejido(lienzo, grilla)
  }, [grilla, modo])

  const texto = diseno?.texto?.trim()
  return (
    <canvas
      ref={ref}
      className={`lienzo-diseno lienzo-${modo} ${className}`.trim()}
      style={modo === 'grilla' ? undefined : { background: diseno?.fondo }}
      role="img"
      aria-label={
        etiqueta ??
        (texto ? `Diseño del cuello con el texto ${texto}` : 'Diseño del cuello')
      }
    />
  )
}

import { useState } from 'react'
import { useAncho } from './useAncho.js'

/** Colores de serie (validados para daltonismo; ver estilos/modulos.css). */
export const COLORES_SERIE = ['var(--grafico-serie-1)', 'var(--grafico-serie-2)']

const ALTO = 240
const MARGEN = { arriba: 12, derecha: 8, abajo: 28, izquierda: 48 }

/** Tope "redondo" del eje: 1, 2, 2.5, 5 o 10 por una potencia de 10. */
export function topeEje(maximo) {
  if (!(maximo > 0)) return 1
  const potencia = 10 ** Math.floor(Math.log10(maximo))
  const fraccion = maximo / potencia
  const paso = [1, 2, 2.5, 5, 10].find((p) => fraccion <= p) ?? 10
  return paso * potencia
}

/** Recta de tendencia (minimos cuadrados) de una lista de valores. */
function tendenciaLineal(valores) {
  const n = valores.length
  if (n < 3) return null
  const mediaX = (n - 1) / 2
  const mediaY = valores.reduce((s, v) => s + v, 0) / n
  let numerador = 0
  let denominador = 0
  valores.forEach((v, i) => {
    numerador += (i - mediaX) * (v - mediaY)
    denominador += (i - mediaX) ** 2
  })
  const pendiente = denominador ? numerador / denominador : 0
  return {
    inicio: mediaY - pendiente * mediaX,
    fin: mediaY + pendiente * (n - 1 - mediaX),
  }
}

/**
 * Barras verticales para una o dos series sobre el mismo eje. Incluye
 * leyenda (2 series), detalle al pasar el cursor o enfocar con el teclado,
 * y la tabla de datos como alternativa accesible.
 *
 * @param {{
 *   titulo: string,                          descripcion para lectores de pantalla
 *   datos: { etiqueta: string, valores: number[] }[],
 *   series: { nombre: string }[],
 *   formatear?: (n: number) => string,
 *   tendencia?: boolean,                     recta de tendencia de la primera serie
 *   vacio?: string,
 * }} props
 */
export default function GraficoBarras({
  titulo,
  datos,
  series,
  formatear = (n) => String(n),
  tendencia = false,
  vacio = 'Sin datos en este período.',
}) {
  const [ref, ancho] = useAncho()
  const [activo, setActivo] = useState(/** @type {number|null} */ (null))

  const maximo = Math.max(0, ...datos.flatMap((d) => d.valores.map(Number)))
  if (datos.length === 0 || maximo === 0) {
    return (
      <div ref={ref} className="grafico-vacio texto-suave">
        {vacio}
      </div>
    )
  }

  const tope = topeEje(maximo)
  const anchoArea = Math.max(40, ancho - MARGEN.izquierda - MARGEN.derecha)
  const altoArea = ALTO - MARGEN.arriba - MARGEN.abajo
  const banda = anchoArea / datos.length
  const anchoGrupo = Math.min(banda * 0.72, series.length * 26)
  // 2px de separacion entre las barras de un mismo grupo.
  const anchoBarra = Math.max(2, (anchoGrupo - (series.length - 1) * 2) / series.length)
  const y = (valor) => MARGEN.arriba + altoArea * (1 - valor / tope)
  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * tope)
  // Etiquetas del eje X: las que quepan sin encimarse.
  const cada = Math.max(
    1,
    Math.ceil(datos.length / Math.max(1, Math.floor(anchoArea / 64))),
  )
  const recta = tendencia ? tendenciaLineal(datos.map((d) => Number(d.valores[0]))) : null
  const centro = (i) => MARGEN.izquierda + banda * (i + 0.5)
  const puntoActivo = activo !== null ? datos[activo] : null

  return (
    <div className="grafico">
      {series.length > 1 && (
        <ul className="grafico-leyenda">
          {series.map((serie, s) => (
            <li key={serie.nombre}>
              <span
                className="grafico-muestra"
                style={{ background: COLORES_SERIE[s] }}
              />
              {serie.nombre}
            </li>
          ))}
          {recta && (
            <li>
              <span className="grafico-muestra grafico-muestra-linea" />
              Tendencia
            </li>
          )}
        </ul>
      )}
      <div ref={ref} className="grafico-lienzo" onPointerLeave={() => setActivo(null)}>
        <svg width={ancho} height={ALTO} role="img" aria-label={titulo}>
          {marcas.map((marca) => (
            <g key={marca}>
              <line
                x1={MARGEN.izquierda}
                x2={ancho - MARGEN.derecha}
                y1={y(marca)}
                y2={y(marca)}
                className={marca === 0 ? 'grafico-eje' : 'grafico-rejilla'}
              />
              <text
                x={MARGEN.izquierda - 6}
                y={y(marca) + 4}
                className="grafico-texto"
                textAnchor="end"
              >
                {formatear(marca)}
              </text>
            </g>
          ))}

          {datos.map((dato, i) => (
            <g key={dato.etiqueta + i}>
              {dato.valores.map((valor, s) => {
                const alto = (Number(valor) / tope) * altoArea
                if (alto <= 0) return null
                const x = centro(i) - anchoGrupo / 2 + s * (anchoBarra + 2)
                const radio = Math.min(4, anchoBarra / 2, alto)
                return (
                  <path
                    key={series[s].nombre}
                    // Extremo superior redondeado; la base queda recta sobre el eje.
                    d={`M${x},${y(0)} V${y(0) - alto + radio} q0,${-radio} ${radio},${-radio} H${
                      x + anchoBarra - radio
                    } q${radio},0 ${radio},${radio} V${y(0)} Z`}
                    fill={COLORES_SERIE[s]}
                    opacity={activo === null || activo === i ? 1 : 0.45}
                  />
                )
              })}
              {i % cada === 0 && (
                <text
                  x={centro(i)}
                  y={ALTO - 8}
                  className="grafico-texto"
                  textAnchor="middle"
                >
                  {dato.etiqueta}
                </text>
              )}
              {/* Zona de deteccion: toda la banda, mas grande que la barra. */}
              <rect
                x={MARGEN.izquierda + banda * i}
                y={MARGEN.arriba}
                width={banda}
                height={altoArea}
                fill="transparent"
                tabIndex={0}
                className="grafico-zona"
                aria-label={`${dato.etiqueta}: ${dato.valores
                  .map((v, s) => `${series[s].nombre} ${formatear(Number(v))}`)
                  .join(', ')}`}
                onPointerEnter={() => setActivo(i)}
                onFocus={() => setActivo(i)}
                onBlur={() => setActivo(null)}
              />
            </g>
          ))}

          {recta && (
            <line
              x1={centro(0)}
              x2={centro(datos.length - 1)}
              y1={y(Math.min(tope, Math.max(0, recta.inicio)))}
              y2={y(Math.min(tope, Math.max(0, recta.fin)))}
              className="grafico-tendencia"
            />
          )}
        </svg>

        {puntoActivo && (
          <div
            className="grafico-detalle"
            style={{
              left: Math.min(Math.max(centro(activo), 80), ancho - 80),
            }}
          >
            <strong>{puntoActivo.etiqueta}</strong>
            {puntoActivo.valores.map((valor, s) => (
              <span key={series[s].nombre}>
                <span
                  className="grafico-muestra"
                  style={{ background: COLORES_SERIE[s] }}
                />
                {series[s].nombre}: <b>{formatear(Number(valor))}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      <details className="grafico-tabla no-imprimir">
        <summary>Ver datos en tabla</summary>
        <div className="tabla-envoltura">
          <table className="tabla-datos">
            <thead>
              <tr>
                <th scope="col">Período</th>
                {series.map((serie) => (
                  <th key={serie.nombre} scope="col" className="numero">
                    {serie.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.map((dato, i) => (
                <tr key={dato.etiqueta + i}>
                  <td>{dato.etiqueta}</td>
                  {dato.valores.map((valor, s) => (
                    <td key={series[s].nombre} className="numero">
                      {formatear(Number(valor))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}

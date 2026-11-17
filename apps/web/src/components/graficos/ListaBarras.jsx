/**
 * Ranking con barras horizontales: etiqueta, barra proporcional y valor
 * escrito (el dato nunca depende solo del largo o del color de la barra).
 *
 * @param {{
 *   filas: { clave: string, etiqueta: import('react').ReactNode, valor: number, detalle?: string, hex?: string|null }[],
 *   formatear?: (n: number) => string,
 *   numerada?: boolean,     muestra la posicion (1, 2, 3...)
 *   vacio?: string,
 * }} props
 */
export default function ListaBarras({
  filas,
  formatear = (n) => String(n),
  numerada = false,
  vacio = 'Sin datos en este período.',
}) {
  const maximo = Math.max(0, ...filas.map((f) => Number(f.valor)))
  if (filas.length === 0 || maximo === 0) return <p className="texto-suave">{vacio}</p>

  return (
    <ol className="lista-barras">
      {filas.map((fila, i) => (
        <li key={fila.clave} className="barra-fila">
          <div className="barra-etiqueta">
            {numerada && <span className="barra-posicion">{i + 1}</span>}
            {fila.hex !== undefined && (
              <span
                className="barra-color"
                style={fila.hex ? { background: fila.hex } : undefined}
                aria-hidden="true"
              />
            )}
            <span className="barra-nombre">{fila.etiqueta}</span>
            <span className="barra-valor">{formatear(Number(fila.valor))}</span>
          </div>
          <div className="barra-pista" aria-hidden="true">
            <div
              className="barra-relleno"
              style={{ width: `${Math.max(2, (Number(fila.valor) / maximo) * 100)}%` }}
            />
          </div>
          {fila.detalle && <div className="barra-detalle">{fila.detalle}</div>}
        </li>
      ))}
    </ol>
  )
}

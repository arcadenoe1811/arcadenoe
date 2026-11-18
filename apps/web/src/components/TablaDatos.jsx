import { descargarCSV } from '../utils/descargar.js'

/**
 * Tabla de datos con titulo y exportacion a Excel (CSV).
 *
 * @template T
 * @typedef {Object} ColumnaTabla
 * @property {string} titulo
 * @property {(fila: T) => unknown} valor       valor crudo (lo que se exporta)
 * @property {(valor: any, fila: T) => import('react').ReactNode} [mostrar]  como se ve en pantalla
 * @property {boolean} [numero]                 alinear a la derecha
 */

/**
 * @template T
 * @param {{
 *   titulo?: string,
 *   archivo?: string,          nombre del CSV; sin el no hay boton de exportar
 *   columnas: ColumnaTabla<T>[],
 *   filas: T[],
 *   clave?: (fila: T, i: number) => string,
 *   vacio?: string,
 *   pie?: import('react').ReactNode,   fila(s) de totales (<tr>)
 *   acciones?: import('react').ReactNode,
 * }} props
 */
export default function TablaDatos({
  titulo,
  archivo,
  columnas,
  filas,
  clave = (_fila, i) => String(i),
  vacio = 'Sin datos en este período.',
  pie = null,
  acciones = null,
}) {
  return (
    <section className="tarjeta bloque-tabla">
      {(titulo || archivo || acciones) && (
        <header className="bloque-encabezado">
          {titulo && <h2>{titulo}</h2>}
          <div className="bloque-acciones no-imprimir">
            {acciones}
            {archivo && filas.length > 0 && (
              <button
                type="button"
                className="boton boton-secundario boton-sm"
                onClick={() => descargarCSV(archivo, columnas, filas)}
              >
                Exportar a Excel
              </button>
            )}
          </div>
        </header>
      )}
      {filas.length === 0 ? (
        <p className="texto-suave">{vacio}</p>
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla-datos">
            <thead>
              <tr>
                {columnas.map((c) => (
                  <th
                    key={c.titulo}
                    scope="col"
                    className={c.numero ? 'numero' : undefined}
                  >
                    {c.titulo}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila, i) => (
                <tr key={clave(fila, i)}>
                  {columnas.map((c) => {
                    const valor = c.valor(fila)
                    return (
                      <td key={c.titulo} className={c.numero ? 'numero' : undefined}>
                        {c.mostrar ? c.mostrar(valor, fila) : (valor ?? '—')}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            {pie && <tfoot>{pie}</tfoot>}
          </table>
        </div>
      )}
    </section>
  )
}

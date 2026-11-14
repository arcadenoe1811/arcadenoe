import { useId, useState } from 'react'
import { LIMITES, valoresInicialesPosicion } from '@inventario/shared'
import { soloEnteros } from '../utils/soloEnteros.js'

const LARGO_POSICION = String(LIMITES.posicion_cuerpo.maximo).length

/**
 * "Cantidad de colores" + una fila por color con su posicion y la marca
 * de letra. El valor es un arreglo de { posicion: string, letra: boolean }.
 * Los errores llegan con clave `posiciones_cuerpo.${indice}`.
 * @param {{
 *   descriptor: import('@inventario/shared').DescriptorCampo,
 *   valor: { posicion: string, letra: boolean }[],
 *   errores?: Record<string, string>,
 *   alCambiar: (nombre: string, valor: any) => void,
 * }} props
 */
export default function PosicionesCuerpo({ descriptor, valor, errores = {}, alCambiar }) {
  const id = useId()
  const { nombre, etiqueta, ayuda, minimo = 0, maximo = 30 } = descriptor
  const filas = valor ?? []
  // Texto propio para poder borrar el numero mientras se escribe sin
  // perder las filas ya cargadas.
  const [textoCantidad, setTextoCantidad] = useState(String(filas.length || ''))

  const redimensionar = (cantidad) => {
    const nuevas = filas.slice(0, cantidad)
    while (nuevas.length < cantidad) nuevas.push(valoresInicialesPosicion())
    alCambiar(nombre, nuevas)
  }

  const cambiarCantidad = (texto) => {
    setTextoCantidad(texto)
    if (!/^\d+$/.test(texto)) return
    const cantidad = Number(texto)
    if (cantidad >= minimo && cantidad <= maximo) redimensionar(cantidad)
  }

  const pasoCantidad = (delta) => {
    const cantidad = Math.min(maximo, Math.max(minimo, filas.length + delta))
    setTextoCantidad(String(cantidad || ''))
    redimensionar(cantidad)
  }

  const cambiarFila = (indice, cambios) =>
    alCambiar(
      nombre,
      filas.map((fila, i) => (i === indice ? { ...fila, ...cambios } : fila)),
    )

  const errorGeneral = errores[nombre]

  return (
    <div
      className="campo campo-posiciones_cuerpo"
      role="group"
      aria-labelledby={`${id}-titulo`}
    >
      <span id={`${id}-titulo`} className="campo-titulo">
        {etiqueta}
      </span>

      <div className="posiciones-cantidad">
        <label htmlFor={`${id}-cantidad`}>Cantidad de colores</label>
        <div className="contador">
          <button
            type="button"
            className="boton boton-secundario boton-sm"
            aria-label="Quitar un color"
            disabled={filas.length <= minimo}
            onClick={() => pasoCantidad(-1)}
          >
            −
          </button>
          <input
            id={`${id}-cantidad`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={String(maximo).length}
            placeholder="0"
            value={textoCantidad}
            onChange={(evento) =>
              cambiarCantidad(soloEnteros(evento.target.value, String(maximo).length))
            }
            onBlur={() => setTextoCantidad(String(filas.length || ''))}
          />
          <button
            type="button"
            className="boton boton-secundario boton-sm"
            aria-label="Agregar un color"
            disabled={filas.length >= maximo}
            onClick={() => pasoCantidad(1)}
          >
            +
          </button>
        </div>
      </div>

      {filas.length > 0 && (
        <ol className="posiciones-lista">
          {filas.map((fila, indice) => {
            const error = errores[`${nombre}.${indice}`]
            const idPosicion = `${id}-posicion-${indice}`
            return (
              <li
                // El orden de las filas es fijo (solo crecen o se cortan
                // por el final), asi que el indice es una clave estable.
                key={indice}
                className={`posicion-fila${fila.letra ? ' posicion-letra' : ''}${
                  error ? ' campo-con-error' : ''
                }`}
              >
                <label htmlFor={idPosicion} className="posicion-numero">
                  Color {indice + 1}
                  {fila.letra && <span className="insignia-letra">Letra</span>}
                </label>
                <input
                  id={idPosicion}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="off"
                  maxLength={LARGO_POSICION}
                  placeholder="Posición"
                  value={fila.posicion}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `${idPosicion}-error` : undefined}
                  onChange={(evento) =>
                    cambiarFila(indice, {
                      posicion: soloEnteros(evento.target.value, LARGO_POSICION),
                    })
                  }
                />
                <label className="casilla">
                  <input
                    type="checkbox"
                    checked={fila.letra}
                    onChange={(evento) =>
                      cambiarFila(indice, { letra: evento.target.checked })
                    }
                  />
                  Es letra
                </label>
                {error && (
                  <small id={`${idPosicion}-error`} className="campo-error">
                    {error}
                  </small>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {errorGeneral ? (
        <small className="campo-error">{errorGeneral}</small>
      ) : (
        ayuda && <small className="campo-ayuda">{ayuda}</small>
      )}
    </div>
  )
}

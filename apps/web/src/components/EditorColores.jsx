import {
  CAMPOS_COLOR,
  leerZonaColor,
  opcionesZonaColor,
  valorZonaColor,
  valoresInicialesColor,
} from '@inventario/shared'
import CampoFormulario from './CampoFormulario.jsx'
import SelectorTono from './SelectorTono.jsx'

const ID_LISTA_COLORES = 'lista-catalogo-colores'

let contadorFilas = 0

/**
 * Crea una fila del editor con una clave estable para React.
 * @param {object} [color]
 * @param {{ hilosPorDefecto?: number|string|null }} [opciones]
 */
export function crearFilaColor(color = {}, opciones = {}) {
  contadorFilas += 1
  return { ...valoresInicialesColor(color, opciones), clave: `fila-${contadorFilas}` }
}

/**
 * Seccion dinamica para agregar colores por zona.
 * - La zona "cuerpo" se abre en un color por cada posicion del cuerpo.
 * - "#" es el codigo del color segun el cono.
 * - Los hilos siguen la "Cantidad de hilos" del cuello (hilos_auto) hasta
 *   que el usuario escribe otro valor; si lo borra, vuelve a seguirla.
 * Los errores usan la clave `colores.${indice}.${campo}`.
 */
export default function EditorColores({
  filas,
  errores = {},
  alCambiar,
  catalogo = [],
  posiciones = [],
  hilosPorDefecto = '',
}) {
  const hexPorNombre = Object.fromEntries(
    catalogo.filter((c) => c.hex).map((c) => [c.nombre.toLowerCase(), c.hex]),
  )

  const cambiarCampo = (indice, nombre, valor) => {
    alCambiar(
      filas.map((fila, i) => {
        if (i !== indice) return fila
        if (nombre === 'color' && !fila.hex_manual) {
          // Sin tono elegido a mano: se toma el del catalogo si lo hay.
          const delCatalogo = hexPorNombre[valor.trim().toLowerCase()] ?? ''
          return { ...fila, color: valor, hex: delCatalogo }
        }
        if (nombre === 'hex') {
          return { ...fila, hex: valor, hex_manual: valor !== '' }
        }
        if (nombre === 'cantidad_hilos') {
          return { ...fila, cantidad_hilos: valor, hilos_auto: valor.trim() === '' }
        }
        return { ...fila, [nombre]: valor }
      }),
    )
  }

  const agregar = () => {
    // Primero el siguiente color del cuerpo que aun no tenga fila; si ya
    // estan todos, la misma zona de la ultima fila.
    const usadas = new Set(filas.map((f) => leerZonaColor(f.zona).posicion))
    const libre = posiciones.findIndex((_, i) => !usadas.has(i + 1))
    const zona =
      libre >= 0 ? valorZonaColor('cuerpo', libre + 1) : (filas.at(-1)?.zona ?? 'cuerpo')
    alCambiar([...filas, { ...crearFilaColor(), zona }])
  }

  const quitar = (indice) => alCambiar(filas.filter((_, i) => i !== indice))

  const mover = (indice, direccion) => {
    const destino = indice + direccion
    if (destino < 0 || destino >= filas.length) return
    const copia = [...filas]
    ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
    alCambiar(copia)
  }

  const valorCampo = (fila, nombre) =>
    nombre === 'cantidad_hilos' && fila.hilos_auto
      ? String(hilosPorDefecto ?? '')
      : fila[nombre]

  return (
    <fieldset className="editor-colores">
      <legend>Colores por zona</legend>
      <datalist id={ID_LISTA_COLORES}>
        {catalogo.map((color) => (
          <option key={color.id} value={color.nombre} />
        ))}
      </datalist>

      {filas.length === 0 && (
        <p className="texto-suave">
          Sin colores. Agrega uno para detallar tubular, cuerpo o borde.
        </p>
      )}

      {filas.length > 0 && (
        <div className="colores-encabezado" aria-hidden="true">
          {CAMPOS_COLOR.map((c) => (
            <span key={c.nombre} title={c.ayuda}>
              {c.etiqueta}
            </span>
          ))}
          <span />
        </div>
      )}

      {filas.map((fila, indice) => (
        <div
          className={`fila-color${fila.hilos_auto ? ' hilos-auto' : ''}`}
          key={fila.clave}
        >
          {CAMPOS_COLOR.map((descriptor) =>
            descriptor.tipo === 'tono' ? (
              <SelectorTono
                key={descriptor.nombre}
                valor={fila.hex}
                error={errores[`colores.${indice}.hex`]}
                alCambiar={(valor) => cambiarCampo(indice, 'hex', valor)}
              />
            ) : (
              <CampoFormulario
                key={descriptor.nombre}
                descriptor={{
                  ...descriptor,
                  ayuda: undefined,
                  etiqueta:
                    descriptor.nombre === 'codigo'
                      ? 'Código del cono'
                      : descriptor.etiqueta,
                  opciones:
                    descriptor.nombre === 'zona'
                      ? opcionesZonaColor(posiciones, fila.zona)
                      : descriptor.opciones,
                }}
                valor={valorCampo(fila, descriptor.nombre)}
                error={errores[`colores.${indice}.${descriptor.nombre}`]}
                alCambiar={(nombre, valor) => cambiarCampo(indice, nombre, valor)}
                listaSugerencias={
                  descriptor.nombre === 'color' ? ID_LISTA_COLORES : undefined
                }
                ocultarEtiqueta
              />
            ),
          )}
          <div className="fila-color-acciones">
            <button
              type="button"
              className="boton-icono"
              onClick={() => mover(indice, -1)}
              disabled={indice === 0}
              aria-label="Subir"
            >
              ↑
            </button>
            <button
              type="button"
              className="boton-icono"
              onClick={() => mover(indice, 1)}
              disabled={indice === filas.length - 1}
              aria-label="Bajar"
            >
              ↓
            </button>
            <button
              type="button"
              className="boton-icono boton-icono-peligro"
              onClick={() => quitar(indice)}
              aria-label="Quitar color"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      {filas.length > 0 && (
        <p className="texto-pequeno texto-suave">
          Los hilos toman la cantidad de hilos del cuello; escribe otro número para
          cambiarlo en ese color.
        </p>
      )}

      <button type="button" className="boton boton-secundario" onClick={agregar}>
        + Agregar color
      </button>
    </fieldset>
  )
}

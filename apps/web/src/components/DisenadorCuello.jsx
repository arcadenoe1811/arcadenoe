import { useId } from 'react'
import {
  ETIQUETAS_LINEA,
  LIMITES_DISENO,
  TIPOS_LINEA,
  ZONAS_LINEA,
  lineaNueva,
  normalizarTextoDiseno,
} from '@inventario/shared'
import { soloEnteros } from '../utils/soloEnteros.js'
import SelectorColorCuello from './SelectorColorCuello.jsx'
import LienzoDiseno from './LienzoDiseno.jsx'
import './DisenadorCuello.css'

const conSigno = (n) => (n > 0 ? `+${n}` : String(n))
const limitar = (n, { minimo, maximo }) => Math.min(maximo, Math.max(minimo, n))

/** Botones subir/bajar con el desplazamiento actual (positivo = arriba). */
function Mover({ valor, etiqueta, alCambiar }) {
  return (
    <span className="disenador-mover">
      <button
        type="button"
        className="disenador-boton-mini"
        onClick={() => alCambiar(limitar(valor + 1, LIMITES_DISENO.desplazamiento))}
        aria-label={`Subir ${etiqueta}`}
        title="Subir"
      >
        ↑
      </button>
      <button
        type="button"
        className="disenador-boton-mini"
        onClick={() => alCambiar(limitar(valor - 1, LIMITES_DISENO.desplazamiento))}
        aria-label={`Bajar ${etiqueta}`}
        title="Bajar"
      >
        ↓
      </button>
      <span className="disenador-desplazamiento" aria-live="polite">
        {conSigno(valor)}
      </span>
    </span>
  )
}

/**
 * Editor visual del diseno Jacquard (cuadricula 100x80, fila 1 abajo).
 * @param {{
 *   valor: import('@inventario/shared').DisenoCuello,
 *   alCambiar: (diseno: import('@inventario/shared').DisenoCuello) => void,
 *   colores: import('./SelectorColorCuello.jsx').OpcionColorCuello[],
 *   error?: string,
 *   etiquetaPieza?: string,
 * }} props
 * Los colores salen SOLO de "Colores por zona" (no se mezclan tonos sueltos).
 * Sirve igual para cuellos y punos: `etiquetaPieza` solo cambia los textos.
 */
export default function DisenadorCuello({
  valor,
  alCambiar,
  colores = [],
  error,
  etiquetaPieza = 'cuello',
}) {
  const id = useId()
  const cambiar = (cambios) => alCambiar({ ...valor, ...cambios })

  const cambiarLinea = (zona, indice, cambios) =>
    cambiar({
      [zona]: valor[zona].map((linea, i) =>
        i === indice ? { ...linea, ...cambios } : linea,
      ),
    })
  // La linea nueva repite el color de la anterior de esa zona, o toma el
  // primer color del cuello: nunca un tono fuera de "Colores por zona".
  const agregarLinea = (zona) => {
    const color = valor[zona].at(-1)?.color ?? colores[0]?.hex
    const linea = lineaNueva(zona)
    cambiar({ [zona]: [...valor[zona], color ? { ...linea, color } : linea] })
  }
  const quitarLinea = (zona, indice) =>
    cambiar({ [zona]: valor[zona].filter((_, i) => i !== indice) })

  return (
    <div className="disenador">
      <div className="disenador-cabecera">
        <div className="campo disenador-texto">
          <label htmlFor={`${id}-texto`}>Texto (marca)</label>
          <input
            id={`${id}-texto`}
            type="text"
            value={valor.texto}
            maxLength={LIMITES_DISENO.texto.maximo}
            placeholder="VENECIA"
            onChange={(evento) =>
              cambiar({ texto: normalizarTextoDiseno(evento.target.value) })
            }
          />
        </div>
        <div className="disenador-control">
          <span className="campo-titulo">Fondo</span>
          <SelectorColorCuello
            valor={valor.fondo}
            opciones={colores}
            etiqueta="Color de fondo"
            alCambiar={(fondo) => cambiar({ fondo })}
          />
        </div>
        <div className="disenador-control">
          <span className="campo-titulo">Letras</span>
          <SelectorColorCuello
            valor={valor.color_texto}
            opciones={colores}
            etiqueta="Color del texto"
            alCambiar={(color_texto) => cambiar({ color_texto })}
          />
        </div>
        <div className="disenador-control">
          <span className="campo-titulo">Posición del texto</span>
          <Mover
            valor={valor.desplazamiento}
            etiqueta="el texto"
            alCambiar={(desplazamiento) => cambiar({ desplazamiento })}
          />
        </div>
      </div>
      <p className="texto-pequeno texto-suave">
        Letras A–Z, Ñ, números, punto y guion. Las tildes se quitan.
      </p>

      {ZONAS_LINEA.map(({ clave, titulo }) => (
        <section key={clave} className="disenador-zona" aria-label={titulo}>
          <div className="disenador-zona-titulo">
            <h3>{titulo}</h3>
            <button
              type="button"
              className="boton boton-contorno boton-sm"
              onClick={() => agregarLinea(clave)}
              disabled={valor[clave].length >= LIMITES_DISENO.lineas_por_zona.maximo}
            >
              + Agregar
            </button>
          </div>
          {valor[clave].length === 0 ? (
            <p className="texto-pequeno texto-suave">Sin líneas.</p>
          ) : (
            <ol className="disenador-lineas">
              {valor[clave].map((linea, i) => {
                const nombre = `línea ${i + 1}`
                return (
                  <li key={i} className="disenador-linea">
                    <span className="disenador-numero">{i + 1}</span>
                    <select
                      value={linea.tipo}
                      aria-label={`Tipo de ${nombre}`}
                      onChange={(evento) =>
                        cambiarLinea(clave, i, { tipo: evento.target.value })
                      }
                    >
                      {TIPOS_LINEA.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {ETIQUETAS_LINEA[tipo]}
                        </option>
                      ))}
                    </select>
                    <label className="disenador-pasadas">
                      <span>Pas.</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={linea.pasadas}
                        aria-label={`Pasadas de ${nombre}`}
                        onChange={(evento) => {
                          const texto = soloEnteros(evento.target.value, 2)
                          cambiarLinea(clave, i, {
                            pasadas: texto === '' ? '' : Number(texto),
                          })
                        }}
                        onBlur={() => {
                          const n = Number(linea.pasadas) || LIMITES_DISENO.pasadas.minimo
                          cambiarLinea(clave, i, {
                            pasadas: limitar(n, LIMITES_DISENO.pasadas),
                          })
                        }}
                      />
                    </label>
                    <SelectorColorCuello
                      valor={linea.color}
                      opciones={colores}
                      etiqueta={`Color de ${nombre}`}
                      alCambiar={(color) => cambiarLinea(clave, i, { color })}
                    />
                    {clave === 'medio' && (
                      <Mover
                        valor={linea.desplazamiento ?? 0}
                        etiqueta={nombre}
                        alCambiar={(desplazamiento) =>
                          cambiarLinea(clave, i, { desplazamiento })
                        }
                      />
                    )}
                    <button
                      type="button"
                      className="disenador-quitar"
                      onClick={() => quitarLinea(clave, i)}
                      aria-label={`Quitar ${nombre}`}
                      title="Quitar"
                    >
                      ×
                    </button>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      ))}

      {error && (
        <small className="campo-error" role="alert">
          {error}
        </small>
      )}

      <div className="disenador-grilla" tabIndex={0} aria-label="Cuadrícula del diseño">
        <LienzoDiseno diseno={valor} modo="grilla" />
      </div>

      <div className="disenador-vista">
        <span className="texto-pequeno texto-suave">
          Vista previa del {etiquetaPieza}
        </span>
        <LienzoDiseno diseno={valor} modo="tejido" />
      </div>
    </div>
  )
}

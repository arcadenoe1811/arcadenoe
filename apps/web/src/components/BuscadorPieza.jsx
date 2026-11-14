import { useId, useState } from 'react'
import { formatearPieza } from '@inventario/shared'
import { useCuellos } from '../hooks/useCuellos.js'
import { useDebounce } from '../hooks/useDebounce.js'
import ImagenCuello from './ImagenCuello.jsx'

const MAXIMO_RESULTADOS = 8

/**
 * Busca una pieza (cuello o puno) con diseno para usarla como padre o
 * plantilla. `pieza` limita los resultados a ese tipo (al heredar: la otra pieza).
 * @param {{
 *   titulo: string,
 *   excluir?: string,
 *   pieza?: string,
 *   alElegir: (pieza: Record<string, any>) => void,
 *   alCancelar: () => void,
 * }} props
 */
export default function BuscadorPieza({
  titulo,
  excluir,
  pieza = '',
  alElegir,
  alCancelar,
}) {
  const id = useId()
  const [termino, setTermino] = useState('')
  const terminoRetrasado = useDebounce(termino, 250)
  const { cuellos, cargando, error } = useCuellos({ termino: terminoRetrasado, pieza })

  const resultados = (cuellos ?? [])
    .filter((p) => p.id !== excluir)
    .slice(0, MAXIMO_RESULTADOS)

  return (
    <div className="buscador-pieza">
      <div className="buscador-pieza-cabecera">
        <label htmlFor={`${id}-q`} className="campo-titulo">
          {titulo}
        </label>
        <button
          type="button"
          className="boton boton-fantasma boton-sm"
          onClick={alCancelar}
        >
          Cancelar
        </button>
      </div>
      <input
        id={`${id}-q`}
        type="search"
        autoFocus
        autoComplete="off"
        placeholder="Código o nombre (ej: maz4t5)"
        value={termino}
        onChange={(evento) => setTermino(evento.target.value)}
        onKeyDown={(evento) => {
          // Enter no envia el formulario de la pieza.
          if (evento.key === 'Enter') evento.preventDefault()
        }}
      />
      {error && <small className="campo-error">{error.mensaje}</small>}
      {cargando && !cuellos && <p className="texto-pequeno texto-suave">Buscando…</p>}
      {cuellos && resultados.length === 0 && (
        <p className="texto-pequeno texto-suave">Sin resultados.</p>
      )}
      <ul className="buscador-pieza-resultados">
        {resultados.map((pieza) => {
          const sinDiseno = !pieza.diseno_efectivo
          return (
            <li key={pieza.id}>
              <button
                type="button"
                className="buscador-pieza-opcion"
                disabled={sinDiseno}
                onClick={() => alElegir(pieza)}
              >
                <ImagenCuello
                  diseno={pieza.diseno_efectivo}
                  url={null}
                  alt={`Diseño de ${pieza.codigo}`}
                />
                <span className="buscador-pieza-texto">
                  <span className="insignia-posicion">{formatearPieza(pieza.pieza)}</span>{' '}
                  <span className="codigo">{pieza.codigo}</span>
                  {pieza.nombre && <span className="texto-suave"> · {pieza.nombre}</span>}
                  {pieza.padre_id && <span className="texto-suave"> · hereda</span>}
                  {sinDiseno && <span className="texto-suave"> · sin diseño</span>}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

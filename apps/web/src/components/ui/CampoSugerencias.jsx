import { useEffect, useId, useRef, useState } from 'react'
import './CampoSugerencias.css'

/**
 * @typedef {{ valor: string, descripcion?: string }} Sugerencia
 */

/** Minusculas y sin acentos, para comparar. */
const comparable = (texto) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Resalta en negrita la parte que coincide con lo escrito. */
function Resaltado({ texto, termino }) {
  const t = comparable(termino)
  if (!t) return texto
  const i = comparable(texto).indexOf(t)
  if (i < 0) return texto
  return (
    <>
      {texto.slice(0, i)}
      <mark>{texto.slice(i, i + t.length)}</mark>
      {texto.slice(i + t.length)}
    </>
  )
}

/**
 * Campo de texto libre con lista de sugerencias propia (reemplaza a <datalist>,
 * que no se puede estilizar). Patron ARIA "combobox" con lista.
 *
 * @param {{
 *   id: string,
 *   valor: string,
 *   alCambiar: (valor: string) => void,
 *   sugerencias: (string|Sugerencia)[],
 *   placeholder?: string,
 *   invalido?: boolean,
 *   vacio?: string,
 * }} props
 */
export default function CampoSugerencias({
  id,
  valor,
  alCambiar,
  sugerencias,
  placeholder,
  invalido = false,
  vacio = 'Sin sugerencias: se usará lo que escribas.',
}) {
  const idLista = `${useId()}-lista`
  const refCaja = useRef(/** @type {HTMLDivElement|null} */ (null))
  const refLista = useRef(/** @type {HTMLUListElement|null} */ (null))
  const [abierta, setAbierta] = useState(false)
  const [activa, setActiva] = useState(-1)
  // Al abrir con la flecha se muestran todas, no solo las que coinciden.
  const [mostrarTodas, setMostrarTodas] = useState(false)

  /** @type {Sugerencia[]} */
  const opciones = sugerencias.map((s) => (typeof s === 'string' ? { valor: s } : s))
  const termino = mostrarTodas ? '' : valor
  const visibles = opciones.filter((o) =>
    comparable(`${o.valor} ${o.descripcion ?? ''}`).includes(comparable(termino)),
  )

  // Cierra al tocar fuera.
  useEffect(() => {
    if (!abierta) return undefined
    const alTocar = (e) => {
      if (!refCaja.current?.contains(/** @type {Node} */ (e.target))) setAbierta(false)
    }
    document.addEventListener('pointerdown', alTocar)
    return () => document.removeEventListener('pointerdown', alTocar)
  }, [abierta])

  // Mantiene visible la opcion activa al moverse con el teclado.
  useEffect(() => {
    if (activa < 0) return
    refLista.current?.children[activa]?.scrollIntoView({ block: 'nearest' })
  }, [activa])

  const abrir = (todas = false) => {
    setMostrarTodas(todas)
    setActiva(-1)
    setAbierta(true)
  }
  const elegir = (opcion) => {
    alCambiar(opcion.valor)
    setAbierta(false)
  }

  const alTeclear = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!abierta) return abrir(false)
      if (visibles.length === 0) return undefined
      const paso = e.key === 'ArrowDown' ? 1 : -1
      setActiva((a) => (a + paso + visibles.length) % visibles.length)
    } else if (e.key === 'Enter' && abierta && activa >= 0 && visibles[activa]) {
      e.preventDefault()
      elegir(visibles[activa])
    } else if (e.key === 'Escape' && abierta) {
      // No cierra el modal que pueda contener al campo.
      e.preventDefault()
      e.stopPropagation()
      setAbierta(false)
    } else if (e.key === 'Tab') {
      setAbierta(false)
    }
    return undefined
  }

  return (
    <div
      ref={refCaja}
      className={`sugerencias${abierta ? ' sugerencias-abierta' : ''}${invalido ? ' sugerencias-invalida' : ''}`}
    >
      <input
        id={id}
        role="combobox"
        aria-expanded={abierta}
        aria-controls={idLista}
        aria-autocomplete="list"
        aria-activedescendant={
          abierta && activa >= 0 ? `${idLista}-${activa}` : undefined
        }
        aria-invalid={invalido || undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={valor}
        onChange={(e) => {
          alCambiar(e.target.value)
          abrir(false)
        }}
        onFocus={() => abrir(true)}
        onClick={() => !abierta && abrir(true)}
        onKeyDown={alTeclear}
      />
      <button
        type="button"
        className="sugerencias-boton"
        tabIndex={-1}
        aria-label={abierta ? 'Cerrar sugerencias' : 'Ver sugerencias'}
        onPointerDown={(e) => e.preventDefault()}
        onClick={() => {
          if (abierta) setAbierta(false)
          else {
            refCaja.current?.querySelector('input')?.focus()
            abrir(true)
          }
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {abierta && (
        <div className="sugerencias-panel">
          {visibles.length === 0 ? (
            <p className="sugerencias-vacio">{vacio}</p>
          ) : (
            <ul ref={refLista} id={idLista} role="listbox" className="sugerencias-lista">
              {visibles.map((o, i) => {
                const elegida = comparable(o.valor) === comparable(valor)
                return (
                  <li
                    key={o.valor}
                    id={`${idLista}-${i}`}
                    role="option"
                    aria-selected={elegida}
                    className={`sugerencia${i === activa ? ' sugerencia-activa' : ''}`}
                    onPointerDown={(e) => e.preventDefault()}
                    onPointerEnter={() => setActiva(i)}
                    onClick={() => elegir(o)}
                  >
                    <span className="sugerencia-texto">
                      <span className="sugerencia-valor">
                        <Resaltado texto={o.valor} termino={termino} />
                      </span>
                      {o.descripcion && (
                        <span className="sugerencia-descripcion">{o.descripcion}</span>
                      )}
                    </span>
                    {elegida && (
                      <svg
                        className="sugerencia-check"
                        viewBox="0 0 24 24"
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import {
  formatearPieza,
  formatearTamanos,
  medidaEnDiseno,
  tallasSugeridas,
  textoComparable,
} from '@inventario/shared'
import CampoSugerencias from '../ui/CampoSugerencias.jsx'

/** Campo con etiqueta y error (mismo aspecto que el resto de formularios). */
export function Campo({ id, etiqueta, error, ayuda, className = '', children }) {
  return (
    <div className={`campo${error ? ' campo-con-error' : ''} ${className}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {error ? (
        <small className="campo-error">{error}</small>
      ) : (
        ayuda && <small className="campo-ayuda">{ayuda}</small>
      )}
    </div>
  )
}

/** "maz4t5 · Mazatenango (Puño)". */
export function etiquetaDiseno(diseno) {
  return [
    diseno.codigo,
    diseno.nombre && `· ${diseno.nombre}`,
    `(${formatearPieza(diseno.pieza)})`,
  ]
    .filter(Boolean)
    .join(' ')
}

/**
 * Selector de diseno.
 * @param {{ id: string, valor: string, alCambiar: (id: string) => void, disenos: any[], invalido?: boolean, vacio?: string }} props
 */
export function SelectorDiseno({
  id,
  valor,
  alCambiar,
  disenos,
  invalido = false,
  vacio = 'Elige un diseño…',
}) {
  return (
    <select
      id={id}
      value={valor}
      aria-invalid={invalido || undefined}
      onChange={(e) => alCambiar(e.target.value)}
    >
      <option value="">{vacio}</option>
      {disenos.map((d) => (
        <option key={d.id} value={d.id}>
          {etiquetaDiseno(d)}
        </option>
      ))}
    </select>
  )
}

/**
 * Diseno que corresponde a lo escrito: su etiqueta completa o su codigo
 * (si ese codigo no lo comparten un cuello y un puno). null si no hay uno.
 */
function disenoDeTexto(texto, disenos) {
  const buscado = textoComparable(texto)
  if (!buscado) return null
  const porEtiqueta = disenos.find((d) => textoComparable(etiquetaDiseno(d)) === buscado)
  if (porEtiqueta) return porEtiqueta
  const porCodigo = disenos.filter((d) => textoComparable(d.codigo) === buscado)
  return porCodigo.length === 1 ? porCodigo[0] : null
}

/**
 * Diseno con busqueda: se escribe parte del codigo o del nombre y la lista
 * muestra los que coinciden (igual que el campo de talla). Solo queda
 * elegido un diseno que existe; cualquier otro texto cuenta como "sin elegir".
 * @param {{ id: string, valor: string, alCambiar: (id: string) => void, disenos: any[], invalido?: boolean }} props
 */
export function BuscadorDiseno({ id, valor, alCambiar, disenos, invalido = false }) {
  const [texto, setTexto] = useState('')
  const elegido = disenos.find((d) => d.id === valor)
  const escrito = disenoDeTexto(texto, disenos)
  // Lo que se muestra se deriva del valor: si el formulario cambia el diseno
  // por fuera (limpiar, duplicar) el texto lo sigue, sin efectos.
  let visible = texto
  if (elegido) visible = escrito?.id === elegido.id ? texto : etiquetaDiseno(elegido)
  else if (escrito) visible = ''

  return (
    <CampoSugerencias
      id={id}
      valor={visible}
      alCambiar={(nuevo) => {
        setTexto(nuevo)
        alCambiar(disenoDeTexto(nuevo, disenos)?.id ?? '')
      }}
      sugerencias={disenos.map((d) => ({
        valor: etiquetaDiseno(d),
        descripcion: formatearTamanos(d),
      }))}
      placeholder="Escribe el código o el nombre"
      invalido={invalido}
      vacio="Ningún diseño coincide."
    />
  )
}

/**
 * Medida: de la 10 a la 20 (o las tallas del puno); se puede escribir.
 * @param {{ id: string, valor: string, alCambiar: (talla: string) => void, diseno: any, invalido?: boolean }} props
 */
export function SelectorTalla({ id, valor, alCambiar, diseno, invalido = false }) {
  // Las del diseño se marcan; las demás quedan como "bajo pedido" (se tejen).
  const describir = (m) => {
    if (!diseno) return undefined
    return medidaEnDiseno(diseno, m) ? 'del diseño' : 'bajo pedido'
  }
  const sugerencias = tallasSugeridas(diseno).map((m) => ({
    valor: m,
    descripcion: describir(m),
  }))
  return (
    <CampoSugerencias
      id={id}
      valor={valor}
      alCambiar={(v) => alCambiar(v.slice(0, 12))}
      sugerencias={sugerencias}
      placeholder={diseno ? 'Medida del diseño' : '10 a 20'}
      invalido={invalido}
      vacio="Otra medida: se usará lo que escribas."
    />
  )
}

let contador = 0
/** Clave unica para una linea nueva (solo para React, no viaja a la base). */
export const nuevaClave = () => `linea-${++contador}`

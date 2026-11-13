import { useState } from 'react'
import { opcionesTipo } from '@inventario/shared'
import { useTiposCuello } from '../hooks/useTiposCuello.js'
import CampoFormulario from './CampoFormulario.jsx'
import ModalNuevoTipo from './ModalNuevoTipo.jsx'

const VALOR_NUEVO = '__nuevo_tipo__'

/**
 * Selector de tipo con una ultima opcion "Agregar tipo…" que abre un modal.
 * @param {{
 *   descriptor: import('@inventario/shared').DescriptorCampo,
 *   valor: string,
 *   error?: string,
 *   alCambiar: (nombre: string, valor: string) => void,
 * }} props
 */
export default function SelectorTipo({ descriptor, valor, error, alCambiar }) {
  const { tipos, recargar } = useTiposCuello()
  const [modalAbierto, setModalAbierto] = useState(false)

  const opciones = [
    ...opcionesTipo(tipos, valor),
    { valor: VALOR_NUEVO, etiqueta: '+ Agregar tipo…' },
  ]

  return (
    <>
      <CampoFormulario
        descriptor={{ ...descriptor, tipo: 'seleccion', opciones }}
        valor={valor}
        error={error}
        alCambiar={(nombre, nuevo) => {
          if (nuevo === VALOR_NUEVO) setModalAbierto(true)
          else alCambiar(nombre, nuevo)
        }}
      />
      {modalAbierto && (
        <ModalNuevoTipo
          alCerrar={() => setModalAbierto(false)}
          alCrear={(nombre) => {
            setModalAbierto(false)
            recargar()
            alCambiar(descriptor.nombre, nombre)
          }}
        />
      )}
    </>
  )
}

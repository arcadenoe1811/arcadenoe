import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { IconoCerrar } from '../Iconos.jsx'

/**
 * Ventana modal accesible (elemento <dialog> nativo: foco atrapado, Escape
 * cierra, fondo oscurecido). Se cierra al tocar fuera, con Escape o con el
 * botón ×.
 *
 * @param {{
 *   titulo: import('react').ReactNode,
 *   children: import('react').ReactNode,
 *   acciones?: import('react').ReactNode,
 *   alCerrar: () => void,
 *   className?: string,
 * }} props
 */
export default function Modal({ titulo, children, acciones, alCerrar, className = '' }) {
  const refDialogo = useRef(/** @type {HTMLDialogElement|null} */ (null))

  useEffect(() => {
    const dialogo = refDialogo.current
    if (dialogo && !dialogo.open) dialogo.showModal()
    return () => dialogo?.close()
  }, [])

  return createPortal(
    <dialog
      ref={refDialogo}
      className={`modal ${className}`}
      onCancel={(evento) => {
        evento.preventDefault()
        alCerrar()
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) alCerrar()
      }}
    >
      <div className="modal-caja">
        <div className="modal-cabecera-simple">
          <h2 className="modal-titulo">{titulo}</h2>
          <button
            type="button"
            className="modal-cerrar"
            onClick={alCerrar}
            aria-label="Cerrar"
          >
            <IconoCerrar width="20" height="20" />
          </button>
        </div>
        <div className="modal-contenido">{children}</div>
        {acciones && <div className="modal-acciones">{acciones}</div>}
      </div>
    </dialog>,
    document.body,
  )
}

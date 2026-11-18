import { ETIQUETAS_ESTADO_CONO, estadoCono } from '@inventario/shared'

const ICONOS = {
  disponible: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  bajo: (
    <>
      <path d="M12 4L2.5 20h19L12 4z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
  agotado: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
    </>
  ),
}

/**
 * Estado del stock con icono + texto (nunca solo color).
 * @param {{ cono: { stock_actual: number, stock_minimo: number }, grande?: boolean }} props
 */
export default function InsigniaEstadoCono({ cono, grande = false }) {
  const estado = estadoCono(cono)
  return (
    <span
      className={`insignia-estado insignia-${estado}${grande ? ' insignia-grande' : ''}`}
    >
      <svg
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
        {ICONOS[estado]}
      </svg>
      {ETIQUETAS_ESTADO_CONO[estado]}
    </span>
  )
}

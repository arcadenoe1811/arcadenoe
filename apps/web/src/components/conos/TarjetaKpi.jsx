import { Link } from 'react-router-dom'

const ICONOS = {
  conos: (
    <>
      <path d="M8 3h8l3 18H5L8 3z" />
      <path d="M7 9h10M6 15h12" />
    </>
  ),
  valor: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9.2c-.5-1-1.6-1.6-3-1.6-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.7-3.1-1.7M12 6v1.6M12 16.6V18" />
    </>
  ),
  ok: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.8 2.8L16 10" />
    </>
  ),
  salida: (
    <>
      <path d="M12 4v11M7 10l5 5 5-5" />
      <path d="M5 20h14" />
    </>
  ),
  cuello: (
    <>
      <path d="M8 3L3 7l3 4 2-1.5V21h8V9.5L18 11l3-4-5-4" />
      <path d="M8 3c.8 2 2.2 3 4 3s3.2-1 4-3" />
    </>
  ),
  alerta: (
    <>
      <path d="M12 4L2.5 20h19L12 4z" />
      <path d="M12 10v4.5M12 17.2v.3" />
    </>
  ),
}

/**
 * Tarjeta de indicador (KPI): icono, numero grande y etiqueta debajo.
 * `estado` colorea la tarjeta; el texto siempre explica el estado (nunca solo color).
 * @param {{
 *   icono: keyof typeof ICONOS,
 *   valor: string,
 *   etiqueta: string,
 *   detalle?: import('react').ReactNode,
 *   estado?: 'neutro'|'ok'|'bajo'|'agotado',
 *   a?: string,
 * }} props
 */
export default function TarjetaKpi({
  icono,
  valor,
  etiqueta,
  detalle,
  estado = 'neutro',
  a,
}) {
  const contenido = (
    <>
      <span className="kpi-icono" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICONOS[icono]}
        </svg>
      </span>
      <span className="kpi-texto">
        <span
          className={`kpi-valor${String(valor).length > 9 ? ' kpi-valor-largo' : ''}`}
        >
          {valor}
        </span>
        <span className="kpi-etiqueta">{etiqueta}</span>
        {detalle && <span className="kpi-detalle">{detalle}</span>}
      </span>
    </>
  )
  const clase = `kpi kpi-${estado}`
  return a ? (
    <Link to={a} className={`${clase} kpi-enlace`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  )
}

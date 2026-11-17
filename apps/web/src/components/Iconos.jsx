/** Iconos SVG en linea (heredan el color del texto). */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export function IconoCorreo(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

export function IconoCandado(props) {
  return (
    <svg {...base} {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function IconoOjo(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function IconoOjoTachado(props) {
  return (
    <svg {...base} {...props}>
      <path d="M10.6 5.1A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a10 10 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
    </svg>
  )
}

export function IconoMenu(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function IconoCerrar(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function IconoSalir(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

/* ---------- Menu lateral ---------- */

export function IconoTablero(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="8" height="10" rx="1.5" />
      <rect x="13" y="3" width="8" height="6" rx="1.5" />
      <rect x="13" y="11" width="8" height="10" rx="1.5" />
      <rect x="3" y="15" width="8" height="6" rx="1.5" />
    </svg>
  )
}

export function IconoInventario(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 3h8l3 18H5L8 3z" />
      <path d="M7 9h10M6 15h12" />
    </svg>
  )
}

export function IconoPaleta(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-2 0-1.6-1-2 0-3 .8-.8 2-.5 3.5-.5A3.5 3.5 0 0 0 21 12c0-5-4-9-9-9z" />
      <circle cx="7.5" cy="11.5" r="1" />
      <circle cx="10.5" cy="7.5" r="1" />
      <circle cx="15.5" cy="8" r="1" />
    </svg>
  )
}

export function IconoCuello(props) {
  return (
    <svg {...base} {...props}>
      <path d="M8 3L3 7l3 4 2-1.500V21h8V9.500L18 11l3-4-5-4" />
      <path d="M8 3c.8 2 2.2 3 4 3s3.2-1 4-3" />
    </svg>
  )
}

export function IconoVentas(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9.200c-.5-1-1.6-1.6-3-1.6-1.7 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.4 0-2.6-.7-3.1-1.700M12 6v1.600M12 16.600V18" />
    </svg>
  )
}

export function IconoCalculadora(props) {
  return (
    <svg {...base} {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8.5 7.500h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
    </svg>
  )
}

export function IconoUsuarios(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.5 3.2-5.5 6.5-5.500s5.9 2 6.5 5.500M16 4.700a3.5 3.5 0 0 1 0 6.600M18.5 14.800c1.7.8 2.7 2.6 3 5.2" />
    </svg>
  )
}

export function IconoReportes(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h9l4 4v14H6V3z" />
      <path d="M14 3v5h5M9.5 17v-3M12.5 17v-5M15.5 17v-2" />
    </svg>
  )
}

export function IconoContraer(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16M16 9.5L13.5 12l2.5 2.5" />
    </svg>
  )
}

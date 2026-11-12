/**
 * Tokens de diseno. Se publican como CSS custom properties (--nombre) en
 * :root al arrancar, y estilos.css solo usa var(--...).
 */
export const tema = {
  // colores
  'color-fondo': '#f6f7f9',
  'color-superficie': '#ffffff',
  'color-superficie-suave': '#f0f2f5',
  'color-borde': '#dde1e7',
  'color-borde-fuerte': '#c3c9d2',
  'color-texto': '#1d2430',
  'color-texto-suave': '#5b6575',
  'color-primario': '#2f5d8a',
  'color-primario-hover': '#244a6e',
  'color-primario-suave': '#e6eef6',
  'color-peligro': '#b3261e',
  'color-peligro-suave': '#fbeceb',
  'color-exito': '#1f7a4d',
  'color-exito-suave': '#e7f4ed',

  // colores por tipo de cuello
  'tipo-liso': '#5b6575',
  'tipo-tubular': '#2f5d8a',
  'tipo-gaspeado': '#8a4f2f',
  'tipo-otro': '#6b4f8a',

  // tipografia
  'fuente-base': "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  'fuente-mono': "ui-monospace, 'Cascadia Code', Consolas, monospace",
  'texto-pequeno': '0.8125rem',
  'texto-base': '0.9375rem',
  'texto-grande': '1.25rem',
  'texto-titulo': '1.625rem',

  // espaciado y forma
  'espacio-1': '0.25rem',
  'espacio-2': '0.5rem',
  'espacio-3': '0.75rem',
  'espacio-4': '1rem',
  'espacio-6': '1.5rem',
  'espacio-8': '2rem',
  'radio': '8px',
  'radio-grande': '12px',
  'sombra': '0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)',
  'sombra-elevada': '0 4px 12px rgba(16, 24, 40, 0.12)',
  'ancho-maximo': '1120px',
};

/** Escribe los tokens como variables CSS en :root. */
export function aplicarTema(tokens = tema) {
  const estilo = document.documentElement.style;
  for (const [nombre, valor] of Object.entries(tokens)) {
    estilo.setProperty(`--${nombre}`, valor);
  }
}

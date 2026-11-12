import './Tarjeta.css';

/**
 * Contenedor con fondo, borde redondeado y sombra.
 * @param {{
 *   padding?: 'sm'|'md'|'lg',
 *   hoverable?: boolean,
 *   como?: keyof JSX.IntrinsicElements,
 *   className?: string,
 *   children?: import('react').ReactNode,
 * } & Record<string, unknown>} props
 */
export default function Tarjeta({ padding = 'md', hoverable = false, como: Elemento = 'div', className = '', children, ...resto }) {
  const clases = ['tarjeta-ui', `tarjeta-ui-${padding}`, hoverable && 'tarjeta-ui-hoverable', className].filter(Boolean).join(' ');
  return (
    <Elemento className={clases} {...resto}>
      {children}
    </Elemento>
  );
}

/** Cuadrito con el color; tachado si no hay hex. */
export default function MuestraColor({ hex }) {
  return (
    <span
      className={`muestra-color${hex ? '' : ' sin-color'}`}
      style={hex ? { background: hex } : undefined}
      aria-hidden="true"
    />
  );
}

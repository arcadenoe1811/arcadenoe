import { normalizarError } from '@inventario/shared';

/** Se muestra si la app no puede arrancar (p. ej. falta el .env). */
export default function PantallaErrorConfiguracion({ error }) {
  const { mensaje } = normalizarError(error);
  return (
    <main className="contenedor">
      <div className="aviso aviso-error" role="alert">
        <strong>No se pudo iniciar la aplicación.</strong>
        <p>{mensaje}</p>
        <p>Copia <code>.env.example</code> a <code>.env</code> en la raíz del proyecto y reinicia <code>npm run dev</code>.</p>
      </div>
    </main>
  );
}

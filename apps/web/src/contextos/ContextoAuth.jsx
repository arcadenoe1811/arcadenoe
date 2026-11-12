import { createContext, useEffect, useMemo, useState } from 'react';
import {
  cerrarSesion as cerrarSesionSupabase,
  escucharCambiosSesion,
  iniciarSesion as iniciarSesionSupabase,
  obtenerCliente,
  obtenerSesion,
} from '@inventario/shared';

/**
 * @typedef {Object} ValorAuth
 * @property {import('@supabase/supabase-js').User|null} usuario
 * @property {import('@supabase/supabase-js').Session|null} sesion
 * @property {boolean} cargando  true mientras se verifica la sesion guardada
 * @property {(email: string, contrasena: string) => Promise<{ usuario: object|null, error: string|null }>} iniciarSesion
 * @property {() => Promise<{ error: string|null }>} cerrarSesion
 */

/** @type {import('react').Context<ValorAuth|null>} */
export const ContextoAuth = createContext(null);

/**
 * Provider de autenticacion. Recupera la sesion guardada al arrancar y
 * escucha onAuthStateChange para reaccionar a login, logout (tambien en
 * otra pestana) y expiracion del token.
 */
export function ProveedorAuth({ children }) {
  const [sesion, setSesion] = useState(/** @type {import('@supabase/supabase-js').Session|null} */ (null));
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cliente = obtenerCliente();
    let vigente = true;

    obtenerSesion(cliente).then(({ sesion: guardada }) => {
      if (!vigente) return;
      setSesion(guardada);
      setCargando(false);
    });

    const dejarDeEscuchar = escucharCambiosSesion(cliente, (nueva) => {
      if (!vigente) return;
      setSesion(nueva);
      setCargando(false);
    });

    return () => {
      vigente = false;
      dejarDeEscuchar();
    };
  }, []);

  const valor = useMemo(
    () => ({
      usuario: sesion?.user ?? null,
      sesion,
      cargando,
      iniciarSesion: (email, contrasena) => iniciarSesionSupabase(obtenerCliente(), email, contrasena),
      cerrarSesion: () => cerrarSesionSupabase(obtenerCliente()),
    }),
    [sesion, cargando],
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

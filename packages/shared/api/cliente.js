import { createClient } from '@supabase/supabase-js'
import { ErrorNormalizado } from './errores.js'

/** Clave de localStorage donde supabase-js guarda la sesion. */
export const CLAVE_SESION = 'inventario-cuellos-sesion'

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cliente = null

/**
 * Crea la instancia unica de supabase-js. Se llama una sola vez al arrancar
 * la app, pasando las variables de entorno (shared no lee import.meta.env).
 * @param {{ url: string, llaveAnonima: string }} configuracion
 */
export function configurarCliente({ url, llaveAnonima }) {
  if (!url || !llaveAnonima) {
    throw new ErrorNormalizado({
      mensaje: 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env',
      codigo: 'configuracion',
    })
  }
  cliente = createClient(url, llaveAnonima, {
    // La sesion se guarda en el navegador y sobrevive a recargas, pero NO es
    // eterna: ContextoAuth la cierra tras 8 horas de inactividad y GoTrue
    // rechaza renovarla pasado ese tiempo (sessions.inactivity_timeout).
    // Los tokens no viajan en la URL (detectSessionInUrl: false).
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: CLAVE_SESION,
    },
  })
  return cliente
}

/**
 * Devuelve la instancia configurada.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function obtenerCliente() {
  if (!cliente) {
    throw new ErrorNormalizado({
      mensaje:
        'El cliente de Supabase no esta configurado. Llama a configurarCliente() al arrancar.',
      codigo: 'configuracion',
    })
  }
  return cliente
}

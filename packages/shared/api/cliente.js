import { createClient } from '@supabase/supabase-js';
import { ErrorNormalizado } from './errores.js';

/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
let cliente = null;

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
    });
  }
  cliente = createClient(url, llaveAnonima, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

/**
 * Devuelve la instancia configurada.
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function obtenerCliente() {
  if (!cliente) {
    throw new ErrorNormalizado({
      mensaje: 'El cliente de Supabase no esta configurado. Llama a configurarCliente() al arrancar.',
      codigo: 'configuracion',
    });
  }
  return cliente;
}

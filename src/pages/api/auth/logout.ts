import type { APIRoute } from 'astro';
import { clearSessionCookies } from '../../../lib/auth';
import { getSupabaseServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Cerramos sesión en Supabase (esto invalida el token)
    const client = getSupabaseServerClient();
    await client.auth.signOut();

    // Limpiamos las cookies locales del navegador
    clearSessionCookies(cookies);

    return new Response(
      JSON.stringify({ success: true, message: 'Sesión cerrada correctamente.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error en API logout:', err);
    return new Response(
      JSON.stringify({ error: 'Ocurrió un error inesperado al cerrar sesión.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';

export const GET: APIRoute = async ({ request }) => {
  try {
    const requestUrl = new URL(request.url);
    const basePrefix = requestUrl.pathname.startsWith('/la-romanita') ? '/la-romanita' : '';
    const redirectTo = new URL(`${basePrefix}/api/auth/google/callback`, requestUrl.origin).toString();

    const client = getSupabaseServerClient();
    const { data, error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error || !data.url) {
      console.error('Error al iniciar OAuth con Google:', error);
      return new Response('No se pudo iniciar login con Google.', { status: 500 });
    }

    return Response.redirect(data.url, 302);
  } catch (err) {
    console.error('Error en endpoint /api/auth/google:', err);
    return new Response('Error inesperado al iniciar login con Google.', { status: 500 });
  }
};

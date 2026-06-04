import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../../lib/supabase';
import { setSessionCookies } from '../../../../lib/auth';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const oauthError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error');
    const basePrefix = requestUrl.pathname.startsWith('/la-romanita') ? '/la-romanita' : '';

    if (oauthError) {
      const loginUrl = new URL(`${basePrefix}/login`, requestUrl.origin);
      loginUrl.searchParams.set('error', oauthError);
      return Response.redirect(loginUrl.toString(), 302);
    }

    if (!code) {
      const loginUrl = new URL(`${basePrefix}/login`, requestUrl.origin);
      loginUrl.searchParams.set('error', 'No se recibió código de autenticación.');
      return Response.redirect(loginUrl.toString(), 302);
    }

    const client = getSupabaseServerClient();
    const { data, error } = await client.auth.exchangeCodeForSession(code);

    if (error || !data.session || !data.user) {
      console.error('Error al intercambiar código OAuth:', error);
      const loginUrl = new URL(`${basePrefix}/login`, requestUrl.origin);
      loginUrl.searchParams.set('error', 'No fue posible iniciar sesión con Google.');
      return Response.redirect(loginUrl.toString(), 302);
    }

    setSessionCookies(cookies, data.session.access_token, data.session.refresh_token);

    const authenticatedClient = getSupabaseServerClient(data.session.access_token);
    const email = data.user.email || '';
    const metadataName =
      (data.user.user_metadata?.name as string | undefined) ||
      (data.user.user_metadata?.full_name as string | undefined) ||
      email.split('@')[0] ||
      'Usuario';

    await authenticatedClient.from('profiles').upsert(
      {
        id: data.user.id,
        email,
        name: metadataName,
        role: 'client',
        client_type: 'minorista',
      },
      { onConflict: 'id' }
    );

    const { data: profile } = await authenticatedClient
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    const destination = profile?.role === 'admin' ? `${basePrefix}/admin/dashboard` : `${basePrefix}/menu`;
    return Response.redirect(new URL(destination, requestUrl.origin).toString(), 302);
  } catch (err) {
    console.error('Error en callback OAuth Google:', err);
    const requestUrl = new URL(request.url);
    const basePrefix = requestUrl.pathname.startsWith('/la-romanita') ? '/la-romanita' : '';
    const loginUrl = new URL(`${basePrefix}/login`, requestUrl.origin);
    loginUrl.searchParams.set('error', 'Error inesperado al completar login con Google.');
    return Response.redirect(loginUrl.toString(), 302);
  }
};

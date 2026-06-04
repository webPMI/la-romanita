import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';
import { setSessionCookies } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { email, password, remember } = body;

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'El correo electrónico y la contraseña son requeridos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Inicializar cliente Supabase público en servidor para autenticar
    const client = getSupabaseServerClient();
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return new Response(
        JSON.stringify({ error: error?.message || 'Correo o contraseña incorrectos.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Consultar el perfil del usuario utilizando su access token
    const authenticatedClient = getSupabaseServerClient(data.session.access_token);
    const { data: profile, error: profileError } = await authenticatedClient
      .from('profiles')
      .select('name, role, client_type')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil de usuario no encontrado en la base de datos.' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Guardar tokens de acceso en cookies seguras (HttpOnly)
    setSessionCookies(cookies, data.session.access_token, data.session.refresh_token, {
      remember: !!remember,
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          email: data.user.email,
          name: profile.name,
          role: profile.role,
          client_type: profile.client_type,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error en API login:', err);
    return new Response(
      JSON.stringify({ error: 'Ocurrió un error inesperado en el servidor.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

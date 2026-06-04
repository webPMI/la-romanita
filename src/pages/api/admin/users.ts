import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';
import { getUserFromSession, getSessionTokens } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getUserFromSession(cookies);
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 403 });
    }

    const { accessToken } = getSessionTokens(cookies);
    const supabase = getSupabaseServerClient(accessToken);

    const body = await request.json();
    const { id, name, email, role, client_type, cif, razon_social, direccion_fiscal } = body;

    if (!name || !email || !role || !client_type) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios.' }), { status: 400 });
    }

    if (client_type === 'mayorista' && (!cif || !razon_social || !direccion_fiscal)) {
      return new Response(JSON.stringify({ error: 'Los datos comerciales son obligatorios para mayoristas.' }), { status: 400 });
    }

    if (id) {
      // Editar usuario existente en tabla profiles
      const updateData: any = { name, role, client_type };
      if (client_type === 'mayorista') {
        updateData.cif = cif;
        updateData.razon_social = razon_social;
        updateData.direccion_fiscal = direccion_fiscal;
      } else {
        updateData.cif = null;
        updateData.razon_social = null;
        updateData.direccion_fiscal = null;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      }
    } else {
      // Crear nuevo usuario en Supabase Auth
      // Al crear un usuario por el admin, le asignamos una contraseña por defecto
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Password123!',
        options: {
          data: {
            name,
            role,
            client_type,
            cif: client_type === 'mayorista' ? cif : '',
            company_name: client_type === 'mayorista' ? razon_social : '',
            fiscal_address: client_type === 'mayorista' ? direccion_fiscal : ''
          }
        }
      });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || 'Error del servidor' }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getUserFromSession(cookies);
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 403 });
    }

    const { accessToken } = getSessionTokens(cookies);
    const supabase = getSupabaseServerClient(accessToken);

    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID de usuario requerido.' }), { status: 400 });
    }

    // Borrar perfil del usuario
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message || 'Error del servidor' }), { status: 500 });
  }
};

import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password, name, surname, phone, client_type, cif, company_name, fiscal_address } = body;

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Por favor, completa todos los campos requeridos.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const type = client_type === 'mayorista' ? 'mayorista' : 'minorista';

    if (type === 'mayorista') {
      if (!cif || !company_name || !fiscal_address) {
        return new Response(
          JSON.stringify({ error: 'Los datos comerciales (CIF, Razón Social y Dirección Fiscal) son obligatorios para mayoristas.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const client = getSupabaseServerClient();

    // Crear el usuario en Supabase Auth pasándole los datos en raw_user_meta_data
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
          surname: surname || '',
          phone: phone || '',
          role: 'client',
          client_type: type,
          cif: type === 'mayorista' ? cif : '',
          company_name: type === 'mayorista' ? company_name : '',
          fiscal_address: type === 'mayorista' ? fiscal_address : ''
        }
      }
    });

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Registro completado con éxito.',
        user: data.user
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error en API register:', err);
    return new Response(
      JSON.stringify({ error: 'Ocurrió un error inesperado al procesar el registro.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};


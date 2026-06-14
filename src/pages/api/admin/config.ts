import type { APIRoute } from 'astro';
import { getSupabaseServerClient, clearCache } from '../../../lib/supabase';
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
    const { type, data } = body;

    if (!type || !data || !data.id) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let error;
    if (type === 'horarios') {
      const { id, hora_apertura, hora_cierre, is_active } = data;
      const { error: dbError } = await supabase
        .from('horarios')
        .update({ hora_apertura, hora_cierre, is_active: !!is_active })
        .eq('id', id);
      error = dbError;
    } else if (type === 'contacto') {
      const { id, valor, descripcion } = data;
      const { error: dbError } = await supabase
        .from('contacto')
        .update({ valor, descripcion })
        .eq('id', id);
      error = dbError;
    } else if (type === 'banners') {
      const { id, titulo, mensaje, is_active } = data;
      const { error: dbError } = await supabase
        .from('banners')
        .update({ titulo, mensaje, is_active: !!is_active })
        .eq('id', id);
      error = dbError;
    } else {
      return new Response(JSON.stringify({ error: 'Tipo de configuración desconocido.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Invalida la caché completa en memoria
    clearCache();

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
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

    const { type, id } = await request.json();
    if (!type || !id) {
      return new Response(JSON.stringify({ error: 'ID y tipo requeridos.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    let error;
    if (type === 'banners') {
      const { error: dbError } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      error = dbError;
    } else {
      return new Response(JSON.stringify({ error: 'Operación no permitida.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    clearCache();
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

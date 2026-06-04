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
    const { id, name, category, image_url, price_minorista, price_mayorista, is_offer, is_active } = body;

    if (!name || !category || price_minorista === undefined || price_mayorista === undefined) {
      return new Response(JSON.stringify({ error: 'Faltan campos obligatorios.' }), { status: 400 });
    }

    const productData = {
      name,
      category,
      image_url: image_url || null,
      price_minorista,
      price_mayorista,
      is_offer: !!is_offer,
      is_active: is_active !== false
    };

    let result;
    if (id) {
      // Update
      result = await supabase
        .from('products')
        .update(productData)
        .eq('id', id)
        .select()
        .single();
    } else {
      // Insert
      result = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();
    }

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ success: true, product: result.data }), { status: 200 });

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
      return new Response(JSON.stringify({ error: 'ID de producto requerido.' }), { status: 400 });
    }

    const { error } = await supabase
      .from('products')
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

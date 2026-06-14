import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';
import { getUserFromSession, getSessionTokens } from '../../../lib/auth';
import { sendOrderReadyEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const user = await getUserFromSession(cookies);
    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'No autorizado.' }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    }

    const { accessToken } = getSessionTokens(cookies);
    const supabase = getSupabaseServerClient(accessToken);

    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== 'next') {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 1. Obtener el pedido actual
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      return new Response(JSON.stringify({ error: 'Pedido no encontrado.' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    let nextStatus = '';
    if (order.status === 'pendiente') {
      nextStatus = 'listo';
    } else if (order.status === 'listo') {
      nextStatus = 'entregado';
    } else {
      return new Response(JSON.stringify({ error: 'El pedido ya está en su estado final.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // 2. Actualizar estado
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: nextStatus })
      .eq('id', id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Si el estado cambia a listo, enviar notificación por correo electrónico
    if (nextStatus === 'listo' && order.user_id) {
      try {
        // Obtener el perfil del cliente
        const { data: profile } = await supabase
          .from('profiles')
          .select('email, name')
          .eq('id', order.user_id)
          .single();

        if (profile && profile.email) {
          await sendOrderReadyEmail(profile.email, order.id, profile.name);
        }
      } catch (emailErr) {
        console.error('Error al enviar correo de notificación:', emailErr);
      }
    }

    return new Response(JSON.stringify({ success: true, nextStatus }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Error del servidor' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};

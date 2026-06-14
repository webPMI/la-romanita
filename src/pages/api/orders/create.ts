import type { APIRoute } from 'astro';
import { getSupabaseServerClient } from '../../../lib/supabase';
import { getUserFromSession } from '../../../lib/auth';
import { sendOrderConfirmationEmail } from '../../../lib/email';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // 1. Validar la sesión del usuario (debe estar autenticado)
    const userSession = await getUserFromSession(cookies);
    if (!userSession) {
      return new Response(
        JSON.stringify({ error: 'Debes iniciar sesión para realizar un pedido.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'El carrito no puede estar vacío.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar estructura básica de cada ítem antes de ir a la DB
    for (const item of items) {
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty < 1) {
        return new Response(
          JSON.stringify({ error: 'La cantidad de cada producto debe ser un número entero mayor que cero.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. Conectar a Supabase
    const accessToken = cookies.get('sb-access-token')?.value;
    const client = getSupabaseServerClient(accessToken);

    // 3. Consultar todos los productos en la base de datos para validar precios y evitar fraudes del lado del cliente
    const productIds = items.map((item: any) => item.product_id || item.id);
    const { data: dbProducts, error: dbError } = await client
      .from('products')
      .select('id, price_minorista, price_mayorista, name, is_active')
      .in('id', productIds);

    if (dbError || !dbProducts) {
      console.error('Error al validar productos en la DB:', dbError);
      return new Response(
        JSON.stringify({ error: 'Error al procesar el pedido. Inténtelo más tarde.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Calcular el total verificando los precios reales desde la base de datos
    const isMayorista = userSession.client_type === 'mayorista';
    let verifiedTotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const dbProduct = dbProducts.find((p: any) => p.id === (item.product_id || item.id));
      if (!dbProduct || dbProduct.is_active === false) {
        return new Response(
          JSON.stringify({ error: `El producto "${item.name}" ya no está disponible.` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Escoger el precio correspondiente en base al tipo de cliente
      const realPrice = isMayorista ? Number(dbProduct.price_mayorista) : Number(dbProduct.price_minorista);
      const subtotal = realPrice * Math.round(Number(item.qty));
      verifiedTotal += subtotal;

      verifiedItems.push({
        product_id: dbProduct.id,
        name: dbProduct.name,
        qty: Math.round(Number(item.qty)),
        price: realPrice
      });
    }

    // 5. Insertar el pedido en la base de datos
    const { data: newOrder, error: orderError } = await client
      .from('orders')
      .insert({
        user_id: userSession.id,
        status: 'pendiente',
        total: verifiedTotal,
        items: verifiedItems
      })
      .select()
      .single();

    if (orderError || !newOrder) {
      console.error('Error al guardar el pedido en Supabase:', orderError);
      return new Response(
        JSON.stringify({ error: 'No se pudo registrar el pedido en la base de datos.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 6. Enviar correo de confirmación de forma asíncrona
    // Se utiliza el correo de la sesión verificada en el servidor
    try {
      await sendOrderConfirmationEmail(
        userSession.email,
        newOrder.id,
        userSession.name,
        verifiedItems,
        verifiedTotal
      );
    } catch (emailErr) {
      // Logueamos pero no bloqueamos la respuesta al cliente
      console.error('Error al enviar correo de confirmación:', emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: newOrder.id,
        total: verifiedTotal
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('Error en API crear pedido:', err);
    return new Response(
      JSON.stringify({ error: 'Ocurrió un error inesperado al procesar el pedido.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

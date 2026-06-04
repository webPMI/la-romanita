import { Resend } from 'resend';

// La API Key de Resend debe estar configurada en las variables de entorno
const resendApiKey = import.meta.env.RESEND_API_KEY;
// En fase de desarrollo/onboarding de Resend se puede usar 'onboarding@resend.dev'
const fromEmail = import.meta.env.PUBLIC_EMAIL_FROM || 'La Romanita <onboarding@resend.dev>';

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface OrderItem {
  name: string;
  qty: number;
  price: number | string;
}

/**
 * Plantilla HTML premium para confirmación de pedido.
 */
function getOrderConfirmationTemplate(clientName: string, orderId: string, items: OrderItem[], total: string | number) {
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #333333;">
        <strong>${item.name}</strong> <span style="color: #bc1a22; font-weight: bold; margin-left: 4px;">x${item.qty}</span>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; color: #333333; text-align: right;">
        €${(parseFloat(item.price as string) * item.qty).toFixed(2)}
      </td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmación de Pedido - La Romanita</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background-color: #0b132b; padding: 40px 20px; text-align: center; }
        .logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-decoration: none; }
        .logo-romanita { color: #bc1a22; }
        .content { padding: 40px 30px; }
        .title { font-size: 22px; font-weight: 700; color: #0b132b; margin-top: 0; margin-bottom: 10px; text-align: center; }
        .subtitle { font-size: 15px; color: #64748b; line-height: 1.6; text-align: center; margin-bottom: 30px; }
        .order-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .total-row td { padding: 20px 0 10px; font-size: 18px; font-weight: 800; color: #0b132b; }
        .info-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 30px; font-size: 14px; color: #475569; line-height: 1.6; }
        .btn { display: block; background-color: #bc1a22; color: #ffffff !important; text-align: center; padding: 14px 20px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 16px; margin: 30px auto 0; max-width: 200px; box-shadow: 0 4px 12px rgba(188, 26, 34, 0.2); }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="logo">La<span class="logo-romanita">Romanita</span></span>
        </div>
        <div class="content">
          <h1 class="title">¡Gracias por tu pedido, ${clientName}!</h1>
          <p class="subtitle">Hemos recibido tu compra correctamente y la estamos preparando con mucho cariño. Abajo encontrarás el resumen de tu pedido.</p>
          
          <div class="info-box">
            <strong>Detalles del Pedido:</strong><br>
            • ID del Pedido: <code style="font-size: 12px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">#${orderId.slice(0, 8)}</code><br>
            • Estado actual: <span style="color: #d97706; font-weight: bold;">Pendiente de preparación</span><br>
            • Ubicación de Recogida: <strong>Carrer de Jaume Balmes, 59, 07004 Palma</strong>
          </div>

          <table class="order-table">
            <thead>
              <tr>
                <th style="text-align: left; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b;">Producto</th>
                <th style="text-align: right; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr class="total-row">
                <td style="border-top: 2px solid #e2e8f0;">Total</td>
                <td style="border-top: 2px solid #e2e8f0; text-align: right; color: #bc1a22;">€${parseFloat(total as string).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <p style="font-size: 14px; color: #64748b; line-height: 1.5; text-align: center;">Te enviaremos otro correo electrónico en cuanto tu pedido esté listo para retirar.</p>
          
          <a href="https://wa.me/34643384775" class="btn">Escríbenos por WhatsApp</a>
        </div>
        <div class="footer">
          La Romanita Palma • Carrer de Jaume Balmes, 59, Nord, 07004 Palma, Illes Balears.<br>
          Este correo es informativo, por favor no respondas a este mensaje.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Plantilla HTML premium para avisar que el pedido está listo para ser recogido.
 */
function getOrderReadyTemplate(clientName: string, orderId: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Tu pedido está listo - La Romanita</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9fc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); border: 1px solid #e1e8ed; }
        .header { background-color: #0b132b; padding: 40px 20px; text-align: center; }
        .logo { font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-decoration: none; }
        .logo-romanita { color: #bc1a22; }
        .content { padding: 40px 30px; text-align: center; }
        .badge { font-size: 50px; margin-bottom: 20px; display: inline-block; }
        .title { font-size: 24px; font-weight: 700; color: #10b981; margin-top: 0; margin-bottom: 10px; }
        .subtitle { font-size: 16px; color: #334155; line-height: 1.6; margin-bottom: 30px; }
        .info-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 0 auto 30px; font-size: 15px; color: #166534; line-height: 1.6; max-width: 480px; text-align: left; }
        .btn { display: inline-block; background-color: #bc1a22; color: #ffffff !important; text-align: center; padding: 14px 25px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 16px; margin-top: 10px; box-shadow: 0 4px 12px rgba(188, 26, 34, 0.2); }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="logo">La<span class="logo-romanita">Romanita</span></span>
        </div>
        <div class="content">
          <div class="badge">🍝🎉</div>
          <h1 class="title">¡Tu pedido está listo para recoger!</h1>
          <p class="subtitle">Hola ${clientName}, tu pasta fresca artesanal ya está empaquetada y lista en el mostrador. Puedes pasar a buscarla cuando quieras.</p>
          
          <div class="info-box">
            <strong>📍 Punto de Recogida:</strong><br>
            Carrer de Jaume Balmes, 59, Nord, 07004 Palma.<br><br>
            <strong>📄 Código del Pedido:</strong> <code style="font-size: 13px; background: #dcfce7; padding: 2px 6px; border-radius: 4px; color: #14532d;">#${orderId.slice(0, 8)}</code><br><br>
            <strong>⏰ Horarios de Tienda:</strong><br>
            Lunes a Sábado: 09:00 a 20:00<br>
            Domingos: 09:00 a 15:00
          </div>

          <p style="font-size: 14px; color: #64748b; line-height: 1.5; max-width: 450px; margin: 0 auto 30px;">
            Si tienes dudas o necesitas cambiar la hora de recogida, puedes avisarnos rápidamente haciendo clic abajo.
          </p>
          
          <a href="https://wa.me/34643384775" class="btn">¡Voy para allá! 🚀</a>
        </div>
        <div class="footer">
          La Romanita Palma • Carrer de Jaume Balmes, 59, Nord, 07004 Palma, Illes Balears.<br>
          Este correo es informativo, por favor no respondas a este mensaje.
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Envía correo de confirmación de pedido.
 */
export async function sendOrderConfirmationEmail(
  toEmail: string,
  orderId: string,
  clientName: string,
  items: OrderItem[],
  total: string | number
) {
  const subject = `Confirmación de Pedido #${orderId.slice(0, 8)} - La Romanita`;
  const html = getOrderConfirmationTemplate(clientName, orderId, items, total);

  if (!resend) {
    console.log('--- RESEND MOCK EMAIL (API Key no configurada) ---');
    console.log(`De: ${fromEmail}`);
    console.log(`Para: ${toEmail}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Pedido: ${orderId}, Total: €${total}`);
    console.log('--------------------------------------------------');
    return { success: true, mocked: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error al enviar email con Resend:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (e) {
    console.error('Excepción al enviar correo con Resend:', e);
    return { success: false, error: e };
  }
}

/**
 * Envía correo para avisar que el pedido está listo para recoger.
 */
export async function sendOrderReadyEmail(toEmail: string, orderId: string, clientName: string) {
  const subject = `¡Tu pedido #${orderId.slice(0, 8)} está listo para recoger! - La Romanita`;
  const html = getOrderReadyTemplate(clientName, orderId);

  if (!resend) {
    console.log('--- RESEND MOCK EMAIL (API Key no configurada) ---');
    console.log(`De: ${fromEmail}`);
    console.log(`Para: ${toEmail}`);
    console.log(`Asunto: ${subject}`);
    console.log(`Pedido ${orderId} está listo.`);
    console.log('--------------------------------------------------');
    return { success: true, mocked: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error al enviar email con Resend:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (e) {
    console.error('Excepción al enviar correo con Resend:', e);
    return { success: false, error: e };
  }
}

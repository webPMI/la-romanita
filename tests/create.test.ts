import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/pages/api/orders/create';

// Mocks
vi.mock('../src/lib/supabase', () => ({
    getSupabaseServerClient: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({
    getUserFromSession: vi.fn(),
}));
vi.mock('../src/lib/email', () => ({
    sendOrderConfirmationEmail: vi.fn(),
}));

import { getSupabaseServerClient } from '../src/lib/supabase';
import { getUserFromSession } from '../src/lib/auth';
import { sendOrderConfirmationEmail } from '../src/lib/email';

describe('API Orders - /api/orders/create', () => {
    const mockFrom = vi.fn();
    const mockSelect = vi.fn();
    const mockIn = vi.fn();
    const mockInsert = vi.fn();
    const mockSingle = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Configuración de la cadena encadenada (Chaining) de Supabase
        mockFrom.mockReturnValue({
            select: mockSelect,
            insert: mockInsert,
        });
        mockSelect.mockReturnValue({
            in: mockIn,
            single: mockSingle,
        });
        mockInsert.mockReturnValue({
            select: mockSelect,
        });

        (getSupabaseServerClient as any).mockReturnValue({
            from: mockFrom,
        });
    });

    const createRequest = (body: any) => ({
        request: {
            json: vi.fn().mockResolvedValue(body),
        },
        cookies: { get: vi.fn().mockReturnValue({ value: 'valid_token' }) },
    } as any);

    it('debe retornar 401 si el usuario no está autenticado', async () => {
        (getUserFromSession as any).mockResolvedValueOnce(null);

        const req = createRequest({ items: [] });
        const response = await POST(req);

        expect(response.status).toBe(401);
        const data = await response.json();
        expect(data.error).toMatch(/iniciar sesión/i);
    });

    it('debe retornar 400 si el carrito no tiene items', async () => {
        (getUserFromSession as any).mockResolvedValueOnce({ id: 'user_1' });

        const req = createRequest({ items: [] });
        const response = await POST(req);

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toMatch(/no puede estar vacío/i);
    });

    it('debe retornar 500 si ocurre un error validando los productos contra la base de datos', async () => {
        (getUserFromSession as any).mockResolvedValueOnce({ id: 'user_1' });
        mockIn.mockResolvedValueOnce({ data: null, error: new Error('Fallo de conexión') });

        const req = createRequest({ items: [{ product_id: 'prod_1', qty: 1 }] });
        const response = await POST(req);

        expect(response.status).toBe(500);
    });

    it('debe retornar 400 si se detecta un producto inválido (fraude o borrado)', async () => {
        (getUserFromSession as any).mockResolvedValueOnce({ id: 'user_1' });
        // El mock retorna un producto, pero el request envió dos
        mockIn.mockResolvedValueOnce({
            data: [{ id: 'prod_1', name: 'Raviolis', price_minorista: 10, price_mayorista: 8 }],
            error: null
        });

        const req = createRequest({
            items: [
                { product_id: 'prod_1', qty: 1 },
                { product_id: 'prod_fantasma', name: 'Salsa', qty: 1 }
            ]
        });

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/ya no está disponible/i);
    });

    it('debe calcular correctamente los precios para MINORISTAS y generar el pedido', async () => {
        const mockUser = { id: 'user_minorista', email: 'test@t.com', name: 'Juan', client_type: 'minorista' };
        (getUserFromSession as any).mockResolvedValueOnce(mockUser);

        mockIn.mockResolvedValueOnce({
            data: [
                { id: 'p1', name: 'Raviolis', price_minorista: 12, price_mayorista: 8 },
                { id: 'p2', name: 'Empanada', price_minorista: 3, price_mayorista: 2.5 }
            ],
            error: null
        });
        mockSingle.mockResolvedValueOnce({ data: { id: 'order_123' }, error: null });

        const req = createRequest({
            items: [{ product_id: 'p1', qty: 2 }, { product_id: 'p2', qty: 5 }]
        }); // (2 * 12 = 24) + (5 * 3 = 15) = 39

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.total).toBe(39);

        // Validar inserción segura
        expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'user_minorista',
            total: 39,
            items: expect.arrayContaining([
                expect.objectContaining({ product_id: 'p1', price: 12 })
            ])
        }));
        // Validar email
        expect(sendOrderConfirmationEmail).toHaveBeenCalledWith('test@t.com', 'order_123', 'Juan', expect.any(Array), 39);
    });

    it('debe calcular correctamente para MAYORISTAS y no fallar si el email asíncrono da error', async () => {
        const mockUser = { id: 'user_mayorista', email: 'empresa@t.com', name: 'Empresa', client_type: 'mayorista' };
        (getUserFromSession as any).mockResolvedValueOnce(mockUser);

        mockIn.mockResolvedValueOnce({ data: [{ id: 'p1', name: 'Raviolis', price_minorista: 12, price_mayorista: 8 }], error: null });
        mockSingle.mockResolvedValueOnce({ data: { id: 'order_124' }, error: null });
        (sendOrderConfirmationEmail as any).mockRejectedValueOnce(new Error('SMTP Error')); // Simulamos error de resend

        const req = createRequest({ items: [{ product_id: 'p1', qty: 10 }] }); // 10 * 8 = 80

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.total).toBe(80); // Calculó mayorista
    });
});
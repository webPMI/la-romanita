import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/pages/api/auth/register';

// Mock del cliente Supabase
vi.mock('../src/lib/supabase', () => ({
    getSupabaseServerClient: vi.fn(),
}));

import { getSupabaseServerClient } from '../src/lib/supabase';

describe('API Auth - /api/auth/register', () => {
    const mockSignUp = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (getSupabaseServerClient as any).mockReturnValue({
            auth: {
                signUp: mockSignUp,
            },
        });
    });

    const createRequest = (body: any) => ({
        request: {
            json: vi.fn().mockResolvedValue(body),
        },
    } as any);

    it('debe retornar 400 si faltan campos obligatorios', async () => {
        const req = createRequest({ email: 'test@test.com' }); // Falta password y name
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/completa todos los campos requeridos/i);
    });

    it('debe retornar 400 si la contraseña es menor a 6 caracteres', async () => {
        const req = createRequest({ email: 't@t.com', password: '123', name: 'Juan' });
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/al menos 6 caracteres/i);
    });

    it('debe retornar 400 si Supabase devuelve un error de registro', async () => {
        mockSignUp.mockResolvedValueOnce({
            data: { user: null },
            error: { message: 'El usuario ya existe' },
        });

        const req = createRequest({ email: 't@t.com', password: 'password123', name: 'Juan' });
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('El usuario ya existe');
        expect(mockSignUp).toHaveBeenCalledWith(expect.objectContaining({ email: 't@t.com' }));
    });

    it('debe retornar 200 y registrar al usuario exitosamente', async () => {
        mockSignUp.mockResolvedValueOnce({
            data: { user: { id: '123', email: 't@t.com' } },
            error: null,
        });

        const req = createRequest({
            email: 't@t.com',
            password: 'password123',
            name: 'Juan',
            surname: 'Perez',
            phone: '123456789'
        });
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user.id).toBe('123');
        expect(mockSignUp).toHaveBeenCalledWith({
            email: 't@t.com',
            password: 'password123',
            options: expect.objectContaining({
                data: expect.objectContaining({ name: 'Juan', surname: 'Perez', phone: '123456789', client_type: 'minorista' })
            })
        });
    });

    it('debe retornar 400 si se registra como mayorista pero faltan datos comerciales', async () => {
        const req = createRequest({
            email: 't@t.com',
            password: 'password123',
            name: 'Juan',
            client_type: 'mayorista',
            cif: '',
            company_name: '',
            fiscal_address: ''
        });
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toMatch(/datos comerciales/i);
    });

    it('debe registrar exitosamente a un mayorista con todos sus datos comerciales', async () => {
        mockSignUp.mockResolvedValueOnce({
            data: { user: { id: '123', email: 't@t.com' } },
            error: null,
        });

        const req = createRequest({
            email: 't@t.com',
            password: 'password123',
            name: 'Juan',
            surname: 'Perez',
            phone: '123456789',
            client_type: 'mayorista',
            cif: 'B12345678',
            company_name: 'Romanita S.L.',
            fiscal_address: 'Calle Falsa 123'
        });
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockSignUp).toHaveBeenCalledWith({
            email: 't@t.com',
            password: 'password123',
            options: expect.objectContaining({
                data: expect.objectContaining({
                    name: 'Juan',
                    surname: 'Perez',
                    phone: '123456789',
                    client_type: 'mayorista',
                    cif: 'B12345678',
                    company_name: 'Romanita S.L.',
                    fiscal_address: 'Calle Falsa 123'
                })
            })
        });
    });

    it('debe retornar 500 si ocurre un error inesperado de servidor', async () => {
        const req = { request: { json: vi.fn().mockRejectedValue(new Error('Network error')) } } as any;
        const response = await POST(req);

        expect(response.status).toBe(500);
    });
});
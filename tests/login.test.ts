import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '../src/pages/api/auth/login';

// Mocks
vi.mock('../src/lib/supabase', () => ({
    getSupabaseServerClient: vi.fn(),
}));
vi.mock('../src/lib/auth', () => ({
    setSessionCookies: vi.fn(),
}));

import { getSupabaseServerClient } from '../src/lib/supabase';
import { setSessionCookies } from '../src/lib/auth';

describe('API Auth - /api/auth/login', () => {
    const mockSignIn = vi.fn();
    const mockFrom = vi.fn();
    const mockSelect = vi.fn();
    const mockEq = vi.fn();
    const mockSingle = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup cadena encadenada de base de datos Supabase: from().select().eq().single()
        mockFrom.mockReturnValue({ select: mockSelect });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ single: mockSingle });

        (getSupabaseServerClient as any).mockReturnValue({
            auth: {
                signInWithPassword: mockSignIn,
            },
            from: mockFrom,
        });
    });

    const createRequest = (body: any) => ({
        request: {
            json: vi.fn().mockResolvedValue(body),
        },
        cookies: {},
    } as any);

    it('debe retornar 400 si faltan el email o la contraseña', async () => {
        const req = createRequest({ email: 'test@test.com' });
        const response = await POST(req);

        expect(response.status).toBe(400);
    });

    it('debe retornar 401 si las credenciales son incorrectas', async () => {
        mockSignIn.mockResolvedValueOnce({
            data: { session: null },
            error: { message: 'Invalid credentials' },
        });

        const req = createRequest({ email: 't@t.com', password: 'wrong' });
        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Invalid credentials');
    });

    it('debe retornar 404 si no se encuentra el perfil en la base de datos', async () => {
        mockSignIn.mockResolvedValueOnce({
            data: {
                session: { access_token: 'token123', refresh_token: 'refresh123' },
                user: { id: 'usr_1', email: 't@t.com' }
            },
            error: null,
        });

        mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } }); // Perfil no encontrado

        const req = createRequest({ email: 't@t.com', password: 'password123' });
        const response = await POST(req);

        expect(response.status).toBe(404);
    });

    it('debe retornar 200, fijar cookies y devolver el usuario si todo es correcto', async () => {
        mockSignIn.mockResolvedValueOnce({
            data: {
                session: { access_token: 'token123', refresh_token: 'refresh123' },
                user: { id: 'usr_1', email: 't@t.com' }
            },
            error: null,
        });

        mockSingle.mockResolvedValueOnce({
            data: { name: 'Juan', role: 'admin', client_type: 'mayorista' },
            error: null
        });

        const cookies = {};
        const req = { request: { json: vi.fn().mockResolvedValue({ email: 't@t.com', password: 'password123' }) }, cookies } as any;

        const response = await POST(req);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user.role).toBe('admin');
        expect(data.user.client_type).toBe('mayorista');

        // Verifica que se seteen las cookies
        expect(setSessionCookies).toHaveBeenCalledWith(cookies, 'token123', 'refresh123', { remember: false });
        // Verifica que la llamada SQL usó el ID correcto
        expect(mockEq).toHaveBeenCalledWith('id', 'usr_1');
    });
});
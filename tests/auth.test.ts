import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    setSessionCookies,
    clearSessionCookies,
    getSessionTokens,
    getUserFromSession
} from '../src/lib/auth';

// Mock de dependencias externas (Supabase)
vi.mock('../src/lib/supabase', () => ({
    getSupabaseServerClient: vi.fn(),
}));

import { getSupabaseServerClient } from '../src/lib/supabase';

describe('Auth Helpers - lib/auth.ts', () => {
    let mockCookies: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock de Astro.cookies (interfaz estándar con get, set, delete)
        mockCookies = {
            set: vi.fn(),
            delete: vi.fn(),
            get: vi.fn(),
        };
    });

    describe('setSessionCookies', () => {
        it('debe establecer las cookies con los parámetros de seguridad correctos', () => {
            setSessionCookies(mockCookies, 'access_123', 'refresh_123');

            const expectedOptions = {
                path: '/',
                secure: !!import.meta.env.PROD,
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
            };

            expect(mockCookies.set).toHaveBeenCalledWith('sb-access-token', 'access_123', expectedOptions);
            expect(mockCookies.set).toHaveBeenCalledWith('sb-refresh-token', 'refresh_123', expectedOptions);
        });
    });

    describe('clearSessionCookies', () => {
        it('debe eliminar las cookies de sesión con el path correcto', () => {
            clearSessionCookies(mockCookies);
            expect(mockCookies.delete).toHaveBeenCalledWith('sb-access-token', { path: '/' });
            expect(mockCookies.delete).toHaveBeenCalledWith('sb-refresh-token', { path: '/' });
        });
    });

    describe('getSessionTokens', () => {
        it('debe retornar los tokens parseados si existen en las cookies', () => {
            mockCookies.get.mockImplementation((name: string) => {
                if (name === 'sb-access-token') return { value: 'access_123' };
                if (name === 'sb-refresh-token') return { value: 'refresh_123' };
                return null;
            });

            const tokens = getSessionTokens(mockCookies);
            expect(tokens).toEqual({ accessToken: 'access_123', refreshToken: 'refresh_123' });
        });

        it('debe retornar undefined para los tokens que no existan', () => {
            mockCookies.get.mockReturnValue(null);
            const tokens = getSessionTokens(mockCookies);
            expect(tokens).toEqual({ accessToken: undefined, refreshToken: undefined });
        });
    });

    describe('getUserFromSession', () => {
        const mockGetUser = vi.fn();
        const mockFrom = vi.fn();
        const mockSelect = vi.fn();
        const mockEq = vi.fn();
        const mockSingle = vi.fn();
        const mockRefreshSession = vi.fn();

        beforeEach(() => {
            mockFrom.mockReturnValue({ select: mockSelect });
            mockSelect.mockReturnValue({ eq: mockEq });
            mockEq.mockReturnValue({ single: mockSingle });

            (getSupabaseServerClient as any).mockReturnValue({
                auth: {
                    getUser: mockGetUser,
                    refreshSession: mockRefreshSession,
                },
                from: mockFrom,
            });
        });

        it('debe retornar null sin hacer llamadas si no hay access token', async () => {
            mockCookies.get.mockReturnValue(null);
            const user = await getUserFromSession(mockCookies);
            expect(user).toBeNull();
            expect(getSupabaseServerClient).not.toHaveBeenCalled();
        });

        it('debe retornar el perfil si el token es válido y existe un registro en DB', async () => {
            mockCookies.get.mockImplementation((name: string) => {
                if (name === 'sb-access-token') return { value: 'valid_access' };
                return null;
            });

            mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'usr_1' } }, error: null });

            const mockProfile = { id: 'usr_1', email: 'test@test.com', name: 'Test', role: 'admin', client_type: 'mayorista' };
            mockSingle.mockResolvedValueOnce({ data: mockProfile });

            const user = await getUserFromSession(mockCookies);

            expect(user).toEqual(mockProfile);
            expect(mockGetUser).toHaveBeenCalledWith('valid_access');
            expect(mockEq).toHaveBeenCalledWith('id', 'usr_1');
        });

        it('debe limpiar las cookies y retornar null si ocurre una excepción de red o DB', async () => {
            mockCookies.get.mockImplementation((name: string) => {
                if (name === 'sb-access-token') return { value: 'bad_token' };
                return null;
            });

            mockGetUser.mockRejectedValueOnce(new Error('Network failure'));

            const user = await getUserFromSession(mockCookies);

            expect(user).toBeNull();
            expect(mockCookies.delete).toHaveBeenCalledTimes(2); // Limpia cookies access y refresh
        });
    });
});
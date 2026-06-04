import { getSupabaseServerClient } from './supabase';

const ACCESS_TOKEN_COOKIE = 'sb-access-token';
const REFRESH_TOKEN_COOKIE = 'sb-refresh-token';

/**
 * Guarda los tokens de sesión de Supabase en cookies HttpOnly y seguras.
 */
export const setSessionCookies = (
  cookies: any,
  accessToken: string,
  refreshToken: string,
  config?: { remember?: boolean }
) => {
  const remember = config?.remember ?? true;
  const options: any = {
    path: '/',
    secure: import.meta.env.PROD,
    httpOnly: true,
    sameSite: 'strict' as const,
  };

  // Si remember=true, persistimos 1 semana. Si no, queda cookie de sesión.
  if (remember) {
    options.maxAge = 60 * 60 * 24 * 7;
  }

  cookies.set(ACCESS_TOKEN_COOKIE, accessToken, options);
  cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, options);
};

/**
 * Limpia las cookies de sesión del navegador.
 */
export const clearSessionCookies = (cookies: any) => {
  const options = { path: '/' };
  cookies.delete(ACCESS_TOKEN_COOKIE, options);
  cookies.delete(REFRESH_TOKEN_COOKIE, options);
};

/**
 * Obtiene los tokens de acceso y refresco desde las cookies.
 */
export const getSessionTokens = (cookies: any) => {
  const accessToken = cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  return { accessToken, refreshToken };
};

export interface UserSessionProfile {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'admin';
  client_type: 'minorista' | 'mayorista';
  phone?: string;
  cif?: string;
  razon_social?: string;
  direccion_fiscal?: string;
}

const PROFILE_SELECT_EXTENDED = 'id, email, name, role, client_type, phone, cif, razon_social, direccion_fiscal';
const PROFILE_SELECT_BASIC = 'id, email, name, role, client_type, phone';

async function fetchProfileWithFallback(client: any, userId: string) {
  let { data: profile, error } = await client
    .from('profiles')
    .select(PROFILE_SELECT_EXTENDED)
    .eq('id', userId)
    .single();

  if (profile && !error) {
    return profile as UserSessionProfile;
  }

  const errorMessage = error?.message || '';
  const missingColumnError =
    errorMessage.includes('column') ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('schema cache');

  if (missingColumnError) {
    const { data: basicProfile, error: basicError } = await client
      .from('profiles')
      .select(PROFILE_SELECT_BASIC)
      .eq('id', userId)
      .single();

    if (basicProfile && !basicError) {
      return basicProfile as UserSessionProfile;
    }
  }

  return null;
}

/**
 * Obtiene el perfil de usuario del usuario autenticado en la sesión actual.
 * Realiza verificación de token en servidor y refresca la sesión si el access token expiró.
 */
export const getUserFromSession = async (cookies: any): Promise<UserSessionProfile | null> => {
  const { accessToken, refreshToken } = getSessionTokens(cookies);
  if (!accessToken) return null;

  const client = getSupabaseServerClient(accessToken);
  
  try {
    // 1. Obtener usuario del servicio de Auth de Supabase usando el JWT
    const { data: { user }, error } = await client.auth.getUser(accessToken);

    if (user && !error) {
      const profile = await fetchProfileWithFallback(client, user.id);

      if (profile) {
        return profile;
      }
    }

    // 3. Si hay error de expiración y hay un refresh token, intentar refrescar
    if (refreshToken) {
      const refreshClient = getSupabaseServerClient();
      const { data, error: refreshError } = await refreshClient.auth.refreshSession({
        refresh_token: refreshToken
      });

      if (data?.session && !refreshError) {
        // Guardar nuevas cookies con la sesión refrescada
        setSessionCookies(cookies, data.session.access_token, data.session.refresh_token);

        // Volver a consultar perfil con el nuevo cliente
        const newClient = getSupabaseServerClient(data.session.access_token);
        const profile = await fetchProfileWithFallback(newClient, data.session.user.id);

        if (profile) {
          return profile;
        }
      }
    }
  } catch (e) {
    console.error('Error al verificar sesión:', e);
  }

  // Si fallan todas las comprobaciones o expira la sesión, limpiamos cookies
  clearSessionCookies(cookies);
  return null;
};

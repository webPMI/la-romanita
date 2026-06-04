import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || 'tu-anon-key';

// Cliente estático por defecto (para uso en el cliente o peticiones públicas)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Crea una instancia de cliente Supabase para peticiones seguras en el servidor (SSR).
 * Si se proporciona un access token (JWT) del usuario, se inyecta en las cabeceras
 * para que Supabase reconozca la sesión del usuario y aplique las políticas RLS.
 */
export const getSupabaseServerClient = (accessToken?: string) => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    },
  });
};

// =====================================================================
// SISTEMA DE CACHÉ DE RESPUESTAS PARA DATOS SEMI-ESTÁTICOS (Públicos)
// Evita consultas repetitivas innecesarias a la base de datos en SSR
// =====================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheStore = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutos de tiempo de vida (TTL)

/**
 * Helper para almacenar en caché en memoria del servidor resultados de consultas
 * que cambian de forma poco frecuente (como horarios, banners y contacto).
 */
export async function getCachedData<T>(key: string, fetchFn: () => Promise<T>): Promise<T> {
  const cached = cacheStore.get(key);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }
  
  const freshData = await fetchFn();
  cacheStore.set(key, { data: freshData, timestamp: now });
  return freshData;
}

/**
 * Invalida una clave de la caché o toda la caché si no se especifica clave.
 */
export function clearCache(key?: string) {
  if (key) {
    cacheStore.delete(key);
  } else {
    cacheStore.clear();
  }
}

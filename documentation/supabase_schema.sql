-- =====================================================================
-- ESQUEMA DE BASE DE DATOS Y RLS: LA ROMANITA
-- Ejecuta este script en el editor SQL de tu panel de Supabase
-- =====================================================================

-- 1. Tabla de Perfiles de Usuario (Enlazada con auth.users de Supabase Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null default 'client' check (role in ('client', 'admin')),
  client_type text not null default 'minorista' check (client_type in ('minorista', 'mayorista')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en perfiles
alter table public.profiles enable row level security;

-- 2. Tabla de Catálogo de Productos
create table public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price_minorista numeric(10, 2) not null check (price_minorista >= 0),
  price_mayorista numeric(10, 2) not null check (price_mayorista >= 0),
  image_url text,
  category text not null,
  is_offer boolean default false not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en productos
alter table public.products enable row level security;

-- 3. Tabla de Pedidos (Orders)
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pendiente' check (status in ('pendiente', 'listo', 'entregado')),
  total numeric(10, 2) not null check (total >= 0),
  items jsonb not null, -- Guardará array de objetos [{product_id, name, qty, price}]
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en pedidos
alter table public.orders enable row level security;

-- 4. Tabla de Horarios de la Tienda
create table public.horarios (
  id uuid default gen_random_uuid() primary key,
  dia_semana text not null,
  hora_apertura time not null,
  hora_cierre time not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en horarios
alter table public.horarios enable row level security;

-- 5. Tabla de Datos de Contacto
create table public.contacto (
  id uuid default gen_random_uuid() primary key,
  tipo text not null check (tipo in ('telefono', 'whatsapp', 'email', 'direccion', 'red_social')),
  valor text not null,
  descripcion text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en contacto
alter table public.contacto enable row level security;

-- 6. Tabla de Banners/Mensajes Promocionales
create table public.banners (
  id uuid default gen_random_uuid() primary key,
  titulo text,
  mensaje text not null,
  is_active boolean default true not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS en banners
alter table public.banners enable row level security;


-- =====================================================================
-- DISPARADOR (TRIGGER) PARA CREACIÓN DE PERFILES AUTOMÁTICA
-- =====================================================================

-- Función que se ejecuta al registrarse un usuario en auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, client_type)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', 'Cliente Nuevo'),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'client_type', 'minorista')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger asociado
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- =====================================================================
-- POLÍTICAS DE ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Helper para comprobar si el usuario autenticado es Administrador
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- --- Políticas de profiles ---
create policy "Cualquiera puede leer su propio perfil"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "El usuario puede actualizar su propio perfil (menos el rol)"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id and (role = (select role from public.profiles where id = auth.uid()))); -- Bloquea cambio de rol por el cliente

create policy "Los administradores tienen control total sobre perfiles"
  on public.profiles for all
  using (public.is_admin());

-- --- Políticas de products ---
create policy "Cualquiera puede ver los productos activos"
  on public.products for select
  using (is_active = true or public.is_admin());

create policy "Solo administradores pueden modificar productos"
  on public.products for all
  using (public.is_admin());

-- --- Políticas de orders ---
create policy "Clientes ven sus pedidos, Administradores ven todos"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Cualquier usuario autenticado puede crear sus propios pedidos"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Solo administradores pueden actualizar pedidos (cambiar estado)"
  on public.orders for update
  using (public.is_admin());

-- --- Políticas de horarios ---
create policy "Cualquiera puede leer horarios activos"
  on public.horarios for select
  using (is_active = true or public.is_admin());

create policy "Solo administradores pueden modificar horarios"
  on public.horarios for all
  using (public.is_admin());

-- --- Políticas de contacto ---
create policy "Cualquiera puede leer la informacion de contacto"
  on public.contacto for select
  using (true);

create policy "Solo administradores pueden modificar contacto"
  on public.contacto for all
  using (public.is_admin());

-- --- Políticas de banners ---
create policy "Cualquiera puede ver banners activos"
  on public.banners for select
  using (is_active = true or public.is_admin());

create policy "Solo administradores pueden modificar banners"
  on public.banners for all
  using (public.is_admin());

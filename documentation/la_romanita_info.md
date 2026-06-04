# Documentación Verificada

## Introducción General
La Romanita es un ejemplo de sistema web para negocios gastronómicos, donde el panel administrador permite gestionar todos los datos relevantes del negocio: productos, usuarios, banners, horarios, pedidos, contacto y más. El objetivo es que cualquier negocio similar pueda adaptar y administrar toda su información desde un único panel centralizado, facilitando la operación diaria y la escalabilidad.

## Ubicación Actualizada
- **Dirección Principal:** Carrer de Jaume Balmes, 59, Nord, 07004 Palma, Illes Balears.

## Historia
- **Apertura Original:** Junio de 1988 en la calle Blanquerna.
- **Fundadores:** Pedro Salaberry, Miguel Franco y socios argentinos.
- **Concepto:** Pioneros en traer la pasta fresca estilo Buenos Aires a Palma, siendo históricamente la tienda de pasta fresca más completa de la ciudad. 
- Han evolucionado y trasladado/expandido sus operaciones, siendo Jaume Balmes, 59 su ubicación verificada actualmente para la venta minorista y mayorista.

## Horarios (Referencia General)
- **Lunes a Sábado:** 09:00 a 20:00.
- **Domingos:** 09:00 a 15:00.

## Productos Destacados
- **Pastas Frescas:** Sorrentinos, raviolis, canelones, ñoquis, spaghetti, tallarines, lasañas.
- **Empanadas Argentinas:** Diversidad de sabores clásicos.
- **Salsas y Platos Preparados:** Elaboración artesanal diaria, colaborando también con iniciativas contra el desperdicio (ej. Too Good To Go).

## Teléfonos de Contacto (Referencia)
- +34 622 634 989
- +34 643 384 775

---

# Estructura y funcionamiento de la web

## 1. Página principal (pública)
- Secciones: Bienvenida, menú destacado, información de contacto, ubicación, testimonios, preguntas frecuentes, formulario de contacto/pedidos rápidos.
- Menú: Productos destacados, precios minorista y mayorista, ofertas activas.
- Acceso a login para clientes y administradores.

## 2. Sección de clientes (requiere inicio de sesión)
- Visualización de productos y precios según tipo de cliente (minorista/mayorista).
- Carrito de compras y pedidos online.
- Historial de pedidos.
- Perfil de usuario (datos personales, preferencias).

## 3. Sección de administrador

El panel de administración permite gestionar todos los datos del negocio:
- Usuarios: alta, baja, edición y roles.
- Productos: creación, edición, categorías, precios y stock.
- Banners y promociones.
- Horarios de atención.
- Pedidos y su seguimiento.
- Datos de contacto y mensajes recibidos.

Este panel es adaptable para otros negocios, permitiendo centralizar la gestión y personalizar los módulos según las necesidades.

---

# Buenas prácticas para estilos y componentes

Para evitar la repetición de estilos en cada página, se recomienda:
- Utilizar variables y utilidades globales en `src/styles/_tokens.css`.
- Importar estilos globales por sección en los layouts principales.
- Reutilizar componentes y estilos comunes.
- Si un estilo se repite entre secciones, moverlo a `_tokens.css`.
- Mantener los estilos específicos en archivos locales o CSS Modules solo cuando sea necesario.

Consulta el archivo `estructura_estilos.md` para más detalles sobre la organización y herencia de estilos.
- CRUD de productos: agregar, editar, eliminar productos.
- Gestión de precios minorista, mayorista y ofertas.
- Gestión de usuarios/clientes.
- Visualización de pedidos y estadísticas de ventas.

---

# Estructura de Base de Datos y Endpoints

## Tablas principales

### productos
- id (PK)
- nombre
- descripcion
- categoria (FK)
- precio_minorista
- precio_mayorista
- precio_oferta (opcional)
- en_oferta (boolean)
- imagen_url
- stock
- activo (boolean)

### categorias
- id (PK)
- nombre
- descripcion

### usuarios
- id (PK)
- nombre
- email
- password_hash
- rol (admin, cliente)
- telefono

### pedidos
- id (PK)
- usuario_id (FK)
- fecha
- estado (pendiente, confirmado, entregado, cancelado)
- total
- detalles (JSON o tabla aparte)

### horarios
- id (PK)
- dia_semana
- hora_apertura
- hora_cierre
- activo (boolean)

### contacto
- id (PK)
- tipo (teléfono, whatsapp, email, dirección, red_social)
- valor
- descripcion

### banners / mensajes
- id (PK)
- titulo
- mensaje
- activo (boolean)

---

## Endpoints/funcionalidades CRUD necesarias

- Productos: listar, crear, editar, eliminar, activar/desactivar, poner/quitar oferta.
- Categorías: listar, crear, editar, eliminar.
- Usuarios: listar, crear, editar, eliminar, cambiar rol.
- Pedidos: listar, ver detalles, cambiar estado.
- Horarios: listar, crear, editar, eliminar, activar/desactivar.
- Contacto: listar, crear, editar, eliminar.
- Banners/mensajes: listar, crear, editar, eliminar, activar/desactivar.

---

## Recomendaciones técnicas

- Usa relaciones entre productos y categorías.
- Permite que el admin edite horarios y datos de contacto desde el panel.
- Haz que los formularios sean simples y adaptados a móvil.
- Protege los endpoints con autenticación y roles.

---

# Recomendaciones para el servicio

- Diferenciación de precios: mostrar precios correctos según el tipo de usuario.
- Ofertas y promociones: activar/desactivar ofertas fácilmente y resaltarlas.
- Experiencia móvil: optimizar la web para móviles.
- Proceso de pedido simple: minimizar pasos para hacer un pedido.
- Seguridad: proteger las secciones de clientes y admin con autenticación segura.
- Panel de administración intuitivo: facilitar la gestión de productos y precios.
- Información clara: mostrar ingredientes, alérgenos y descripciones detalladas.
- Notificaciones: agregar notificaciones por email o WhatsApp para pedidos nuevos y confirmaciones.
- Testimonios y reseñas: permitir opiniones de clientes.
- SEO local: optimizar la web para búsquedas locales.

---

# Próximos pasos sugeridos

1. Definir estructura de carpetas y archivos para el CRUD de productos.
2. Implementar autenticación y roles (cliente/admin).
3. Crear modelos de datos para productos, usuarios y pedidos.
4. Desarrollar las vistas principales (pública, cliente, admin).
5. Integrar notificaciones y gestión de ofertas.
6. Testear experiencia móvil y accesibilidad.

---

# Esquemas SQL/Supabase sugeridos

## Tabla: productos
```sql
create table productos (
  id serial primary key,
  nombre text not null,
  descripcion text,
  categoria integer references categorias(id),
  precio_minorista numeric(10,2) not null,
  precio_mayorista numeric(10,2),
  precio_oferta numeric(10,2),
  en_oferta boolean default false,
  imagen_url text,
  stock integer default 0,
  activo boolean default true
);
```

## Tabla: categorias
```sql
create table categorias (
  id serial primary key,
  nombre text not null,
  descripcion text
);
```

## Tabla: usuarios
```sql
create table usuarios (
  id serial primary key,
  nombre text not null,
  email text unique not null,
  password_hash text not null,
  rol text check (rol in ('admin', 'cliente')) default 'cliente',
  telefono text
);
```

## Tabla: pedidos
```sql
create table pedidos (
  id serial primary key,
  usuario_id integer references usuarios(id),
  fecha timestamp default now(),
  estado text check (estado in ('pendiente', 'confirmado', 'entregado', 'cancelado')) default 'pendiente',
  total numeric(10,2),
  detalles jsonb
);
```

## Tabla: horarios
```sql
create table horarios (
  id serial primary key,
  dia_semana text not null,
  hora_apertura time not null,
  hora_cierre time not null,
  activo boolean default true
);
```

## Tabla: contacto
```sql
create table contacto (
  id serial primary key,
  tipo text not null,
  valor text not null,
  descripcion text
);
```

## Tabla: banners
```sql
create table banners (
  id serial primary key,
  titulo text,
  mensaje text,
  activo boolean default true
);
```

---

# Notas
- Ajusta los tipos de datos según necesidades específicas.
- Puedes agregar campos de auditoría (created_at, updated_at) si lo deseas.
- Usa Supabase Studio para crear estas tablas fácilmente.

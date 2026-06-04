# Ruta de Trabajo (Roadmap) - La Romanita

Este archivo detalla el estado actual del proyecto, las correcciones necesarias y la ruta de trabajo (TODO) estructurada por fases para pasar de una versión simulada a una aplicación de producción completamente funcional con **Astro**, **Supabase** y **Resend**.

---

## 🔍 Estado Actual del Proyecto

Actualmente, el proyecto tiene una interfaz visual maquetada y pulida (Premium), pero gran parte de la funcionalidad interactiva está **simulada en el cliente** o **mockeada**:
* **Autenticación:** [login.astro](file:///c:/Users/inken/development/la-romanita/src/pages/login.astro) utiliza credenciales simuladas en [mockData.js](file:///c:/Users/inken/development/la-romanita/src/dev/mockData.js) y persiste el estado mediante `localStorage`. Los endpoints backend reales ([login.ts](file:///c:/Users/inken/development/la-romanita/src/pages/api/auth/login.ts) y [logout.ts](file:///c:/Users/inken/development/la-romanita/src/pages/api/auth/logout.ts)) están creados pero no se llaman en el formulario.
* **Menú:** [menu.astro](file:///c:/Users/inken/development/la-romanita/src/pages/menu.astro) muestra productos estáticos mockeados y los botones de "+ Añadir" no tienen comportamiento ni agregan a un carrito de compras.
* **Panel de Administración:** [dashboard.astro](file:///c:/Users/inken/development/la-romanita/src/pages/admin/dashboard.astro) es de solo lectura y utiliza estadísticas e historial de pedidos estáticos. La validación del rol `admin` se realiza de manera insegura en el navegador (JS del cliente) en lugar de protegerse en el servidor (SSR).
* **Emails:** La librería [email.ts](file:///c:/Users/inken/development/la-romanita/src/lib/email.ts) usando Resend está implementada y lista para producción/mock, pero no está integrada con ningún flujo de pedidos o cambios de estado.

---

## 📋 Lista de Tareas (TODO)

### 🛠️ Corrección de Discrepancias
- [x] Corregir la discrepancia del año de inicio (1989 vs 1988) en [index.astro](file:///c:/Users/inken/development/la-romanita/src/pages/index.astro).

---

### 🗄️ Fase 1: Base de Datos Completa (Supabase DDL)
- [x] **Esquema de Supabase Principal:** Ejecutar el archivo [supabase_schema.sql](file:///c:/Users/inken/development/la-romanita/documentation/supabase_schema.sql) en el editor SQL de Supabase para crear las tablas `profiles`, `products`, `orders`, la función `is_admin`, y habilitar RLS.
- [x] **Tablas Adicionales Faltantes:** Crear el DDL y ejecutar la creación de las tablas de configuración dinámica que no están incluidas en el `.sql` original pero sí en los requerimientos:
  - `public.horarios` (días, horas de apertura/cierre, activo).
  - `public.contacto` (tipo: teléfono, email, dirección, redes; valor, descripción).
  - `public.banners` (mensajes promocionales activos en cabecera).
- [x] **Configuración de Entorno:** Copiar el archivo [.env.example](file:///c:/Users/inken/development/la-romanita/.env.example) a un archivo `.env` y configurar las claves de Supabase y Resend.
- [x] **Carga de Datos Inicial (Seed):** Insertar categorías y productos iniciales en la tabla `products` de Supabase para poder consultarlos dinámicamente.

---

### 🔑 Fase 2: Autenticación Segura y Roles (Backend + Cookies)
- [x] **Conexión del Formulario de Login:** Modificar el script de cliente en [login.astro](file:///c:/Users/inken/development/la-romanita/src/pages/login.astro) para enviar una solicitud HTTP POST real a `/api/auth/login` con el email y contraseña introducidos, eliminando la lógica simulada del `localStorage` directo.
- [x] **Sincronización en Navbar:** Asegurar que [Navbar.astro](file:///c:/Users/inken/development/la-romanita/src/components/Navbar.astro) lea el estado de sesión de manera integrada a través de cookies HTTP o mediante la respuesta del API de login.
- [x] **Protección SSR del Dashboard:** Modificar [dashboard.astro](file:///c:/Users/inken/development/la-romanita/src/pages/admin/dashboard.astro) para verificar la sesión en el servidor utilizando `getUserFromSession(Astro.cookies)` de [auth.ts](file:///c:/Users/inken/development/la-romanita/src/lib/auth.ts). Si el usuario no está autenticado o no es administrador, realizar una redirección del servidor (`Astro.redirect('/login')`).

---

### 🏠 Fase 3: Mejoras en la Página Pública (Landing Page y Menú Dinámico)
- [x] **Secciones Faltantes de la Landing Page:** Enriquecer [index.astro](file:///c:/Users/inken/development/la-romanita/src/pages/index.astro) agregando:
  - **Menú Destacado:** Carrusel o cuadrícula con las ofertas activas (`is_offer = true` en base de datos).
  - **Información de Ubicación e Integración de Mapa:** Dirección física y un mapa interactivo (iframe o similar).
  - **Horarios Dinámicos:** Mostrar los horarios consultados directamente desde la tabla `public.horarios`.
  - **Preguntas Frecuentes (FAQs) y Testimonios:** Acordeón interactivo con las dudas típicas y testimonios de clientes reales/demo.
  - **Formulario de Contacto Rápido:** Formulario simple para enviar mensajes/consultas.
- [x] **Consulta de Menú Dinámica:** Reemplazar el array estático de categorías en [menu.astro](file:///c:/Users/inken/development/la-romanita/src/pages/menu.astro) con una consulta real a Supabase utilizando la instancia del cliente.
- [x] **Lógica de Precios (Minorista/Mayorista):** Obtener el perfil del usuario activo (si existe) y mostrar el precio correspondiente:
  - Si el usuario es tipo `mayorista`, mostrar `price_mayorista`.
  - Si el usuario es tipo `minorista` o no está logueado, mostrar `price_minorista`.

---

### 🛒 Fase 4: Carrito de Compras, Checkout y Área de Clientes
- [x] **Estado del Carrito (Client-side):** Implementar la interactividad del carrito de compras en [menu.astro](file:///c:/Users/inken/development/la-romanita/src/pages/menu.astro) (añadir, restar cantidades, persistir temporalmente).
- [x] **Vista de Carrito y Checkout:** Crear un modal o una sección lateral para revisar los ítems seleccionados, modificar cantidades y ver el total dinámicamente.
- [x] **API de Creación de Pedidos:** Crear un endpoint API `POST /api/orders/create` que reciba el carrito, calcule el total en el servidor para evitar fraudes, inserte el registro en la tabla `orders` y asocie el `user_id` de la sesión.
- [x] **Confirmación por Email:** Importar `sendOrderConfirmationEmail` de [email.ts](file:///c:/Users/inken/development/la-romanita/src/lib/email.ts) en el API de creación para enviar la confirmación del pedido de forma automática al email del cliente.
- [x] **[NUEVO] Área de Cliente (`/account` o `/profile`):**
  - [x] Crear una vista de perfil segura (acceso solo a clientes autenticados).
  - [x] **Historial de Pedidos:** Mostrar la lista de pedidos anteriores realizados por el cliente actual (obtenidos de la tabla `orders`).
  - [x] **Mis Datos:** Formulario para editar información de perfil (nombre, teléfono) que se actualiza en la tabla `profiles`.

---

### 👑 Fase 5: Panel de Administración Dinámico y Gestión Completa
- [x] **Lista de Pedidos en Tiempo Real:** Modificar [dashboard.astro](file:///c:/Users/inken/development/la-romanita/src/pages/admin/dashboard.astro) para cargar y listar los pedidos pendientes y listos reales desde la tabla `orders` de Supabase.
- [x] **Gestor de Estados:** Implementar botones en el panel para cambiar el estado de un pedido (`pendiente` -> `listo` -> `entregado`).
- [x] **Notificación de Pedido Listo:** Llamar a `sendOrderReadyEmail` de [email.ts](file:///c:/Users/inken/development/la-romanita/src/lib/email.ts) automáticamente cuando el administrador cambie el estado de un pedido a `listo`.
- [x] **CRUD de Productos (Gestión del Catálogo):**
  - [x] Listar los productos actuales de la base de datos con filtros.
  - [x] Formulario para **Añadir** productos con campos completos (nombre, descripción, precios, categoría, activo, imagen).
  - [x] Formulario para **Editar** y activar/desactivar productos.
  - [x] Opción para **Eliminar** productos.
- [x] **[NUEVO] Gestión de Configuración de la Tienda (Horarios, Contacto y Banners):**
  - [x] Formulario de edición para actualizar los registros de `public.horarios`.
  - [x] Formulario de edición para actualizar teléfonos, dirección y enlaces de redes en `public.contacto`.
  - [x] Editor para activar/desactivar y cambiar el texto del banner promocional en `public.banners`.
- [x] **[NUEVO] Gestión de Clientes:**
  - [x] Listar todos los usuarios/perfiles registrados.
  - [x] Permitir a los administradores cambiar el `client_type` de un usuario entre `minorista` y `mayorista`.

---

### 📈 Fase 6: SEO, Optimización y Pruebas
- [x] **SEO Local y Accesibilidad:**
  - [x] Configurar etiquetas meta (título, descripción, open graph) adecuadas en cada página usando [Layout.astro](file:///c:/Users/inken/development/la-romanita/src/layouts/Layout.astro).
  - [x] Asegurar jerarquía semántica HTML5 correcta (`<h1>` único por página).
  - [x] Garantizar que todos los elementos interactivos tengan IDs únicos para facilitar pruebas y automatización.
- [x] **Optimización Móvil:** Verificar el rendimiento y la responsividad de los formularios en móviles.

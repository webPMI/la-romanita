# Estructura y herencia de estilos

Para mantener el código limpio, escalable y evitar la duplicidad de estilos, se implementa la siguiente organización:

## 1. Variables y utilidades globales
- Archivo: `src/styles/_tokens.css`
- Contiene variables CSS, paleta de colores, tipografías y utilidades compartidas por todo el proyecto.

## 2. Estilos globales por sección
Cada sección (admin, user, public) tiene su propio archivo de estilos globales:
- `src/admin/styles/global.css`
- `src/user/styles/global.css`
- `src/public/styles/global.css`

Estos archivos deben importar SIEMPRE primero las variables globales:

```css
@import '../../../styles/_tokens.css';
/* Estilos específicos de la sección aquí */
```

## 3. Importación en layouts
En el layout raíz de cada sección (por ejemplo, `AdminLayout.astro` o `UserLayout.astro`), importa el archivo global correspondiente:

```astro
---
import '../styles/global.css';
---
```

## 4. Buenas prácticas
- Si un estilo se repite entre secciones, muévelo a `_tokens.css`.
- Mantén los estilos específicos de cada sección en su propio global.css.
- Si un componente requiere estilos muy particulares, puedes usar CSS Modules o archivos locales junto al componente.

Así, cada sección hereda la base global y mantiene independencia visual y de código.

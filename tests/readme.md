# Guía de Estructura Profesional y Testing para La Romanita

## Estructura de Proyecto Escalable

```
la-romanita/
├── src/
│   ├── assets/           # Imágenes, fuentes, etc.
│   ├── components/       # Componentes reutilizables (por dominio: admin, user, home...)
│   ├── layouts/          # Layouts generales
│   ├── lib/              # Lógica compartida, helpers, clientes API
│   ├── pages/            # Rutas Astro (por dominio: admin, usuario, etc.)
│   └── styles/           # CSS global y tokens
├── tests/                # Pruebas unitarias y de integración
│   ├── admin/            # Tests de componentes y lógica admin
│   ├── user/             # Tests de componentes y lógica usuario
│   └── ...
├── public/               # Archivos estáticos
├── documentation/        # Documentación técnica y de negocio
├── package.json          # Dependencias y scripts
└── ...
```

- **Componentes**: Separar por dominio (admin, user, home) y por tipo (tabla, formulario, dashboard).
- **Lógica**: Centralizar helpers, clientes y lógica de negocio en `src/lib`.
- **Estilos**: Usar CSS modular y tokens para escalabilidad.
- **Documentación**: Mantener documentación técnica y de negocio actualizada.

## Testing Profesional

- **Ubicación**: Todos los tests en `/tests`, organizados por dominio y tipo.
- **Herramientas**: Usar [Vitest](https://vitest.dev/) para unitarios y [Testing Library](https://testing-library.com/) para integración (cuando sea posible).
- **Cobertura**: Testear lógica crítica, helpers, validadores y componentes clave.
- **Mocks**: Simular datos y dependencias externas (API, Supabase) para tests predecibles.
- **Nombres**: Usar nombres descriptivos para archivos y casos de test.
- **Automatización**: Integrar los tests en CI/CD (GitHub Actions, etc.).
- **Buenas prácticas**:
  - Un test = un comportamiento esperado.
  - No testear implementaciones internas, solo el resultado esperado.
  - Mantener los tests rápidos y aislados.
  - Revisar y actualizar los tests con cada cambio relevante.

### Ejemplo de estructura de tests

```
tests/
├── admin/
│   ├── userTable.test.js
│   ├── productTable.test.js
│   └── ...
├── user/
│   └── ...
└── smoke.test.js
```

### Ejemplo de test unitario

```js
import { describe, it, expect } from 'vitest';

describe('Admin - UserTable', () => {
  it('debe renderizar usuarios con email válido', () => {
    const users = [
      { id: '1', nombre: 'Juan', email: 'juan@mail.com', rol: 'admin', telefono: '123' }
    ];
    expect(users[0].email).toMatch(/@/);
  });
});
```

## Cobertura Máxima

- **Objetivo**: Apuntar a >95% de cobertura de statements, branches, functions y lines.
- **Revisión**: No se aceptan PRs sin cobertura total en código nuevo/crítico.
- **Herramienta**: Usar el flag `--coverage` de Vitest y revisar el reporte generado.
- **Acciones recomendadas**:
  - Añadir tests para todos los paths posibles (casos de error, edge cases, validaciones, renderizados condicionales).
  - Mockear dependencias externas para aislar la lógica propia.
  - Revisar el reporte de cobertura tras cada commit relevante.
  - Automatizar el chequeo de cobertura en CI/CD (falla si baja del umbral).

### Ejemplo de comando:

```bash
npm run test -- --coverage
```

### Ejemplo de integración en CI/CD (GitHub Actions):

```yaml
- name: Run tests with coverage
  run: npm run test -- --coverage
```

---

**La cobertura máxima es un estándar obligatorio para mantener la calidad y evitar regresiones.**

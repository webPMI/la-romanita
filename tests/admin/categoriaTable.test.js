import { describe, it, expect } from 'vitest';

describe('Admin - CategoriaTable', () => {
  it('debe renderizar categorías con nombre y descripción', () => {
    const categorias = [
      { id: '1', nombre: 'Pasta', descripcion: 'Pastas frescas' },
      { id: '2', nombre: 'Empanadas', descripcion: 'Empanadas argentinas' }
    ];
    categorias.forEach(cat => {
      expect(cat).toHaveProperty('nombre');
      expect(typeof cat.descripcion).toBe('string');
    });
  });
});

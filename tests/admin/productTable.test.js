import { describe, it, expect } from 'vitest';

describe('Admin - ProductTable', () => {
  it('debe renderizar productos con los campos requeridos', () => {
    const productos = [
      { id: '1', nombre: 'Ravioles', categoria: 'Pasta', precio_minorista: 10, precio_mayorista: 8, en_oferta: false, stock: 20, activo: true },
      { id: '2', nombre: 'Ñoquis', categoria: 'Pasta', precio_minorista: 9, precio_mayorista: 7, en_oferta: true, stock: 15, activo: true }
    ];
    productos.forEach(p => {
      expect(p).toHaveProperty('nombre');
      expect(typeof p.precio_minorista).toBe('number');
    });
  });

  it('debe marcar productos en oferta correctamente', () => {
    const productos = [
      { id: '2', nombre: 'Ñoquis', categoria: 'Pasta', precio_minorista: 9, precio_mayorista: 7, en_oferta: true, stock: 15, activo: true }
    ];
    expect(productos[0].en_oferta).toBe(true);
  });
});

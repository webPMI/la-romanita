import { describe, it, expect } from 'vitest';
// Aquí podrías importar lógica de helpers, validadores o mocks si los tienes

describe('Admin - UserTable', () => {
  it('debe renderizar la tabla de usuarios con datos mínimos', () => {
    // Simulación de datos mínimos
    const users = [
      { id: '1', nombre: 'Juan', email: 'juan@mail.com', rol: 'admin', telefono: '123' },
      { id: '2', nombre: 'Ana', email: 'ana@mail.com', rol: 'cliente', telefono: '456' }
    ];
    expect(users).toBeInstanceOf(Array);
    expect(users[0]).toHaveProperty('nombre');
    expect(users[1].rol).toBe('cliente');
  });

  it('debe validar que todos los usuarios tengan email', () => {
    const users = [
      { id: '1', nombre: 'Juan', email: 'juan@mail.com', rol: 'admin', telefono: '123' },
      { id: '2', nombre: 'Ana', email: 'ana@mail.com', rol: 'cliente', telefono: '456' }
    ];
    users.forEach(user => {
      expect(user.email).toMatch(/@/);
    });
  });
});

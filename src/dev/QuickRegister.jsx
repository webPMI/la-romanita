
import { useState } from 'react';

export default function QuickRegister() {
  const [form, setForm] = useState({
    name: 'Juan',
    surname: 'Pérez',
    email: `cliente@laromanita.com`,
    phone: '+34 600 000 000',
    password: 'user123',
    confirmPassword: 'user123',
    acceptPolicies: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  }

  function autofill() {
    setForm({
      name: 'Juan',
      surname: 'Pérez',
      email: `cliente${Math.floor(Math.random()*10000)}@ejemplo.com`,
      phone: '+34 600 000 000',
      password: '123456',
      confirmPassword: '123456',
      acceptPolicies: true,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResultado(null);
    // Validaciones
    if (!form.acceptPolicies) {
      setResultado({ error: 'Debes aceptar las políticas de privacidad.' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setResultado({ error: 'Las contraseñas no coinciden.' });
      return;
    }
    if (form.password.length < 6) {
      setResultado({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          surname: form.surname,
          email: form.email,
          phone: form.phone,
          password: form.password,
        }),
      });
      const data = await res.json();
      setResultado(data);
    } catch (err) {
      setResultado({ error: 'Error en el registro' });
    }
    setEnviando(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }} autoComplete="on">
      <h2>Registro Rápido (Dev)</h2>
      <div style={{ marginBottom: 8 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="Nombre" autoComplete="given-name" style={{ width: '100%', marginBottom: 4 }} required />
        <input name="surname" value={form.surname} onChange={handleChange} placeholder="Apellido" autoComplete="family-name" style={{ width: '100%', marginBottom: 4 }} required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" autoComplete="email" style={{ width: '100%', marginBottom: 4 }} required type="email" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Teléfono" autoComplete="tel" style={{ width: '100%', marginBottom: 4 }} required type="tel" />
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <input name="password" value={form.password} onChange={handleChange} placeholder="Contraseña" type={showPassword ? 'text' : 'password'} minLength={6} autoComplete="new-password" style={{ width: '100%' }} required />
          <button type="button" tabIndex={-1} style={{ position: 'absolute', right: 4, top: 4, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowPassword(v => !v)}>{showPassword ? '🙈' : '👁️'}</button>
        </div>
        <div style={{ position: 'relative', marginBottom: 4 }}>
          <input name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repite tu contraseña" type={showConfirm ? 'text' : 'password'} minLength={6} autoComplete="new-password" style={{ width: '100%' }} required />
          <button type="button" tabIndex={-1} style={{ position: 'absolute', right: 4, top: 4, background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setShowConfirm(v => !v)}>{showConfirm ? '🙈' : '👁️'}</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input type="checkbox" name="acceptPolicies" checked={form.acceptPolicies} onChange={handleChange} required style={{ width: 'auto' }} />
          <label htmlFor="acceptPolicies" style={{ margin: 0, fontSize: 13 }}>
            Acepto las <a href="/politicas" target="_blank" rel="noopener noreferrer">políticas de privacidad</a>
          </label>
        </div>
      </div>
      <button type="submit" disabled={enviando} style={{ width: '100%' }}>
        {enviando ? 'Enviando...' : 'Registrar'}
      </button>
      <button type="button" onClick={autofill} style={{ width: '100%', marginTop: 8, background: '#eee', color: '#333', borderRadius: 8, border: 'none', padding: '0.5rem 0' }}>Autocompletar (dev)</button>
      {resultado && (
        <pre style={{ marginTop: 16, background: '#f8f8f8', padding: 10, borderRadius: 4, color: resultado.error ? 'red' : 'green' }}>{JSON.stringify(resultado, null, 2)}</pre>
      )}
    </form>
  );
}

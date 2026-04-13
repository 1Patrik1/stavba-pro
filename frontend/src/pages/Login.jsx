import React, { useState } from 'react';
import { s } from '../styles';

export default function Login({ setUser }) {
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', pass: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const api = "https://backend-9xye.onrender.com/api";

  const handleSubmit = async () => {
    // Validace
    if (!form.email || !form.pass) {
      setError('Vyplňte e-mail a heslo');
      return;
    }
    if (isReg && !form.name) {
      setError('Vyplňte jméno');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = isReg ? '/register' : '/login';
      const body = isReg ? { jmeno: form.name, email: form.email, heslo: form.pass } : { email: form.email, heslo: form.pass };
      
      const r = await fetch(api + endpoint, { 
        method: 'POST', 
        headers: {'Content-Type':'application/json'}, 
        body: JSON.stringify(body) 
      });
      
      if (!r.ok) {
        throw new Error(`Server odpověděl s chybou: ${r.status}`);
      }
      
      const d = await r.json();
      
      if(!isReg && d.success) {
        localStorage.setItem('token', d.token);
        setUser(d.user); 
        localStorage.setItem('user', JSON.stringify(d.user));
      } else if (d.success) {
        alert(d.message || "Registrace úspěšná! Čekejte na schválení.");
        setIsReg(false);
      } else {
        setError(d.message || "Neplatné přihlašovací údaje");
      }
    } catch (err) {
      console.log("[v0] Login error:", err);
      setError('Nepodařilo se připojit k serveru. Zkuste to znovu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={{...s.card, maxWidth: '350px', textAlign: 'center'}}>
        <div style={{fontSize: '40px', marginBottom: '10px'}}>🏗️</div>
        <h2 style={{color: '#38bdf8', marginTop: 0}}>{isReg ? 'Nová registrace' : 'Vstup na stavbu'}</h2>
        {isReg && <input placeholder="Celé jméno (např. Jan Novák)" onChange={e=>setForm({...form, name: e.target.value})} style={s.input}/>}
        <input placeholder="E-mail" type="email" onChange={e=>setForm({...form, email: e.target.value})} style={s.input}/>
        <input placeholder="Heslo" type="password" onChange={e=>setForm({...form, pass: e.target.value})} style={s.input}/>
        
        {error && <p style={{color: '#ef4444', marginTop: '10px', fontSize: '14px'}}>{error}</p>}
        
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          style={{...s.btn, marginTop: '10px', opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
        >
          {loading ? 'Načítání...' : (isReg ? 'Zaregistrovat se' : 'Přihlásit se')}
        </button>
        
        <p onClick={() => setIsReg(!isReg)} style={{marginTop: '20px', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline'}}>
          {isReg ? 'Zpět na přihlášení' : 'Nemáte účet? Registrujte se'}
        </p>
      </div>
    </div>
  );
}

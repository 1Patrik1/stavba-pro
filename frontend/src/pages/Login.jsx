import React, { useState } from 'react';
import { s } from '../styles';

export default function Login({ setUser }) {
  const [isReg, setIsReg] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', pass: '' });
  const api = "http://localhost:3000/api";

  const handleSubmit = async () => {
    const endpoint = isReg ? '/register' : '/login';
    const body = isReg ? { jmeno: form.name, email: form.email, heslo: form.pass } : { email: form.email, heslo: form.pass };
    
    const r = await fetch(api + endpoint, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body) });
    const d = await r.json();
    
    if(!isReg && d.success) {
      // 🔒 KOUZLO BEZPEČNOSTI: Uložíme si tajný kryptografický průkaz do mobilu
      localStorage.setItem('token', d.token);
      
      setUser(d.user); localStorage.setItem('user', JSON.stringify(d.user));
    } else {
      alert(d.message || "Požadavek odeslán");
      if(isReg) setIsReg(false);
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
        <button onClick={handleSubmit} style={{...s.btn, marginTop: '10px'}}>{isReg ? 'Zaregistrovat se' : 'Přihlásit se'}</button>
        
        <p onClick={() => setIsReg(!isReg)} style={{marginTop: '20px', color: '#94a3b8', cursor: 'pointer', textDecoration: 'underline'}}>
          {isReg ? 'Zpět na přihlášení' : 'Nemáte účet? Registrujte se'}
        </p>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';

export default function App() {
  // Načteme uživatele z paměti, pokud už se dříve přihlásil
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  // --- DOPRAVNÍ POLICAJT ---

  // 1. Pokud nikdo není přihlášený, ukážeme Přihlašovací bránu
  if (!user) {
    return <Login setUser={setUser} />;
  }

  // 2. Pokud se přihlásil Admin (nebo náš speciální testovací e-mail), ukážeme Řídící věž
  if (user.role === 'Admin' || user.email === 'admin@stavba.cz') {
    return <AdminDashboard user={user} setUser={setUser} />;
  }

  // 3. Všem ostatním ukážeme Terminál pro dělníky
  return <WorkerDashboard user={user} setUser={setUser} />;
}

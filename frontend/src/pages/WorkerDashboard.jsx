import React, { useState, useEffect, useRef } from 'react';
import { s } from '../styles';

export default function WorkerDashboard({ user, setUser }) {
  const [tab, setTab] = useState('terminal');
  const [tasks, setTasks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const api = "https://backend-9xye.onrender.com/api";
  const fileInputRef = useRef(null);

  const fetchTasks = async () => { const r = await fetch(`${api}/tasks/${user.projekt}`); const d = await r.json(); if(d.success) setTasks(d.data); };
  const fetchMessages = async () => { const r = await fetch(`${api}/chat/${user.projekt}`); const d = await r.json(); if(d.success) setMessages(d.data); };
  const fetchGallery = async () => { const r = await fetch(`${api}/gallery/${user.projekt}`); const d = await r.json(); if(d.success) setGallery(d.data); };
  
  useEffect(() => { 
      fetchTasks(); fetchMessages(); fetchGallery();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
  }, []);

  const logWithGPS = (typ) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => { await fetch(`${api}/log`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({userId: user.id, jmeno: user.jmeno, projekt: user.projekt, typ, lat: pos.coords.latitude, lng: pos.coords.longitude}) }); alert(`✅ ${typ} zaznamenán!`); },
        async (err) => { await fetch(`${api}/log`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({userId: user.id, jmeno: user.jmeno, projekt: user.projekt, typ, lat: null, lng: null}) }); alert("Uloženo bez GPS."); },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const completeTask = async (taskId) => { await fetch(`${api}/tasks/${taskId}/complete`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({jmeno: user.jmeno}) }); fetchTasks(); };
  const sendMessage = async () => { if(!newMessage) return; await fetch(`${api}/chat`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({projekt: user.projekt, odesilatel: user.jmeno, text: newMessage}) }); setNewMessage(''); fetchMessages(); };

  // MAGIE: Zpracování fotky
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      alert("Nahrávám fotku...");
      await fetch(`${api}/gallery`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({projekt: user.projekt, autor: user.jmeno, fotka: reader.result}) });
      alert("Fotka uložena!"); fetchGallery();
    };
    reader.readAsDataURL(file); // Převod na textový formát (Base64)
  };

  return (
    <div style={s.page}>
      <div style={{...s.card, maxWidth: '400px', textAlign: 'center'}}>
        <h1 style={{margin: 0}}>{user.jmeno}</h1>
        <p style={{color: '#38bdf8', fontWeight: 'bold'}}>{user.projekt}</p>
        
        <div style={{display: 'flex', gap: '5px', margin: '20px 0', overflowX: 'auto'}}>
          <button onClick={() => setTab('terminal')} style={tab === 'terminal' ? s.tabActive : s.tab}>Pípačka</button>
          <button onClick={() => { setTab('ukoly'); fetchTasks(); }} style={tab === 'ukoly' ? s.tabActive : s.tab}>Úkoly ({tasks.filter(t=>!t.hotovo).length})</button>
          <button onClick={() => { setTab('chat'); fetchMessages(); }} style={tab === 'chat' ? s.tabActive : s.tab}>Chat 💬</button>
          <button onClick={() => { setTab('galerie'); fetchGallery(); }} style={tab === 'galerie' ? s.tabActive : s.tab}>Foto 📸</button>
        </div>

        {tab === 'terminal' && ( <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}> <button onClick={() => logWithGPS('PŘÍCHOD')} style={s.btnSuccess}>📍 PŘÍCHOD</button> <button onClick={() => logWithGPS('ODCHOD')} style={s.btnDanger}>📍 ODCHOD</button> </div> )}
        
        {tab === 'ukoly' && ( <div style={{background: '#0f172a', padding: '15px', borderRadius: '10px', textAlign: 'left', maxHeight: '350px', overflowY: 'auto'}}> <h3 style={{marginTop: 0, color: '#f59e0b'}}>Dnešní práce:</h3> {tasks.length === 0 ? <p style={{color: '#64748b'}}>Žádné úkoly!</p> : tasks.map(t => ( <div key={t.id} style={{padding: '10px', borderBottom: '1px solid #1e293b', opacity: t.hotovo ? 0.5 : 1}}> <p style={{margin: '0 0 10px 0', textDecoration: t.hotovo ? 'line-through' : 'none'}}>{t.popis}</p> {!t.hotovo ? <button onClick={() => completeTask(t.id)} style={{...s.btn, padding: '8px', background: '#10b981', color: 'white', fontSize: '12px'}}>✔️ Hotovo</button> : <span style={{fontSize: '12px', color: '#10b981'}}>✅ Splněno</span>} </div> ))} </div> )}
        
        {tab === 'chat' && ( <div style={{textAlign: 'left', background: '#0f172a', borderRadius: '10px', padding: '10px'}}> <div style={{height: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '10px'}}> {messages.map(m => ( <div key={m.id} style={{background: m.odesilatel === user.jmeno ? '#38bdf8' : '#1e293b', color: m.odesilatel === user.jmeno ? '#0f172a' : 'white', padding: '10px', borderRadius: '10px', alignSelf: m.odesilatel === user.jmeno ? 'flex-end' : 'flex-start', maxWidth: '80%'}}> <b style={{fontSize: '11px', opacity: 0.8}}>{m.odesilatel}</b> <p style={{margin: '5px 0 0 0', fontSize: '14px'}}>{m.text}</p> </div> ))} </div> <div style={{display: 'flex', gap: '5px'}}> <input placeholder="Zpráva..." value={newMessage} onChange={e=>setNewMessage(e.target.value)} style={{...s.input, margin: 0}} /> <button onClick={sendMessage} style={{...s.btn, width: 'auto', padding: '0 15px'}}>Poslat</button> </div> </div> )}

        {/* NOVÝ MODUL: GALERIE */}
        {tab === 'galerie' && (
          <div style={{background: '#0f172a', padding: '15px', borderRadius: '10px', textAlign: 'center'}}>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handlePhotoUpload} style={{display: 'none'}} />
            <button onClick={() => fileInputRef.current.click()} style={{...s.btn, background: '#f59e0b', marginBottom: '20px'}}>📸 Vyfotit a nahrát na server</button>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px'}}>
               {gallery.map(g => (
                 <div key={g.id} style={{background: '#1e293b', padding: '5px', borderRadius: '8px'}}>
                    <img src={g.fotka} alt="Stavba" style={{width: '100%', height: '100px', objectFit: 'cover', borderRadius: '5px'}} />
                    <p style={{fontSize: '10px', margin: '5px 0 0 0', color: '#94a3b8'}}>{g.autor}</p>
                 </div>
               ))}
            </div>
          </div>
        )}

        <button onClick={() => {localStorage.clear(); setUser(null);}} style={{background: 'none', border: 'none', color: '#64748b', marginTop: '20px', cursor: 'pointer', textDecoration: 'underline'}}>Odhlásit se</button>
      </div>
    </div>
  );
}

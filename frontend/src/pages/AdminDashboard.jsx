import React, { useState, useEffect, useRef } from 'react';
import { s } from '../styles';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Cylinder, Box, Torus, Text } from '@react-three/drei';

// --- 1. PROFI 3D RENDEROVACÍ ENGINE ---
function ThreeDScene({ route, system, selectedId }) {
  const isVzt = system === 'vzt';
  const colorPipe = isVzt ? '#94a3b8' : '#38bdf8';
  const colorFit = isVzt ? '#475569' : '#0284c7';

  return (
    <Canvas shadows camera={{ position: [5, 5, 8], fov: 50 }} style={{ background: '#1e293b' }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        <Environment preset="city" />

        <group rotation={[0, 0, 0]}>
          {route.map((c, index) => {
            const spacing = 2; 
            const position = [index * spacing - (route.length * spacing) / 2, 0, 0];
            const r1 = (c.dn1 || 100) / 200; 
            const r2 = (c.dn2 || 100) / 200; 
            const len = c.length || 1;
            const isSelected = c.id === selectedId;
            const highlightColor = isSelected ? '#f59e0b' : colorPipe;

            return (
              <group key={c.id} position={position}>
                {isSelected && <Text position={[0, Math.max(r1, r2) + 0.5, 0]} fontSize={0.2} color="#f59e0b">✏️ Upravujete</Text>}
                {c.type === 'pipe' && ( <Cylinder args={[r1, r1, len, 32]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color={highlightColor} metalness={0.7} roughness={0.3} /></Cylinder> )}
                {c.type === 'elbow' && ( <group rotation={[0, 0, 0]}><Torus args={[0.5, r1, 16, 32, (c.angle * Math.PI) / 180]} rotation={[Math.PI / 2, 0, 0]} castShadow><meshStandardMaterial color={isSelected ? '#f59e0b' : colorFit} metalness={0.8} roughness={0.2} /></Torus></group> )}
                {c.type === 'reducer' && ( <Cylinder args={[r1, r2, 1, 32]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color={isSelected ? '#f59e0b' : colorFit} metalness={0.8} roughness={0.2} /></Cylinder> )}
                {c.type === 'silencer' && ( <Cylinder args={[r1 * 1.5, r1 * 1.5, len, 32]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color={isSelected ? '#f59e0b' : colorPipe} metalness={0.3} roughness={0.8} /></Cylinder> )}
                {c.type === 'tee' && ( <group><Cylinder args={[r1, r1, 1, 32]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color={isSelected ? '#f59e0b' : colorFit} metalness={0.8} roughness={0.2} /></Cylinder><Cylinder args={[r1, r1, 0.8, 32]} position={[0, 0.4, 0]} castShadow><meshStandardMaterial color={isSelected ? '#f59e0b' : colorFit} metalness={0.8} roughness={0.2} /></Cylinder></group> )}
                {c.type === 'regulator' && ( <group><Cylinder args={[r1, r1, 0.8, 32]} rotation={[0, 0, Math.PI / 2]} castShadow><meshStandardMaterial color={highlightColor} metalness={0.7} roughness={0.3} /></Cylinder><Box args={[0.4, 0.4, 0.4]} position={[0, r1 + 0.2, 0]} castShadow><meshStandardMaterial color="#ef4444" metalness={0.5} roughness={0.5} /></Box></group> )}
                <Text position={[0, -Math.max(r1, r2) - 0.4, 0]} fontSize={0.15} color="white">{c.name}</Text>
              </group>
            );
          })}
        </group>
        <gridHelper args={[30, 30, 0x334155, 0x334155]} position={[0, -1.5, 0]} />
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </Canvas>
  );
}

// --- 2. HLAVNÍ APLIKACE (ADMIN DASHBOARD) ---
export default function AdminDashboard({ user, setUser }) {
  const [tab, setTab] = useState('prehled'); 
  const api = "http://localhost:3000/api";
  const pdfInputRef = useRef(null);
  
  // VŠECHNA DATA APLIKACE (OBNOVENO)
  const [onsite, setOnsite] = useState([]); const [pending, setPending] = useState([]);
  const [projects, setProjects] = useState([]); const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]); const [tasks, setTasks] = useState([]);
  const [diary, setDiary] = useState([]); const [gallery, setGallery] = useState([]);
  const [plans, setPlans] = useState([]);
  
  // STAVY PRO FORMULÁŘE
  const [newProject, setNewProject] = useState({ nazev: '', adresa: '' });
  const [newTask, setNewTask] = useState({ projekt: '', popis: '' });
  
  // STAVY PRO KALKULAČKY A BIM
  const [calcType, setCalcType] = useState('bim'); 
  const [calcInputs, setCalcInputs] = useState({ objem: 0, plochaOken: 0, plochaSten: 0, teplotaIn: 21, teplotaOut: -12, izolace: 0.3, osoby: 0, sprchy: 0, wc: 0, prutokVzt: 0, rychlost: 3, delkaTrasy: 0 });
  const [calcResult, setCalcResult] = useState(null);
  const [route, setRoute] = useState([]); 
  const [bimSystem, setBimSystem] = useState('vzt');
  const [selectedId, setSelectedId] = useState(null);

  // NAČTENÍ ÚPLNĚ VŠECH DAT BEZ ZKRACOVÁNÍ
  const fetchData = async () => {
    try {
      const rOnsite = await fetch(`${api}/admin/onsite`); const dOnsite = await rOnsite.json(); if(dOnsite.success) setOnsite(dOnsite.data);
      const rPending = await fetch(`${api}/admin/pending`); setPending(await rPending.json());
      const rProj = await fetch(`${api}/projects`); const dProj = await rProj.json(); if(dProj.success) setProjects(dProj.data);
      const rHist = await fetch(`${api}/admin/logs`); const dHist = await rHist.json(); if(dHist.success) setHistory(dHist.data);
      const rEmp = await fetch(`${api}/admin/users`); const dEmp = await rEmp.json(); if(dEmp.success) setEmployees(dEmp.data);
      const rTasks = await fetch(`${api}/tasks`); const dTasks = await rTasks.json(); if(dTasks.success) setTasks(dTasks.data);
      const rGal = await fetch(`${api}/gallery`); const dGal = await rGal.json(); if(dGal.success) setGallery(dGal.data);
      const rPlans = await fetch(`${api}/plans`); const dPlans = await rPlans.json(); if(dPlans.success) setPlans(dPlans.data);
    } catch(e) { console.error("Chyba načítání:", e); }
  };
  useEffect(() => { fetchData(); }, []);

  // FUNKCE JÁDRA
  const handleCreateProject = async () => { if(!newProject.nazev) return alert("Zadejte název"); await fetch(`${api}/projects`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newProject) }); setNewProject({nazev:'', adresa:''}); fetchData(); };
  const handleCreateTask = async () => { if(!newTask.projekt || !newTask.popis) return alert("Vyplňte úkol"); await fetch(`${api}/tasks`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(newTask) }); setNewTask({...newTask, popis:''}); fetchData(); };
  const exportCSV = () => { let csv = "data:text/csv;charset=utf-8,ID,Jmeno,Projekt,Typ,Cas\n"; history.forEach(r => { csv += `${r.id},${r.jmeno},${r.projekt},${r.typ},${new Date(r.cas).toLocaleString('cs-CZ').replace(',','')}\n`; }); const link = document.createElement("a"); link.href = encodeURI(csv); link.download = "Dochazka.csv"; document.body.appendChild(link); link.click(); };
  const handlePdfUpload = (e) => { const file = e.target.files[0]; if(!file) return; const prj = prompt('Název stavby:'); if(!prj) return; const reader = new FileReader(); reader.onloadend = async () => { await fetch(`${api}/plans`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({projekt: prj, nazev: file.name, data: reader.result}) }); fetchData(); alert('PDF uloženo'); }; reader.readAsDataURL(file); };
  const downloadPdf = async (id, nazev) => { const r = await fetch(`${api}/plans/download/${id}`); const d = await r.json(); if(d.success) { const link = document.createElement('a'); link.href = d.data.pdf_data; link.download = d.data.nazev_souboru; document.body.appendChild(link); link.click(); } };

  // FUNKCE KALKULAČEK
  const handleCalculate = () => {
    switch(calcType) {
      case 'topeni': const deltaT = calcInputs.teplotaIn - calcInputs.teplotaOut; const wCelkem = (calcInputs.plochaSten * calcInputs.izolace * deltaT) + (calcInputs.plochaOken * 1.2 * deltaT) + (calcInputs.objem * 0.5 * 0.34 * deltaT); setCalcResult(`CELKOVÝ POŽADOVANÝ VÝKON: ${wCelkem.toFixed(0)} W\nDoporučený zdroj (s rezervou): ${(wCelkem * 1.15 / 1000).toFixed(1)} kW`); break;
      case 'voda': const lZaDen = (calcInputs.osoby * 100) + (calcInputs.sprchy * 40) + (calcInputs.wc * 25); const qVterina = (lZaDen / 24 / 3600) * 5; setCalcResult(`Denní spotřeba vody: ${lZaDen} litrů/den\nVýpočtový průtok ve špičce: ${qVterina.toFixed(3)} l/s\nDoporučené potrubí: DN ${qVterina > 0.5 ? '25' : '20'}`); break;
      case 'vzt': const prumerMM = Math.sqrt((4 * ((calcInputs.prutokVzt / 3600) / calcInputs.rychlost)) / Math.PI) * 1000; setCalcResult(`Doporučený vnitřní průměr potrubí: ${Math.ceil(prumerMM)} mm\nOdhadovaná tlaková ztráta trasy: ${calcInputs.delkaTrasy * 2.5} Pa`); break;
    }
  };

  // FUNKCE BIM MODELÁŘE
  const addComp = (type, name, defaults) => { const newId = Date.now(); setRoute([...route, { id: newId, type, name, ...defaults }]); setSelectedId(newId); };
  const updateComp = (key, value) => { setRoute(route.map(c => c.id === selectedId ? { ...c, [key]: parseFloat(value) || 0 } : c)); };
  const selectedComp = route.find(c => c.id === selectedId);

  return (
    <div style={s.page}>
      <div style={{...s.card, maxWidth: '1400px'}}> 
        <div style={{display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '15px'}}>
          <h1 style={{color: '#38bdf8', margin: 0}}>Stavba PRO v9.0 - Kompletní Systém</h1>
          <button onClick={() => {localStorage.clear(); setUser(null);}} style={{...s.btn, width: 'auto', background: 'transparent', color: '#ef4444'}}>Odhlásit</button>
        </div>

        {/* --- HLAVNÍ NAVIGACE (ZDE JSOU VŠECHNY TABY) --- */}
        <div style={{display: 'flex', gap: '10px', margin: '20px 0', overflowX: 'auto', paddingBottom: '10px'}}>
          <button onClick={() => setTab('prehled')} style={tab === 'prehled' ? s.tabActive : s.tab}>Lidé a Docházka</button>
          <button onClick={() => setTab('projekty')} style={tab === 'projekty' ? s.tabActive : s.tab}>Projekty a Úkoly</button>
          <button onClick={() => setTab('nastroje')} style={tab === 'nastroje' ? s.tabActive : s.tab}>Nástroje & 3D BIM</button>
          <button onClick={() => setTab('soubory')} style={tab === 'soubory' ? s.tabActive : s.tab}>Výkresy a Fotky</button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: LIDÉ A DOCHÁZKA */}
        {/* ========================================================= */}
        {tab === 'prehled' && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', textAlign: 'left'}}>
             <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
               <div style={{background: '#0f172a', padding: '15px', borderRadius: '10px'}}>
                  <h3 style={{color: '#f59e0b', marginTop: 0}}>⏳ Čekající nováčci</h3>
                  {pending.length === 0 && <p style={{color: '#64748b'}}>Žádné žádosti.</p>}
                  {pending.map(p => (
                    <div key={p.id} style={{padding: '10px', borderBottom: '1px solid #334155', background: '#1e293b', borderRadius: '8px', marginBottom: '10px'}}>
                      <b>{p.jmeno}</b>
                      <div style={{display: 'flex', gap: '5px', marginTop: '10px'}}>
                         <select id={`role-${p.id}`} style={{...s.input, padding: '8px', margin: 0}}><option value="Dělník">Dělník</option><option value="Instalatér">Instalatér</option><option value="Topenář">Topenář</option><option value="Stavbyvedoucí">Stavbyvedoucí</option></select>
                         <select id={`proj-${p.id}`} style={{...s.input, padding: '8px', margin: 0}}><option value="">Projekt...</option>{projects.map(pr => <option key={pr.id} value={pr.nazev}>{pr.nazev}</option>)}</select>
                         <button onClick={async () => { await fetch(`${api}/admin/approve`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({id: p.id, projekt: document.getElementById(`proj-${p.id}`).value, role: document.getElementById(`role-${p.id}`).value}) }); fetchData(); }} style={{...s.btn, background: '#f59e0b', width: 'auto'}}>Schválit</button>
                      </div>
                    </div>
                  ))}
               </div>
               <div style={{background: '#0f172a', padding: '15px', borderRadius: '10px', maxHeight: '400px', overflowY: 'auto'}}>
                  <h3 style={{color: '#10b981', marginTop: 0}}>👥 Databáze Zaměstnanců</h3>
                  {employees.map(emp => (
                    <div key={emp.id} style={{padding: '10px', borderBottom: '1px solid #334155'}}>
                       <b>{emp.jmeno}</b> <span style={{fontSize: '11px', color: '#94a3b8'}}>({emp.email})</span>
                       <div style={{display: 'flex', gap: '5px', marginTop: '5px'}}>
                          <select defaultValue={emp.role} id={`u-role-${emp.id}`} style={{...s.input, padding: '5px', margin: 0, fontSize: '12px'}}><option value="Dělník">Dělník</option><option value="Instalatér">Instalatér</option><option value="Topenář">Topenář</option><option value="Stavbyvedoucí">Stavbyvedoucí</option><option value="Admin">Admin</option></select>
                          <select defaultValue={emp.projekt} id={`u-proj-${emp.id}`} style={{...s.input, padding: '5px', margin: 0, fontSize: '12px'}}>{projects.map(pr => <option key={pr.id} value={pr.nazev}>{pr.nazev}</option>)}</select>
                          <button onClick={async () => { await fetch(`${api}/admin/users/${emp.id}/role`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({role: document.getElementById(`u-role-${emp.id}`).value, projekt: document.getElementById(`u-proj-${emp.id}`).value}) }); alert("Uloženo"); fetchData(); }} style={{...s.btn, background: '#38bdf8', color: '#0f172a', width: 'auto', padding: '5px 10px'}}>Uložit</button>
                       </div>
                    </div>
                  ))}
               </div>
             </div>
             <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
               <div style={{background: '#0f172a', padding: '15px', borderRadius: '10px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                     <h3 style={{color: '#38bdf8', margin: 0}}>📊 Mzdové podklady (Logy)</h3>
                     <button onClick={exportCSV} style={{...s.btn, background: '#10b981', color: 'white', width: 'auto', padding: '5px 15px', fontSize: '12px'}}>⬇️ CSV (Excel)</button>
                  </div>
                  <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', fontSize: '13px'}}>
                      <thead><tr style={{borderBottom: '1px solid #334155', color: '#94a3b8'}}><th style={{textAlign:'left', padding:'5px'}}>Čas</th><th style={{textAlign:'left'}}>Jméno</th><th style={{textAlign:'left'}}>Akce</th></tr></thead>
                      <tbody>
                        {history.slice(0, 50).map(h => (
                          <tr key={h.id} style={{borderBottom: '1px solid #1e293b'}}>
                            <td style={{padding: '5px', color: '#cbd5e1'}}>{new Date(h.cas).toLocaleTimeString('cs-CZ')} <br/><span style={{fontSize:'10px'}}>{new Date(h.cas).toLocaleDateString('cs-CZ')}</span></td>
                            <td><b>{h.jmeno}</b><br/><span style={{fontSize:'10px', color: '#38bdf8'}}>{h.projekt}</span></td>
                            <td style={{color: h.typ === 'PŘÍCHOD' ? '#10b981' : '#ef4444', fontWeight: 'bold'}}>{h.typ}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
               <div style={{background: '#0f172a', padding: '15px', borderRadius: '10px'}}>
                 <h3 style={{color: '#10b981', marginTop: 0}}>👷‍♂️ Aktuálně na stavbách (Pípli příchod)</h3>
                 {onsite.length === 0 ? <p style={{color: '#64748b'}}>Nikdo není v práci.</p> : onsite.map((o, i) => <div key={i} style={{padding: '5px 0', borderBottom: '1px solid #334155'}}><b>{o.jmeno}</b> <span style={{float: 'right', color: '#38bdf8'}}>{o.projekt}</span></div>)}
               </div>
             </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROJEKTY A ÚKOLY */}
        {/* ========================================================= */}
        {tab === 'projekty' && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', textAlign: 'left'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
               <div style={{background: '#0f172a', padding: '20px', borderRadius: '10px'}}>
                  <h3 style={{color: '#38bdf8', marginTop: 0}}>🏗️ Založit novou stavbu</h3>
                  <input placeholder="Název projektu" value={newProject.nazev} onChange={e=>setNewProject({...newProject, nazev: e.target.value})} style={s.input}/>
                  <input placeholder="Adresa stavby" value={newProject.adresa} onChange={e=>setNewProject({...newProject, adresa: e.target.value})} style={s.input}/>
                  <button onClick={handleCreateProject} style={{...s.btn, background: '#38bdf8', color: '#0f172a'}}>Vytvořit projekt</button>
               </div>
               <div style={{background: '#0f172a', padding: '20px', borderRadius: '10px', maxHeight: '300px', overflowY: 'auto'}}>
                  <h3 style={{color: '#10b981', marginTop: 0}}>Aktivní projekty ({projects.length})</h3>
                  {projects.map(pr => <div key={pr.id} style={{padding: '10px', borderBottom: '1px solid #334155', background: '#1e293b', borderRadius: '8px', marginBottom: '10px'}}><h4>{pr.nazev}</h4><p style={{margin: 0, fontSize: '12px', color: '#94a3b8'}}>📍 {pr.adresa}</p></div>)}
               </div>
            </div>
            <div style={{background: '#0f172a', padding: '20px', borderRadius: '10px'}}>
               <h3 style={{color: '#f59e0b', marginTop: 0}}>📝 Zadat úkol</h3>
               <select value={newTask.projekt} onChange={e=>setNewTask({...newTask, projekt: e.target.value})} style={s.input}><option value="">Vyberte stavbu...</option>{projects.map(pr => <option key={pr.id} value={pr.nazev}>{pr.nazev}</option>)}</select>
               <textarea placeholder="Popis úkolu (např. Zapojit stoupačky)" value={newTask.popis} onChange={e=>setNewTask({...newTask, popis: e.target.value})} style={{...s.input, minHeight: '60px'}}/>
               <button onClick={handleCreateTask} style={{...s.btn, background: '#f59e0b', color: '#0f172a', marginBottom: '20px'}}>Zadat na stavbu</button>
               
               <h3 style={{color: '#10b981', marginTop: 0}}>Seznam úkolů</h3>
               <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                 {tasks.length === 0 ? <p style={{color: '#64748b'}}>Vše hotovo.</p> : tasks.map(t => (
                   <div key={t.id} style={{padding: '10px', borderBottom: '1px solid #334155', borderLeft: t.hotovo ? '4px solid #10b981' : '4px solid #ef4444', marginBottom: '5px', background: '#1e293b', borderRadius: '0 8px 8px 0'}}>
                     <span style={{color: '#38bdf8', fontSize: '11px', fontWeight: 'bold'}}>{t.projekt_nazev}</span>
                     <p style={{margin: '5px 0', fontSize: '14px', textDecoration: t.hotovo ? 'line-through' : 'none'}}>{t.popis}</p>
                     {t.hotovo ? <span style={{fontSize: '11px', color: '#10b981'}}>✅ Splnil: {t.kdo_dokoncil}</span> : <span style={{fontSize: '11px', color: '#ef4444'}}>⏳ Nehotovo</span>}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: NÁSTROJE, KALKULAČKY A 3D BIM */}
        {/* ========================================================= */}
        {tab === 'nastroje' && (
          <div style={{background: '#0f172a', padding: '20px', borderRadius: '10px', textAlign: 'left'}}>
            <div style={{display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap'}}>
               <button onClick={()=>setCalcType('topeni')} style={calcType === 'topeni' ? s.tabActive : s.tab}>Tepelné ztráty 🌡️</button>
               <button onClick={()=>setCalcType('voda')} style={calcType === 'voda' ? s.tabActive : s.tab}>Dimenzování vody 💧</button>
               <button onClick={()=>setCalcType('vzt')} style={calcType === 'vzt' ? s.tabActive : s.tab}>VZT Potrubí 💨</button>
               <button onClick={()=>setCalcType('bim')} style={calcType === 'bim' ? {...s.tabActive, background: '#f59e0b', color: '#0f172a'} : s.tab}>3D BIM Parametrický Modelář 🛠️</button>
            </div>

            {/* A) OBYČEJNÉ KALKULAČKY */}
            {calcType !== 'bim' && (
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', background: '#1e293b', padding: '20px', borderRadius: '8px'}}>
                 {calcType === 'topeni' && ( <><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Vnitřní teplota (°C)</label><input type="number" value={calcInputs.teplotaIn} onChange={e=>setCalcInputs({...calcInputs, teplotaIn: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Venkovní teplota (°C)</label><input type="number" value={calcInputs.teplotaOut} onChange={e=>setCalcInputs({...calcInputs, teplotaOut: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Plocha stěn (m²)</label><input type="number" onChange={e=>setCalcInputs({...calcInputs, plochaSten: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Plocha oken (m²)</label><input type="number" onChange={e=>setCalcInputs({...calcInputs, plochaOken: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Objem (m³)</label><input type="number" onChange={e=>setCalcInputs({...calcInputs, objem: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Izolace (U)</label><select onChange={e=>setCalcInputs({...calcInputs, izolace: parseFloat(e.target.value)})} style={s.input}><option value="0.2">Pasivní (0.2)</option><option value="0.3">Nová (0.3)</option><option value="1.5">Stará (1.5)</option></select></div></> )}
                 {calcType === 'voda' && ( <><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Osob</label><input type="number" onChange={e=>setCalcInputs({...calcInputs, osoby: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Sprch</label><input type="number" onChange={e=>setCalcInputs({...calcInputs, sprchy: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>WC</label><input type="number" onChange={e=>setCalcInputs({...calcInputs, wc: e.target.value})} style={s.input}/></div></> )}
                 {calcType === 'vzt' && ( <><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Průtok (m³/h)</label><input type="number" onChange={e=>setCalcInputs({...calcInputs, prutokVzt: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Délka trasy (m)</label><input type="number" onChange={e=>setCalcInputs({...calcInputs, delkaTrasy: e.target.value})} style={s.input}/></div><div><label style={{color:'#94a3b8', fontSize:'12px'}}>Rychlost (m/s)</label><input type="number" value={calcInputs.rychlost} onChange={e=>setCalcInputs({...calcInputs, rychlost: e.target.value})} style={s.input}/></div></> )}
                 <div style={{gridColumn: '1 / -1'}}><button onClick={handleCalculate} style={{...s.btn, background: '#10b981', color: 'white'}}>Vypočítat</button></div>
                 {calcResult && ( <div style={{gridColumn: '1 / -1', background: '#0f172a', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #38bdf8', whiteSpace: 'pre-line', color: 'white', fontSize: '15px'}}>{calcResult}</div> )}
              </div>
            )}

            {/* B) 3D BIM MODELÁŘ S VLASTNOSTMI */}
            {calcType === 'bim' && (
               <div style={{display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
                  <div style={{flex: '1', minWidth: '250px', background: '#1e293b', padding: '15px', borderRadius: '10px'}}>
                      <h3 style={{color: '#10b981', marginTop: 0}}>1. Knihovna prvků</h3>
                      <select value={bimSystem} onChange={e=>{setBimSystem(e.target.value); setRoute([]);}} style={{...s.input, marginBottom: '15px'}}><option value="vzt">Vzduchotechnika (Spiro)</option><option value="voda">Voda / Topení (PPR/Měď)</option></select>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                          <button onClick={()=>addComp('pipe', 'Trubka', { dn1: 100, length: 2 })} style={{...s.btn, background: '#334155'}}>➖ Trubka</button>
                          <button onClick={()=>addComp('elbow', 'Koleno', { dn1: 100, angle: 90 })} style={{...s.btn, background: '#334155'}}>📐 Koleno</button>
                          <button onClick={()=>addComp('tee', 'T-Kus', { dn1: 100 })} style={{...s.btn, background: '#334155'}}>┳ T-Kus</button>
                          <button onClick={()=>addComp('reducer', 'Redukce', { dn1: 150, dn2: 100 })} style={{...s.btn, background: '#334155'}}>🔽 Redukce</button>
                          <button onClick={()=>addComp('silencer', 'Tlumič', { dn1: 100, length: 1 })} style={{...s.btn, background: '#334155'}}>🔈 Tlumič</button>
                          <button onClick={()=>addComp('regulator', 'Regulátor', { dn1: 100 })} style={{...s.btn, background: '#ef4444'}}>🛑 Regulátor průtoku</button>
                      </div>
                  </div>

                  <div style={{flex: '3', minWidth: '400px', display: 'flex', flexDirection: 'column'}}>
                      <div style={{border: '2px solid #334155', borderRadius: '10px', height: '500px', overflow: 'hidden'}}>
                          {route.length === 0 ? <p style={{color: '#64748b', textAlign: 'center', marginTop: '200px'}}>Klikněte vlevo pro přidání prvků.</p> : (
                              <ThreeDScene route={route} system={bimSystem} selectedId={selectedId} />
                          )}
                      </div>
                  </div>

                  <div style={{flex: '1', minWidth: '250px', background: '#1e293b', padding: '15px', borderRadius: '10px'}}>
                      <h3 style={{color: '#38bdf8', marginTop: 0}}>2. Vlastnosti prvku</h3>
                      {!selectedComp ? <p style={{color: '#64748b', fontSize: '13px'}}>Vyberte prvek.</p> : (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                              <div style={{background: '#0f172a', padding: '10px', borderRadius: '5px', color: '#10b981', fontWeight: 'bold'}}>{selectedComp.name}</div>
                              {selectedComp.dn1 !== undefined && ( <div><label style={{color:'#94a3b8', fontSize:'12px'}}>Vstupní DN (mm):</label><input type="number" value={selectedComp.dn1} onChange={e=>updateComp('dn1', e.target.value)} style={s.input}/></div> )}
                              {selectedComp.type === 'reducer' && ( <div><label style={{color:'#94a3b8', fontSize:'12px'}}>Výstupní DN 2 (mm):</label><input type="number" value={selectedComp.dn2} onChange={e=>updateComp('dn2', e.target.value)} style={s.input}/></div> )}
                              {(selectedComp.type === 'pipe' || selectedComp.type === 'silencer') && ( <div><label style={{color:'#94a3b8', fontSize:'12px'}}>Délka (m):</label><input type="number" step="0.5" value={selectedComp.length} onChange={e=>updateComp('length', e.target.value)} style={s.input}/></div> )}
                              {selectedComp.type === 'elbow' && ( <div><label style={{color:'#94a3b8', fontSize:'12px'}}>Úhel (°):</label><input type="number" step="15" value={selectedComp.angle} onChange={e=>updateComp('angle', e.target.value)} style={s.input}/></div> )}
                              <button onClick={()=>{setRoute(route.filter(c=>c.id!==selectedId)); setSelectedId(null);}} style={{...s.btnDanger, marginTop: '20px'}}>🗑️ Odebrat</button>
                          </div>
                      )}
                  </div>
               </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: SOUBORY, VÝKRESY A FOTOGALERIE */}
        {/* ========================================================= */}
        {tab === 'soubory' && (
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', textAlign: 'left'}}>
             <div style={{background: '#0f172a', padding: '20px', borderRadius: '10px'}}>
                <h3 style={{color: '#38bdf8', marginTop: 0}}>📄 Projektová dokumentace (PDF)</h3>
                <input type="file" accept="application/pdf" ref={pdfInputRef} onChange={handlePdfUpload} style={{display: 'none'}} />
                <button onClick={() => pdfInputRef.current.click()} style={{...s.btn, background: '#38bdf8', color: '#0f172a', marginBottom: '15px'}}>+ Nahrát nový PDF výkres</button>
                <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                   {plans.map(p => (
                     <div key={p.id} style={{padding: '10px', background: '#1e293b', borderLeft: '4px solid #38bdf8', marginBottom: '10px', borderRadius: '0 8px 8px 0'}}>
                        <b style={{color: '#f59e0b', fontSize: '11px'}}>{p.projekt_nazev}</b>
                        <p style={{margin: '5px 0', fontSize: '13px', color: 'white', wordBreak: 'break-all'}}>{p.nazev_souboru}</p>
                        <button onClick={() => downloadPdf(p.id, p.nazev_souboru)} style={{...s.btn, background: '#10b981', color: 'white', fontSize: '12px', padding: '5px'}}>Stáhnout / Otevřít</button>
                     </div>
                   ))}
                </div>
             </div>
             <div style={{background: '#0f172a', padding: '20px', borderRadius: '10px'}}>
                <h3 style={{color: '#10b981', marginTop: 0}}>📸 Fotogalerie ze staveb</h3>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', maxHeight: '450px', overflowY: 'auto'}}>
                   {gallery.map(g => (
                     <div key={g.id} style={{background: '#1e293b', padding: '5px', borderRadius: '5px'}}>
                        <b style={{color: '#38bdf8', fontSize: '10px'}}>{g.projekt_nazev}</b>
                        <img src={g.fotka} alt="Stavba" style={{width: '100%', height: '100px', objectFit: 'cover', borderRadius: '5px', marginTop: '5px'}} />
                        <span style={{fontSize: '10px', color: '#94a3b8'}}>Od: {g.autor}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

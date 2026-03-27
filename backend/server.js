require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cloudinary = require('cloudinary').v2; // ☁️ Přidáno Cloudinary

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// ☁️ Nastavení přístupu do Cloudinary skladu
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const initDB = async () => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, jmeno VARCHAR(100), email VARCHAR(100) UNIQUE, heslo VARCHAR(255), role VARCHAR(50) DEFAULT 'Dělník', projekt VARCHAR(100) DEFAULT 'Nepřiřazen', is_approved BOOLEAN DEFAULT false);
        CREATE TABLE IF NOT EXISTS logs (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), jmeno VARCHAR(100), projekt VARCHAR(100), typ VARCHAR(50), cas TIMESTAMP DEFAULT CURRENT_TIMESTAMP, lat DECIMAL(10, 7), lng DECIMAL(10, 7));
        CREATE TABLE IF NOT EXISTS projects (id SERIAL PRIMARY KEY, nazev VARCHAR(100) UNIQUE, adresa VARCHAR(200));
        CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, projekt_nazev VARCHAR(100), popis TEXT, hotovo BOOLEAN DEFAULT false, kdo_dokoncil VARCHAR(100) DEFAULT NULL, vytvoreno TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS diary (id SERIAL PRIMARY KEY, projekt_nazev VARCHAR(100), zapis TEXT, autor VARCHAR(100), datum TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, projekt_nazev VARCHAR(100), odesilatel VARCHAR(100), text TEXT, cas TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS gallery (id SERIAL PRIMARY KEY, projekt_nazev VARCHAR(100), autor VARCHAR(100), fotka TEXT, cas TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
        CREATE TABLE IF NOT EXISTS plans (id SERIAL PRIMARY KEY, projekt_nazev VARCHAR(100), nazev_souboru VARCHAR(200), pdf_data TEXT, cas TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
    `);
    console.log('🐘 DB připravena, ☁️ Cloudinary napojeno!');
};
initDB();

app.post('/api/register', async (req, res) => { const hash = await bcrypt.hash(req.body.heslo, 10); try { await pool.query('INSERT INTO users (jmeno, email, heslo) VALUES ($1, $2, $3)', [req.body.jmeno, req.body.email, hash]); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.post('/api/login', async (req, res) => {
    const r = await pool.query('SELECT * FROM users WHERE email = $1', [req.body.email]);
    if (r.rows.length && await bcrypt.compare(req.body.heslo, r.rows[0].heslo)) {
        let u = r.rows[0];
        if (u.email === 'admin@stavba.cz' && !u.is_approved) { await pool.query("UPDATE users SET is_approved = true, role = 'Admin' WHERE email = 'admin@stavba.cz'"); u.is_approved = true; u.role = 'Admin'; }
        if (!u.is_approved) return res.json({ success: false, message: "Neschváleno." });
        const token = jwt.sign({ id: u.id, role: u.role, jmeno: u.jmeno }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token: token, user: { id: u.id, jmeno: u.jmeno, projekt: u.projekt, role: u.role } });
    } else res.json({ success: false, message: "Chybné údaje." });
});

app.post('/api/log', async (req, res) => { await pool.query('INSERT INTO logs (user_id, jmeno, projekt, typ, lat, lng) VALUES ($1, $2, $3, $4, $5, $6)', [req.body.userId, req.body.jmeno, req.body.projekt, req.body.typ, req.body.lat, req.body.lng]); res.json({ success: true }); });
app.get('/api/admin/pending', async (req, res) => { const r = await pool.query('SELECT id, jmeno, email FROM users WHERE is_approved = false'); res.json(r.rows); });
app.post('/api/admin/approve', async (req, res) => { await pool.query('UPDATE users SET is_approved = true, projekt = $1, role = $2 WHERE id = $3', [req.body.projekt, req.body.role, req.body.id]); res.json({ success: true }); });
app.get('/api/admin/onsite', async (req, res) => { const r = await pool.query(`SELECT DISTINCT ON (user_id) user_id, jmeno, projekt, typ, cas, lat, lng FROM logs ORDER BY user_id, cas DESC;`); res.json({ success: true, data: r.rows.filter(row => row.typ === 'PŘÍCHOD') }); });
app.get('/api/admin/logs', async (req, res) => { const r = await pool.query('SELECT * FROM logs ORDER BY cas DESC'); res.json({ success: true, data: r.rows }); });
app.get('/api/admin/users', async (req, res) => { const r = await pool.query('SELECT id, jmeno, email, role, projekt FROM users WHERE is_approved = true ORDER BY jmeno ASC'); res.json({ success: true, data: r.rows }); });
app.put('/api/admin/users/:id/role', async (req, res) => { await pool.query('UPDATE users SET role = $1, projekt = $2 WHERE id = $3', [req.body.role, req.body.projekt, req.params.id]); res.json({ success: true }); });
app.get('/api/projects', async (req, res) => { const r = await pool.query('SELECT * FROM projects ORDER BY id DESC'); res.json({ success: true, data: r.rows }); });
app.post('/api/projects', async (req, res) => { try { await pool.query('INSERT INTO projects (nazev, adresa) VALUES ($1, $2)', [req.body.nazev, req.body.adresa]); res.json({ success: true }); } catch(e) { res.json({ success: false }); } });
app.get('/api/tasks/:projekt', async (req, res) => { const r = await pool.query('SELECT * FROM tasks WHERE projekt_nazev = $1 ORDER BY hotovo ASC, id DESC', [req.params.projekt]); res.json({ success: true, data: r.rows }); });
app.get('/api/tasks', async (req, res) => { const r = await pool.query('SELECT * FROM tasks ORDER BY id DESC'); res.json({ success: true, data: r.rows }); });
app.post('/api/tasks', async (req, res) => { await pool.query('INSERT INTO tasks (projekt_nazev, popis) VALUES ($1, $2)', [req.body.projekt, req.body.popis]); res.json({ success: true }); });
app.put('/api/tasks/:id/complete', async (req, res) => { await pool.query('UPDATE tasks SET hotovo = true, kdo_dokoncil = $1 WHERE id = $2', [req.body.jmeno, req.params.id]); res.json({ success: true }); });
app.get('/api/diary', async (req, res) => { const r = await pool.query('SELECT * FROM diary ORDER BY datum DESC'); res.json({ success: true, data: r.rows }); });
app.post('/api/diary', async (req, res) => { await pool.query('INSERT INTO diary (projekt_nazev, zapis, autor) VALUES ($1, $2, $3)', [req.body.projekt, req.body.zapis, req.body.autor]); res.json({ success: true }); });

// ☁️ OPRAVA: FOTOGALERIE PŘES CLOUDINARY
app.get('/api/gallery', async (req, res) => { const r = await pool.query('SELECT * FROM gallery ORDER BY cas DESC'); res.json({ success: true, data: r.rows }); });
app.get('/api/gallery/:projekt', async (req, res) => { const r = await pool.query('SELECT * FROM gallery WHERE projekt_nazev = $1 ORDER BY cas DESC', [req.params.projekt]); res.json({ success: true, data: r.rows }); });
app.post('/api/gallery', async (req, res) => { 
    try { 
        // 1. Nahraje velkou fotku do Cloudinary
        const result = await cloudinary.uploader.upload(req.body.fotka, { folder: "stavba_pro/galerie" });
        // 2. Do Neon databáze uloží už jen textový odkaz (result.secure_url)
        await pool.query('INSERT INTO gallery (projekt_nazev, autor, fotka) VALUES ($1, $2, $3)', [req.body.projekt, req.body.autor, result.secure_url]); 
        res.json({ success: true }); 
    } catch(e) { console.log(e); res.status(500).json({ success: false }); } 
});

// ☁️ OPRAVA: PDF VÝKRESY PŘES CLOUDINARY
app.get('/api/plans', async (req, res) => { const r = await pool.query('SELECT id, projekt_nazev, nazev_souboru, cas FROM plans ORDER BY cas DESC'); res.json({ success: true, data: r.rows }); });
app.get('/api/plans/proj/:projekt', async (req, res) => { const r = await pool.query('SELECT id, projekt_nazev, nazev_souboru, cas FROM plans WHERE projekt_nazev = $1 ORDER BY cas DESC', [req.params.projekt]); res.json({ success: true, data: r.rows }); });
app.get('/api/plans/download/:id', async (req, res) => { const r = await pool.query('SELECT pdf_data, nazev_souboru FROM plans WHERE id = $1', [req.params.id]); res.json({ success: true, data: r.rows[0] }); });
app.post('/api/plans', async (req, res) => { 
    try { 
        // 1. Nahraje obří PDF do Cloudinary jako "raw" soubor
        const result = await cloudinary.uploader.upload(req.body.data, { resource_type: "raw", folder: "stavba_pro/vykresy", format: "pdf" });
        // 2. Do Neon databáze uloží opět jen link (pdf_data = secure_url)
        await pool.query('INSERT INTO plans (projekt_nazev, nazev_souboru, pdf_data) VALUES ($1, $2, $3)', [req.body.projekt, req.body.nazev, result.secure_url]); 
        res.json({ success: true }); 
    } catch(e) { console.log(e); res.status(500).json({ success: false }); } 
});

app.listen(3000, () => console.log('🚀 Backend jede, DB napojena, Cloudinary aktivní!'));

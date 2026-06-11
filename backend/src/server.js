import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import './db.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import accessRoutes from './routes/access.js';
import statsRoutes from './routes/stats.js';
import { requireAuth } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Permitir herramientas sin origen (curl, Postman, lector ESP32)
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Origen no permitido: ' + origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Health check (para Render/Fly/etc.)
app.get('/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// Rutas
app.use('/api/auth', authRoutes);

// Rutas protegidas con JWT
app.use('/api/users', requireAuth, usersRoutes);
app.use('/api/stats', requireAuth, statsRoutes);

// /api/access/scan usa token de dispositivo (no JWT) — montaje aparte
app.use('/api/access', accessRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno' });
});

app.listen(PORT, () => {
  console.log(`✓ SIPAV backend escuchando en http://localhost:${PORT}`);
  console.log(`  Health:  GET  /health`);
  console.log(`  Login:   POST /api/auth/login`);
  console.log(`  Escaneo: POST /api/access/scan (X-Device-Token)`);
});

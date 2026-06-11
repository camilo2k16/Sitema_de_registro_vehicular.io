import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });

  const { email, password } = parsed.data;
  const admin = db.prepare('SELECT id, email, name, role, password_hash FROM admins WHERE email = ?').get(email);
  if (!admin) return res.status(401).json({ error: 'Credenciales incorrectas' });

  if (!bcrypt.compareSync(password, admin.password_hash)) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = signToken({ sub: admin.id, email: admin.email, name: admin.name, role: admin.role });
  res.json({
    token,
    user: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  // requireAuth aplicado a nivel app; aquí solo devuelve los claims
  res.json({ user: req.user });
});

export default router;

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const UserSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  email: z.string().email().regex(/@ufps\.edu\.co$/i, 'Debe ser correo @ufps.edu.co'),
  role: z.enum(['Estudiante', 'Docente', 'Administrativo']),
  faculty: z.string().min(2),
  program: z.string().min(2),
  vehicle_type: z.enum(['Carro', 'Moto', 'Peatón']),
  plate: z.string().regex(/^[A-Z]{3}\d{3}$/).optional().nullable(),
  brand: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  rfid_uid: z.string().min(4),
  status: z.enum(['Activo', 'Inactivo']).default('Activo'),
}).superRefine((d, ctx) => {
  // Para vehículos: placa, marca y color son obligatorios
  if (d.vehicle_type !== 'Peatón') {
    if (!d.plate)  ctx.addIssue({ code: 'custom', path: ['plate'],  message: 'Requerido para vehículos' });
    if (!d.brand)  ctx.addIssue({ code: 'custom', path: ['brand'],  message: 'Requerido para vehículos' });
    if (!d.color)  ctx.addIssue({ code: 'custom', path: ['color'],  message: 'Requerido para vehículos' });
  }
});

// GET /api/users — listado con filtros opcionales
router.get('/', (req, res) => {
  const { q, role, vehicle_type, blocked } = req.query;
  let sql = 'SELECT * FROM users WHERE 1=1';
  const params = [];
  if (q) {
    sql += ' AND (name LIKE ? OR code LIKE ? OR plate LIKE ? OR rfid_uid LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (role) { sql += ' AND role = ?'; params.push(role); }
  if (vehicle_type) { sql += ' AND vehicle_type = ?'; params.push(vehicle_type); }
  if (blocked != null) { sql += ' AND blocked = ?'; params.push(blocked === 'true' ? 1 : 0); }
  sql += ' ORDER BY created_at DESC LIMIT 500';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/users/:id
router.get('/:id', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(u);
});

// GET /api/users/:id/stats — conteo de ingresos por día y semana
router.get('/:id/stats', (req, res) => {
  const u = db.prepare('SELECT id, code, name FROM users WHERE id = ?').get(req.params.id);
  if (!u) return res.status(404).json({ error: 'Usuario no encontrado' });

  const todayCount = db.prepare(
    `SELECT COUNT(*) AS n FROM access_logs
     WHERE user_id = ? AND status = 'Permitido'
       AND date(ts) = date('now', 'localtime')`
  ).get(u.id).n;

  const weekCount = db.prepare(
    `SELECT COUNT(*) AS n FROM access_logs
     WHERE user_id = ? AND status = 'Permitido'
       AND date(ts) >= date('now', '-6 days', 'localtime')`
  ).get(u.id).n;

  // Detalle por día (últimos 7 días)
  const byDay = db.prepare(
    `SELECT date(ts, 'localtime') AS day, COUNT(*) AS n
       FROM access_logs
      WHERE user_id = ? AND status = 'Permitido'
        AND date(ts) >= date('now', '-6 days', 'localtime')
      GROUP BY day
      ORDER BY day`
  ).all(u.id);

  res.json({ user: u, today: todayCount, week: weekCount, by_day: byDay });
});

// POST /api/users
router.post('/', requireAdmin, (req, res) => {
  const parsed = UserSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
  const d = parsed.data;
  try {
    const stmt = db.prepare(`
      INSERT INTO users (code, name, email, role, faculty, program, vehicle_type, plate, brand, color, rfid_uid, status)
      VALUES (@code, @name, @email, @role, @faculty, @program, @vehicle_type, @plate, @brand, @color, @rfid_uid, @status)
    `);
    const info = stmt.run({
      ...d,
      plate: d.plate || null,
      brand: d.brand || null,
      color: d.color || null,
    });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(user);
  } catch (e) {
    if (String(e.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Código, correo o UID ya registrados' });
    }
    res.status(500).json({ error: e.message });
  }
});

// PUT /api/users/:id
router.put('/:id', requireAdmin, (req, res) => {
  const parsed = UserSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten() });
  const d = parsed.data;
  const cols = Object.keys(d);
  if (!cols.length) return res.status(400).json({ error: 'Sin cambios' });
  const sets = cols.map((c) => `${c} = @${c}`).join(', ');
  const stmt = db.prepare(`UPDATE users SET ${sets} WHERE id = @id`);
  const info = stmt.run({ ...d, id: Number(req.params.id) });
  if (!info.changes) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
});

// PATCH /api/users/:id/block — bloquear/desbloquear
router.patch('/:id/block', requireAdmin, (req, res) => {
  const blocked = req.body.blocked ? 1 : 0;
  const status = blocked ? 'Inactivo' : 'Activo';
  const info = db.prepare('UPDATE users SET blocked = ?, status = ? WHERE id = ?').run(blocked, status, req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id));
});

// DELETE /api/users/:id
router.delete('/:id', requireAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true });
});

export default router;

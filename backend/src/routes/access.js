import { Router } from 'express';
import { db } from '../db.js';
import { requireDevice } from '../middleware/auth.js';

const router = Router();

const ENTRY_GATE = process.env.ENTRY_GATE || 'La Casona';

/**
 * POST /api/access/scan
 * Llamado por el lector RFID (ESP32) cada vez que detecta una tarjeta.
 * Body: { rfid_uid: "AA BB CC DD" }
 * Headers: X-Device-Token: <token compartido>
 *
 * Devuelve: { allowed, reason, user }  ← el ESP32 abre la barrera si allowed=true
 */
router.post('/scan', requireDevice, (req, res) => {
  const uid = String(req.body.rfid_uid || '').trim().toUpperCase();
  if (!uid) return res.status(400).json({ error: 'rfid_uid requerido' });

  const user = db.prepare('SELECT * FROM users WHERE rfid_uid = ?').get(uid);
  let allowed = false;
  let reason = null;

  if (!user) {
    reason = 'Tarjeta no registrada';
  } else if (user.blocked) {
    reason = 'Usuario bloqueado';
  } else if (user.status !== 'Activo') {
    reason = 'Usuario inactivo';
  } else {
    allowed = true;
  }

  // Registrar siempre el intento
  const info = db.prepare(`
    INSERT INTO access_logs (user_id, rfid_uid, gate, status, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(user?.id || null, uid, ENTRY_GATE, allowed ? 'Permitido' : 'Denegado', reason);

  res.json({
    allowed,
    reason,
    log_id: info.lastInsertRowid,
    user: user ? {
      id: user.id, code: user.code, name: user.name, role: user.role,
      vehicle_type: user.vehicle_type, plate: user.plate,
    } : null,
    gate: ENTRY_GATE,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/access/logs — historial con filtros
 * ?q=&status=&vehicle_type=&range=hoy|semana|todo&limit=&offset=
 */
router.get('/logs', (req, res) => {
  const { q, status, vehicle_type, range = 'todo', limit = 100, offset = 0 } = req.query;
  let sql = `
    SELECT a.*, u.code, u.name, u.role, u.vehicle_type, u.plate
      FROM access_logs a
      LEFT JOIN users u ON u.id = a.user_id
     WHERE 1=1
  `;
  const params = [];
  if (q) {
    sql += ' AND (u.name LIKE ? OR u.code LIKE ? OR u.plate LIKE ? OR a.rfid_uid LIKE ?)';
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  if (status) { sql += ' AND a.status = ?'; params.push(status); }
  if (vehicle_type) { sql += ' AND u.vehicle_type = ?'; params.push(vehicle_type); }
  if (range === 'hoy')    sql += " AND date(a.ts) = date('now', 'localtime')";
  if (range === 'semana') sql += " AND date(a.ts) >= date('now', '-6 days', 'localtime')";
  sql += ' ORDER BY a.ts DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));
  res.json(db.prepare(sql).all(...params));
});

/** Endpoint manual para registrar un ingreso sin pasar por el lector (rara vez) */
router.post('/manual', (req, res) => {
  const { user_id, status = 'Permitido', reason = null } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(user_id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const info = db.prepare(`
    INSERT INTO access_logs (user_id, rfid_uid, gate, status, reason)
    VALUES (?, ?, ?, ?, ?)
  `).run(user.id, user.rfid_uid, ENTRY_GATE, status, reason);
  res.status(201).json({ id: info.lastInsertRowid });
});

export default router;

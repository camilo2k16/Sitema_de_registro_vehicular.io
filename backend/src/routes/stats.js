import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

// GET /api/stats/dashboard — resumen para el panel principal
router.get('/dashboard', (req, res) => {
  const totalUsers = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  const newUsersWeek = db.prepare(
    `SELECT COUNT(*) AS n FROM users WHERE date(created_at) >= date('now', '-6 days')`
  ).get().n;
  const entriesToday = db.prepare(
    `SELECT COUNT(*) AS n FROM access_logs
      WHERE status = 'Permitido' AND date(ts) = date('now', 'localtime')`
  ).get().n;
  const deniedToday = db.prepare(
    `SELECT COUNT(*) AS n FROM access_logs
      WHERE status = 'Denegado' AND date(ts) = date('now', 'localtime')`
  ).get().n;
  const weekTotal = db.prepare(
    `SELECT COUNT(*) AS n FROM access_logs
      WHERE status = 'Permitido' AND date(ts) >= date('now', '-6 days', 'localtime')`
  ).get().n;

  // Distribución del día por tipo
  const byType = db.prepare(
    `SELECT u.vehicle_type AS type, COUNT(*) AS n
       FROM access_logs a JOIN users u ON u.id = a.user_id
      WHERE a.status = 'Permitido' AND date(a.ts) = date('now', 'localtime')
      GROUP BY u.vehicle_type`
  ).all();

  // Serie por día (últimos 7)
  const byDay = db.prepare(
    `SELECT date(ts, 'localtime') AS day, COUNT(*) AS n
       FROM access_logs
      WHERE status = 'Permitido'
        AND date(ts) >= date('now', '-6 days', 'localtime')
      GROUP BY day
      ORDER BY day`
  ).all();

  // Picos por hora (promedio últimas 30 entradas)
  const byHour = db.prepare(
    `SELECT strftime('%H', ts, 'localtime') AS hour, COUNT(*) AS n
       FROM access_logs
      WHERE status = 'Permitido' AND date(ts) >= date('now', '-30 days', 'localtime')
      GROUP BY hour ORDER BY hour`
  ).all();

  res.json({
    total_users: totalUsers,
    new_users_week: newUsersWeek,
    entries_today: entriesToday,
    denied_today: deniedToday,
    week_total: weekTotal,
    by_type: byType,
    by_day: byDay,
    by_hour: byHour,
  });
});

// GET /api/stats/faculties — usuarios por facultad
router.get('/faculties', (req, res) => {
  res.json(
    db.prepare('SELECT faculty, COUNT(*) AS n FROM users GROUP BY faculty ORDER BY n DESC').all()
  );
});

export default router;

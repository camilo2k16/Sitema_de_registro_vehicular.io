import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/** Middleware que exige JWT válido en Authorization: Bearer ... */
export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

/** Solo administradores pueden mutar */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Acceso solo para administradores' });
  next();
}

/** Middleware para el lector RFID — usa token compartido en X-Device-Token */
export function requireDevice(req, res, next) {
  const expected = process.env.RFID_DEVICE_TOKEN;
  const provided = req.headers['x-device-token'];
  if (!expected || provided !== expected) return res.status(401).json({ error: 'Dispositivo no autorizado' });
  next();
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '12h' });
}

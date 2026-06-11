import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db.js';

console.log('🌱 Sembrando base de datos…');

// ---- Admin inicial -----
const adminEmail = 'liliana@ufps.edu.co';
const adminPass = 'admin123';
const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(adminEmail);
if (!existing) {
  db.prepare('INSERT INTO admins (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(adminEmail, 'Liliana', bcrypt.hashSync(adminPass, 10), 'admin');
  console.log(`  ✓ Admin creado: ${adminEmail} / ${adminPass}`);
} else {
  console.log(`  · Admin ya existe: ${adminEmail}`);
}

// ---- Usuarios de ejemplo -----
const FACULTIES = {
  'Ingenierías': ['Ing. de Sistemas', 'Ing. Industrial', 'Ing. Civil', 'Ing. Electrónica'],
  'Ciencias Empresariales': ['Administración', 'Contaduría Pública', 'Economía'],
  'Salud': ['Enfermería'],
};
const VEH = ['Carro', 'Moto', 'Peatón'];
const COLORS = ['Blanco', 'Negro', 'Gris', 'Rojo', 'Azul'];
const BRANDS_CARRO = ['Chevrolet', 'Renault', 'Mazda', 'Kia', 'Toyota'];
const BRANDS_MOTO = ['Yamaha', 'AKT', 'Honda', 'Bajaj'];

const SAMPLE = [
  ['115101', 'Juan Pérez Quintero',  'Estudiante'],
  ['115202', 'María Camila Rojas',   'Estudiante'],
  ['115303', 'Carlos Andrés Mendoza','Estudiante'],
  ['115404', 'Laura Sofía Villamizar','Estudiante'],
  ['D1054',  'Dr. Ramón Ovalle',     'Docente'],
  ['D1078',  'Dra. Yolanda Pinzón',  'Docente'],
];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const randUid = () => Array.from({length:4}, () => Math.floor(Math.random()*256).toString(16).toUpperCase().padStart(2,'0')).join(' ');
const randPlate = () => {
  const L = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${L()}${L()}${L()}${String(Math.floor(Math.random()*900)+100)}`;
};

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (code, name, email, role, faculty, program, vehicle_type, plate, brand, color, rfid_uid, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Activo')
`);

for (const [code, name, role] of SAMPLE) {
  const fac = pick(Object.keys(FACULTIES));
  const program = pick(FACULTIES[fac]);
  const vt = pick(VEH);
  const isPed = vt === 'Peatón';
  const plate = isPed ? null : randPlate();
  const brand = isPed ? null : (vt === 'Moto' ? pick(BRANDS_MOTO) : pick(BRANDS_CARRO));
  const color = isPed ? null : pick(COLORS);
  const email = name.toLowerCase().replace(/[^a-z]/g,'').slice(0, 14) + '@ufps.edu.co';
  insertUser.run(code, name, email, role, fac, program, vt, plate, brand, color, randUid());
}

const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
console.log(`  ✓ Usuarios en la BD: ${userCount}`);

// ---- Logs de ejemplo (7 días) -----
const insertLog = db.prepare(`
  INSERT INTO access_logs (user_id, rfid_uid, gate, status, ts)
  VALUES (?, ?, 'La Casona', 'Permitido', ?)
`);
const users = db.prepare('SELECT id, rfid_uid FROM users').all();
const now = Date.now();
let logCount = 0;
for (let d = 0; d < 7; d++) {
  for (const u of users) {
    const n = Math.floor(Math.random() * 3); // 0-2 ingresos por día
    for (let k = 0; k < n; k++) {
      const ts = new Date(now - d*24*3600*1000 - Math.random()*10*3600*1000).toISOString();
      insertLog.run(u.id, u.rfid_uid, ts);
      logCount++;
    }
  }
}
console.log(`  ✓ Logs creados: ${logCount}`);

console.log('🌱 Listo.');

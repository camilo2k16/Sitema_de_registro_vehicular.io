/* Mock data — Sistema de registro vehicular UFPS (La Casona) */

const NAMES = [
  'Juan Pérez Quintero', 'María Camila Rojas', 'Carlos Andrés Mendoza', 'Laura Sofía Villamizar',
  'Andrés Felipe Cárdenas', 'Daniela Contreras', 'Sergio Alberto Suárez', 'Valentina Pabón',
  'Diego Armando Salazar', 'Natalia Quintero', 'Jorge Iván Bautista', 'Paula Andrea Ortega',
  'Mateo Jaimes', 'Isabella Duarte', 'Felipe Restrepo', 'Camila Becerra',
  'Ricardo Téllez', 'Manuela Galvis', 'Esteban Niño', 'Sara Lucía Carrillo',
  'Dr. Ramón Ovalle', 'Dra. Yolanda Pinzón', 'Prof. Hernán Castro', 'Mg. Patricia Ríos',
];

const FACULTIES = [
  'Ingenierías', 'Ciencias Empresariales', 'Educación, Artes y Humanidades',
  'Ciencias Agrarias y del Ambiente', 'Salud',
];

const PROGRAMS = {
  'Ingenierías': ['Ing. de Sistemas', 'Ing. Industrial', 'Ing. Civil', 'Ing. Electrónica', 'Ing. Mecánica'],
  'Ciencias Empresariales': ['Administración', 'Contaduría Pública', 'Economía', 'Comercio Internacional'],
  'Educación, Artes y Humanidades': ['Comunicación Social', 'Lic. Matemáticas', 'Arquitectura'],
  'Ciencias Agrarias y del Ambiente': ['Ing. Ambiental', 'Ing. Agroindustrial', 'Ing. Biotecnológica'],
  'Salud': ['Enfermería'],
};

const VEH_TYPES = ['Carro', 'Moto', 'Peatón'];
const CAR_BRANDS = ['Chevrolet', 'Renault', 'Mazda', 'Kia', 'Hyundai', 'Toyota', 'Nissan'];
const MOTO_BRANDS = ['Yamaha', 'AKT', 'Honda', 'Bajaj', 'Suzuki', 'Kawasaki'];
const COLORS_LIST = ['Blanco', 'Negro', 'Gris', 'Rojo', 'Azul', 'Plata'];

const ENTRY_GATE = 'La Casona';

const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const pad = (n, w = 2) => String(n).padStart(w, '0');

const randPlate = () => {
  const L = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return `${L()}${L()}${L()}${pad(Math.floor(Math.random()*900)+100, 3)}`;
};
const randCode = () => `${1100 + Math.floor(Math.random() * 800)}${pad(Math.floor(Math.random()*99),2)}`;
const randUid = () => {
  const hex = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
  return `${hex()} ${hex()} ${hex()} ${hex()}`;
};

const buildUsers = () => {
  // Type distribution: ~38% Carro, ~38% Moto, ~24% Peatón
  const typePool = ['Carro','Carro','Carro','Moto','Moto','Moto','Peatón','Peatón'];
  const users = NAMES.map((name, i) => {
    const role = i >= 20 ? 'Docente' : (i % 7 === 0 ? 'Administrativo' : 'Estudiante');
    const fac = randPick(FACULTIES);
    const type = typePool[i % typePool.length];
    const isPed = type === 'Peatón';
    const brand = isPed ? '' : (type === 'Moto' ? randPick(MOTO_BRANDS) : randPick(CAR_BRANDS));
    return {
      id: i + 1,
      code: role === 'Estudiante' ? randCode() : 'D' + (1000 + i),
      name,
      email: name.toLowerCase().replace(/[^a-z\s]/g, '').replace(/\s+/g, '.').slice(0, 22) + '@ufps.edu.co',
      faculty: fac,
      program: randPick(PROGRAMS[fac]),
      role,
      vehicleType: type,
      plate: isPed ? '' : randPlate(),
      brand,
      color: isPed ? '' : randPick(COLORS_LIST),
      uid: randUid(),
      status: i === 3 || i === 11 ? 'Inactivo' : 'Activo',
      blocked: i === 3 || i === 11,
    };
  });
  return users;
};

/* Build a 7-day access log with multiple entries per user per day. */
const buildAccessLog = (users) => {
  const log = [];
  const now = new Date();
  let serial = 1000;

  for (let d = 0; d < 7; d++) {
    // d=0 is today, d=6 is six days ago
    users.forEach((u) => {
      // Active users come in more often; inactive almost never
      const lambda = u.status === 'Activo' ? (u.role === 'Estudiante' ? 1.8 : 1.2) : 0.15;
      const entries = Math.min(4, Math.floor(Math.random() * (lambda * 1.6)));
      for (let k = 0; k < entries; k++) {
        const base = new Date(now);
        base.setDate(now.getDate() - d);
        // Spread across the working day
        const hour = 6 + Math.floor(Math.random() * 14);
        const minute = Math.floor(Math.random() * 60);
        base.setHours(hour, minute, Math.floor(Math.random() * 60), 0);
        // Today: only include entries up to "now"
        if (d === 0 && base > now) continue;

        const allowed = u.status === 'Activo' && Math.random() > 0.04;
        log.push({
          id: 'L' + (serial++),
          time: base,
          code: u.code,
          name: u.name,
          role: u.role,
          plate: u.plate,
          vehicleType: u.vehicleType,
          uid: u.uid,
          status: allowed ? 'Permitido' : 'Denegado',
          reason: allowed ? null : (u.blocked ? 'Usuario bloqueado' : 'RFID inválido'),
          gate: ENTRY_GATE,
        });
      }
    });
  }
  return log.sort((a, b) => b.time - a.time);
};

const INITIAL_USERS = buildUsers();
const INITIAL_LOG = buildAccessLog(INITIAL_USERS);

/* Live counts derived from log */
const todayCount = INITIAL_LOG.filter((r) => {
  const d = new Date();
  return r.time.toDateString() === d.toDateString() && r.status === 'Permitido';
}).length;
const deniedToday = INITIAL_LOG.filter((r) => {
  const d = new Date();
  return r.time.toDateString() === d.toDateString() && r.status === 'Denegado';
}).length;

const DASHBOARD_STATS = {
  vehiclesInside: 142,
  capacity: 200,
  totalUsers: INITIAL_USERS.length,
  newUsersWeek: 6,
  entriesToday: todayCount,
  deniedToday,
  freeSpaces: 58,
};

/* Hourly distribution for bar chart (24h) — peak morning + midday */
const HOURLY = [0,0,0,0,2,8,32,86,72,44,30,26,24,30,38,52,64,72,40,18,8,4,2,0];

/* Vehicle type distribution — Carro / Moto / Peatón only */
const VEH_DIST = [
  { label: 'Carros',   value: 64, color: '#e30613' },
  { label: 'Motos',    value: 58, color: '#1f5fae' },
  { label: 'Peatones', value: 42, color: '#117a4a' },
];

Object.assign(window, {
  INITIAL_USERS, INITIAL_LOG, DASHBOARD_STATS, HOURLY, VEH_DIST,
  FACULTIES, PROGRAMS, VEH_TYPES, CAR_BRANDS, MOTO_BRANDS, COLORS_LIST,
  ENTRY_GATE, randUid, randPlate, randCode,
});

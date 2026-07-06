/* Catálogos reales — Sistema de registro vehicular UFPS (La Casona)
   Aquí NO hay datos de ejemplo: solo las listas que usa el formulario
   de registro (facultades, programas, tipos de vehículo, marcas, colores). */

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

const ENTRY_GATE = window.ENTRY_GATE || 'La Casona';

/* Colores para la distribución por tipo de vehículo (gráficas) */
const VEH_COLORS = { 'Carro': '#e30613', 'Moto': '#1f5fae', 'Peatón': '#117a4a' };

/* Calcula los ingresos por hora (0–23) a partir del historial REAL */
function hourlyFromLog(log, onlyToday) {
  const counts = Array.from({ length: 24 }, () => 0);
  const todayStr = new Date().toDateString();
  log.forEach((r) => {
    if (r.status !== 'Permitido') return;
    if (onlyToday && r.time.toDateString() !== todayStr) return;
    counts[r.time.getHours()]++;
  });
  return counts;
}

Object.assign(window, {
  FACULTIES, PROGRAMS, VEH_TYPES, CAR_BRANDS, MOTO_BRANDS, COLORS_LIST,
  ENTRY_GATE, VEH_COLORS, hourlyFromLog,
});

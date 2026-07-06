/* ════════════════════════════════════════════════════════════════════
   CONFIGURACIÓN DE FIREBASE
   ────────────────────────────────────────────────────────────────────
   Pega aquí los datos de tu proyecto de Firebase.
   Mientras "databaseURL" esté vacío, el sistema funciona en modo LOCAL
   (guarda en el navegador). Cuando lo llenes, usará la base en la nube
   y el hardware ESP32 podrá leer/escribir los mismos datos.

   Cómo obtenerlos (todo en el navegador, sin consola):
   1. Entra a  https://console.firebase.google.com  → "Crear proyecto"
   2. Menú izquierdo → "Realtime Database" → "Crear base de datos"
      → ubicación → empezar en "modo de prueba"
   3. Engranaje ⚙ (Configuración del proyecto) → "Tus apps" → ícono </>
      → registra una app web → copia el objeto firebaseConfig aquí abajo.
   ════════════════════════════════════════════════════════════════════ */

window.FIREBASE_CONFIG = {
  databaseURL: "https://sipav-ufps-default-rtdb.firebaseio.com",
  projectId: "sipav-ufps"
};

/* Punto de entrada del campus (se guarda en cada registro de acceso) */
window.ENTRY_GATE = "La Casona";

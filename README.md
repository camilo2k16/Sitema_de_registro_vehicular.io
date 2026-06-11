# 🚗 Sistema de Registro Vehicular UFPS — Guía completa (sin consola)

Sistema de control de acceso por **RFID** para la entrada **La Casona**.
Todo se sube y configura **desde el navegador** — no necesitas usar la terminal.

```
┌─────────────────┐   lee/escribe   ┌──────────────────────┐   lee/escribe   ┌─────────────────┐
│  Página web      │ ◄────────────► │  Firebase Realtime    │ ◄────────────► │  ESP32 + RC522   │
│  (GitHub Pages)  │   tiempo real  │  Database (gratis)    │   HTTPS REST   │  en La Casona    │
└─────────────────┘                └──────────────────────┘                └─────────────────┘
```

- **Frontend:** GitHub Pages (gratis, estático)
- **Base de datos:** Firebase Realtime Database (gratis, sin servidor)
- **Hardware:** ESP32 + lector RC522 → consulta y registra directo en Firebase

> 💡 Si abres la página **sin** configurar Firebase, funciona igual pero guarda
> los datos solo en tu navegador (modo local, ideal para probar). El hardware
> necesita Firebase para compartir los datos.

---

## PARTE 1 · Subir el proyecto a GitHub (desde el navegador)

1. Entra a **https://github.com** e inicia sesión (o crea cuenta gratis).
2. Arriba a la derecha **➕ → New repository**.
   - Repository name: `sistema-registro-vehicular` (o el que quieras)
   - Público ✅ · **Create repository**.
3. En la página del repo vacío, haz clic en **“uploading an existing file”**
   (enlace azul en el centro).
4. **Arrastra TODOS los archivos y carpetas** de este proyecto a la ventana
   (incluye `index.html`, `SIPAV-UFPS.html`, los `.jsx`, `.css`, `.js`,
   `assets/`, `hardware/`, `.nojekyll`).
   - Si tu navegador no deja arrastrar carpetas, usa **“choose your files”**
     y selecciónalos todos; sube `assets/` y `hardware/` por separado con
     **Add file → Upload files** repitiendo el paso.
5. Abajo, botón verde **Commit changes**.

### Activar GitHub Pages
6. En el repo: **Settings** (engranaje) → menú izquierdo **Pages**.
7. En **Source** elige **Deploy from a branch**.
8. Branch: **main** · carpeta: **/ (root)** → **Save**.
9. Espera ~1 minuto y recarga. Aparecerá:
   **“Your site is live at `https://TU-USUARIO.github.io/sistema-registro-vehicular/`”**

✅ Esa es la URL de tu sistema. Ya funciona (en modo local).

---

## PARTE 2 · Crear la base de datos gratis (Firebase)

1. Entra a **https://console.firebase.google.com** con tu cuenta Google.
2. **Crear un proyecto** → nombre `sipav-ufps` → continuar (puedes desactivar
   Google Analytics) → **Crear proyecto**.
3. Menú izquierdo → **Compilación → Realtime Database** → **Crear base de datos**.
   - Ubicación: la que sugiera (ej. *us-central1*).
   - **Empezar en modo de prueba** → Habilitar.
   - *(Modo de prueba = lectura/escritura abierta por 30 días, suficiente para
     arrancar. Más abajo te digo cómo dejarlo seguro.)*
4. Arriba verás la **URL de la base**, algo como:
   `https://sipav-ufps-default-rtdb.firebaseio.com` → **cópiala**.
5. Engranaje ⚙ (**Configuración del proyecto**) → pestaña **General** →
   baja a **Tus apps** → ícono **`</>`** (Web) → registra la app (un nombre
   cualquiera) → te muestra un bloque `firebaseConfig` → **cópialo**.

### Pega la config en el proyecto (desde GitHub, sin consola)
6. En tu repo de GitHub abre el archivo **`firebase-config.js`** → ícono del
   **lápiz ✏ (Edit)**.
7. Reemplaza los valores vacíos por los de tu `firebaseConfig`. Lo
   **imprescindible** es `databaseURL` (la URL del paso 4). Ejemplo:
   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "sipav-ufps.firebaseapp.com",
     databaseURL: "https://sipav-ufps-default-rtdb.firebaseio.com",
     projectId: "sipav-ufps",
     storageBucket: "sipav-ufps.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234:web:abcd"
   };
   ```
8. **Commit changes**. En ~1 min tu página ya estará conectada a la nube.
   (En **Configuración** dentro del sistema verás “Conectado a la nube”.)

---

## PARTE 3 · El hardware (ESP32 + RC522)

### Cableado
```
   ESP32            RC522
   ───────────────────────
   3.3V    ───────► 3.3V        ⚠ NO uses 5V, el RC522 es de 3.3V
   GND     ───────► GND
   GPIO 5  ───────► SDA (SS)
   GPIO 18 ───────► SCK
   GPIO 23 ───────► MOSI
   GPIO 19 ───────► MISO
   GPIO 22 ───────► RST

   GPIO 26 ───────► IN del módulo relé → motor/electroimán de la barrera
   GPIO 14 ───────► LED verde  (+resistencia 220Ω)
   GPIO 27 ───────► LED rojo   (+resistencia 220Ω)
   GPIO 25 ───────► buzzer (opcional)
```

### Programar
1. Instala el **IDE de Arduino** y el soporte para **ESP32**
   (Gestor de tarjetas → "esp32 by Espressif").
2. Gestor de **librerías** → instala **MFRC522** y **ArduinoJson**.
3. Abre `hardware/sipav_esp32_firebase.ino`.
4. Cambia arriba:
   - `WIFI_SSID` y `WIFI_PASSWORD` → tu red.
   - `DB_URL` → la **misma** `databaseURL` de Firebase (sin barra final).
5. Selecciona placa **ESP32 Dev Module** y el puerto → **Subir**.
6. Abre el **Monitor Serie** (115200 baudios) para ver las lecturas.

---

## PARTE 4 · Cómo funciona el flujo completo

### Registrar un usuario y asignar su tarjeta
1. En la web ve a **Registrar usuario** y llena los datos.
2. En el campo **UID de la tarjeta** pulsa **“Escanear ahora”**.
3. Acerca la **tarjeta nueva** al lector de La Casona.
4. El ESP32 ve que no está registrada → la manda a Firebase (`/enroll`) →
   **el UID aparece solo en el formulario**. Pulsa **Registrar**.
   *(Sin hardware todavía: “Escanear ahora” genera un UID de prueba.)*

### Ingreso normal
1. El usuario acerca su tarjeta.
2. El ESP32 consulta Firebase: ¿existe?, ¿está activa?, ¿no bloqueada?
3. Si todo OK → **registra el ingreso** y **abre la barrera** (LED verde).
   Si no → LED rojo y queda el intento en el historial.
4. En la web, **Monitoreo en vivo**, **Historial** y **Usuarios** se actualizan
   solos en tiempo real.

---

## PARTE 5 · Dejar la base de datos segura (recomendado tras probar)

El "modo de prueba" caduca a los 30 días. Para uso real, en
**Realtime Database → Reglas** pon algo como esto (lectura pública, escritura
controlada por una clave en el dispositivo es más avanzado; lo más simple para
un proyecto académico es exigir que la web tenga autenticación). Para empezar y
no bloquearte, puedes extender el modo de prueba con:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> ⚠️ Esto deja la base abierta a quien tenga la URL. Para un sistema en
> producción, conviene añadir autenticación de Firebase a la web y reglas por
> usuario. Para una demo / trabajo de grado, las reglas de arriba sirven.

---

## Resumen de costos: **$0 / mes**

| Servicio | Plan gratis | Límite |
|---|---|---|
| GitHub Pages | Free | Sitios estáticos ilimitados |
| Firebase Realtime DB | Spark (free) | 1 GB almacenado · 10 GB/mes descarga |
| Hardware | — | Tu ESP32 + RC522 |

Más que suficiente para miles de usuarios y cientos de ingresos diarios.

---

### Archivos clave
| Archivo | Qué es |
|---|---|
| `index.html` | Redirige a la app (entrada de GitHub Pages) |
| `SIPAV-UFPS.html` | La aplicación |
| `firebase-config.js` | **Aquí pegas tu config de Firebase** |
| `store.js` | Capa de datos (Firebase + respaldo local) |
| `hardware/sipav_esp32_firebase.ino` | Firmware del ESP32 |
| `backend/` | *(Opcional)* servidor Node alternativo si no quieres Firebase |

---
**Universidad Francisco de Paula Santander · Uso académico.**

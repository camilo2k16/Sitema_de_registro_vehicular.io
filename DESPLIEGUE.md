# SIPAV-UFPS · Despliegue gratuito

Resumen ejecutivo de cómo subir el sistema completo **sin pagar nada**.

## La pila más simple

```
                                  ┌─────────────────────────┐
   Usuario (navegador)  ─────────►│  Frontend en Netlify    │
                                  │  (HTML + JSX estáticos) │
                                  └────────────┬────────────┘
                                               │ fetch /api/*
                                               ▼
                                  ┌─────────────────────────┐
                                  │  Backend en Render      │
                                  │  Node + Express         │
                                  │  + SQLite (o Supabase)  │
                                  └────────────┬────────────┘
                                               ▲ POST /api/access/scan
                                               │ X-Device-Token
                                  ┌────────────┴────────────┐
                                  │  ESP32 + MFRC522        │
                                  │  en la portería La Casona│
                                  └─────────────────────────┘
```

## 1️⃣ Frontend — **Netlify** (más fácil)

1. Entra a https://app.netlify.com → **Sites** → arrastra la carpeta del proyecto entera.
2. Listo. URL: `https://sipav-ufps.netlify.app`.
3. Para futuros cambios, conecta el repo de GitHub y se redespliega automáticamente.

Alternativas equivalentes:
- **GitHub Pages** (https://pages.github.com) — gratis, ideal si ya usas GitHub.
- **Cloudflare Pages** — gratis ilimitado, CDN mundial.
- **Vercel** — gratis para hobby.

## 2️⃣ Backend — **Render** (Node.js)

1. Sube este proyecto a GitHub (carpeta `backend/` incluida).
2. https://render.com → **New → Web Service** → conecta el repo.
3. Configura:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `node src/server.js`
   - **Plan:** Free
4. **Environment Variables** (mismas que `.env.example`):
   - `JWT_SECRET` ← genera uno largo (`openssl rand -hex 32`)
   - `RFID_DEVICE_TOKEN` ← otro aleatorio
   - `CORS_ORIGINS` ← la URL de Netlify
5. Deploy. URL: `https://sipav-backend.onrender.com`.

⚠️ El plan free de Render duerme tras 15 min. La primera petición tarda ~30s en despertarlo. Para evitarlo:
- Pingéalo con **UptimeRobot** (gratis, cada 5 min al endpoint `/health`).
- O usa **Fly.io** (3 VMs gratis siempre activas).

## 3️⃣ Base de datos

### Opción rápida — **SQLite en Fly.io**
Mejor para TFG / demo. Persiste sin pagar. Sigue las instrucciones en `backend/README.md` → Opción B.

### Opción robusta — **Supabase Postgres** (gratis 500 MB)
1. https://supabase.com → New project.
2. Copia la **Connection string** del proyecto.
3. Reemplaza `better-sqlite3` por `pg` en `backend/src/db.js`:
   ```js
   import { Pool } from 'pg';
   export const db = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
   ```
4. Ajusta las queries (`?` → `$1, $2…`).
5. En Render → Environment → agrega `DATABASE_URL`.

## 4️⃣ Conectar el frontend al backend

En `SIPAV-UFPS.html`, agrega al inicio del `<head>`:
```html
<script>window.API_URL = "https://sipav-backend.onrender.com";</script>
```

Y en cada `fetch`:
```js
const res = await fetch(`${window.API_URL}/api/users`, {
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});
```

(Dímelo cuando estés en este paso y te conecto los componentes a los endpoints.)

## 5️⃣ Hardware — ESP32 + MFRC522

El microcontrolador hace una sola cosa: lee el UID, lo manda al backend, abre el relé si `allowed=true`:

```cpp
// pseudocódigo Arduino
String uid = leerTarjeta();
HTTPClient http;
http.begin("https://sipav-backend.onrender.com/api/access/scan");
http.addHeader("X-Device-Token", DEVICE_TOKEN);
http.addHeader("Content-Type", "application/json");
int code = http.POST("{\"rfid_uid\":\"" + uid + "\"}");
String body = http.getString();
if (body.indexOf("\"allowed\":true") > 0) abrirBarrera();
```

---

## Costos totales: **$0 / mes**

| Servicio | Plan | Límite |
|---|---|---|
| Netlify (frontend) | Free | 100 GB/mes de tráfico |
| Render (backend) | Free | 750 h/mes (sleeps tras 15 min) |
| Supabase (DB opcional) | Free | 500 MB, 50.000 usuarios |
| GitHub | Free | Repos ilimitados |
| UptimeRobot | Free | 50 monitores |

Suficiente para varios cientos de ingresos diarios y miles de usuarios registrados.

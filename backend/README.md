# SIPAV-UFPS · Backend

Backend del **Sistema de Registro Vehicular UFPS** (entrada La Casona).
Stack: **Node.js + Express + SQLite + JWT**.

---

## 1. Estructura

```
backend/
├── src/
│   ├── server.js          ← entrada
│   ├── db.js              ← conexión SQLite
│   ├── schema.sql         ← esquema
│   ├── seed.js            ← admin + datos de ejemplo
│   ├── middleware/auth.js ← JWT + token de dispositivo
│   └── routes/
│       ├── auth.js        ← login admin
│       ├── users.js       ← CRUD usuarios + bloqueo
│       ├── access.js      ← escaneo RFID + historial
│       └── stats.js       ← dashboard
├── Dockerfile
├── package.json
└── .env.example
```

---

## 2. Correr localmente

```bash
cd backend
cp .env.example .env       # edita JWT_SECRET y RFID_DEVICE_TOKEN
npm install
npm run seed               # crea admin + datos demo
npm run dev                # escucha en :4000
```

Login de prueba:
- **Usuario:** `liliana@ufps.edu.co`
- **Clave:** `admin123`

---

## 3. Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST`   | `/api/auth/login`         | público   | Login del administrador |
| `GET`    | `/api/users`              | JWT       | Lista usuarios (filtros: `q`, `role`, `vehicle_type`, `blocked`) |
| `GET`    | `/api/users/:id`          | JWT       | Detalle de un usuario |
| `GET`    | `/api/users/:id/stats`    | JWT       | **Ingresos hoy + semana + por día** |
| `POST`   | `/api/users`              | JWT admin | Registrar usuario nuevo |
| `PUT`    | `/api/users/:id`          | JWT admin | Editar |
| `PATCH`  | `/api/users/:id/block`    | JWT admin | Bloquear / desbloquear |
| `DELETE` | `/api/users/:id`          | JWT admin | Eliminar |
| `POST`   | `/api/access/scan`        | **Device token** | El ESP32 manda el UID y responde si permite el paso |
| `GET`    | `/api/access/logs`        | JWT       | Historial (`q`, `status`, `vehicle_type`, `range`, `limit`) |
| `GET`    | `/api/stats/dashboard`    | JWT       | Datos para el panel principal |
| `GET`    | `/api/stats/faculties`    | JWT       | Usuarios por facultad |

### Ejemplo: ESP32 escaneando una tarjeta

```http
POST /api/access/scan
X-Device-Token: token-del-lector-esp32-la-casona
Content-Type: application/json

{ "rfid_uid": "A1 B2 C3 D4" }
```

Respuesta:
```json
{
  "allowed": true,
  "reason": null,
  "user": { "id": 1, "name": "Juan Pérez", "vehicle_type": "Carro", "plate": "ABC123" },
  "gate": "La Casona",
  "timestamp": "2026-05-20T13:42:11.000Z"
}
```

Si `allowed = true` el ESP32 abre la barrera.

---

## 4. 🚀 Dónde montarlo **gratis**

### Opción A — Recomendada (todo gratis, sin tarjeta de crédito)

| Componente | Servicio | Plan | Notas |
|---|---|---|---|
| **Frontend** (HTML) | **Netlify** o **GitHub Pages** o **Cloudflare Pages** | Gratis ilimitado | Arrastras la carpeta o conectas un repo |
| **Backend** (API) | **Render.com** — Web Service | Gratis (750 h/mes) | Se "duerme" tras 15 min sin uso y despierta en ~30s |
| **Base de datos** | **SQLite** en disco de Render | — | Disco persistente: **el plan free de Render no lo tiene**. Pasar a Postgres ↓ |
| **Base de datos** (alterna) | **Supabase** o **Neon** — Postgres | Gratis (500 MB / 0.5 GB) | No se duerme · ideal si necesitas persistencia real |

**Pasos en Render:**
1. Sube el repo a GitHub.
2. En Render → *New Web Service* → conecta el repo → carpeta `backend/`.
3. Build command: `npm install` · Start command: `node src/server.js`.
4. Variables de entorno: copia las de `.env.example` (cambia `JWT_SECRET` y `RFID_DEVICE_TOKEN`).
5. Listo. URL: `https://sipav-backend.onrender.com`.

### Opción B — **Fly.io** (mantiene SQLite con disco persistente, gratis)

1. Instala `flyctl`, corre `fly launch` en `backend/`.
2. `fly volumes create sipav_data --size 1` (1 GB gratis).
3. En `fly.toml`: `[mounts] source="sipav_data" destination="/data"`.
4. `fly deploy`.

Ventaja: SQLite persiste, no se duerme tan agresivamente, 3 VMs gratis siempre.

### Opción C — **Vercel + Supabase** (serverless)

- Frontend en **Vercel** (mismo proyecto).
- Backend convertido a *serverless functions* en `/api/*` (requiere refactor menor).
- DB en **Supabase Postgres** (gratis).
- Pros: nunca se duerme, escala infinito. Contras: necesitas reescribir las queries a Postgres.

### 🎯 Camino más sencillo para arrancar

```
Frontend → Netlify (drag-and-drop la carpeta del proyecto)
Backend  → Render (apunta a /backend)
DB       → SQLite local del backend (suficiente para demo / TFG)
```

Cuando la base crezca, migra a **Supabase Postgres** sin tocar las rutas (cambias `better-sqlite3` por `pg` en `db.js`).

---

## 5. Próximos pasos

- [ ] Conectar el frontend (`SIPAV-UFPS.html`) al backend reemplazando los datos mock por `fetch` a `/api/*`.
- [ ] Programar el ESP32 con MFRC522 para mandar `POST /api/access/scan` y abrir la barrera con el relé según `allowed`.
- [ ] (Opcional) Generar reportes PDF con `pdfkit` desde `/api/access/logs`.

---

**Licencia:** Uso académico — Universidad Francisco de Paula Santander.

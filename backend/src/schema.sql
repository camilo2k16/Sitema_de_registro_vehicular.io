-- Sistema de Registro Vehicular UFPS — Esquema SQLite
-- Punto de entrada único: La Casona

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'admin',  -- admin | viewer
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL UNIQUE,              -- Código institucional
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,              -- @ufps.edu.co
  role          TEXT NOT NULL,                     -- Estudiante | Docente | Administrativo
  faculty       TEXT NOT NULL,
  program       TEXT NOT NULL,
  vehicle_type  TEXT NOT NULL CHECK (vehicle_type IN ('Carro','Moto','Peatón')),
  plate         TEXT,                              -- Nulo para Peatón
  brand         TEXT,
  color         TEXT,
  rfid_uid      TEXT NOT NULL UNIQUE,              -- UID de la tarjeta
  status        TEXT NOT NULL DEFAULT 'Activo',    -- Activo | Inactivo
  blocked       INTEGER NOT NULL DEFAULT 0,        -- 0/1
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_rfid ON users(rfid_uid);
CREATE INDEX IF NOT EXISTS idx_users_plate ON users(plate);
CREATE INDEX IF NOT EXISTS idx_users_blocked ON users(blocked);

CREATE TABLE IF NOT EXISTS access_logs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER,                           -- nulo si UID desconocido
  rfid_uid      TEXT NOT NULL,
  gate          TEXT NOT NULL DEFAULT 'La Casona',
  status        TEXT NOT NULL CHECK (status IN ('Permitido','Denegado')),
  reason        TEXT,                              -- razón del rechazo (si aplica)
  ts            TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_ts ON access_logs(ts);
CREATE INDEX IF NOT EXISTS idx_logs_status ON access_logs(status);

-- Trigger para mantener users.updated_at
CREATE TRIGGER IF NOT EXISTS trg_users_updated
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

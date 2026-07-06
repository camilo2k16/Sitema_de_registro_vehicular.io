/* ════════════════════════════════════════════════════════════════════
   store.js  —  Capa de datos del Sistema de Registro Vehicular UFPS
   ────────────────────────────────────────────────────────────────────
   Expone window.DB con una API simple usada por toda la app React.

   Dos modos automáticos:
     • FIREBASE  — si firebase-config.js tiene databaseURL.
                   Datos en la nube, compartidos con el hardware ESP32.
     • LOCAL     — si no hay config. Guarda en localStorage del navegador
                   (perfecto para probar la interfaz sin montar nada).

   Modelo de datos en Firebase Realtime Database:
     /users/{UIDKEY}   = { code, name, email, role, faculty, program,
                           vehicleType, plate, brand, color, uid,
                           status, blocked, createdAt }
     /logs/{pushId}    = { uid, code, name, role, plate, vehicleType,
                           status, reason, gate, ts }
     /enroll           = { uid, ts }   ← última tarjeta leída para registrar

   UIDKEY = el UID en mayúsculas y sin espacios (ej. "A1 B2 C3 D4" → "A1B2C3D4")
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var cfg = window.FIREBASE_CONFIG || {};
  var hasFirebase = !!(cfg.databaseURL && cfg.databaseURL.trim() && typeof firebase !== 'undefined');

  var state = {
    mode: hasFirebase ? 'firebase' : 'local',
    users: [],
    logs: [],
    fb: null,
  };

  var userSubs = new Set();
  var logSubs = new Set();
  var initialized = false;

  // ---------- helpers ----------
  function uidKey(uid) {
    return String(uid || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }
  function normalizeUser(u) {
    var key = uidKey(u.uid);
    return Object.assign({}, u, {
      id: key,
      uid: u.uid,
      blocked: !!u.blocked,
      status: u.status || 'Activo',
      createdAt: u.createdAt || Date.now(),
    });
  }
  function normalizeLog(l, id) {
    var ts = l.ts != null ? l.ts : (l.time instanceof Date ? l.time.getTime() : Date.now());
    return {
      id: id || l.id || ('L' + ts + Math.random().toString(36).slice(2, 6)),
      time: new Date(ts),
      ts: ts,
      uid: l.uid || '',
      code: l.code || '',
      name: l.name || 'Desconocido',
      role: l.role || '',
      plate: l.plate || '',
      vehicleType: l.vehicleType || '',
      status: l.status || 'Permitido',
      reason: l.reason || null,
      gate: l.gate || window.ENTRY_GATE || 'La Casona',
    };
  }
  function emitUsers() { var snap = state.users.slice(); userSubs.forEach(function (cb) { cb(snap); }); }
  function emitLogs() {
    state.logs.sort(function (a, b) { return b.ts - a.ts; });
    var snap = state.logs.slice(0, 500);
    logSubs.forEach(function (cb) { cb(snap); });
  }

  // ---------- localStorage persistence ----------
  var LS_USERS = 'sipav.users.v1';
  var LS_LOGS = 'sipav.logs.v1';
  function lsLoad() {
    try {
      var u = JSON.parse(localStorage.getItem(LS_USERS) || 'null');
      var l = JSON.parse(localStorage.getItem(LS_LOGS) || 'null');
      if (u) state.users = u.map(normalizeUser);
      if (l) state.logs = l.map(function (x) { return normalizeLog(x); });
      return !!(u && l);
    } catch (e) { return false; }
  }
  function lsSaveUsers() { try { localStorage.setItem(LS_USERS, JSON.stringify(state.users)); } catch (e) {} }
  function lsSaveLogs() {
    try { localStorage.setItem(LS_LOGS, JSON.stringify(state.logs.slice(0, 500).map(function (l) {
      return { id: l.id, ts: l.ts, uid: l.uid, code: l.code, name: l.name, role: l.role, plate: l.plate, vehicleType: l.vehicleType, status: l.status, reason: l.reason, gate: l.gate };
    }))); } catch (e) {}
  }

  // ════════════════════════════════════════════════════════════
  //  INIT
  // ════════════════════════════════════════════════════════════
  function init(opts) {
    if (initialized) return;
    initialized = true;
    opts = opts || {};

    if (state.mode === 'firebase') {
      try {
        firebase.initializeApp(cfg);
        state.fb = firebase.database();
        console.log('%c[SIPAV] Conectado a Firebase: ' + cfg.databaseURL, 'color:#117a4a');

        state.fb.ref('users').on('value', function (snap) {
          var val = snap.val() || {};
          state.users = Object.keys(val).map(function (k) { return normalizeUser(val[k]); });
          emitUsers();
        });
        state.fb.ref('logs').on('value', function (snap) {
          var val = snap.val() || {};
          state.logs = Object.keys(val).map(function (k) { return normalizeLog(val[k], k); });
          emitLogs();
        });
      } catch (e) {
        console.error('[SIPAV] Error iniciando Firebase, usando modo local:', e);
        state.mode = 'local';
      }
    }

    if (state.mode === 'local') {
      console.log('%c[SIPAV] Modo LOCAL (navegador). Configura firebase-config.js para usar la nube + hardware.', 'color:#b25e00');
      lsLoad();
      emitUsers(); emitLogs();
    }
  }

  // ════════════════════════════════════════════════════════════
  //  SUSCRIPCIONES
  // ════════════════════════════════════════════════════════════
  function onUsers(cb) { userSubs.add(cb); cb(state.users.slice()); return function () { userSubs.delete(cb); }; }
  function onLogs(cb) { logSubs.add(cb); emitLogsTo(cb); return function () { logSubs.delete(cb); }; }
  function emitLogsTo(cb) { state.logs.sort(function (a, b) { return b.ts - a.ts; }); cb(state.logs.slice(0, 500)); }

  // ════════════════════════════════════════════════════════════
  //  MUTACIONES
  // ════════════════════════════════════════════════════════════
  function addUser(u) {
    var rec = normalizeUser(u);
    if (state.mode === 'firebase') {
      var clean = {}; Object.keys(rec).forEach(function (k) { if (k !== 'id') clean[k] = rec[k] == null ? '' : rec[k]; });
      return state.fb.ref('users/' + rec.id).set(clean);
    }
    state.users = state.users.filter(function (x) { return x.id !== rec.id; });
    state.users.unshift(rec);
    lsSaveUsers(); emitUsers();
    return Promise.resolve(rec);
  }
  function updateUser(id, patch) {
    if (state.mode === 'firebase') {
      var clean = {}; Object.keys(patch).forEach(function (k) { if (k !== 'id') clean[k] = patch[k] == null ? '' : patch[k]; });
      // Si cambió el UID, la clave cambia: re-crear
      if (patch.uid && uidKey(patch.uid) !== id) {
        var existing = state.users.find(function (x) { return x.id === id; }) || {};
        var merged = Object.assign({}, existing, patch);
        return state.fb.ref('users/' + id).remove().then(function () { return addUser(merged); });
      }
      return state.fb.ref('users/' + id).update(clean);
    }
    state.users = state.users.map(function (x) { return x.id === id ? normalizeUser(Object.assign({}, x, patch)) : x; });
    lsSaveUsers(); emitUsers();
    return Promise.resolve();
  }
  function deleteUser(id) {
    if (state.mode === 'firebase') return state.fb.ref('users/' + id).remove();
    state.users = state.users.filter(function (x) { return x.id !== id; });
    lsSaveUsers(); emitUsers();
    return Promise.resolve();
  }
  function setBlocked(id, blocked) {
    var status = blocked ? 'Inactivo' : 'Activo';
    return updateUser(id, { blocked: !!blocked, status: status });
  }
  function addLog(entry) {
    var rec = normalizeLog(entry);
    if (state.mode === 'firebase') {
      return state.fb.ref('logs').push({
        uid: rec.uid, code: rec.code, name: rec.name, role: rec.role, plate: rec.plate,
        vehicleType: rec.vehicleType, status: rec.status, reason: rec.reason, gate: rec.gate, ts: rec.ts,
      });
    }
    state.logs.unshift(rec);
    state.logs = state.logs.slice(0, 500);
    lsSaveLogs(); emitLogs();
    return Promise.resolve(rec);
  }

  // ════════════════════════════════════════════════════════════
  //  RFID — registrar tarjeta (lectura REAL del hardware)
  // ════════════════════════════════════════════════════════════
  // Espera a que el hardware escriba en /enroll un UID nuevo y lo devuelve.
  function captureScan() {
    if (state.mode === 'firebase') {
      return new Promise(function (resolve, reject) {
        var ref = state.fb.ref('enroll');
        var baseline = null, started = false, timer;
        var handler = ref.on('value', function (snap) {
          var v = snap.val();
          if (!started) { baseline = v ? v.ts : 0; started = true; return; }
          if (v && v.uid && v.ts !== baseline) {
            ref.off('value', handler); clearTimeout(timer); resolve(v.uid);
          }
        });
        timer = setTimeout(function () { ref.off('value', handler); reject(new Error('timeout')); }, 30000);
      });
    }
    // Sin Firebase no hay lector conectado: no se puede capturar.
    return Promise.reject(new Error('sin-conexion'));
  }

  function findByUid(uid) {
    var k = uidKey(uid);
    return state.users.find(function (u) { return u.id === k; }) || null;
  }

  window.DB = {
    get mode() { return state.mode; },
    init: init,
    onUsers: onUsers,
    onLogs: onLogs,
    addUser: addUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    setBlocked: setBlocked,
    addLog: addLog,
    captureScan: captureScan,
    findByUid: findByUid,
    uidKey: uidKey,
  };
})();

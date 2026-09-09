/* ════════════════════════════════════════════════════════════════════
   puerta.js — Cerebro del control de acceso (lado web)
   ────────────────────────────────────────────────────────────────────
   El hardware solo publica el EPC leido en  /scan
   Esta pagina hace TODO lo demas:
     · busca el usuario
     · decide si se permite el acceso
     · escribe el registro en /logs  (alimenta historial y dashboard)
     · si la tarjeta es nueva, la copia a /enroll para el formulario
     · responde en /gate  para que el Arduino encienda el piloto verde

   Requiere que la pagina este abierta.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ultimoN = -1;

  function iniciar() {
    if (!window.DB || DB.mode !== 'firebase' || typeof firebase === 'undefined') {
      console.warn('[PUERTA] Sin Firebase. El control automatico no arranca.');
      return;
    }

    var db = firebase.database();
    console.log('%c[PUERTA] Control de acceso activo. Esperando lecturas...', 'color:#117a4a');

    db.ref('scan').on('value', function (snap) {
      var v = snap.val();
      if (!v || !v.uid || v.n == null) return;
      if (v.n === ultimoN) return;      // ya procesado
      ultimoN = v.n;

      procesar(v.uid, v.n, db);
    });
  }

  function procesar(uid, n, db) {
    var key = DB.uidKey(uid);
    var u = DB.findByUid(uid);

    console.log('[PUERTA] Lectura:', key, u ? '(' + u.name + ')' : '(no registrada)');

    // ── Tarjeta desconocida: la pasamos al formulario de registro ──
    if (!u) {
      db.ref('enroll').set({ uid: key, ts: Date.now() });
      responder(db, key, n, 0);
      return;
    }

    // ── Validacion ──
    var permitido = true, motivo = '';
    if (u.blocked)                { permitido = false; motivo = 'Usuario bloqueado'; }
    else if (u.status !== 'Activo') { permitido = false; motivo = 'Usuario inactivo'; }

    // ── Registro en el historial (dashboard, estadisticas, monitoreo) ──
    DB.addLog({
      uid: key,
      code: u.code || '',
      name: u.name || '',
      role: u.role || '',
      plate: u.plate || '',
      vehicleType: u.vehicleType || '',
      status: permitido ? 'Permitido' : 'Denegado',
      reason: motivo,
      gate: window.ENTRY_GATE || 'La Casona',
      ts: Date.now(),
    });

    console.log('[PUERTA]', permitido ? 'ACCESO PERMITIDO' : 'DENEGADO: ' + motivo);
    responder(db, key, n, permitido ? 1 : 0);
  }

  function responder(db, uid, n, allow) {
    db.ref('gate').set({ uid: uid, n: n, allow: allow });
    // limpiamos a los 15 s para que no queden respuestas viejas
    setTimeout(function () { db.ref('gate').remove(); }, 15000);
  }

  // Arrancamos cuando la app ya inicializo Firebase
  if (document.readyState === 'complete') setTimeout(iniciar, 1500);
  else window.addEventListener('load', function () { setTimeout(iniciar, 1500); });
})();

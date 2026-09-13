/* ════════════════════════════════════════════════════════════════════
   puerta.js — Cerebro del control de acceso (lado web)
   ────────────────────────────────────────────────────────────────────
   El hardware solo publica el EPC leido en  /scan
   Esta pagina hace TODO lo demas: valida, registra el log,
   copia a /enroll si es nueva, y responde en /gate.
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ultimoN = -1;
  var primeraVez = true;     // la lectura que ya estaba guardada se ignora

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

      // Al cargar la pagina, /scan trae la ultima lectura vieja.
      // La tomamos solo como referencia, sin procesarla.
      if (primeraVez) {
        primeraVez = false;
        ultimoN = v.n;
        console.log('[PUERTA] Lectura previa ignorada (n=' + v.n + ')');
        return;
      }

      if (v.n === ultimoN) return;
      ultimoN = v.n;

      procesar(v.uid, v.n, db);
    });
  }

  function procesar(uid, n, db) {
    var key = DB.uidKey(uid);
    var u = DB.findByUid(uid);

    console.log('[PUERTA] Lectura:', key, u ? '(' + u.name + ')' : '(no registrada)');

    if (!u) {
      db.ref('enroll').set({ uid: key, ts: Date.now() });
      responder(db, key, n, 0);
      return;
    }

    var permitido = true, motivo = '';
    if (u.blocked)                  { permitido = false; motivo = 'Usuario bloqueado'; }
    else if (u.status !== 'Activo') { permitido = false; motivo = 'Usuario inactivo'; }

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
    setTimeout(function () { db.ref('gate').remove(); }, 15000);
  }

  if (document.readyState === 'complete') setTimeout(iniciar, 1500);
  else window.addEventListener('load', function () { setTimeout(iniciar, 1500); });
})();

/* Monitoreo en vivo — reacciona a los registros reales (hardware/Firebase) */

const MonitoreoView = ({ users, log, actions, gateOpen, setGateOpen }) => {
  const toast = useToast();
  const [lastScan, setLastScan] = React.useState(null);
  const seenRef = React.useRef(null);
  const closeTimer = React.useRef(null);

  /* Cuando llega un registro nuevo (desde el hardware o la simulación),
     animar la barrera si fue permitido. */
  React.useEffect(() => {
    if (!log.length) return;
    const newest = log[0];
    // Inicializar marca sin animar al cargar
    if (seenRef.current === null) { seenRef.current = newest.id; return; }
    if (newest.id !== seenRef.current) {
      seenRef.current = newest.id;
      setLastScan(newest);
      if (newest.status === 'Permitido') {
        setGateOpen(true);
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setGateOpen(false), 3500);
      }
    }
  }, [log]);

  const manualOpen = () => {
    setGateOpen(true);
    toast({ tone: 'ok', title: 'Apertura manual', sub: 'La barrera se cerrará automáticamente' });
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setGateOpen(false), 4500);
  };
  const manualClose = () => { clearTimeout(closeTimer.current); setGateOpen(false); };

  const simulate = () => {
    actions.simulateScan().then((r) => {
      if (!r) toast({ tone: 'bad', title: 'Sin usuarios activos', sub: 'Registra al menos un usuario activo' });
    });
  };

  const recent = log.slice(0, 5);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Monitoreo en vivo</h2>
          <div className="page-sub">Estado en tiempo real de la entrada {window.ENTRY_GATE || 'La Casona'} · lector RFID</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={simulate}>
            <Icon name="rfid" size={14} /> Simular lectura
          </button>
        </div>
      </div>

      <div className="live-wrap">
        {/* Barrier scene */}
        <div className="card barrier-card">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 14}}>
            <h3 className="section-title" style={{margin: 0}}>
              <span className="live-dot"></span>
              {window.ENTRY_GATE || 'La Casona'} · Barrera principal
            </h3>
            <Badge tone={gateOpen ? 'ok' : 'neutral'}>
              {gateOpen ? 'Abierta' : 'Cerrada'}
            </Badge>
          </div>

          <div className={`gate-scene ${gateOpen ? 'open' : ''}`}>
            <span className="status-pill">{gateOpen ? 'Acceso permitido' : 'En espera'}</span>
            <span className="light"></span>
            <div className="post-left"></div>
            <div className="post-right"></div>
            <div className="arm"></div>
            <div className="ground"></div>
          </div>

          <div className="gate-controls">
            <button className="gate-btn open-btn" onClick={manualOpen}>
              <span className="gate-btn-label" style={{display:'inline-flex', alignItems:'center', gap: 6}}>
                <Icon name="check" size={14} stroke={2.4} /> Abrir manual
              </span>
              <span className="gate-btn-hint">Apertura asistida por operador</span>
            </button>
            <button className="gate-btn close-btn" onClick={manualClose}>
              <span className="gate-btn-label" style={{display:'inline-flex', alignItems:'center', gap: 6}}>
                <Icon name="x" size={14} stroke={2.4} /> Cerrar
              </span>
              <span className="gate-btn-hint">Forzar cierre inmediato</span>
            </button>
          </div>

          <div style={{marginTop: 16, padding: 12, background:'var(--surface-2)', borderRadius: 8, fontSize: 12.5, color:'var(--text-muted)', display:'flex', gap: 14}}>
            <span style={{display:'inline-flex', alignItems:'center', gap: 6}}>
              <Icon name="wifi" size={14} /> Controlador <b style={{color: DB.mode === 'firebase' ? 'var(--ok)' : 'var(--warn)'}}>ESP32-RFID-01</b>
            </span>
            <span style={{display:'inline-flex', alignItems:'center', gap: 6, marginLeft:'auto'}}>
              <span style={{width:7, height:7, borderRadius:'50%', background: DB.mode === 'firebase' ? 'var(--ok)' : 'var(--warn)'}}></span>
              {DB.mode === 'firebase' ? 'En línea (Firebase)' : 'Modo local (sin nube)'}
            </span>
          </div>
        </div>

        {/* RFID reader */}
        <div className="card rfid-reader">
          <h3 className="section-title">
            <span className="live-dot"></span>
            Último RFID detectado
          </h3>

          <div className="rfid-display">
            <div className="label">
              <Icon name="rfid" size={13} /> Tarjeta leída
              <span style={{marginLeft:'auto', fontFamily:'var(--font-mono)', color:'rgba(255,255,255,0.7)'}}>
                {lastScan ? formatTime(lastScan.time) : '--:--:--'}
              </span>
            </div>
            <div className="signal">
              <i></i><i></i><i></i><i></i>
            </div>
            <div className="uid">{lastScan ? lastScan.uid : '-- -- -- --'}</div>
            <div style={{marginTop: 12, fontSize: 13, color:'rgba(255,255,255,0.8)', display:'flex', alignItems:'center', gap: 8, position:'relative'}}>
              {lastScan ? (
                <>
                  <span style={{width: 6, height: 6, borderRadius:'50%', background: lastScan.status === 'Permitido' ? '#2ecc71' : '#ff5f5f'}}></span>
                  {lastScan.status === 'Permitido' ? `Acceso permitido · ${lastScan.name}` : `Denegado · ${lastScan.reason || 'No autorizado'}`}
                </>
              ) : (
                <span style={{color:'rgba(255,255,255,0.5)'}}>Esperando lectura del hardware…</span>
              )}
            </div>
          </div>

          <div className="recent-rfid-list" style={{marginTop: 16}}>
            <div style={{fontSize: 11.5, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight: 600, marginBottom: 8}}>
              Últimas lecturas
            </div>
            {recent.length === 0 ? (
              <div className="empty" style={{padding: '24px 0'}}>
                Sin lecturas todavía · usa “Simular lectura” o acerca una tarjeta al lector
              </div>
            ) : (
              recent.map((s) => (
                <div key={s.id} className={`scan-card ${s.status === 'Permitido' ? '' : 'denied'}`}>
                  <span className="scan-ico">
                    <Icon name={s.status === 'Permitido' ? 'check' : 'x'} size={18} stroke={2.4} />
                  </span>
                  <div className="scan-meta">
                    <div className="scan-name">{s.name}</div>
                    <div className="scan-sub">
                      <span style={{display:'inline-flex', alignItems:'center', gap: 4}}>
                        <Icon name={vehicleIconName(s.vehicleType)} size={12} />
                        {s.vehicleType || '—'}
                      </span>
                      {s.plate && <>
                        <span className="dot-sep">·</span>
                        <span style={{fontFamily:'var(--font-mono)'}}>{s.plate}</span>
                      </>}
                      <span className="dot-sep">·</span>
                      {s.gate}
                    </div>
                  </div>
                  <div className="scan-time">{formatTime(s.time).slice(0,8)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

window.MonitoreoView = MonitoreoView;

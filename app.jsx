/* SIPAV-UFPS — Main app */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#e30613",
  "density": "comfortable",
  "sidebarStyle": "dark",
  "showLiveTicker": true,
  "systemName": "SIPAV"
}/*EDITMODE-END*/;

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',         icon: 'dashboard' },
  { id: 'registro',    label: 'Registrar usuario', icon: 'user-plus' },
  { id: 'usuarios',    label: 'Usuarios',          icon: 'users' },
  { id: 'historial',   label: 'Historial',         icon: 'history' },
  { id: 'monitoreo',   label: 'Monitoreo en vivo', icon: 'eye', badge: 'LIVE' },
  { id: 'estadisticas',label: 'Estadísticas',      icon: 'chart' },
  { id: 'bloqueados',  label: 'Bloqueados',        icon: 'ban' },
  { id: 'config',      label: 'Configuración',     icon: 'gear' },
];

const PAGE_TITLES = {
  dashboard: 'Panel principal',
  registro: 'Registro de usuario',
  usuarios: 'Usuarios registrados',
  historial: 'Historial de accesos',
  monitoreo: 'Monitoreo en vivo',
  estadisticas: 'Estadísticas',
  bloqueados: 'Usuarios bloqueados',
  config: 'Configuración',
};

const App = () => {
  const [view, setView] = React.useState('dashboard');
  const [users, setUsers] = React.useState([]);
  const [log, setLog] = React.useState([]);
  const [editingUser, setEditingUser] = React.useState(null);
  const [gateOpen, setGateOpen] = React.useState(false);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Conectar a la capa de datos (Firebase o local)
  React.useEffect(() => {
    DB.init({ seedUsers: INITIAL_USERS, seedLogs: INITIAL_LOG });
    const offU = DB.onUsers(setUsers);
    const offL = DB.onLogs(setLog);
    return () => { offU && offU(); offL && offL(); };
  }, []);

  const actions = React.useMemo(() => ({
    addUser: (u) => DB.addUser(u),
    updateUser: (id, patch) => DB.updateUser(id, patch),
    deleteUser: (id) => DB.deleteUser(id),
    setBlocked: (id, blocked) => DB.setBlocked(id, blocked),
    addLog: (entry) => DB.addLog(entry),
    captureScan: () => DB.captureScan(),
    simulateScan: () => DB.simulateScan(),
  }), []);

  const stats = React.useMemo(() => {
    const todayStr = new Date().toDateString();
    const today = log.filter((r) => r.time.toDateString() === todayStr);
    return {
      totalUsers: users.length,
      newUsersWeek: users.filter((u) => u.createdAt && (Date.now() - u.createdAt < 7 * 864e5)).length,
      entriesToday: today.filter((r) => r.status === 'Permitido').length,
      deniedToday: today.filter((r) => r.status === 'Denegado').length,
    };
  }, [users, log]);

  const onEditUser = (u) => { setEditingUser(u); setView('registro'); };

  // Apply tweaks live
  React.useEffect(() => {
    document.documentElement.style.setProperty('--brand', t.accent);
    // Recompute brand-deep + tint (rough)
    document.documentElement.style.setProperty('--brand-tint', hexAlpha(t.accent, 0.10));
    document.documentElement.style.setProperty('--brand-deep', shade(t.accent, -0.18));
    if (t.density === 'compact') {
      document.documentElement.style.setProperty('--row-pad', '8px');
    }
    if (t.sidebarStyle === 'light') {
      document.documentElement.style.setProperty('--sidebar-bg', '#ffffff');
      document.documentElement.style.setProperty('--sidebar-text', '#0f1219');
      document.documentElement.style.setProperty('--sidebar-muted', '#5b6271');
      document.documentElement.style.setProperty('--sidebar-active', '#f4f5f7');
    } else {
      document.documentElement.style.setProperty('--sidebar-bg', '#0f1219');
      document.documentElement.style.setProperty('--sidebar-text', '#c8ccd4');
      document.documentElement.style.setProperty('--sidebar-muted', '#6f7585');
      document.documentElement.style.setProperty('--sidebar-active', '#1a1f2b');
    }
  }, [t.accent, t.density, t.sidebarStyle]);

  return (
    <ToastProvider>
      <div className={`app density-${t.density}`}>
        <Sidebar view={view} onNavigate={(v) => { setView(v); if (v !== 'registro') setEditingUser(null); }} systemName={t.systemName} />
        <main className="main">
          <Topbar title={PAGE_TITLES[view]} crumbs={['SIPAV-UFPS', PAGE_TITLES[view]]} systemName={t.systemName} showLiveTicker={t.showLiveTicker} />
          <div className="content">
            {view === 'dashboard' && <DashboardView users={users} log={log} stats={stats} onNavigate={setView} dbMode={DB.mode} />}
            {view === 'registro' && <RegistroView users={users} actions={actions} editingUser={editingUser} setEditingUser={setEditingUser} />}
            {view === 'usuarios' && <UsuariosView users={users} actions={actions} onEditUser={onEditUser} onNavigate={setView} log={log} />}
            {view === 'bloqueados' && <UsuariosView users={users} actions={actions} onEditUser={onEditUser} onNavigate={setView} log={log} blockedView />}
            {view === 'historial' && <HistorialView log={log} />}
            {view === 'monitoreo' && <MonitoreoView users={users} log={log} actions={actions} gateOpen={gateOpen} setGateOpen={setGateOpen} />}
            {view === 'estadisticas' && <EstadisticasView log={log} users={users} />}
            {view === 'config' && <ConfigView dbMode={DB.mode} />}
          </div>
        </main>
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Marca">
          <TweakColor
            label="Acento"
            value={t.accent}
            onChange={(v) => setTweak('accent', v)}
            options={['#e30613', '#1f5fae', '#0f766e', '#7c3aed', '#0f1219']}
          />
          <TweakText label="Nombre" value={t.systemName} onChange={(v) => setTweak('systemName', v)} />
        </TweakSection>

        <TweakSection label="Apariencia">
          <TweakRadio
            label="Sidebar"
            value={t.sidebarStyle}
            options={[
              { value: 'dark', label: 'Oscura' },
              { value: 'light', label: 'Clara' },
            ]}
            onChange={(v) => setTweak('sidebarStyle', v)}
          />
          <TweakRadio
            label="Densidad"
            value={t.density}
            options={[
              { value: 'comfortable', label: 'Confort' },
              { value: 'compact', label: 'Compacta' },
            ]}
            onChange={(v) => setTweak('density', v)}
          />
          <TweakToggle label="Reloj en topbar" value={t.showLiveTicker} onChange={(v) => setTweak('showLiveTicker', v)} />
        </TweakSection>
      </TweaksPanel>
    </ToastProvider>
  );
};

const Sidebar = ({ view, onNavigate, systemName }) => (
  <aside className="sidebar">
    <div className="sidebar-brand">
      <div className="logo-square">
        <img src="assets/ufps-logo.png" alt="UFPS" />
      </div>
      <div className="brand-text">
        <span className="brand-name">{systemName || 'SIPAV'}</span>
        <span className="brand-sub">UFPS · Acceso vehicular</span>
      </div>
    </div>

    <div className="sidebar-section-label">Operación</div>
    {NAV.slice(0, 5).map((n) => (
      <div key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => onNavigate(n.id)}>
        <span className="ico"><Icon name={n.icon} size={17} /></span>
        <span>{n.label}</span>
        {n.badge && <span className="badge-mini" style={{background: 'var(--brand)'}}>{n.badge}</span>}
      </div>
    ))}

    <div className="sidebar-section-label">Gestión</div>
    {NAV.slice(5).map((n) => (
      <div key={n.id} className={`nav-item ${view === n.id ? 'active' : ''}`} onClick={() => onNavigate(n.id)}>
        <span className="ico"><Icon name={n.icon} size={17} /></span>
        <span>{n.label}</span>
      </div>
    ))}

    <div className="sidebar-foot">
      <span className="pulse-dot"></span>
      <span>Sistema operativo · v1.0.3</span>
    </div>
  </aside>
);

const Topbar = ({ title, crumbs, systemName, showLiveTicker }) => {
  const now = useClock();
  return (
    <header className="topbar">
      <div className="topbar-title">
        <div className="crumbs">{crumbs.join(' / ')}</div>
        <h1>{title}</h1>
      </div>

      {showLiveTicker && (
        <div className="topbar-clock">
          <Icon name="clock" size={14} />
          <div>
            <div>{formatTime(now)}</div>
          </div>
          <span style={{width: 1, height: 18, background:'var(--border)'}}></span>
          <div className="clock-date">{formatDate(now)}</div>
        </div>
      )}

      <div className="topbar-search">
        <Icon name="search" size={14} />
        <input placeholder="Buscar usuario, placa o UID…" />
      </div>

      <button className="topbar-icon-btn" title="Notificaciones">
        <Icon name="bell" size={16} />
        <span className="dot"></span>
      </button>

      <div className="topbar-user">
        <span className="avatar">LM</span>
        <div className="user-meta">
          <span className="user-name">Liliana</span>
          <span className="user-role">Administradora · {systemName}</span>
        </div>
        <button className="logout-btn">
          <Icon name="logout" size={14} /> Salir
        </button>
      </div>
    </header>
  );
};

/* color helpers */
function hexAlpha(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
function shade(hex, pct) {
  const h = hex.replace('#', '');
  let r = parseInt(h.slice(0, 2), 16);
  let g = parseInt(h.slice(2, 4), 16);
  let b = parseInt(h.slice(4, 6), 16);
  const f = pct < 0 ? 0 : 255;
  const t = Math.abs(pct);
  r = Math.round((f - r) * t + r);
  g = Math.round((f - g) * t + g);
  b = Math.round((f - b) * t + b);
  return `rgb(${r}, ${g}, ${b})`;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

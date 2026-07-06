/* Shared UI primitives + Icons for SIPAV-UFPS */

const Icon = ({ name, size = 16, stroke = 1.75, ...rest }) => {
  const s = size;
  const sw = stroke;
  const common = {
    width: s, height: s, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round',
    ...rest
  };
  switch (name) {
    case 'dashboard': return (
      <svg {...common}><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>
    );
    case 'user-plus': return (
      <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>
    );
    case 'car': return (
      <svg {...common}><path d="M5 17h14M3 17v-3.5L5.5 8h13L21 13.5V17"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/><path d="M6 13h12"/></svg>
    );
    case 'history': return (
      <svg {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
    );
    case 'chart': return (
      <svg {...common}><path d="M3 3v18h18"/><path d="M7 14l3-3 3 3 5-6"/></svg>
    );
    case 'shield': return (
      <svg {...common}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>
    );
    case 'ban': return (
      <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M5.5 5.5l13 13"/></svg>
    );
    case 'gear': return (
      <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.7l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.7-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.7.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.7 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.7.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.7-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.7V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/></svg>
    );
    case 'search': return (
      <svg {...common} width={s} height={s}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    );
    case 'bell': return (
      <svg {...common}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
    );
    case 'logout': return (
      <svg {...common}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
    );
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'arrow-up': return <svg {...common}><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
    case 'arrow-down': return <svg {...common}><path d="M12 5v14M19 12l-7 7-7-7"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
    case 'check': return <svg {...common}><path d="M20 6 9 17l-5-5"/></svg>;
    case 'x': return <svg {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>;
    case 'edit': return <svg {...common}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
    case 'trash': return <svg {...common}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>;
    case 'download': return <svg {...common}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>;
    case 'filter': return <svg {...common}><path d="M22 3H2l8 9.5V21l4-2v-6.5L22 3z"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>;
    case 'login': return <svg {...common}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/></svg>;
    case 'rfid': return <svg {...common}><path d="M5 8a8 8 0 0 1 14 0"/><path d="M7 11a5 5 0 0 1 10 0"/><path d="M9 14a2 2 0 0 1 6 0"/><circle cx="12" cy="18" r="1.5"/></svg>;
    case 'barrier': return <svg {...common}><path d="M3 20h18"/><path d="M5 20v-6M5 14h16l-2-3H7l-2 3z"/><path d="M9 14v-3M13 14v-3M17 14v-3"/></svg>;
    case 'eye': return <svg {...common}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'users': return <svg {...common}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'bike': return <svg {...common}><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6l3 5-6 0-5-2 4-3z"/></svg>;
    case 'walk': return <svg {...common}><circle cx="13" cy="4" r="2"/><path d="M9 21l2-7-3-2.5L6 14"/><path d="M11 14l3 1 2 6"/><path d="M14 8l-3 2-2 4 3 1 3-3 3 2"/></svg>;
    case 'motorcycle': return <svg {...common}><circle cx="5" cy="17" r="3"/><circle cx="19" cy="17" r="3"/><path d="M14 7h3l2 7"/><path d="M5 14l4-7h4l3 4-6 4"/></svg>;
    case 'parking': return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>;
    case 'door': return <svg {...common}><path d="M4 21h16"/><path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M14 12h.01"/></svg>;
    case 'clock': return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
    case 'wifi': return <svg {...common}><path d="M5 12.55a11 11 0 0 1 14 0"/><path d="M1.5 8.5a16 16 0 0 1 21 0"/><path d="M8.5 16.4a6 6 0 0 1 7 0"/><circle cx="12" cy="20" r="0.5"/></svg>;
    case 'menu': return <svg {...common}><path d="M3 6h18M3 12h18M3 18h18"/></svg>;
    case 'refresh': return <svg {...common}><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>;
    case 'more': return <svg {...common}><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="m6 9 6 6 6-6"/></svg>;
    default: return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/></svg>;
  }
};

/* Stat tile */
const Stat = ({ tone = '', label, value, icon, deltaPct, deltaDir = 'flat', foot, sparkPct }) => (
  <div className={`stat ${tone}`}>
    <div className="stat-head">
      <span className="stat-label">{label}</span>
      <span className="stat-icon"><Icon name={icon} size={16} /></span>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-foot">
      <span>{foot}</span>
      {deltaPct != null && (
        <span className={`delta ${deltaDir}`}>
          {deltaDir === 'up' && <Icon name="arrow-up" size={11} stroke={2.5} />}
          {deltaDir === 'down' && <Icon name="arrow-down" size={11} stroke={2.5} />}
          {deltaPct}
        </span>
      )}
    </div>
    {sparkPct != null && <span className="sparkbar" style={{'--pct': sparkPct + '%'}}></span>}
  </div>
);

/* Badge */
const Badge = ({ tone = 'neutral', children, dot = true }) => (
  <span className={`badge ${tone}`}>
    {dot && <span className="dot"></span>}
    {children}
  </span>
);

/* Vehicle type icon resolver */
const vehicleIconName = (t) => t === 'Carro' ? 'car' : t === 'Moto' ? 'motorcycle' : t === 'Peatón' ? 'walk' : 'car';

/* Toast manager — simple context */
const ToastCtx = React.createContext(() => {});

const ToastProvider = ({ children }) => {
  const [items, setItems] = React.useState([]);
  const push = React.useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setItems((arr) => [...arr, { id, ...t }]);
    setTimeout(() => setItems((arr) => arr.filter((x) => x.id !== id)), t.duration || 3800);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-stack">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.tone || ''}`}>
            <span className="toast-ico">
              <Icon name={t.tone === 'ok' ? 'check' : t.tone === 'bad' ? 'x' : 'bell'} size={16} stroke={2.4} />
            </span>
            <div style={{flex: 1, minWidth: 0}}>
              <div className="toast-title">{t.title}</div>
              {t.sub && <div className="toast-sub">{t.sub}</div>}
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
};
const useToast = () => React.useContext(ToastCtx);

/* Live clock */
const useClock = () => {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
};

const formatTime = (d) => d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const formatDate = (d) => d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

/* Exporta el historial de accesos a un archivo CSV (abre en Excel).
   Devuelve false si no hay datos. */
function exportReportCSV(log, filename) {
  if (!log || !log.length) return false;
  const head = ['Fecha', 'Hora', 'Código', 'Nombre', 'Rol', 'Tipo', 'Placa', 'UID', 'Estado', 'Motivo', 'Entrada'];
  const rows = log.map((r) => [
    r.time.toLocaleDateString('es-CO'), formatTime(r.time), r.code, r.name, r.role,
    r.vehicleType, r.plate, r.uid, r.status, r.reason || '', r.gate,
  ]);
  const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const csv = '\uFEFF' + [head].concat(rows).map((r) => r.map(esc).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename || 'reporte-accesos.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return true;
}

Object.assign(window, {
  Icon, Stat, Badge, ToastProvider, useToast, useClock, formatTime, formatDate, vehicleIconName, exportReportCSV
});

/* Usuarios + Estadísticas + Bloqueados + Config — Sistema UFPS La Casona */

const dayKey = (d) => {
  const dt = new Date(d); dt.setHours(0,0,0,0);
  return dt.getTime();
};
const startOfToday = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
const startOfWeek = () => { const d = startOfToday(); d.setDate(d.getDate() - 6); return d; };

/* Build per-user access stats from log */
const useUserStats = (log) => React.useMemo(() => {
  const today = startOfToday();
  const weekStart = startOfWeek();
  const m = new Map();
  // Build seven daily buckets
  const days = Array.from({length: 7}, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });
  log.forEach((r) => {
    if (r.status !== 'Permitido') return;
    if (!m.has(r.code)) m.set(r.code, { today: 0, week: 0, last: null, byDay: Array(7).fill(0) });
    const s = m.get(r.code);
    if (r.time >= weekStart) s.week++;
    if (r.time >= today) s.today++;
    if (!s.last || r.time > s.last) s.last = r.time;
    const idx = days.findIndex((d) => d.toDateString() === r.time.toDateString());
    if (idx >= 0) s.byDay[idx]++;
  });
  return { stats: m, days };
}, [log]);

const UsuariosView = ({ users, actions, onEditUser, onNavigate, log, blockedView = false }) => {
  const toast = useToast();
  const [q, setQ] = React.useState('');
  const [role, setRole] = React.useState('Todos');
  const [vehType, setVehType] = React.useState('Todos');
  const [expanded, setExpanded] = React.useState(null);
  const { stats: userStats, days } = useUserStats(log);

  const list = users.filter((u) => {
    if (blockedView && !u.blocked) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!u.name.toLowerCase().includes(s) && !(u.plate || '').toLowerCase().includes(s) && !u.code.includes(s) && !u.uid.includes(s.toUpperCase())) return false;
    }
    if (role !== 'Todos' && u.role !== role) return false;
    if (vehType !== 'Todos' && u.vehicleType !== vehType) return false;
    return true;
  });

  const toggleBlock = (u) => {
    actions.setBlocked(u.id, !u.blocked);
    toast({ tone: u.blocked ? 'ok' : 'bad', title: u.blocked ? 'Usuario desbloqueado' : 'Usuario bloqueado', sub: u.name });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{blockedView ? 'Usuarios bloqueados' : 'Usuarios registrados'}</h2>
          <div className="page-sub">
            {list.length} usuarios · {blockedView ? `Sin acceso a ${ENTRY_GATE}` : 'Comunidad universitaria habilitada para ingresar'}
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => onNavigate('registro')}>
            <Icon name="plus" size={14} stroke={2.4} /> Nuevo usuario
          </button>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="filter" style={{flex: '0 0 280px'}}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nombre, placa, código, UID…" style={{flex: 1}} />
          </div>
          <div className="filter">
            <Icon name="users" size={13} />
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Todos</option>
              <option>Estudiante</option>
              <option>Docente</option>
              <option>Administrativo</option>
            </select>
          </div>
          <div className="filter">
            <Icon name="car" size={13} />
            <select value={vehType} onChange={(e) => setVehType(e.target.value)}>
              <option>Todos</option>
              <option>Carro</option>
              <option>Moto</option>
              <option>Peatón</option>
            </select>
          </div>
          <div className="spacer"></div>
          <button className="btn btn-ghost">
            <Icon name="download" size={13} /> Exportar
          </button>
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th style={{textAlign:'center'}}>Ingresos hoy</th>
                <th style={{textAlign:'center'}}>Ingresos semana</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan="8"><div className="empty">Sin resultados</div></td></tr>
              ) : (
                list.flatMap((u) => {
                  const s = userStats.get(u.code) || { today: 0, week: 0, last: null, byDay: Array(7).fill(0) };
                  const isOpen = expanded === u.id;
                  const rows = [
                    <tr key={u.id} style={{cursor:'pointer'}} onClick={() => setExpanded(isOpen ? null : u.id)}>
                      <td>
                        <div style={{display:'flex', alignItems:'center', gap: 10}}>
                          <span className="avatar" style={{width: 32, height: 32, fontSize: 11}}>
                            {u.name.split(' ').slice(0, 2).map((p) => p[0]).join('')}
                          </span>
                          <div>
                            <div style={{fontWeight: 500, display:'flex', alignItems:'center', gap: 6}}>
                              {u.name}
                              <Icon name={isOpen ? 'arrow-up' : 'chevron-down'} size={12} stroke={2} />
                            </div>
                            <div style={{fontSize: 11.5, color:'var(--text-muted)'}}>{u.code} · {u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge tone={u.role === 'Docente' ? 'info' : u.role === 'Administrativo' ? 'warn' : 'neutral'} dot={false}>{u.role}</Badge>
                      </td>
                      <td>
                        <span className="veh-chip">
                          <Icon name={vehicleIconName(u.vehicleType)} size={14} />
                          {u.vehicleType}
                        </span>
                      </td>
                      <td className="mono" style={{letterSpacing:'0.05em', color: u.plate ? 'var(--text)' : 'var(--text-dim)'}}>
                        {u.plate || '—'}
                      </td>
                      <td style={{textAlign:'center'}}>
                        <CountPill value={s.today} tone={s.today > 0 ? 'brand' : 'muted'} />
                      </td>
                      <td style={{textAlign:'center'}}>
                        <CountPill value={s.week} tone={s.week > 0 ? 'info' : 'muted'} />
                      </td>
                      <td>
                        <Badge tone={u.blocked ? 'bad' : (u.status === 'Activo' ? 'ok' : 'warn')}>
                          {u.blocked ? 'Bloqueado' : u.status}
                        </Badge>
                      </td>
                      <td style={{textAlign:'right', whiteSpace:'nowrap'}} onClick={(e) => e.stopPropagation()}>
                        <button className="btn btn-ghost" style={{padding: '4px 6px'}} onClick={() => onEditUser(u)}>
                          <Icon name="edit" size={14} />
                        </button>
                        <button className="btn btn-ghost" style={{padding: '4px 6px'}} onClick={() => toggleBlock(u)}>
                          <Icon name={u.blocked ? 'check' : 'ban'} size={14} />
                        </button>
                      </td>
                    </tr>
                  ];
                  if (isOpen) {
                    rows.push(
                      <tr key={u.id + '_d'} style={{background:'var(--surface-2)'}}>
                        <td colSpan="8" style={{padding: 0}}>
                          <UserWeekDetail user={u} stats={s} days={days} log={log} />
                        </td>
                      </tr>
                    );
                  }
                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const CountPill = ({ value, tone }) => {
  const styles = {
    brand: { bg: 'var(--brand-tint)', fg: 'var(--brand)' },
    info: { bg: 'var(--info-bg)', fg: 'var(--info)' },
    muted: { bg: 'var(--bg)', fg: 'var(--text-dim)' },
  }[tone || 'muted'];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      minWidth: 32, height: 24, padding: '0 8px',
      background: styles.bg, color: styles.fg,
      borderRadius: 999, fontVariantNumeric:'tabular-nums',
      fontWeight: 600, fontSize: 13, fontFamily:'var(--font-mono)',
    }}>{value}</span>
  );
};

const UserWeekDetail = ({ user, stats, days, log }) => {
  const max = Math.max(1, ...stats.byDay);
  const userEntries = log
    .filter((r) => r.code === user.code)
    .slice(0, 5);

  return (
    <div style={{padding: '18px 24px', display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 24, borderTop:'1px solid var(--border)'}}>
      <div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom: 12}}>
          <div style={{fontSize: 12, fontWeight: 600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em'}}>
            Ingresos por día · últimos 7 días
          </div>
          <div style={{fontSize: 12, color:'var(--text-muted)'}}>
            Total semana <b style={{color:'var(--text)', fontFamily:'var(--font-mono)', marginLeft: 6}}>{stats.week}</b>
          </div>
        </div>

        <div style={{display:'flex', alignItems:'flex-end', gap: 10, height: 110, paddingBottom: 26, position:'relative'}}>
          {days.map((d, i) => {
            const v = stats.byDay[i];
            const h = (v / max) * 100;
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div key={i} style={{flex: 1, position:'relative', height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center'}}>
                <span style={{position:'absolute', top: -2, fontSize: 11, fontWeight: 600, color: v > 0 ? (isToday ? 'var(--brand)' : 'var(--text)') : 'var(--text-dim)', fontVariantNumeric:'tabular-nums'}}>
                  {v}
                </span>
                <div style={{
                  width:'100%', minHeight: 4, height: `${h}%`,
                  background: v === 0 ? 'var(--border)' : (isToday ? 'linear-gradient(180deg, var(--brand), var(--brand-deep))' : 'var(--brand-tint)'),
                  border: v === 0 ? 'none' : 'none',
                  borderRadius: '4px 4px 0 0',
                  marginTop: 16,
                }}></div>
                <span style={{position:'absolute', bottom: -22, fontSize: 11, fontWeight: isToday ? 600 : 500, color: isToday ? 'var(--brand)' : 'var(--text-muted)', textTransform:'capitalize'}}>
                  {d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')}
                </span>
                <span style={{position:'absolute', bottom: -34, fontSize: 10, color:'var(--text-dim)', fontVariantNumeric:'tabular-nums'}}>
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 8, marginTop: 14}}>
          <MiniStat label="Hoy" value={stats.today} tone="brand" />
          <MiniStat label="Semana" value={stats.week} tone="info" />
          <MiniStat label="Promedio diario" value={(stats.week / 7).toFixed(1)} tone="muted" />
        </div>
      </div>

      <div>
        <div style={{fontSize: 12, fontWeight: 600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom: 12}}>
          Ingresos recientes
        </div>
        {userEntries.length === 0 ? (
          <div className="empty" style={{padding: 20, fontSize: 12.5}}>Sin ingresos registrados</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap: 6}}>
            {userEntries.map((r) => (
              <div key={r.id} style={{display:'flex', alignItems:'center', gap: 10, padding: '8px 10px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius: 6}}>
                <span style={{
                  width: 28, height: 28, borderRadius: 6,
                  background: r.status === 'Permitido' ? 'var(--ok-bg)' : 'var(--bad-bg)',
                  color: r.status === 'Permitido' ? 'var(--ok)' : 'var(--bad)',
                  display:'grid', placeItems:'center', flexShrink: 0,
                }}>
                  <Icon name={r.status === 'Permitido' ? 'login' : 'ban'} size={13} stroke={2.2}/>
                </span>
                <div style={{flex: 1, minWidth: 0, fontSize: 12.5}}>
                  <div style={{fontWeight: 500}}>{r.time.toLocaleDateString('es-CO', { weekday: 'long', day: '2-digit', month: 'short' })}</div>
                  <div style={{fontSize: 11.5, color:'var(--text-muted)'}}>{ENTRY_GATE} · {r.status}</div>
                </div>
                <span className="time" style={{fontSize: 12, fontFamily:'var(--font-mono)'}}>{formatTime(r.time).slice(0, 5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MiniStat = ({ label, value, tone }) => {
  const styles = {
    brand: { bg: 'var(--brand-tint)', fg: 'var(--brand)' },
    info: { bg: 'var(--info-bg)', fg: 'var(--info)' },
    muted: { bg: 'var(--surface)', fg: 'var(--text)' },
  }[tone];
  return (
    <div style={{background: styles.bg, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)'}}>
      <div style={{fontSize: 10.5, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight: 600}}>{label}</div>
      <div style={{fontSize: 20, fontWeight: 700, color: styles.fg, fontVariantNumeric:'tabular-nums', marginTop: 2}}>{value}</div>
    </div>
  );
};

/* ───── Estadísticas ───── */
const EstadisticasView = ({ log, users }) => {
  const hourlyMax = Math.max(...HOURLY);

  /* Real 7-day series derived from log */
  const now = new Date();
  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = new Date(now); d.setHours(0,0,0,0); d.setDate(now.getDate() - (6 - i));
    return d;
  });
  const weekCounts = weekDays.map((d) => log.filter((r) => r.time.toDateString() === d.toDateString() && r.status === 'Permitido').length);
  const weekMax = Math.max(1, ...weekCounts);
  const weekTotal = weekCounts.reduce((a, b) => a + b, 0);
  const promedio = (weekTotal / 7).toFixed(0);
  const allowed = log.filter((r) => r.status === 'Permitido').length;
  const denied = log.filter((r) => r.status === 'Denegado').length;
  const tasa = allowed + denied > 0 ? ((allowed / (allowed + denied)) * 100).toFixed(1) : '100';

  const facCounts = {};
  users.forEach((u) => { facCounts[u.faculty] = (facCounts[u.faculty] || 0) + 1; });
  const facList = Object.entries(facCounts).sort((a, b) => b[1] - a[1]);
  const facMax = Math.max(...facList.map((f) => f[1]));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Estadísticas</h2>
          <div className="page-sub">Indicadores históricos · entrada {ENTRY_GATE}</div>
        </div>
        <div className="actions">
          <div className="filter" style={{padding: '6px 10px'}}>
            <Icon name="calendar" size={13} />
            <select defaultValue="7d" style={{background:'transparent', border:'none', fontSize: 12.5}}>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
            </select>
          </div>
          <button className="btn"><Icon name="download" size={14} /> Descargar reporte</button>
        </div>
      </div>

      <div className="stat-grid" style={{gridTemplateColumns:'repeat(4, 1fr)', marginBottom: 18}}>
        <Stat tone="brand" label="Ingresos totales" value={weekTotal.toLocaleString('es-CO')} icon="login" foot="Últimos 7 días" deltaPct="+8.2%" deltaDir="up" />
        <Stat tone="info" label="Promedio diario" value={promedio} icon="chart" foot="ingresos/día" deltaPct="+12" deltaDir="up" />
        <Stat tone="ok" label="Tasa de aceptación" value={`${tasa}%`} icon="shield" foot="permisos sobre total" deltaPct="+0.3%" deltaDir="up" />
        <Stat tone="warn" label="Usuarios activos" value={users.filter((u) => !u.blocked).length} icon="users" foot={`de ${users.length} totales`} />
      </div>

      <div className="grid-2" style={{marginBottom: 18}}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Ingresos por día · semana actual</h3>
              <div className="card-sub">Solo registros permitidos por {ENTRY_GATE}</div>
            </div>
            <span style={{display:'inline-flex', alignItems:'center', gap: 6, fontSize: 12, color:'var(--text-muted)'}}>
              <span style={{width: 10, height: 10, borderRadius: 3, background:'var(--brand)'}}></span> Ingresos
            </span>
          </div>
          <div className="card-body">
            <div style={{display:'flex', alignItems:'flex-end', gap: 18, height: 200, paddingBottom: 26, position:'relative'}}>
              {weekDays.map((d, i) => {
                const v = weekCounts[i];
                const h = (v / weekMax) * 100;
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <div key={i} style={{flex: 1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative', height:'100%', justifyContent:'flex-end'}}>
                    <span style={{position:'absolute', top: 0, fontSize: 11, fontWeight: 600, color: isToday ? 'var(--brand)' : 'var(--text-muted)'}}>{v}</span>
                    <div style={{
                      width: '100%',
                      height: `${h}%`,
                      background: isToday ? 'linear-gradient(180deg, var(--brand), var(--brand-deep))' : 'var(--brand-tint)',
                      borderRadius:'4px 4px 0 0', minHeight: 4, marginTop: 18,
                    }}></div>
                    <span style={{position:'absolute', bottom: -22, fontSize: 11, color: isToday ? 'var(--brand)' : 'var(--text-muted)', textTransform:'capitalize', fontWeight: isToday ? 600 : 500}}>
                      {d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Picos por hora · promedio</h3>
            <div className="card-sub">Lectura sobre últimos 30 días</div>
          </div>
          <div className="card-body">
            <div className="bars bars-wrap">
              {HOURLY.map((v, i) => {
                const h = (v / hourlyMax) * 100;
                return (
                  <div key={i} className="bar" style={{height: '100%'}}>
                    <div className="fill" style={{height: `${h}%`}}></div>
                    {i % 3 === 0 && <span className="lbl">{String(i).padStart(2, '0')}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Usuarios por facultad</h3>
            <div className="card-sub">Comunidad registrada</div>
          </div>
          <div className="card-body" style={{display:'flex', flexDirection:'column', gap: 12}}>
            {facList.map(([fac, n]) => (
              <div key={fac}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize: 12.5, marginBottom: 4}}>
                  <span>{fac}</span>
                  <span style={{fontFamily:'var(--font-mono)', color:'var(--text-muted)'}}>{n}</span>
                </div>
                <div className="capacity-bar" style={{height: 6}}>
                  <span style={{width: (n / facMax) * 100 + '%', background:'linear-gradient(90deg, var(--brand-deep), var(--brand))'}}></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Anomalías recientes</h3>
            <Badge tone="warn">Requiere revisión</Badge>
          </div>
          <div className="card-body" style={{display:'flex', flexDirection:'column', gap: 10}}>
            <AnomalyRow time="08:42" title="3 intentos consecutivos denegados" sub={`Placa BVN485 · ${ENTRY_GATE}`} tone="bad" />
            <AnomalyRow time="10:15" title="Tarjeta clonada detectada" sub="UID A1 B2 C3 D4 · doble lectura simultánea" tone="bad" />
            <AnomalyRow time="13:08" title="Usuario no registrado intentó ingresar" sub={`UID 7F 32 18 9A · ${ENTRY_GATE}`} tone="warn" />
            <AnomalyRow time="15:30" title="Acceso fuera de horario habitual" sub="Esteban Niño · 21:48 (cierre 22:00)" tone="warn" />
            <AnomalyRow time="16:48" title="Lector RFID con latencia alta" sub="Controlador ESP32-RFID-01 · 184ms" tone="info" />
          </div>
        </div>
      </div>
    </div>
  );
};

const AnomalyRow = ({ time, title, sub, tone }) => (
  <div style={{display:'flex', gap: 12, alignItems:'flex-start', padding: 10, border: '1px solid var(--border)', borderRadius: 8}}>
    <span style={{
      width: 32, height: 32, borderRadius: 8,
      background: tone === 'bad' ? 'var(--bad-bg)' : tone === 'warn' ? 'var(--warn-bg)' : 'var(--info-bg)',
      color: tone === 'bad' ? 'var(--bad)' : tone === 'warn' ? 'var(--warn)' : 'var(--info)',
      display:'grid', placeItems:'center', flexShrink: 0,
    }}>
      <Icon name={tone === 'bad' ? 'ban' : tone === 'warn' ? 'shield' : 'wifi'} size={15} />
    </span>
    <div style={{flex: 1, minWidth: 0}}>
      <div style={{fontSize: 13, fontWeight: 500}}>{title}</div>
      <div style={{fontSize: 11.5, color:'var(--text-muted)', marginTop: 2}}>{sub}</div>
    </div>
    <span className="time" style={{fontSize: 11.5}}>{time}</span>
  </div>
);

/* ───── Configuración ───── */
const ConfigView = ({ dbMode }) => (
  <div>
    <div className="page-header">
      <div>
        <h2>Configuración</h2>
        <div className="page-sub">Ajustes del sistema, entrada y notificaciones</div>
      </div>
    </div>

    <div className="card" style={{marginBottom: 18, borderLeft: `3px solid ${dbMode === 'firebase' ? 'var(--ok)' : 'var(--warn)'}`}}>
      <div className="card-body" style={{display:'flex', gap: 14, alignItems:'center'}}>
        <span style={{width: 40, height: 40, borderRadius: 10, flexShrink: 0, display:'grid', placeItems:'center',
          background: dbMode === 'firebase' ? 'var(--ok-bg)' : 'var(--warn-bg)',
          color: dbMode === 'firebase' ? 'var(--ok)' : 'var(--warn)'}}>
          <Icon name={dbMode === 'firebase' ? 'wifi' : 'shield'} size={20} />
        </span>
        <div style={{flex: 1}}>
          <div style={{fontWeight: 600, fontSize: 14}}>
            {dbMode === 'firebase' ? 'Conectado a la nube (Firebase)' : 'Modo local — datos en este navegador'}
          </div>
          <div style={{fontSize: 12.5, color:'var(--text-muted)', marginTop: 2}}>
            {dbMode === 'firebase'
              ? 'Los datos se comparten con el hardware ESP32 y entre dispositivos en tiempo real.'
              : 'Edita firebase-config.js con los datos de tu proyecto Firebase para activar la nube y el hardware.'}
          </div>
        </div>
        <Badge tone={dbMode === 'firebase' ? 'ok' : 'warn'}>{dbMode === 'firebase' ? 'En línea' : 'Local'}</Badge>
      </div>
    </div>

    <div className="grid-2">
      <div className="card">
        <div className="card-head"><h3>Entrada</h3></div>
        <div className="card-body" style={{display:'flex', flexDirection:'column', gap: 14}}>
          <SettingRow label="Punto de acceso" value={ENTRY_GATE} />
          <SettingRow label="Modo de registro" value="Solo entradas" />
          <SettingRow label="Tipos permitidos" value="Carro · Moto · Peatón" />
          <SettingRow label="Horario operativo" value="05:30 – 22:00" />
          <SettingRow label="Apertura automática barrera" value="Activada" tone="ok" />
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Hardware</h3></div>
        <div className="card-body" style={{display:'flex', flexDirection:'column', gap: 14}}>
          <SettingRow label="Lector RFID conectado" value="1 / 1" tone="ok" />
          <SettingRow label="Frecuencia de operación" value="13.56 MHz (ISO/IEC 14443A)" />
          <SettingRow label="Controlador" value="ESP32-RFID-01" />
          <SettingRow label="Servidor principal" value="srv-sipav.ufps.edu.co" />
          <SettingRow label="Última sincronización" value="hace 12 segundos" />
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Notificaciones</h3></div>
        <div className="card-body" style={{display:'flex', flexDirection:'column', gap: 14}}>
          <SettingRow label="Alertas de acceso denegado" value="Email + SMS" />
          <SettingRow label="Reporte diario automático" value="08:00 a.m." />
          <SettingRow label="Alertas de intentos múltiples" value="Activado" tone="ok" />
          <SettingRow label="Destinatarios" value="3 administradores" />
        </div>
      </div>
      <div className="card">
        <div className="card-head"><h3>Seguridad y privacidad</h3></div>
        <div className="card-body" style={{display:'flex', flexDirection:'column', gap: 14}}>
          <SettingRow label="Cifrado de tarjetas RFID" value="AES-128" tone="ok" />
          <SettingRow label="Retención de logs" value="365 días" />
          <SettingRow label="Política de datos" value="Ley 1581 de 2012" />
          <SettingRow label="Autenticación 2FA" value="Habilitada" tone="ok" />
        </div>
      </div>
    </div>
  </div>
);

const SettingRow = ({ label, value, tone }) => (
  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingBottom: 12, borderBottom:'1px dashed var(--border)'}}>
    <div style={{fontSize: 13, color:'var(--text-muted)'}}>{label}</div>
    <div style={{fontSize: 13, fontWeight: 500, color: tone === 'ok' ? 'var(--ok)' : 'var(--text)'}}>{value}</div>
  </div>
);

Object.assign(window, { UsuariosView, EstadisticasView, ConfigView });

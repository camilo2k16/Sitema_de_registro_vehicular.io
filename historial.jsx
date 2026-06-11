/* Historial de accesos — Sistema de registro vehicular UFPS (La Casona) */

const HistorialView = ({ log }) => {
  const toast = useToast();
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('Todos');
  const [vehType, setVehType] = React.useState('Todos');
  const [dayFilter, setDayFilter] = React.useState('hoy');
  const [page, setPage] = React.useState(0);
  const perPage = 10;

  React.useEffect(() => { setPage(0); }, [q, status, vehType, dayFilter]);

  const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setHours(0,0,0,0); startOfWeek.setDate(now.getDate() - 6);

  const filtered = log.filter((r) => {
    if (q) {
      const s = q.toLowerCase();
      const matches = r.name.toLowerCase().includes(s)
        || (r.plate && r.plate.toLowerCase().includes(s))
        || r.code.includes(s);
      if (!matches) return false;
    }
    if (status !== 'Todos' && r.status !== status) return false;
    if (vehType !== 'Todos' && r.vehicleType !== vehType) return false;
    if (dayFilter === 'hoy' && r.time.toDateString() !== now.toDateString()) return false;
    if (dayFilter === 'semana' && r.time < startOfWeek) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const slice = filtered.slice(page * perPage, (page + 1) * perPage);

  const todayCount = log.filter((r) => r.time.toDateString() === now.toDateString()).length;
  const weekCount = log.filter((r) => r.time >= startOfWeek).length;

  const exportAs = (fmt) => toast({ tone: 'ok', title: `Exportando ${fmt}`, sub: `${filtered.length} registros` });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Historial de accesos</h2>
          <div className="page-sub">{filtered.length} de {log.length} registros · entrada única: {ENTRY_GATE}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={() => exportAs('PDF')}><Icon name="download" size={14} /> PDF</button>
          <button className="btn" onClick={() => exportAs('Excel')}><Icon name="download" size={14} /> Excel</button>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="stat-grid" style={{gridTemplateColumns:'repeat(4, 1fr)', marginBottom: 18}}>
        <Stat tone="brand" label="Ingresos hoy" value={todayCount} icon="login" foot={ENTRY_GATE} />
        <Stat tone="info" label="Ingresos semana" value={weekCount} icon="calendar" foot="Últimos 7 días" />
        <Stat tone="ok" label="Permitidos" value={log.filter((r) => r.status === 'Permitido').length} icon="check" foot="Acumulado" />
        <Stat tone="bad" label="Denegados" value={log.filter((r) => r.status === 'Denegado').length} icon="ban" foot="Acumulado" />
      </div>

      <div className="card">
        <div className="filters">
          <div className="filter" style={{flex: '0 0 280px'}}>
            <Icon name="search" size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por placa, código o nombre…" style={{flex: 1}} />
          </div>
          <div className="filter">
            <Icon name="calendar" size={13} />
            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)}>
              <option value="hoy">Hoy</option>
              <option value="semana">Últimos 7 días</option>
              <option value="todos">Todo el historial</option>
            </select>
          </div>
          <div className="filter">
            <Icon name="shield" size={13} />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option>Todos</option>
              <option>Permitido</option>
              <option>Denegado</option>
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
          <button className="btn btn-ghost" onClick={() => { setQ(''); setStatus('Todos'); setVehType('Todos'); setDayFilter('hoy'); }}>
            <Icon name="x" size={12} /> Limpiar filtros
          </button>
        </div>

        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Fecha · Hora</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Placa</th>
                <th>Entrada</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 ? (
                <tr><td colSpan="8"><div className="empty">Sin resultados · ajusta los filtros</div></td></tr>
              ) : (
                slice.map((r) => (
                  <tr key={r.id}>
                    <td className="time">
                      <div>{formatTime(r.time)}</div>
                      <div style={{fontSize: 11, color:'var(--text-dim)'}}>
                        {r.time.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                      </div>
                    </td>
                    <td className="mono">{r.code}</td>
                    <td>
                      <div style={{fontWeight: 500}}>{r.name}</div>
                      <div style={{fontSize: 11.5, color:'var(--text-muted)'}}>{r.role}</div>
                    </td>
                    <td>
                      <span className="veh-chip">
                        <Icon name={vehicleIconName(r.vehicleType)} size={14} />
                        {r.vehicleType}
                      </span>
                    </td>
                    <td className="mono" style={{letterSpacing:'0.05em', color: r.plate ? 'var(--text)' : 'var(--text-dim)'}}>
                      {r.plate || '—'}
                    </td>
                    <td style={{fontSize: 12.5, color:'var(--text-muted)'}}>
                      <span style={{display:'inline-flex', alignItems:'center', gap: 6}}>
                        <Icon name="door" size={13} /> {r.gate}
                      </span>
                    </td>
                    <td>
                      <Badge tone={r.status === 'Permitido' ? 'ok' : 'bad'}>{r.status}</Badge>
                      {r.reason && <div style={{fontSize: 11, color:'var(--text-muted)', marginTop: 2}}>{r.reason}</div>}
                    </td>
                    <td style={{textAlign:'right'}}>
                      <button className="btn btn-ghost" style={{padding: '4px 6px'}}>
                        <Icon name="eye" size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <span>Mostrando {slice.length} de {filtered.length} · Página {page + 1} de {totalPages}</span>
          <div className="pages">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>‹</button>
            {Array.from({length: Math.min(5, totalPages)}, (_, i) => i).map((i) => (
              <button key={i} className={i === page ? 'active' : ''} onClick={() => setPage(i)}>{i + 1}</button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>›</button>
          </div>
        </div>
      </div>
    </div>
  );
};

window.HistorialView = HistorialView;

/* Dashboard — Sistema de registro vehicular UFPS (La Casona) */

const DashboardView = ({ users, log, stats, onNavigate, dbMode }) => {
  const toast = useToast();

  const refresh = () => {
    toast({
      tone: 'ok',
      title: 'Datos actualizados',
      sub: dbMode === 'firebase' ? 'Sincronizado con la base de datos en la nube' : 'Datos locales recargados',
    });
  };

  const exportReport = () => {
    const fecha = new Date().toISOString().slice(0, 10);
    if (exportReportCSV(log, `reporte-accesos-${fecha}.csv`)) {
      toast({ tone: 'ok', title: 'Reporte exportado', sub: `${log.length} registros · reporte-accesos-${fecha}.csv` });
    } else {
      toast({ tone: 'bad', title: 'Sin datos para exportar', sub: 'El historial de accesos está vacío todavía' });
    }
  };

  /* Flujo por hora calculado del historial REAL (hoy) */
  const hourly = hourlyFromLog(log, true);
  const hourlyMax = Math.max(1, ...hourly);

  /* Distribución del día calculada del historial REAL */
  const today = log.filter((r) => r.time.toDateString() === new Date().toDateString());
  const distLive = ['Carro', 'Moto', 'Peatón'].map((t) => ({
    label: t === 'Peatón' ? 'Peatones' : (t + 's'),
    type: t,
    value: today.filter((r) => r.vehicleType === t).length,
    color: VEH_COLORS[t],
  }));
  const totalVehDist = distLive.reduce((a, b) => a + b.value, 0);

  /* 7-day series for the bottom mini chart */
  const now = new Date();
  const weekDays = Array.from({length: 7}, (_, i) => {
    const d = new Date(now); d.setHours(0,0,0,0); d.setDate(now.getDate() - (6 - i));
    return d;
  });
  const weekCounts = weekDays.map((d) =>
    log.filter((r) => r.time.toDateString() === d.toDateString() && r.status === 'Permitido').length
  );
  const weekMax = Math.max(1, ...weekCounts);
  const dayLabel = (d) => d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '');

  const recentLog = log.slice(0, 6);
  const weekTotal = weekCounts.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Panel de control</h2>
          <div className="page-sub">Resumen operativo · entrada {ENTRY_GATE} · {formatDate(new Date())}</div>
        </div>
        <div className="actions">
          <button className="btn" onClick={refresh}><Icon name="refresh" size={14} /> Actualizar</button>
          <button className="btn" onClick={exportReport}><Icon name="download" size={14} /> Exportar reporte</button>
          <button className="btn btn-primary" onClick={() => onNavigate('registro')}>
            <Icon name="plus" size={14} stroke={2.4} /> Nuevo registro
          </button>
        </div>
      </div>

      <div className="stat-grid" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        <Stat
          tone="brand"
          label="Ingresos hoy"
          value={stats.entriesToday}
          icon="login"
          foot={`Entrada ${ENTRY_GATE}`}
          deltaPct={weekCounts[5] ? `${Math.round(((weekCounts[6]-weekCounts[5])/Math.max(1,weekCounts[5]))*100)}%` : '—'}
          deltaDir={weekCounts[6] >= weekCounts[5] ? 'up' : 'down'}
        />
        <Stat
          tone="info"
          label="Ingresos semana"
          value={weekTotal}
          icon="calendar"
          foot="Últimos 7 días"
          deltaPct={`+${stats.newUsersWeek}`}
          deltaDir="up"
        />
        <Stat
          tone="ok"
          label="Usuarios registrados"
          value={stats.totalUsers.toLocaleString('es-CO')}
          icon="users"
          foot="Comunidad UFPS"
          deltaPct={`+${stats.newUsersWeek}`}
          deltaDir="up"
        />
        <Stat
          tone="bad"
          label="Accesos denegados"
          value={stats.deniedToday}
          icon="ban"
          foot="En el día"
          deltaPct={stats.deniedToday > 0 ? `${stats.deniedToday}` : '0'}
          deltaDir={stats.deniedToday > 0 ? 'down' : 'flat'}
        />
      </div>

      <div className="grid-2" style={{marginBottom: 18, marginTop: 20}}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Flujo de ingresos · últimas 24 horas</h3>
              <div className="card-sub">Entradas registradas por hora en {ENTRY_GATE}</div>
            </div>
            <span style={{display:'inline-flex', alignItems:'center', gap:6, fontSize: 12, color:'var(--text-muted)'}}>
              <span style={{width:10, height:10, borderRadius:3, background:'var(--brand)'}}></span> Ingresos
            </span>
          </div>
          <div className="card-body">
            <div className="bars bars-wrap">
              {hourly.map((v, i) => {
                const h = (v / hourlyMax) * 100;
                return (
                  <div key={i} className="bar" style={{height: '100%'}}>
                    <div className="fill" style={{height: `${h}%`}}></div>
                    {i % 3 === 0 && <span className="lbl">{pad2(i)}:00</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Distribución por tipo</h3>
              <div className="card-sub">Ingresos del día</div>
            </div>
          </div>
          <div className="card-body">
            <div className="donut-wrap">
              {totalVehDist === 0 ? (
                <div className="empty" style={{padding: '40px 10px', width: '100%', textAlign: 'center'}}>
                  Sin ingresos hoy todavía · la gráfica se llena con las lecturas reales del lector
                </div>
              ) : (
              <React.Fragment>
              <div className="donut" style={{
                background: `conic-gradient(
                  ${distLive[0].color} 0% ${(distLive[0].value/totalVehDist)*100}%,
                  ${distLive[1].color} ${(distLive[0].value/totalVehDist)*100}% ${((distLive[0].value+distLive[1].value)/totalVehDist)*100}%,
                  ${distLive[2].color} ${((distLive[0].value+distLive[1].value)/totalVehDist)*100}% 100%
                )`
              }}>
                <div className="center">
                  <b>{totalVehDist}</b>
                  <span>Hoy</span>
                </div>
              </div>
              <div className="legend">
                {distLive.map((d) => (
                  <div className="row" key={d.label}>
                    <span className="sw" style={{background: d.color}}></span>
                    <span style={{display:'inline-flex', alignItems:'center', gap: 6}}>
                      <Icon name={vehicleIconName(d.type)} size={13} />
                      {d.label}
                    </span>
                    <span className="pct">{d.value}</span>
                  </div>
                ))}
                <div style={{borderTop:'1px solid var(--border)', marginTop:4, paddingTop:8, fontSize:12, color:'var(--text-muted)'}}>
                  Total semana
                  <b style={{color:'var(--text)', float:'right', fontFamily:'var(--font-mono)'}}>{weekTotal}</b>
                </div>
              </div>
              </React.Fragment>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Actividad reciente</h3>
              <div className="card-sub">Últimos 6 ingresos por {ENTRY_GATE}</div>
            </div>
            <button className="btn btn-ghost" onClick={() => onNavigate('historial')}>
              Ver todo <Icon name="arrow-right" size={12} />
            </button>
          </div>
          <div className="table-wrap">
            {recentLog.length === 0 ? (
              <div className="empty" style={{padding: '36px 16px', textAlign: 'center'}}>
                Aún no hay ingresos registrados · aparecerán aquí cuando el lector RFID registre la primera tarjeta
              </div>
            ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Usuario</th>
                  <th>Tipo</th>
                  <th>Placa</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentLog.map((r) => (
                  <tr key={r.id}>
                    <td className="time">{formatTime(r.time).slice(0,5)}</td>
                    <td>
                      <div style={{fontWeight: 500}}>{r.name}</div>
                      <div style={{fontSize:11.5, color:'var(--text-muted)'}}>{r.code} · {r.role}</div>
                    </td>
                    <td>
                      <span className="veh-chip">
                        <Icon name={vehicleIconName(r.vehicleType)} size={14} />
                        {r.vehicleType}
                      </span>
                    </td>
                    <td className="mono" style={{color: r.plate ? 'var(--text)' : 'var(--text-dim)'}}>{r.plate || '—'}</td>
                    <td>
                      <Badge tone={r.status === 'Permitido' ? 'ok' : 'bad'}>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Ingresos por día · semana actual</h3>
              <div className="card-sub">{weekTotal} ingresos permitidos en los últimos 7 días</div>
            </div>
          </div>
          <div className="card-body">
            <div style={{display:'flex', alignItems:'flex-end', gap: 14, height: 180, paddingBottom: 24, position:'relative'}}>
              {weekDays.map((d, i) => {
                const v = weekCounts[i];
                const h = (v / weekMax) * 100;
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                  <div key={i} style={{flex: 1, position:'relative', height:'100%', display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'center'}}>
                    <div style={{
                      width: '100%',
                      height: `${h}%`,
                      background: isToday ? 'linear-gradient(180deg, var(--brand), var(--brand-deep))' : 'var(--brand-tint)',
                      borderRadius: '6px 6px 0 0',
                      minHeight: 4,
                      position:'relative',
                    }}>
                      <span style={{position:'absolute', top: -18, left: 0, right: 0, textAlign:'center', fontSize: 11, fontWeight: 600, color: isToday ? 'var(--brand)' : 'var(--text-muted)', fontVariantNumeric:'tabular-nums'}}>{v}</span>
                    </div>
                    <span style={{position:'absolute', bottom: -22, fontSize: 11, color: isToday ? 'var(--brand)' : 'var(--text-muted)', textTransform:'capitalize', fontWeight: isToday ? 600 : 500}}>
                      {dayLabel(d)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{marginTop: 14, padding: 12, background:'var(--surface-2)', borderRadius: 8, fontSize: 12.5, color:'var(--text-muted)', display:'flex', gap: 10, alignItems:'center'}}>
              <Icon name="clock" size={16} />
              <span>Última actualización <b style={{color:'var(--text)', fontFamily:'var(--font-mono)'}}>{formatTime(new Date())}</b></span>
              <span style={{marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:5, color: dbMode === 'firebase' ? 'var(--ok)' : 'var(--warn)'}}>
                <span style={{width:7, height:7, borderRadius:'50%', background: dbMode === 'firebase' ? 'var(--ok)' : 'var(--warn)'}}></span>
                {dbMode === 'firebase' ? 'Sincronizado con la nube' : 'Modo local'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const pad2 = (n) => String(n).padStart(2, '0');

window.DashboardView = DashboardView;

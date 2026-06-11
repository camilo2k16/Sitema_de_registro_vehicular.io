/* Registro view — SIPAV-UFPS */

const RegistroView = ({ users, actions, editingUser, setEditingUser }) => {
  const toast = useToast();
  const blank = {
    code: '', name: '', email: '', faculty: '', program: '',
    role: 'Estudiante',
    plate: '', vehicleType: 'Carro', brand: '', color: '',
    uid: '', status: 'Activo',
  };
  const [form, setForm] = React.useState(editingUser || blank);
  const [errors, setErrors] = React.useState({});
  const [scanning, setScanning] = React.useState(false);

  React.useEffect(() => {
    if (editingUser) setForm(editingUser);
  }, [editingUser]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const isPed = form.vehicleType === 'Peatón';

  const validate = () => {
    const e = {};
    if (!form.code) e.code = 'Requerido';
    if (!form.name) e.name = 'Requerido';
    if (!form.email) e.email = 'Requerido';
    else if (!/.+@ufps\.edu\.co$/i.test(form.email)) e.email = 'Debe ser @ufps.edu.co';
    if (!form.faculty) e.faculty = 'Requerido';
    if (!form.program) e.program = 'Requerido';
    if (!isPed) {
      if (!form.plate) e.plate = 'Requerido';
      else if (!/^[A-Z]{3}\d{3}$/.test(form.plate)) e.plate = 'Formato: AAA000';
      if (!form.brand) e.brand = 'Requerido';
      if (!form.color) e.color = 'Requerido';
    }
    if (!form.uid) e.uid = 'Escanee la tarjeta RFID';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) {
      toast({ tone: 'bad', title: 'Revise los campos', sub: 'Hay datos incompletos o con formato inválido' });
      return;
    }
    const cleaned = isPed ? { ...form, plate: '', brand: '', color: '' } : form;
    const subText = isPed ? `${form.name} · Peatón` : `${form.name} · ${form.plate}`;
    if (editingUser) {
      actions.updateUser(editingUser.id, { ...editingUser, ...cleaned })
        .then(() => toast({ tone: 'ok', title: 'Usuario actualizado', sub: subText }))
        .catch((e) => toast({ tone: 'bad', title: 'Error al guardar', sub: String(e.message || e) }));
    } else {
      actions.addUser({ blocked: false, ...cleaned })
        .then(() => toast({ tone: 'ok', title: 'Registro exitoso', sub: subText }))
        .catch((e) => toast({ tone: 'bad', title: 'Error al registrar', sub: String(e.message || e) }));
    }
    setForm(blank);
    setEditingUser(null);
    setErrors({});
  };

  const scan = () => {
    setScanning(true);
    actions.captureScan()
      .then((uid) => {
        set('uid', uid);
        setScanning(false);
        toast({ tone: 'ok', title: 'RFID leído', sub: `UID ${uid} capturado` });
      })
      .catch(() => {
        setScanning(false);
        toast({ tone: 'bad', title: 'Sin lectura', sub: 'No se detectó ninguna tarjeta. Acerque la tarjeta al lector e intente de nuevo.' });
      });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>{editingUser ? 'Editar registro' : 'Nuevo registro de usuario y vehículo'}</h2>
          <div className="page-sub">
            {editingUser ? `Editando: ${editingUser.name}` : 'Vincula estudiantes, docentes o administrativos con su vehículo y tarjeta RFID'}
          </div>
        </div>
        {editingUser && (
          <button className="btn" onClick={() => { setEditingUser(null); setForm(blank); setErrors({}); }}>
            <Icon name="x" size={14} /> Cancelar edición
          </button>
        )}
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-body">
            {/* Section 1 */}
            <div className="form-section">
              <h4><span className="num">1</span> Información del usuario</h4>
              <div className="form-grid">
                <Field label="Código institucional" required err={errors.code}>
                  <input value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="1152345" />
                </Field>
                <Field label="Tipo de usuario" required>
                  <div className="radio-row">
                    {['Estudiante', 'Docente', 'Administrativo'].map((r) => (
                      <label key={r} className={`radio-pill ${form.role === r ? 'checked' : ''}`}>
                        <input type="radio" checked={form.role === r} onChange={() => set('role', r)} />
                        {r}
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Nombre completo" required err={errors.name} full>
                  <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej. Juan Pérez Quintero" />
                </Field>
                <Field label="Correo institucional" required err={errors.email} full hint="Debe terminar en @ufps.edu.co">
                  <input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="usuario@ufps.edu.co" />
                </Field>
                <Field label="Facultad" required err={errors.faculty}>
                  <select value={form.faculty} onChange={(e) => { set('faculty', e.target.value); set('program', ''); }}>
                    <option value="">Seleccione…</option>
                    {FACULTIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
                <Field label="Programa académico" required err={errors.program}>
                  <select value={form.program} onChange={(e) => set('program', e.target.value)} disabled={!form.faculty}>
                    <option value="">{form.faculty ? 'Seleccione…' : 'Elija facultad primero'}</option>
                    {(PROGRAMS[form.faculty] || []).map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>
            </div>

            {/* Section 2 */}
            <div className="form-section">
              <h4><span className="num">2</span> Información del vehículo o acceso</h4>
              <div className="form-grid">
                <Field label="Tipo de acceso" required full>
                  <div className="radio-row">
                    {['Carro', 'Moto', 'Peatón'].map((t) => (
                      <label key={t} className={`radio-pill ${form.vehicleType === t ? 'checked' : ''}`}>
                        <input type="radio" checked={form.vehicleType === t} onChange={() => set('vehicleType', t)} />
                        <Icon name={vehicleIconName(t)} size={14} />
                        {t}
                      </label>
                    ))}
                  </div>
                </Field>
                {isPed ? (
                  <Field full>
                    <div style={{padding: 14, background:'var(--surface-2)', border:'1px dashed var(--border)', borderRadius: 8, display:'flex', gap: 12, alignItems:'center'}}>
                      <span style={{width: 36, height: 36, borderRadius: 8, background:'var(--info-bg)', color:'var(--info)', display:'grid', placeItems:'center', flexShrink: 0}}>
                        <Icon name="walk" size={18} />
                      </span>
                      <div style={{fontSize: 12.5, color:'var(--text-muted)', lineHeight: 1.5}}>
                        Los peatones no requieren placa, marca ni color.
                        Solo se vincula la tarjeta RFID con el usuario.
                      </div>
                    </div>
                  </Field>
                ) : (
                  <>
                    <Field label="Placa" required err={errors.plate} hint="Formato AAA000 (sin espacios)">
                      <input
                        value={form.plate}
                        onChange={(e) => set('plate', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                        placeholder="ABC123"
                        style={{fontFamily:'var(--font-mono)', letterSpacing: '0.1em', textTransform:'uppercase'}}
                      />
                    </Field>
                    <Field label="Marca" required err={errors.brand}>
                      <input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="Chevrolet, Yamaha…" />
                    </Field>
                    <Field label="Color" required err={errors.color}>
                      <select value={form.color} onChange={(e) => set('color', e.target.value)}>
                        <option value="">Seleccione…</option>
                        {COLORS_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                  </>
                )}
              </div>
            </div>

            {/* Section 3 */}
            <div className="form-section">
              <h4><span className="num">3</span> Tarjeta RFID</h4>
              <div className="form-grid">
                <Field label="UID de la tarjeta" required err={errors.uid} full>
                  <div style={{display:'flex', gap: 8}}>
                    <input
                      value={form.uid}
                      onChange={(e) => set('uid', e.target.value.toUpperCase())}
                      placeholder="-- -- -- --"
                      style={{flex: 1, fontFamily:'var(--font-mono)', letterSpacing: '0.08em'}}
                    />
                    <button type="button" className="btn" onClick={scan} disabled={scanning}>
                      <Icon name="rfid" size={14} />
                      {scanning ? 'Esperando tarjeta…' : 'Escanear ahora'}
                    </button>
                  </div>
                </Field>
                <Field label="Estado" full>
                  <div className="radio-row">
                    {['Activo', 'Inactivo'].map((s) => (
                      <label key={s} className={`radio-pill ${form.status === s ? 'checked' : ''}`}>
                        <input type="radio" checked={form.status === s} onChange={() => set('status', s)} />
                        <span className="dot" style={{width:6, height:6, borderRadius:'50%', background: s === 'Activo' ? 'var(--ok)' : 'var(--bad)'}}></span>
                        {s}
                      </label>
                    ))}
                  </div>
                </Field>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => { setForm(blank); setErrors({}); }}>
                <Icon name="refresh" size={14} /> Limpiar
              </button>
              {editingUser && (
                <button className="btn btn-danger" onClick={() => {
                  actions.deleteUser(editingUser.id)
                    .then(() => toast({ tone: 'bad', title: 'Registro eliminado', sub: editingUser.name }));
                  setEditingUser(null); setForm(blank);
                }}>
                  <Icon name="trash" size={14} /> Eliminar
                </button>
              )}
              <button className="btn btn-primary" onClick={submit}>
                <Icon name="check" size={14} stroke={2.5} />
                {editingUser ? 'Guardar cambios' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>

        <RegistroPreview form={form} scanning={scanning} />
      </div>
    </div>
  );
};

const Field = ({ label, required, err, hint, full, children }) => (
  <div className={`field ${full ? 'full' : ''} ${err ? 'has-err' : ''}`}>
    <label>
      <span>{label} {required && <span className="req">*</span>}</span>
      {hint && !err && <span className="hint">{hint}</span>}
    </label>
    {children}
    {err && <span className="err-msg">{err}</span>}
  </div>
);

const RegistroPreview = ({ form, scanning }) => {
  const isPed = form.vehicleType === 'Peatón';
  return (
    <div style={{display:'flex', flexDirection:'column', gap: 18}}>
      <div className="card">
        <div className="card-head">
          <h3>Vista previa de la tarjeta RFID</h3>
          <Badge tone={form.status === 'Activo' ? 'ok' : 'bad'}>{form.status || 'Activo'}</Badge>
        </div>
        <div className="card-body">
          <RfidCardPreview form={form} scanning={scanning} isPed={isPed} />
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <h3>Resumen del registro</h3>
          <span style={{fontSize:11.5, color:'var(--text-muted)'}}>Datos validados en vivo</span>
        </div>
        <div className="card-body" style={{display:'flex', flexDirection:'column', gap: 10}}>
          <Row label="Código">{form.code || '—'}</Row>
          <Row label="Usuario">{form.name || '—'}</Row>
          <Row label="Rol">{form.role}</Row>
          <Row label="Facultad / Programa">{form.faculty ? `${form.faculty} · ${form.program || '—'}` : '—'}</Row>
          <Row label="Tipo de acceso">
            <span style={{display:'inline-flex', alignItems:'center', gap: 6}}>
              <Icon name={vehicleIconName(form.vehicleType)} size={14} />
              {form.vehicleType}{!isPed && ` · ${form.brand || '—'} · ${form.color || '—'}`}
            </span>
          </Row>
          {!isPed && <Row label="Placa" mono>{form.plate || '— — —'}</Row>}
          <Row label="UID RFID" mono>{form.uid || '-- -- -- --'}</Row>
        </div>
      </div>

      <div className="card" style={{background:'var(--surface-2)'}}>
        <div className="card-body" style={{display:'flex', gap:12, alignItems:'flex-start'}}>
          <span style={{width:32, height:32, borderRadius:8, background:'var(--info-bg)', color:'var(--info)', display:'grid', placeItems:'center', flexShrink:0}}>
            <Icon name="shield" size={16} />
          </span>
          <div style={{fontSize: 12.5, color:'var(--text-muted)', lineHeight: 1.55}}>
            La información se vincula a la tarjeta RFID y se guarda en la base de datos.
            Al registrar, el usuario podrá ingresar por {window.ENTRY_GATE || 'La Casona'} con su tarjeta inmediatamente.
            Los datos personales se tratan conforme a la Ley 1581 de 2012.
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, children, mono }) => (
  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', gap: 12, paddingBottom: 8, borderBottom:'1px dashed var(--border)'}}>
    <span style={{fontSize: 12, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em'}}>{label}</span>
    <span style={{fontSize: 13, fontWeight: 500, textAlign:'right', fontFamily: mono ? 'var(--font-mono)' : 'inherit'}}>{children}</span>
  </div>
);

const RfidCardPreview = ({ form, scanning, isPed }) => (
  <div style={{
    background: 'linear-gradient(135deg, #1a1f2b 0%, #0f1219 60%, #2a0608 100%)',
    borderRadius: 14,
    padding: 20,
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    aspectRatio: '1.586',
    boxShadow: '0 8px 24px rgba(15,18,25,0.18)',
  }}>
    {/* corner pattern */}
    <div style={{position:'absolute', top:-30, right:-30, width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle, rgba(227,6,19,0.35), transparent 60%)'}}></div>
    <div style={{position:'absolute', bottom:0, left:0, right:0, height:1, background:'linear-gradient(90deg, transparent, rgba(227,6,19,0.6), transparent)'}}></div>

    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', position:'relative'}}>
      <div>
        <div style={{fontSize: 9.5, letterSpacing:'0.12em', color:'rgba(255,255,255,0.5)', textTransform:'uppercase'}}>Universidad Francisco de Paula Santander</div>
        <div style={{fontSize: 14, fontWeight: 700, marginTop: 2, letterSpacing:'-0.01em'}}>SIPAV · Tarjeta de acceso</div>
      </div>
      <div style={{width: 32, height: 24, background:'linear-gradient(135deg, #d4af37, #8a6914)', borderRadius: 4, position:'relative'}}>
        <div style={{position:'absolute', inset: 3, border:'1px solid rgba(0,0,0,0.3)', borderRadius: 2}}></div>
      </div>
    </div>

    <div style={{marginTop: 20, position:'relative'}}>
      <div style={{fontSize: 9.5, letterSpacing:'0.12em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase'}}>UID</div>
      <div style={{fontFamily:'var(--font-mono)', fontSize: 18, letterSpacing:'0.12em', fontWeight: 600, marginTop: 2, minHeight: 24, transition:'opacity 0.3s', opacity: scanning ? 0.4 : 1}}>
        {scanning ? '·· ·· ·· ··' : (form.uid || '-- -- -- --')}
      </div>
    </div>

    <div style={{position:'absolute', bottom: 16, left: 20, right: 20, display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
      <div>
        <div style={{fontSize: 9.5, letterSpacing:'0.12em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase'}}>Titular</div>
        <div style={{fontSize: 12, fontWeight: 600, marginTop: 2, maxWidth: 180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
          {form.name || 'Nombre del titular'}
        </div>
      </div>
      <div style={{textAlign:'right'}}>
        <div style={{fontSize: 9.5, letterSpacing:'0.12em', color:'rgba(255,255,255,0.4)', textTransform:'uppercase'}}>{isPed ? 'Tipo' : 'Placa'}</div>
        <div style={{fontFamily: isPed ? 'inherit' : 'var(--font-mono)', fontSize: 12, fontWeight: 600, marginTop: 2, letterSpacing: isPed ? 'normal' : '0.08em'}}>
          {isPed ? 'Peatón' : (form.plate || '— — —')}
        </div>
      </div>
    </div>
  </div>
);

window.RegistroView = RegistroView;

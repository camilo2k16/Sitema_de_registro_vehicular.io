/* Pantalla de inicio de sesión — SIPAV-UFPS */

const LOGIN_USER = 'liliana';
const LOGIN_PASS = 'UFPSeduacion';
const SESSION_KEY = 'sipav.session.v1';

const LoginView = ({ onLogin, systemName }) => {
  const [user, setUser] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [error, setError] = React.useState('');
  const [shaking, setShaking] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    const u = user.trim().toLowerCase();
    if (u === LOGIN_USER && pass === LOGIN_PASS) {
      try { localStorage.setItem(SESSION_KEY, JSON.stringify({ user: 'liliana', name: 'Liliana', ts: Date.now() })); } catch (err) {}
      setError('');
      onLogin({ user: 'liliana', name: 'Liliana' });
    } else {
      setError(u !== LOGIN_USER ? 'Usuario no reconocido' : 'Contraseña incorrecta');
      setShaking(true);
      setTimeout(() => setShaking(false), 450);
    }
  };

  return (
    <div className="login-stage">
      <div className={`login-card ${shaking ? 'shake' : ''}`}>
        <div className="login-brand">
          <div className="login-logo">
            <img src="assets/ufps-logo.png" alt="UFPS" />
          </div>
          <div className="login-title">{systemName || 'SIPAV'}</div>
          <div className="login-sub">UFPS · Sistema de Acceso Vehicular · La Casona</div>
        </div>

        <form onSubmit={submit} className="login-form">
          <label className="login-field">
            <span>Usuario</span>
            <div className="login-input">
              <Icon name="users" size={15} />
              <input
                value={user}
                onChange={(e) => { setUser(e.target.value); setError(''); }}
                placeholder="Nombre de usuario"
                autoComplete="username"
                autoFocus
              />
            </div>
          </label>

          <label className="login-field">
            <span>Contraseña</span>
            <div className="login-input">
              <Icon name="shield" size={15} />
              <input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(''); }}
                placeholder="••••••••••"
                autoComplete="current-password"
              />
              <button type="button" className="login-eye" onClick={() => setShowPass(!showPass)} title={showPass ? 'Ocultar' : 'Mostrar'}>
                <Icon name="eye" size={15} />
              </button>
            </div>
          </label>

          {error && (
            <div className="login-error">
              <Icon name="ban" size={14} /> {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary login-btn">
            <Icon name="login" size={15} /> Ingresar
          </button>
        </form>

        <div className="login-foot">
          <span className="pulse-dot"></span>
          Acceso restringido · Personal autorizado
        </div>
      </div>
    </div>
  );
};

/* Sesión persistida: devuelve la sesión guardada o null */
function getSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}
function clearSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
}

Object.assign(window, { LoginView, getSavedSession, clearSession });

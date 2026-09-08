import { useState } from 'react';
import {
  Navigate,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

function defaultPathForUser(user) {
  if (user?.role === 'WAREHOUSE') {
    return '/inventory';
  }

  if (user?.role === 'ACCOUNTING') {
    return '/cashier';
  }

  return '/';
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) {
    return (
      <Navigate
        to={defaultPathForUser(user)}
        replace
      />
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setBusy(true);
    setError('');

    try {
      const loggedInUser =
        await login(
          email,
          password,
        );

      navigate(
        defaultPathForUser(
          loggedInUser,
        ),
      );
    } catch {
      setError('E-posta veya şifre hatalı.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          TB
        </div>

        <h1>Tamir Bakım</h1>
        <p>Servis yönetim paneline giriş yapın.</p>

        <form onSubmit={handleSubmit}>
          <label>
            E-posta
            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="ornek@servis.com"
              required
            />
          </label>

          <label>
            Şifre
            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />
          </label>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            className="primary-button"
            disabled={busy}
          >
            {busy ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
}


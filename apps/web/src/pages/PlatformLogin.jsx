import {
  Navigate,
  useNavigate,
} from 'react-router-dom';
import {
  useState,
} from 'react';

import { useAuth } from '../auth/AuthContext';

export default function PlatformLogin() {
  const {
    user,
    platformLogin,
  } = useAuth();

  const navigate =
    useNavigate();

  const [email, setEmail] =
    useState('');
  const [password, setPassword] =
    useState('');
  const [error, setError] =
    useState('');
  const [busy, setBusy] =
    useState(false);

  if (
    user?.actorType ===
    'PLATFORM'
  ) {
    return (
      <Navigate
        to="/platform"
        replace
      />
    );
  }

  async function submit(event) {
    event.preventDefault();

    setBusy(true);
    setError('');

    try {
      await platformLogin(
        email,
        password,
      );

      navigate(
        '/platform',
      );
    } catch (err) {
      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'Ajans girişi başarısız.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="platform-login-page">
      <div className="platform-login-card">
        <div className="platform-login-logo">
          İG
        </div>

        <span className="platform-kicker">
          İGESA PLATFORM
        </span>

        <h1>
          Ajans Yönetim Merkezi
        </h1>

        <p>
          İşletme paketlerini, modül
          yetkilerini ve müşteri
          hesaplarını yönetin.
        </p>

        <form onSubmit={submit}>
          <label>
            E-posta
            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            Şifre
            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
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
            {busy
              ? 'Giriş yapılıyor...'
              : 'Ajans Paneline Gir'}
          </button>
        </form>
      </div>
    </div>
  );
}

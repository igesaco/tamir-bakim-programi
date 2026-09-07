import {
  useState,
} from 'react';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

const roleLabels = {
  OWNER: 'Kurucu',
  MANAGER: 'Yönetici',
  SERVICE_ADVISOR:
    'Servis Danışmanı',
  TECHNICIAN:
    'Teknik Bakım Personeli',
};

export default function Account() {
  const {
    user,
    logout,
  } = useAuth();

  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] =
    useState('');
  const [error, setError] =
    useState('');
  const [busy, setBusy] =
    useState(false);

  async function changePassword(e) {
    e.preventDefault();

    setMessage('');
    setError('');

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setError(
        'Yeni şifreler birbiriyle eşleşmiyor.',
      );
      return;
    }

    setBusy(true);

    try {
      await api.patch(
        '/users/me/password',
        {
          currentPassword:
            passwordForm.currentPassword,
          newPassword:
            passwordForm.newPassword,
        },
      );

      setMessage(
        'Şifre güncellendi. Yeniden giriş ekranına yönlendiriliyorsunuz.',
      );

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setTimeout(() => {
        logout();
        window.location.href =
          '/login';
      }, 1200);
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Şifre değiştirilemedi.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Hesabım</h1>
          <p>
            Hesap bilgilerinizi ve
            şifrenizi yönetin.
          </p>
        </div>
      </div>

      {message && (
        <div className="page-message success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="page-message error-message">
          {error}
        </div>
      )}

      <div className="content-grid">
        <div className="panel-card">
          <h3>Hesap Bilgileri</h3>

          <div className="detail-info">
            <div>
              <span>Ad Soyad</span>
              <strong>
                {user?.firstName}{' '}
                {user?.lastName}
              </strong>
            </div>

            <div>
              <span>E-posta</span>
              <strong>
                {user?.email || '-'}
              </strong>
            </div>

            <div>
              <span>Rol</span>
              <strong>
                {roleLabels[
                  user?.role
                ] ||
                  user?.role ||
                  '-'}
              </strong>
            </div>

            <div>
              <span>Şube</span>
              <strong>
                {user?.branch?.name ||
                  '-'}
              </strong>
            </div>

            <div>
              <span>İşletme</span>
              <strong>
                {user?.organization
                  ?.name ||
                  '-'}
              </strong>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Şifre Değiştir</h3>

          <form
            className="form-grid"
            onSubmit={changePassword}
          >
            <input
              className="full"
              type="password"
              placeholder="Mevcut şifre"
              value={
                passwordForm.currentPassword
              }
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword:
                    e.target.value,
                })
              }
              required
            />

            <input
              type="password"
              minLength="8"
              placeholder="Yeni şifre"
              value={
                passwordForm.newPassword
              }
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword:
                    e.target.value,
                })
              }
              required
            />

            <input
              type="password"
              minLength="8"
              placeholder="Yeni şifre tekrar"
              value={
                passwordForm.confirmPassword
              }
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword:
                    e.target.value,
                })
              }
              required
            />

            <button
              className="primary-button full"
              disabled={busy}
            >
              {busy
                ? 'Güncelleniyor...'
                : 'Şifremi Değiştir'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

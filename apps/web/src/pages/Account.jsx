import {
  useState,
} from 'react';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { getSavedTheme, saveTheme } from '../utils/theme';

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

  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme(user?.id));

  function handleThemeChange(newTheme) {
    setCurrentTheme(newTheme);
    saveTheme(newTheme, user?.id);
  }

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

      {/* Görünüm ve Tema */}
      <div className="panel-card" style={{ marginBottom: '20px' }}>
        <div className="card-title-row">
          <div>
            <h3>Görünüm ve Tema</h3>
            <p className="muted-text">
              Programın renk temasını seçin. Seçiminiz anında uygulanır ve bu cihazda hatırlanır.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '14px' }}>
          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '20px',
              borderRadius: '12px',
              border: currentTheme === 'dark' ? '2px solid #3b82f6' : '1px solid #334155',
              background: currentTheme === 'dark' ? 'rgba(59, 130, 246, 0.12)' : '#0f172a',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '32px' }}>🌙</span>
            <div>
              <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>Koyu Tema</strong>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>Göz yormayan koyu gri kurumsal arayüz</span>
            </div>
            {currentTheme === 'dark' && (
              <span style={{ fontSize: '11px', background: '#3b82f6', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
                ✓ Aktif Tema
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '20px',
              borderRadius: '12px',
              border: currentTheme === 'light' ? '2px solid #3b82f6' : '1px solid #cbd5e1',
              background: currentTheme === 'light' ? 'rgba(59, 130, 246, 0.08)' : '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ fontSize: '32px' }}>☀️</span>
            <div>
              <strong style={{ fontSize: '15px', display: 'block', marginBottom: '4px' }}>Aydınlık Tema</strong>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Ferah ve kurumsal beyaz arayüz</span>
            </div>
            {currentTheme === 'light' && (
              <span style={{ fontSize: '11px', background: '#3b82f6', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontWeight: 600 }}>
                ✓ Aktif Tema
              </span>
            )}
          </button>
        </div>
      </div>

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

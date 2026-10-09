import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { getSavedTheme, saveTheme } from '../utils/theme';

export default function Settings() {
  const { user, logout } = useAuth();
  const [currentTheme, setCurrentTheme] = useState(() => getSavedTheme(user?.id));
  const [organization, setOrganization] = useState(null);
  const [saved, setSaved] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [whatsappCode, setWhatsappCode] = useState('');
  const [whatsappSenderPhone, setWhatsappSenderPhone] = useState('');
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [whatsappError, setWhatsappError] = useState('');
  const [whatsappBusy, setWhatsappBusy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    api.get('/organizations/me')
      .then((response) => {
        setOrganization(response.data);
      });
  }, []);

  if (!organization) {
    return <div>Ayarlar yükleniyor...</div>;
  }

  async function save(e) {
    e.preventDefault();

    const response = await api.patch(
      '/organizations/me',
      {
        name: organization.name,
        taxNumber:
          organization.taxNumber || undefined,
        taxOffice:
          organization.taxOffice || undefined,
        address:
          organization.address || undefined,
        phone:
          organization.phone || undefined,
        whatsappPhone:
          organization.whatsappPhone || undefined,
        email:
          organization.email || undefined,
      },
    );

    setOrganization({
      ...organization,
      ...response.data,
    });

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  async function changePassword(e) {
    e.preventDefault();

    setPasswordMessage('');
    setPasswordError('');

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setPasswordError(
        'Yeni şifreler birbiriyle eşleşmiyor.',
      );
      return;
    }

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

      setPasswordMessage(
        'Şifre güncellendi. Güvenlik için yeniden giriş yapmanız gerekiyor.',
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
      }, 1500);
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setPasswordError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Şifre değiştirilemedi.',
      );
    }
  }

  async function confirmWhatsapp(e) {
    e.preventDefault();
    setWhatsappMessage('');
    setWhatsappError('');
    setWhatsappBusy(true);

    try {
      const response = await api.post(
        '/customer-portal/access/whatsapp/manual-confirm',
        {
          code: whatsappCode.trim(),
          senderPhone: whatsappSenderPhone.trim(),
        },
      );
      setWhatsappMessage(
        `${response.data.customer} (${response.data.plate}) için giriş onaylandı.`,
      );
      setWhatsappCode('');
      setWhatsappSenderPhone('');
    } catch (err) {
      const detail = err?.response?.data?.message;
      setWhatsappError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail || 'WhatsApp kodu onaylanamadı.',
      );
    } finally {
      setWhatsappBusy(false);
    }
  }

  function handleThemeChange(newTheme) {
    setCurrentTheme(newTheme);
    saveTheme(newTheme, user?.id);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Ayarlar</h1>
          <p>İşletme ve hesap bilgilerini yönetin.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="panel-card" style={{ gridColumn: '1 / -1' }}>
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

        {['OWNER', 'MANAGER', 'SERVICE_ADVISOR'].includes(user?.role) && (
          <div className="panel-card">
            <h3>WhatsApp Müşteri Giriş Onayı</h3>
            <p className="muted-text">
              WhatsApp'ta mesajı gönderen numarayı ve TB- ile başlayan kodu girin. Numara müşteri kaydıyla eşleşmeden giriş açılmaz.
            </p>
            <form className="form-grid" onSubmit={confirmWhatsapp}>
              <input
                className="full"
                placeholder="TB-123456"
                value={whatsappCode}
                onChange={(e) =>
                  setWhatsappCode(
                    e.target.value.toUpperCase().replace(/[^TB\d-]/g, ''),
                  )
                }
                required
              />
              <input
                className="full"
                inputMode="tel"
                placeholder="Mesajı gönderen telefon (05xx...)"
                value={whatsappSenderPhone}
                onChange={(e) =>
                  setWhatsappSenderPhone(e.target.value.replace(/[^\d+ ()-]/g, ''))
                }
                required
              />
              <button
                className="primary-button full"
                disabled={whatsappBusy}
              >
                {whatsappBusy ? 'Onaylanıyor...' : 'Müşteri Girişini Onayla'}
              </button>
              {whatsappMessage && (
                <div className="success-message full">{whatsappMessage}</div>
              )}
              {whatsappError && (
                <div className="error-message full">{whatsappError}</div>
              )}
            </form>
          </div>
        )}
        <div className="panel-card">
          <h3>İşletme Bilgileri</h3>

          <form className="form-grid" onSubmit={save}>
            <input
              className="full"
              placeholder="İşletme adı"
              value={organization.name || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Telefon"
              value={organization.phone || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  phone: e.target.value,
                })
              }
            />

            <input
              placeholder="WhatsApp numarası"
              value={organization.whatsappPhone || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  whatsappPhone:
                    e.target.value,
                })
              }
            />

            <input
              type="email"
              placeholder="E-posta"
              value={organization.email || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  email: e.target.value,
                })
              }
            />

            <input
              placeholder="Vergi numarası"
              value={organization.taxNumber || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  taxNumber: e.target.value,
                })
              }
            />

            <input
              placeholder="Vergi dairesi"
              value={organization.taxOffice || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  taxOffice: e.target.value,
                })
              }
            />

            <textarea
              className="full"
              placeholder="Fatura / işletme adresi"
              value={organization.address || ''}
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  address: e.target.value,
                })
              }
            />

            <button className="primary-button full">
              Değişiklikleri Kaydet
            </button>

            {saved && (
              <div className="success-message full">
                Bilgiler kaydedildi.
              </div>
            )}
          </form>
        </div>

        <div className="panel-card">
          <h3>Hesabım</h3>

          <div className="settings-info">
            <div>
              <span>Ad Soyad</span>
              <strong>
                {user?.firstName} {user?.lastName}
              </strong>
            </div>

            <div>
              <span>E-posta</span>
              <strong>{user?.email}</strong>
            </div>

            <div>
              <span>Rol</span>
              <strong>{user?.role}</strong>
            </div>

            <div>
              <span>Şube</span>
              <strong>
                {user?.branch?.name || '-'}
              </strong>
            </div>
          </div>

          <form
            className="form-grid spaced-card"
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

            <button className="primary-button full">
              Şifremi Değiştir
            </button>

            {passwordMessage && (
              <div className="success-message full">
                {passwordMessage}
              </div>
            )}

            {passwordError && (
              <div className="error-message full">
                {passwordError}
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [saved, setSaved] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
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

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Ayarlar</h1>
          <p>İşletme ve hesap bilgilerini yönetin.</p>
        </div>
      </div>

      <div className="settings-grid">
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

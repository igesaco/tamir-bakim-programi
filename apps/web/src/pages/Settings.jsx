import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

export default function Settings() {
  const {
    user,
    logout,
    refreshUser,
  } = useAuth();
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
        whatsappPhone:
          organization.whatsappPhone || undefined,
        email:
          organization.email || undefined,
        logoUrl:
          organization.logoUrl || undefined,
        panelTitle:
          organization.panelTitle || undefined,
        primaryColor:
          organization.primaryColor || '#F59E0B',
        secondaryColor:
          organization.secondaryColor || '#E9EDF2',
        sidebarColor:
          organization.sidebarColor || '#111419',
        defaultPanelMode:
          organization.defaultPanelMode || 'classic',
      },
    );

    setOrganization({
      ...organization,
      ...response.data,
    });

    await refreshUser?.();

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

        <div className="panel-card branding-settings-card">
          <div className="card-title-row">
            <div>
              <h3>Panel Tasarımı</h3>
              <p className="sub-text">
                Bu işletmeye giriş yapan personel aynı verileri,
                işletmeye özel logo ve renklerle görür.
              </p>
            </div>

            <div
              className="branding-preview-mark"
              style={{
                background:
                  organization.primaryColor ||
                  '#F59E0B',
              }}
            >
              {organization.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt="Logo önizleme"
                />
              ) : (
                organization.name
                  ?.trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((part) =>
                    part.charAt(0),
                  )
                  .join('')
                  .toLocaleUpperCase(
                    'tr-TR',
                  ) || 'TB'
              )}
            </div>
          </div>

          <form
            className="form-grid branding-form"
            onSubmit={save}
          >
            <input
              className="full"
              placeholder="Logo URL (https://...)"
              value={
                organization.logoUrl || ''
              }
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  logoUrl:
                    e.target.value,
                })
              }
            />

            <input
              className="full"
              placeholder="Panel başlığı (örn. Servis Yönetim Merkezi)"
              value={
                organization.panelTitle || ''
              }
              onChange={(e) =>
                setOrganization({
                  ...organization,
                  panelTitle:
                    e.target.value,
                })
              }
            />

            <label className="branding-color-field">
              <span>Ana renk</span>
              <div>
                <input
                  type="color"
                  value={
                    organization.primaryColor ||
                    '#F59E0B'
                  }
                  onChange={(e) =>
                    setOrganization({
                      ...organization,
                      primaryColor:
                        e.target.value,
                    })
                  }
                />
                <strong>
                  {organization.primaryColor ||
                    '#F59E0B'}
                </strong>
              </div>
            </label>

            <label className="branding-color-field">
              <span>Yazı / vurgu rengi</span>
              <div>
                <input
                  type="color"
                  value={
                    organization.secondaryColor ||
                    '#E9EDF2'
                  }
                  onChange={(e) =>
                    setOrganization({
                      ...organization,
                      secondaryColor:
                        e.target.value,
                    })
                  }
                />
                <strong>
                  {organization.secondaryColor ||
                    '#E9EDF2'}
                </strong>
              </div>
            </label>

            <label className="branding-color-field">
              <span>Sol menü rengi</span>
              <div>
                <input
                  type="color"
                  value={
                    organization.sidebarColor ||
                    '#111419'
                  }
                  onChange={(e) =>
                    setOrganization({
                      ...organization,
                      sidebarColor:
                        e.target.value,
                    })
                  }
                />
                <strong>
                  {organization.sidebarColor ||
                    '#111419'}
                </strong>
              </div>
            </label>

            <label className="branding-mode-field">
              <span>Varsayılan panel düzeni</span>
              <select
                value={
                  organization.defaultPanelMode ||
                  'classic'
                }
                onChange={(e) =>
                  setOrganization({
                    ...organization,
                    defaultPanelMode:
                      e.target.value,
                  })
                }
              >
                <option value="classic">
                  Klasik
                </option>
                <option value="desktop">
                  Masaüstü
                </option>
                <option value="focus">
                  Çalışma Alanı
                </option>
              </select>
            </label>

            <div
              className="branding-preview full"
              style={{
                '--preview-primary':
                  organization.primaryColor ||
                  '#F59E0B',
                '--preview-secondary':
                  organization.secondaryColor ||
                  '#E9EDF2',
                '--preview-sidebar':
                  organization.sidebarColor ||
                  '#111419',
              }}
            >
              <aside>
                <div className="branding-preview-logo">
                  {organization.logoUrl ? (
                    <img
                      src={organization.logoUrl}
                      alt=""
                    />
                  ) : (
                    'TB'
                  )}
                </div>

                <strong>
                  {organization.name ||
                    'İşletme'}
                </strong>
                <span>
                  {organization.panelTitle ||
                    'Yönetim Paneli'}
                </span>
              </aside>

              <main>
                <span>Dashboard</span>
                <div />
                <div />
              </main>
            </div>

            <button className="primary-button full">
              Panel Tasarımını Kaydet
            </button>
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

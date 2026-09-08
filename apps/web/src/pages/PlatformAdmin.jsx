import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

const featureLabels = {
  DASHBOARD: 'Dashboard',
  CUSTOMERS: 'Müşteriler',
  VEHICLES_QR:
    'Araçlar + QR',
  SERVICE_ORDERS:
    'İş Emirleri',
  APPOINTMENTS:
    'Randevular',
  MAINTENANCE:
    'Bakım Planlaması',
  QUOTES:
    'Teklif / Proforma',
  INVENTORY:
    'Stok',
  SUPPLIERS:
    'Tedarikçiler',
  STAFF:
    'Personel',
  BRANCHES:
    'Şubeler',
  NOTIFICATIONS:
    'Bildirimler',
  CASHIER:
    'Cari / Tahsilat',
  REPORTS:
    'Raporlar',
  SETTINGS:
    'Ayarlar',
  INSPECTIONS:
    'Araç Kabul',
  MEDIA:
    'Medya / Evrak',
  CUSTOMER_PORTAL:
    'Müşteri Portalı',
  AUDIT:
    'Denetim Kayıtları',
};

export default function PlatformAdmin() {
  const {
    user,
    enterOrganization,
    logout,
  } = useAuth();

  const [packages, setPackages] =
    useState([]);
  const [organizations, setOrganizations] =
    useState([]);
  const [selectedId, setSelectedId] =
    useState('');
  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState('');
  const [message, setMessage] =
    useState('');

  async function load() {
    const [
      packagesResponse,
      organizationsResponse,
    ] = await Promise.all([
      api.get(
        '/platform/packages',
      ),
      api.get(
        '/platform/organizations',
      ),
    ]);

    setPackages(
      packagesResponse.data,
    );
    setOrganizations(
      organizationsResponse.data,
    );

    setSelectedId(
      (current) =>
        current ||
        organizationsResponse
          .data[0]?.id ||
        '',
    );
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Ajans paneli yüklenemedi.',
      );
    });
  }, []);

  const selected =
    useMemo(
      () =>
        organizations.find(
          (item) =>
            item.id ===
            selectedId,
        ) || null,
      [
        organizations,
        selectedId,
      ],
    );

  const allFeatures =
    useMemo(
      () =>
        Object.keys(
          featureLabels,
        ),
      [],
    );

  async function setPackage(
    packageId,
  ) {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.patch(
        `/platform/organizations/${selected.id}/package`,
        {
          packageId,
        },
      );

      setMessage(
        'İşletme paketi güncellendi.',
      );

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Paket güncellenemedi.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function toggleFeature(
    feature,
  ) {
    if (!selected) {
      return;
    }

    const enabled =
      !selected.effectiveFeatures
        ?.includes(feature);

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.put(
        `/platform/organizations/${selected.id}/features/${feature}`,
        {
          enabled,
        },
      );

      setMessage(
        `${featureLabels[feature]} yetkisi güncellendi.`,
      );

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Modül yetkisi güncellenemedi.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function resetOverride(
    feature,
  ) {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.delete(
        `/platform/organizations/${selected.id}/features/${feature}`,
      );

      setMessage(
        'Modül paket varsayılanına döndürüldü.',
      );

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Özel yetki kaldırılamadı.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function enter() {
    if (!selected) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      await enterOrganization(
        selected.id,
      );

      window.location.href =
        '/';
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'İşletme paneline girilemedi.',
      );
      setBusy(false);
    }
  }

  return (
    <div className="platform-page">
      <header className="platform-header">
        <div>
          <span className="platform-kicker">
            İGESA PLATFORM
          </span>

          <h1>
            Yetki ve Paket Yönetimi
          </h1>

          <p>
            Ajans hesabı tüm
            işletmeleri ve paket
            modüllerini yönetebilir.
          </p>
        </div>

        <div className="platform-user">
          <div>
            <strong>
              {user?.firstName}{' '}
              {user?.lastName}
            </strong>
            <span>
              {user?.platformRole}
            </span>
          </div>

          <button
            className="secondary-button"
            onClick={logout}
          >
            Çıkış
          </button>
        </div>
      </header>

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

      <div className="platform-grid">
        <aside className="platform-organizations">
          <h3>
            İşletmeler
          </h3>

          <div className="platform-org-list">
            {organizations.map(
              (organization) => (
                <button
                  type="button"
                  key={
                    organization.id
                  }
                  className={
                    selectedId ===
                    organization.id
                      ? 'platform-org active'
                      : 'platform-org'
                  }
                  onClick={() =>
                    setSelectedId(
                      organization.id,
                    )
                  }
                >
                  <strong>
                    {
                      organization.name
                    }
                  </strong>

                  <span>
                    {organization.package
                      ?.name ||
                      'Paket yok'}
                  </span>

                  <small>
                    {
                      organization
                        ._count
                        ?.customers
                    }{' '}
                    müşteri ·{' '}
                    {
                      organization
                        ._count
                        ?.vehicles
                    }{' '}
                    araç
                  </small>
                </button>
              ),
            )}
          </div>
        </aside>

        <main className="platform-detail">
          {!selected ? (
            <div className="panel-card">
              İşletme seçin.
            </div>
          ) : (
            <>
              <div className="panel-card platform-org-head">
                <div>
                  <span className="platform-kicker">
                    İŞLETME
                  </span>

                  <h2>
                    {
                      selected.name
                    }
                  </h2>

                  <p>
                    {
                      selected.email ||
                      selected.phone ||
                      'İletişim bilgisi yok'
                    }
                  </p>
                </div>

                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={enter}
                >
                  İşletme Paneline Gir
                </button>
              </div>

              <div className="panel-card spaced-card">
                <div className="card-title-row">
                  <div>
                    <h3>
                      Hazır Paket
                    </h3>
                    <p className="sub-text">
                      Paket seçildiğinde
                      temel modül listesi
                      otomatik uygulanır.
                    </p>
                  </div>

                  <select
                    value={
                      selected.packageId ||
                      ''
                    }
                    disabled={busy}
                    onChange={(event) =>
                      setPackage(
                        event.target.value,
                      )
                    }
                  >
                    <option value="">
                      Paket seç
                    </option>

                    {packages.map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {
                            item.name
                          }
                        </option>
                      ),
                    )}
                  </select>
                </div>

                <div className="platform-package-cards">
                  {packages.map(
                    (item) => (
                      <div
                        className={
                          selected.packageId ===
                          item.id
                            ? 'platform-package active'
                            : 'platform-package'
                        }
                        key={
                          item.id
                        }
                      >
                        <strong>
                          {
                            item.name
                          }
                        </strong>

                        <span>
                          {
                            item.description
                          }
                        </span>

                        <small>
                          {
                            item.features
                              ?.length
                          }{' '}
                          modül
                        </small>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="panel-card spaced-card">
                <div className="card-title-row">
                  <div>
                    <h3>
                      Modül Yetkileri
                    </h3>
                    <p className="sub-text">
                      Paket dışında
                      işletmeye özel modül
                      açabilir veya
                      kapatabilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="platform-feature-grid">
                  {allFeatures.map(
                    (feature) => {
                      const enabled =
                        selected.effectiveFeatures
                          ?.includes(
                            feature,
                          );

                      const override =
                        selected.featureOverrides
                          ?.find(
                            (item) =>
                              item.feature ===
                              feature,
                          );

                      return (
                        <div
                          className={
                            enabled
                              ? 'platform-feature active'
                              : 'platform-feature'
                          }
                          key={
                            feature
                          }
                        >
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              toggleFeature(
                                feature,
                              )
                            }
                          >
                            <span>
                              {
                                featureLabels[
                                  feature
                                ]
                              }
                            </span>

                            <strong>
                              {enabled
                                ? 'AÇIK'
                                : 'KAPALI'}
                            </strong>
                          </button>

                          {override && (
                            <button
                              type="button"
                              className="platform-feature-reset"
                              disabled={busy}
                              onClick={() =>
                                resetOverride(
                                  feature,
                                )
                              }
                            >
                              Özel ayarı kaldır
                            </button>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

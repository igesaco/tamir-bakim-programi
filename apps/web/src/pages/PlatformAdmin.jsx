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
  VEHICLES_QR: 'Araçlar + QR',
  SERVICE_ORDERS: 'İş Emirleri',
  APPOINTMENTS: 'Randevular',
  MAINTENANCE: 'Bakım Planlaması',
  QUOTES: 'Teklif / Proforma',
  INVENTORY: 'Stok',
  SUPPLIERS: 'Tedarikçiler',
  STAFF: 'Personel',
  BRANCHES: 'Şubeler',
  NOTIFICATIONS: 'Bildirimler',
  CASHIER: 'Cari / Tahsilat',
  REPORTS: 'Raporlar',
  SETTINGS: 'Ayarlar',
  INSPECTIONS: 'Araç Kabul',
  MEDIA: 'Medya / Evrak',
  CUSTOMER_PORTAL: 'Müşteri Portalı',
  AUDIT: 'Denetim Kayıtları',
};

const featureGroups = [
  {
    title: 'Servis Operasyonları',
    description:
      'Günlük servis akışı ve müşteri işlemleri.',
    items: [
      'DASHBOARD',
      'CUSTOMERS',
      'VEHICLES_QR',
      'SERVICE_ORDERS',
      'APPOINTMENTS',
      'INSPECTIONS',
      'MEDIA',
      'NOTIFICATIONS',
    ],
  },
  {
    title: 'Teklif ve Bakım',
    description:
      'Teklif, proforma ve periyodik bakım yönetimi.',
    items: [
      'QUOTES',
      'MAINTENANCE',
    ],
  },
  {
    title: 'Stok ve Tedarik',
    description:
      'Parça, depo ve tedarikçi operasyonları.',
    items: [
      'INVENTORY',
      'SUPPLIERS',
    ],
  },
  {
    title: 'Yönetim ve Finans',
    description:
      'Personel, şube, cari, rapor ve işletme ayarları.',
    items: [
      'STAFF',
      'BRANCHES',
      'CASHIER',
      'REPORTS',
      'SETTINGS',
      'AUDIT',
    ],
  },
  {
    title: 'Müşteri Deneyimi',
    description:
      'Sanayicinin kendi müşterisine sunduğu dijital erişim.',
    items: [
      'CUSTOMER_PORTAL',
    ],
  },
];

const roleLabels = {
  OWNER: 'İşletme Kurucusu',
  MANAGER: 'Yönetici',
  SERVICE_ADVISOR: 'Servis Danışmanı',
  TECHNICIAN: 'Teknik Bakım Personeli',
  WAREHOUSE: 'Depo / Stok Personeli',
  ACCOUNTING: 'Muhasebe / Kasa',
};

const roleDescriptions = {
  OWNER:
    'İşletmenin ana yöneticisi. Varsayılan olarak tüm işlem yetkilerine sahiptir.',
  MANAGER:
    'Operasyon yöneticisi. Varsayılan olarak tüm işlem yetkilerine sahiptir.',
  SERVICE_ADVISOR:
    'Müşteri kabul, randevu, iş emri, teklif ve servis koordinasyonu.',
  TECHNICIAN:
    'Atanmış iş emirlerini görür ve teknik servis durumlarını günceller.',
  WAREHOUSE:
    'Stok, parça giriş-çıkış ve tedarikçi operasyonları.',
  ACCOUNTING:
    'Cari, tahsilat, ödeme durumu ve raporlama işlemleri.',
};

const permissionGroups = [
  {
    title: 'Müşteri',
    items: [
      ['CUSTOMER_VIEW', 'Müşteri görüntüle'],
      ['CUSTOMER_CREATE', 'Müşteri oluştur'],
      ['CUSTOMER_UPDATE', 'Müşteri düzenle'],
      ['CUSTOMER_DELETE', 'Müşteri sil'],
    ],
  },
  {
    title: 'Araç ve QR',
    items: [
      ['VEHICLE_VIEW', 'Araç görüntüle'],
      ['VEHICLE_CREATE', 'Araç oluştur'],
      ['VEHICLE_UPDATE', 'Araç düzenle'],
      ['VEHICLE_DELETE', 'Araç sil'],
      ['VEHICLE_QR', 'QR / dijital kart işlemleri'],
    ],
  },
  {
    title: 'İş Emri',
    items: [
      ['SERVICE_ORDER_VIEW', 'İş emri görüntüle'],
      ['SERVICE_ORDER_CREATE', 'İş emri oluştur'],
      ['SERVICE_ORDER_EDIT', 'İş emri düzenle'],
      ['SERVICE_ORDER_ASSIGN', 'Personel / teknisyen ata'],
      ['SERVICE_ORDER_STATUS', 'İş emri durumunu değiştir'],
      ['SERVICE_ORDER_ITEM_MANAGE', 'İşçilik / parça kalemi yönet'],
      ['SERVICE_ORDER_WORKLOG', 'Teknik işlem notu / kullanılan parça kaydı'],
    ],
  },
  {
    title: 'Randevu ve Kabul',
    items: [
      ['APPOINTMENT_VIEW', 'Randevuları görüntüle'],
      ['APPOINTMENT_MANAGE', 'Randevu oluştur / değiştir'],
      ['INSPECTION_VIEW', 'Araç kabul formunu görüntüle'],
      ['INSPECTION_MANAGE', 'Araç kabul formunu düzenle'],
      ['MEDIA_VIEW', 'Fotoğraf / evrak görüntüle'],
      ['MEDIA_UPLOAD', 'Fotoğraf / evrak yükle'],
      ['MEDIA_DELETE', 'Fotoğraf / evrak sil'],
    ],
  },
  {
    title: 'Teklif ve Bakım',
    items: [
      ['QUOTE_VIEW', 'Teklifleri görüntüle'],
      ['QUOTE_CREATE', 'Teklif / proforma oluştur'],
      ['QUOTE_STATUS', 'Teklif durumunu değiştir'],
      ['MAINTENANCE_VIEW', 'Bakım planlarını görüntüle'],
      ['MAINTENANCE_MANAGE', 'Bakım planı oluştur / tamamla'],
    ],
  },
  {
    title: 'Stok ve Tedarik',
    items: [
      ['INVENTORY_VIEW', 'Stok görüntüle'],
      ['INVENTORY_MANAGE', 'Stok hareketi / parça yönet'],
      ['SUPPLIER_VIEW', 'Tedarikçileri görüntüle'],
      ['SUPPLIER_MANAGE', 'Tedarikçi oluştur / düzenle'],
    ],
  },
  {
    title: 'Personel ve Şube',
    items: [
      ['STAFF_VIEW', 'Personeli görüntüle'],
      ['STAFF_CREATE', 'Personel oluştur'],
      ['STAFF_UPDATE', 'Personel yetki / şube / durum değiştir'],
      ['STAFF_PASSWORD', 'Personel şifresi sıfırla'],
      ['BRANCH_VIEW', 'Şubeleri görüntüle'],
      ['BRANCH_MANAGE', 'Şube oluştur / durum değiştir'],
    ],
  },
  {
    title: 'Finans ve Yönetim',
    items: [
      ['CASHIER_VIEW', 'Cari / ödeme görüntüle'],
      ['CASHIER_COLLECT', 'Tahsilat oluştur'],
      ['CASHIER_STATUS', 'Ödeme durumunu değiştir'],
      ['REPORTS_VIEW', 'Raporları görüntüle'],
      ['SETTINGS_VIEW', 'İşletme ayarlarını görüntüle'],
      ['SETTINGS_MANAGE', 'İşletme ayarlarını değiştir'],
      ['NOTIFICATION_VIEW', 'Bildirimleri görüntüle'],
      ['NOTIFICATION_MANAGE', 'Bildirim oluştur'],
    ],
  },
];

const allPermissionKeys =
  permissionGroups.flatMap(
    (group) =>
      group.items.map(
        ([key]) => key,
      ),
  );

function errorMessage(
  error,
  fallback,
) {
  const message =
    error?.response?.data?.message;

  return Array.isArray(message)
    ? message.join(', ')
    : message || fallback;
}

function formatMoney(
  value,
) {
  return new Intl.NumberFormat(
    'tr-TR',
    {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 2,
    },
  ).format(
    Number(value || 0),
  );
}

function formatDate(
  value,
) {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'tr-TR',
    {
      dateStyle: 'medium',
    },
  ).format(
    new Date(value),
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}) {
  return (
    <button
      type="button"
      className={
        checked
          ? 'platform-toggle active'
          : 'platform-toggle'
      }
      aria-pressed={checked}
      onClick={onChange}
      disabled={disabled}
    >
      <span />
    </button>
  );
}

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
  const [selectedRole, setSelectedRole] =
    useState('SERVICE_ADVISOR');
  const [search, setSearch] =
    useState('');
  const [activeSection, setActiveSection] =
    useState('customer');
  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState('');
  const [message, setMessage] =
    useState('');

  const [ledgerForm, setLedgerForm] =
    useState({
      type: 'DEBIT',
      amount: '',
      description: '',
      dueDate: '',
    });

  async function load() {
    const [
      packagesResponse,
      organizationsResponse,
    ] = await Promise.all([
      api.get('/platform/packages'),
      api.get('/platform/organizations'),
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
        errorMessage(
          err,
          'Ajans paneli yüklenemedi.',
        ),
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

  const filteredOrganizations =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLocaleLowerCase(
            'tr-TR',
          );

      if (!term) {
        return organizations;
      }

      return organizations.filter(
        (organization) =>
          [
            organization.name,
            organization.email,
            organization.phone,
            organization.package
              ?.name,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              'tr-TR',
            )
            .includes(term),
      );
    }, [
      organizations,
      search,
    ]);

  const totalUsers =
    organizations.reduce(
      (sum, item) =>
        sum +
        Number(
          item._count?.users ||
            0,
        ),
      0,
    );

  const totalVehicles =
    organizations.reduce(
      (sum, item) =>
        sum +
        Number(
          item._count?.vehicles ||
            0,
        ),
      0,
    );

  const totalMonthlyFee =
    organizations.reduce(
      (sum, item) =>
        sum +
        Number(
          item.monthlyFee ||
            0,
        ),
      0,
    );

  const totalLedgerBalance =
    organizations.reduce(
      (sum, item) =>
        sum +
        Number(
          item.ledgerBalance ||
            0,
        ),
      0,
    );

  const currentRoleMatrix =
    selected
      ?.effectiveRolePermissions?.[
        selectedRole
      ] || {
        effective: [],
        defaults: [],
        overrides: [],
      };

  const roleEffective =
    currentRoleMatrix.effective ||
    [];

  const roleDefaults =
    currentRoleMatrix.defaults ||
    [];

  const roleOverrides =
    currentRoleMatrix.overrides ||
    [];

  async function run(
    action,
    successMessage,
  ) {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      await action();

      if (successMessage) {
        setMessage(
          successMessage,
        );
      }

      await load();
    } catch (err) {
      setError(
        errorMessage(
          err,
          'İşlem tamamlanamadı.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function setPackage(
    packageId,
  ) {
    if (!selected) {
      return;
    }

    return run(
      () =>
        api.patch(
          `/platform/organizations/${selected.id}/package`,
          {
            packageId,
          },
        ),
      'İşletme paketi güncellendi.',
    );
  }

  function toggleFeature(
    feature,
  ) {
    if (!selected) {
      return;
    }

    const enabled =
      !selected.effectiveFeatures
        ?.includes(feature);

    return run(
      () =>
        api.put(
          `/platform/organizations/${selected.id}/features/${feature}`,
          {
            enabled,
          },
        ),
      `${featureLabels[feature]} modülü güncellendi.`,
    );
  }

  function resetFeature(
    feature,
  ) {
    if (!selected) {
      return;
    }

    return run(
      () =>
        api.delete(
          `/platform/organizations/${selected.id}/features/${feature}`,
        ),
      'Modül paket varsayılanına döndürüldü.',
    );
  }

  function togglePermission(
    permission,
  ) {
    if (!selected) {
      return;
    }

    const allowed =
      !roleEffective.includes(
        permission,
      );

    return run(
      () =>
        api.put(
          `/platform/organizations/${selected.id}/roles/${selectedRole}/permissions/${permission}`,
          {
            allowed,
          },
        ),
      `${roleLabels[selectedRole]} yetkisi güncellendi.`,
    );
  }

  function replaceRolePermissions(
    permissions,
    label,
  ) {
    if (!selected) {
      return;
    }

    return run(
      () =>
        api.put(
          `/platform/organizations/${selected.id}/roles/${selectedRole}/permissions`,
          {
            permissions,
          },
        ),
      label,
    );
  }

  function resetRolePermissions() {
    if (!selected) {
      return;
    }

    return run(
      () =>
        api.delete(
          `/platform/organizations/${selected.id}/roles/${selectedRole}/permissions`,
        ),
      `${roleLabels[selectedRole]} varsayılan yetkilerine döndürüldü.`,
    );
  }

  function setBrandingField(
    field,
    value,
  ) {
    if (!selected) {
      return;
    }

    setOrganizations(
      (current) =>
        current.map(
          (organization) =>
            organization.id ===
            selected.id
              ? {
                  ...organization,
                  [field]: value,
                }
              : organization,
        ),
    );
  }

  function saveBranding(
    event,
  ) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    return run(
      () =>
        api.patch(
          `/platform/organizations/${selected.id}/branding`,
          {
            logoUrl:
              selected.logoUrl || '',
            panelTitle:
              selected.panelTitle || '',
            primaryColor:
              selected.primaryColor ||
              '#F59E0B',
            secondaryColor:
              selected.secondaryColor ||
              '#E9EDF2',
            sidebarColor:
              selected.sidebarColor ||
              '#111419',
            defaultPanelMode:
              selected.defaultPanelMode ||
              'classic',
            defaultWallpaper:
              selected.defaultWallpaper ||
              'soft',
          },
        ),
      'Panel tasarımı güncellendi.',
    );
  }

  function saveCommercial(
    event,
  ) {
    event.preventDefault();

    if (!selected) {
      return;
    }

    return run(
      () =>
        api.patch(
          `/platform/organizations/${selected.id}/commercial`,
          {
            name:
              selected.name,
            email:
              selected.email || undefined,
            phone:
              selected.phone || undefined,
            whatsappPhone:
              selected.whatsappPhone || undefined,
            address:
              selected.address || undefined,
            contactPersonName:
              selected.contactPersonName || undefined,
            contactPersonPhone:
              selected.contactPersonPhone || undefined,
            platformNotes:
              selected.platformNotes || undefined,
            monthlyFee:
              Number(
                selected.monthlyFee ||
                0,
              ),
            active:
              Boolean(
                selected.active,
              ),
          },
        ),
      'Müşteri işletme bilgileri güncellendi.',
    );
  }

  function addLedgerEntry(
    event,
  ) {
    event.preventDefault();

    if (
      !selected ||
      !ledgerForm.amount ||
      !ledgerForm.description.trim()
    ) {
      return;
    }

    return run(
      () =>
        api.post(
          `/platform/organizations/${selected.id}/ledger`,
          {
            type:
              ledgerForm.type,
            amount:
              Number(
                ledgerForm.amount,
              ),
            description:
              ledgerForm.description.trim(),
            dueDate:
              ledgerForm.dueDate ||
              undefined,
          },
        ).then(() => {
          setLedgerForm({
            type: 'DEBIT',
            amount: '',
            description: '',
            dueDate: '',
          });
        }),
      ledgerForm.type === 'DEBIT'
        ? 'Cari borç kaydı eklendi.'
        : 'Tahsilat kaydı eklendi.',
    );
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
        errorMessage(
          err,
          'İşletme paneline girilemedi.',
        ),
      );
      setBusy(false);
    }
  }

  function featureState(
    feature,
  ) {
    const enabled =
      selected?.effectiveFeatures
        ?.includes(feature);

    const override =
      selected?.featureOverrides
        ?.find(
          (item) =>
            item.feature ===
            feature,
        );

    const inPackage =
      selected?.package
        ?.features
        ?.includes(feature);

    return {
      enabled,
      override,
      inPackage,
    };
  }

  function permissionState(
    permission,
  ) {
    const enabled =
      roleEffective.includes(
        permission,
      );

    const defaultEnabled =
      roleDefaults.includes(
        permission,
      );

    const override =
      roleOverrides.find(
        (item) =>
          item.permission ===
          permission,
      );

    return {
      enabled,
      defaultEnabled,
      override,
    };
  }

  return (
    <div className="platform-page">
      <header className="platform-header">
        <div className="platform-header-brand">
          <div className="platform-header-logo">
            İG
          </div>

          <div>
            <span className="platform-kicker">
              İGESA PLATFORM
            </span>

            <h1>
              Ajans Yönetim Merkezi
            </h1>

            <p>
              İşletmeleri, paketleri,
              modülleri ve personel
              işlem yetkilerini tek
              merkezden yönetin.
            </p>
          </div>
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
            className="platform-logout"
            onClick={logout}
          >
            Çıkış
          </button>
        </div>
      </header>

      <section className="platform-summary platform-summary-finance">
        <div className="platform-summary-card">
          <span>
            Müşteri İşletme
          </span>
          <strong>
            {organizations.length}
          </strong>
          <small>
            Platformdaki toplam sanayici / servis hesabı
          </small>
        </div>

        <div className="platform-summary-card accent">
          <span>
            Aylık Sözleşme
          </span>
          <strong className="platform-money">
            {formatMoney(
              totalMonthlyFee,
            )}
          </strong>
          <small>
            Kayıtlı aylık hizmet bedelleri toplamı
          </small>
        </div>

        <div className="platform-summary-card">
          <span>
            Cari Alacak
          </span>
          <strong className={
            totalLedgerBalance > 0
              ? 'platform-money warning'
              : 'platform-money'
          }>
            {formatMoney(
              totalLedgerBalance,
            )}
          </strong>
          <small>
            Borç hareketleri eksi tahsilatlar
          </small>
        </div>

        <div className="platform-summary-card">
          <span>
            Personel
          </span>
          <strong>
            {totalUsers}
          </strong>
          <small>
            Tüm işletmelerdeki panel kullanıcıları
          </small>
        </div>

        <div className="platform-summary-card">
          <span>
            Araç
          </span>
          <strong>
            {totalVehicles}
          </strong>
          <small>
            Sistemde kayıtlı toplam araç
          </small>
        </div>
      </section>

      {message && (
        <div className="page-message success-message platform-flash">
          {message}
        </div>
      )}

      {error && (
        <div className="page-message error-message platform-flash">
          {error}
        </div>
      )}

      <div className="platform-grid">
        <aside className="platform-organizations">
          <div className="platform-sidebar-head">
            <div>
              <span className="platform-kicker">
                MÜŞTERİLERİMİZ
              </span>
              <h3>
                İşletmeler
              </h3>
            </div>

            <span className="platform-count">
              {organizations.length}
            </span>
          </div>

          <input
            className="platform-search"
            placeholder="İşletme, paket, telefon ara..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value,
              )
            }
          />

          <div className="platform-org-list">
            {filteredOrganizations.map(
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
                  <div className="platform-org-avatar">
                    {organization.name
                      ?.trim()
                      .charAt(0)
                      .toLocaleUpperCase(
                        'tr-TR',
                      ) || '?'}
                  </div>

                  <div className="platform-org-copy">
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
                      araç ·{' '}
                      {
                        organization
                          ._count
                          ?.users
                      }{' '}
                      personel
                    </small>
                  </div>
                </button>
              ),
            )}

            {!filteredOrganizations.length && (
              <div className="platform-empty">
                Aramaya uygun işletme bulunamadı.
              </div>
            )}
          </div>
        </aside>

        <main className="platform-detail">
          {!selected ? (
            <div className="platform-empty-state">
              Yönetmek için bir işletme seçin.
            </div>
          ) : (
            <>
              <div className="platform-org-hero">
                <div>
                  <span className="platform-kicker">
                    SEÇİLİ İŞLETME
                  </span>

                  <h2>
                    {selected.name}
                  </h2>

                  <p>
                    {selected.email ||
                      selected.phone ||
                      'İletişim bilgisi yok'}
                  </p>

                  <div className="platform-org-meta">
                    <span>
                      Paket:{' '}
                      <strong>
                        {selected.package
                          ?.name ||
                          'Tanımsız'}
                      </strong>
                    </span>

                    <span>
                      Modül:{' '}
                      <strong>
                        {selected.effectiveFeatures
                          ?.length ||
                          0}
                      </strong>
                    </span>

                    <span>
                      Şube:{' '}
                      <strong>
                        {selected._count
                          ?.branches ||
                          0}
                      </strong>
                    </span>

                    <span>
                      Durum:{' '}
                      <strong>
                        {selected.active
                          ? 'Aktif'
                          : 'Pasif'}
                      </strong>
                    </span>

                    <span>
                      Aylık:{' '}
                      <strong>
                        {formatMoney(
                          selected.monthlyFee,
                        )}
                      </strong>
                    </span>

                    <span>
                      Cari:{' '}
                      <strong>
                        {formatMoney(
                          selected.ledgerBalance,
                        )}
                      </strong>
                    </span>
                  </div>
                </div>

                <button
                  className="platform-enter-button"
                  disabled={busy}
                  onClick={enter}
                >
                  <span>
                    İşletme Paneline Gir
                  </span>
                  <strong>
                    →
                  </strong>
                </button>
              </div>

              <div className="platform-section-tabs platform-section-tabs-wide">
                <button
                  type="button"
                  className={
                    activeSection ===
                    'customer'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveSection(
                      'customer',
                    )
                  }
                >
                  Müşteri Bilgileri
                </button>

                <button
                  type="button"
                  className={
                    activeSection ===
                    'account'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveSection(
                      'account',
                    )
                  }
                >
                  Cari Hesap
                </button>

                <button
                  type="button"
                  className={
                    activeSection ===
                    'branding'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveSection(
                      'branding',
                    )
                  }
                >
                  Panel Tasarımı
                </button>

                <button
                  type="button"
                  className={
                    activeSection ===
                    'package'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveSection(
                      'package',
                    )
                  }
                >
                  Paket & Modüller
                </button>

                <button
                  type="button"
                  className={
                    activeSection ===
                    'roles'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setActiveSection(
                      'roles',
                    )
                  }
                >
                  Personel Yetkileri
                </button>
              </div>

              {activeSection ===
                'customer' && (
                <section className="platform-card">
                  <div className="platform-card-head">
                    <div>
                      <span className="platform-kicker">
                        MÜŞTERİ KARTI
                      </span>

                      <h3>
                        İşletme ve Hesap Bilgileri
                      </h3>

                      <p>
                        Sanayici müşterinizin iletişim, sözleşme,
                        panel hesabı ve ajans notlarını buradan yönetin.
                      </p>
                    </div>

                    <span
                      className={
                        selected.active
                          ? 'platform-customer-status active'
                          : 'platform-customer-status passive'
                      }
                    >
                      {selected.active
                        ? 'AKTİF MÜŞTERİ'
                        : 'PASİF MÜŞTERİ'}
                    </span>
                  </div>

                  <div className="platform-customer-layout">
                    <form
                      className="form-grid platform-customer-form"
                      onSubmit={saveCommercial}
                    >
                      <input
                        className="full"
                        placeholder="İşletme adı"
                        value={
                          selected.name ||
                          ''
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'name',
                            event.target.value,
                          )
                        }
                        required
                      />

                      <input
                        placeholder="Yetkili kişi"
                        value={
                          selected.contactPersonName ||
                          ''
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'contactPersonName',
                            event.target.value,
                          )
                        }
                      />

                      <input
                        placeholder="Yetkili telefonu"
                        value={
                          selected.contactPersonPhone ||
                          ''
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'contactPersonPhone',
                            event.target.value,
                          )
                        }
                      />

                      <input
                        placeholder="İşletme telefonu"
                        value={
                          selected.phone ||
                          ''
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'phone',
                            event.target.value,
                          )
                        }
                      />

                      <input
                        placeholder="WhatsApp"
                        value={
                          selected.whatsappPhone ||
                          ''
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'whatsappPhone',
                            event.target.value,
                          )
                        }
                      />

                      <input
                        className="full"
                        type="email"
                        placeholder="İşletme e-posta"
                        value={
                          selected.email ||
                          ''
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'email',
                            event.target.value,
                          )
                        }
                      />

                      <textarea
                        className="full"
                        placeholder="Adres"
                        value={
                          selected.address ||
                          ''
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'address',
                            event.target.value,
                          )
                        }
                      />

                      <label className="platform-money-input">
                        <span>
                          Aylık hizmet bedeli
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={
                            selected.monthlyFee ??
                            0
                          }
                          onChange={(event) =>
                            setBrandingField(
                              'monthlyFee',
                              event.target.value,
                            )
                          }
                        />
                      </label>

                      <label className="platform-active-field">
                        <span>
                          Müşteri hesabı
                        </span>

                        <button
                          type="button"
                          className={
                            selected.active
                              ? 'platform-active-button active'
                              : 'platform-active-button'
                          }
                          onClick={() =>
                            setBrandingField(
                              'active',
                              !selected.active,
                            )
                          }
                        >
                          {selected.active
                            ? 'Aktif'
                            : 'Pasif'}
                        </button>
                      </label>

                      <textarea
                        className="full"
                        placeholder="İGESA iç notu — müşteri görmez"
                        value={
                          selected.platformNotes ||
                          ''
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'platformNotes',
                            event.target.value,
                          )
                        }
                      />

                      <button
                        className="primary-button full"
                        disabled={busy}
                      >
                        Müşteri Bilgilerini Kaydet
                      </button>
                    </form>

                    <aside className="platform-account-side">
                      <span className="platform-kicker">
                        PANEL HESAPLARI
                      </span>

                      <h4>
                        İşletme Kurucusu
                      </h4>

                      {selected.users?.length ? (
                        selected.users.map(
                          (owner) => (
                            <div
                              className="platform-owner-card"
                              key={owner.id}
                            >
                              <div className="platform-owner-avatar">
                                {owner.firstName
                                  ?.charAt(0)
                                  .toLocaleUpperCase(
                                    'tr-TR',
                                  )}
                                {owner.lastName
                                  ?.charAt(0)
                                  .toLocaleUpperCase(
                                    'tr-TR',
                                  )}
                              </div>

                              <div>
                                <strong>
                                  {owner.firstName}{' '}
                                  {owner.lastName}
                                </strong>

                                <span>
                                  {owner.email}
                                </span>

                                <small>
                                  {owner.phone ||
                                    'Telefon yok'}{' '}
                                  ·{' '}
                                  {owner.active
                                    ? 'Aktif'
                                    : 'Pasif'}
                                </small>
                              </div>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="platform-empty">
                          Kurucu panel hesabı bulunamadı.
                        </div>
                      )}

                      <div className="platform-customer-metrics">
                        <div>
                          <span>
                            Alt Müşteri
                          </span>
                          <strong>
                            {selected._count
                              ?.customers ||
                              0}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Araç
                          </span>
                          <strong>
                            {selected._count
                              ?.vehicles ||
                              0}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Personel
                          </span>
                          <strong>
                            {selected._count
                              ?.users ||
                              0}
                          </strong>
                        </div>

                        <div>
                          <span>
                            İş Emri
                          </span>
                          <strong>
                            {selected._count
                              ?.serviceOrders ||
                              0}
                          </strong>
                        </div>
                      </div>
                    </aside>
                  </div>
                </section>
              )}

              {activeSection ===
                'account' && (
                <>
                  <section className="platform-cari-summary">
                    <div>
                      <span>
                        Toplam Borç
                      </span>
                      <strong>
                        {formatMoney(
                          selected.ledgerDebit,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Tahsilat
                      </span>
                      <strong>
                        {formatMoney(
                          selected.ledgerCredit,
                        )}
                      </strong>
                    </div>

                    <div
                      className={
                        Number(
                          selected.ledgerBalance ||
                            0,
                        ) > 0
                          ? 'warning'
                          : 'success'
                      }
                    >
                      <span>
                        Güncel Bakiye
                      </span>
                      <strong>
                        {formatMoney(
                          selected.ledgerBalance,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Aylık Sözleşme
                      </span>
                      <strong>
                        {formatMoney(
                          selected.monthlyFee,
                        )}
                      </strong>
                    </div>
                  </section>

                  <section className="platform-card">
                    <div className="platform-card-head">
                      <div>
                        <span className="platform-kicker">
                          CARİ HAREKET
                        </span>

                        <h3>
                          Borç / Tahsilat Ekle
                        </h3>

                        <p>
                          İGESA'nın bu işletmeden alacağı ve
                          müşteriden gelen tahsilatları kayıt altına alın.
                        </p>
                      </div>
                    </div>

                    <form
                      className="platform-ledger-form"
                      onSubmit={addLedgerEntry}
                    >
                      <select
                        value={
                          ledgerForm.type
                        }
                        onChange={(event) =>
                          setLedgerForm({
                            ...ledgerForm,
                            type:
                              event.target.value,
                          })
                        }
                      >
                        <option value="DEBIT">
                          Borç / Fatura
                        </option>
                        <option value="CREDIT">
                          Tahsilat
                        </option>
                      </select>

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Tutar"
                        value={
                          ledgerForm.amount
                        }
                        onChange={(event) =>
                          setLedgerForm({
                            ...ledgerForm,
                            amount:
                              event.target.value,
                          })
                        }
                        required
                      />

                      <input
                        placeholder="Açıklama"
                        value={
                          ledgerForm.description
                        }
                        onChange={(event) =>
                          setLedgerForm({
                            ...ledgerForm,
                            description:
                              event.target.value,
                          })
                        }
                        required
                      />

                      <input
                        type="date"
                        title="Vade tarihi"
                        value={
                          ledgerForm.dueDate
                        }
                        onChange={(event) =>
                          setLedgerForm({
                            ...ledgerForm,
                            dueDate:
                              event.target.value,
                          })
                        }
                      />

                      <button
                        className="primary-button"
                        disabled={busy}
                      >
                        Hareket Ekle
                      </button>
                    </form>
                  </section>

                  <section className="platform-card">
                    <div className="platform-card-head">
                      <div>
                        <span className="platform-kicker">
                          CARİ EKSTRE
                        </span>

                        <h3>
                          Hesap Hareketleri
                        </h3>

                        <p>
                          En yeni hareketler üstte gösterilir.
                        </p>
                      </div>
                    </div>

                    <div className="platform-ledger-table-wrap">
                      <table className="platform-ledger-table">
                        <thead>
                          <tr>
                            <th>
                              Tarih
                            </th>
                            <th>
                              Tür
                            </th>
                            <th>
                              Açıklama
                            </th>
                            <th>
                              Vade
                            </th>
                            <th>
                              Tutar
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {selected.platformLedgerEntries
                            ?.map(
                              (entry) => (
                                <tr
                                  key={entry.id}
                                >
                                  <td>
                                    {formatDate(
                                      entry.occurredAt,
                                    )}
                                  </td>

                                  <td>
                                    <span
                                      className={
                                        entry.type ===
                                        'DEBIT'
                                          ? 'platform-ledger-type debit'
                                          : 'platform-ledger-type credit'
                                      }
                                    >
                                      {entry.type ===
                                      'DEBIT'
                                        ? 'BORÇ'
                                        : 'TAHSİLAT'}
                                    </span>
                                  </td>

                                  <td>
                                    {entry.description}
                                  </td>

                                  <td>
                                    {formatDate(
                                      entry.dueDate,
                                    )}
                                  </td>

                                  <td
                                    className={
                                      entry.type ===
                                      'DEBIT'
                                        ? 'platform-ledger-amount debit'
                                        : 'platform-ledger-amount credit'
                                    }
                                  >
                                    {entry.type ===
                                    'DEBIT'
                                      ? '+'
                                      : '-'}
                                    {formatMoney(
                                      entry.amount,
                                    )}
                                  </td>
                                </tr>
                              ),
                            )}

                          {!selected.platformLedgerEntries
                            ?.length && (
                            <tr>
                              <td
                                colSpan="5"
                                className="platform-ledger-empty"
                              >
                                Henüz cari hareket yok.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}

              {activeSection ===
                'package' && (
                <>
                  <section className="platform-card">
                    <div className="platform-card-head">
                      <div>
                        <span className="platform-kicker">
                          ABONELİK
                        </span>

                        <h3>
                          Hazır Paket
                        </h3>

                        <p>
                          Temel modülleri paket ile belirleyin.
                          İsterseniz aşağıdan tek tek özel
                          modül açıp kapatabilirsiniz.
                        </p>
                      </div>

                      <select
                        className="platform-package-select"
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
                              {item.name}
                            </option>
                          ),
                        )}
                      </select>
                    </div>

                    <div className="platform-package-cards">
                      {packages.map(
                        (item) => {
                          const active =
                            selected.packageId ===
                            item.id;

                          return (
                            <button
                              type="button"
                              className={
                                active
                                  ? 'platform-package active'
                                  : 'platform-package'
                              }
                              key={
                                item.id
                              }
                              disabled={busy}
                              onClick={() =>
                                setPackage(
                                  item.id,
                                )
                              }
                            >
                              <span className="platform-package-badge">
                                {active
                                  ? 'AKTİF'
                                  : item.code}
                              </span>

                              <strong>
                                {item.name}
                              </strong>

                              <p>
                                {item.description}
                              </p>

                              <small>
                                {item.features
                                  ?.length}{' '}
                                temel modül
                              </small>
                            </button>
                          );
                        },
                      )}
                    </div>
                  </section>

                  <section className="platform-card">
                    <div className="platform-card-head">
                      <div>
                        <span className="platform-kicker">
                          MODÜL ERİŞİMİ
                        </span>

                        <h3>
                          Panel Kontrolleri
                        </h3>

                        <p>
                          Paketten gelen erişimi işletmeye özel
                          olarak geçersiz kılabilirsiniz.
                        </p>
                      </div>
                    </div>

                    <div className="platform-feature-groups">
                      {featureGroups.map(
                        (group) => (
                          <div
                            className="platform-feature-group"
                            key={
                              group.title
                            }
                          >
                            <div className="platform-feature-group-head">
                              <div>
                                <h4>
                                  {group.title}
                                </h4>
                                <p>
                                  {group.description}
                                </p>
                              </div>
                            </div>

                            <div className="platform-feature-grid">
                              {group.items.map(
                                (feature) => {
                                  const state =
                                    featureState(
                                      feature,
                                    );

                                  return (
                                    <div
                                      className={
                                        state.enabled
                                          ? 'platform-feature active'
                                          : 'platform-feature'
                                      }
                                      key={
                                        feature
                                      }
                                    >
                                      <div className="platform-feature-row">
                                        <div>
                                          <strong>
                                            {
                                              featureLabels[
                                                feature
                                              ]
                                            }
                                          </strong>

                                          <span>
                                            {state.override
                                              ? state.enabled
                                                ? 'İGESA özel olarak açtı'
                                                : 'İGESA özel olarak kapattı'
                                              : state.inPackage
                                                ? 'Paketten geliyor'
                                                : 'Pakette yok'}
                                          </span>
                                        </div>

                                        <Toggle
                                          checked={
                                            state.enabled
                                          }
                                          disabled={
                                            busy
                                          }
                                          onChange={() =>
                                            toggleFeature(
                                              feature,
                                            )
                                          }
                                        />
                                      </div>

                                      {state.override && (
                                        <button
                                          type="button"
                                          className="platform-reset-link"
                                          disabled={
                                            busy
                                          }
                                          onClick={() =>
                                            resetFeature(
                                              feature,
                                            )
                                          }
                                        >
                                          Paket varsayılanına dön
                                        </button>
                                      )}
                                    </div>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </section>
                </>
              )}

              {activeSection ===
                'branding' && (
                <section className="platform-card">
                  <div className="platform-card-head">
                    <div>
                      <span className="platform-kicker">
                        PLATFORM GÖRÜNÜMÜ
                      </span>

                      <h3>
                        İşletmeye Özel Panel
                      </h3>

                      <p>
                        Giriş ekranı ortak kalır. İşletme personeli
                        giriş yaptıktan sonra bu logo, renkler ve
                        varsayılan panel düzeni otomatik uygulanır.
                      </p>
                    </div>
                  </div>

                  <form
                    className="form-grid platform-branding-form"
                    onSubmit={saveBranding}
                  >
                    <input
                      className="full"
                      placeholder="Logo URL (https://...)"
                      value={
                        selected.logoUrl ||
                        ''
                      }
                      onChange={(event) =>
                        setBrandingField(
                          'logoUrl',
                          event.target.value,
                        )
                      }
                    />

                    <input
                      className="full"
                      placeholder="Panel başlığı"
                      value={
                        selected.panelTitle ||
                        ''
                      }
                      onChange={(event) =>
                        setBrandingField(
                          'panelTitle',
                          event.target.value,
                        )
                      }
                    />

                    <label className="branding-color-field">
                      <span>Ana renk</span>
                      <div>
                        <input
                          type="color"
                          value={
                            selected.primaryColor ||
                            '#F59E0B'
                          }
                          onChange={(event) =>
                            setBrandingField(
                              'primaryColor',
                              event.target.value,
                            )
                          }
                        />
                        <strong>
                          {selected.primaryColor ||
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
                            selected.secondaryColor ||
                            '#E9EDF2'
                          }
                          onChange={(event) =>
                            setBrandingField(
                              'secondaryColor',
                              event.target.value,
                            )
                          }
                        />
                        <strong>
                          {selected.secondaryColor ||
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
                            selected.sidebarColor ||
                            '#111419'
                          }
                          onChange={(event) =>
                            setBrandingField(
                              'sidebarColor',
                              event.target.value,
                            )
                          }
                        />
                        <strong>
                          {selected.sidebarColor ||
                            '#111419'}
                        </strong>
                      </div>
                    </label>

                    <label className="branding-mode-field">
                      <span>Varsayılan panel düzeni</span>
                      <select
                        value={
                          selected.defaultPanelMode ||
                          'classic'
                        }
                        onChange={(event) =>
                          setBrandingField(
                            'defaultPanelMode',
                            event.target.value,
                          )
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
                          selected.primaryColor ||
                          '#F59E0B',
                        '--preview-secondary':
                          selected.secondaryColor ||
                          '#E9EDF2',
                        '--preview-sidebar':
                          selected.sidebarColor ||
                          '#111419',
                      }}
                    >
                      <aside>
                        <div
                          className="branding-preview-logo"
                          style={{
                            background:
                              selected.primaryColor ||
                              '#F59E0B',
                          }}
                        >
                          {selected.logoUrl ? (
                            <img
                              src={selected.logoUrl}
                              alt=""
                            />
                          ) : (
                            selected.name
                              ?.charAt(0)
                              .toLocaleUpperCase(
                                'tr-TR',
                              ) || 'T'
                          )}
                        </div>

                        <strong>
                          {selected.name}
                        </strong>

                        <span>
                          {selected.panelTitle ||
                            'Yönetim Paneli'}
                        </span>
                      </aside>

                      <main>
                        <span>
                          Dashboard
                        </span>
                        <div />
                        <div />
                      </main>
                    </div>

                    <button
                      className="primary-button full"
                      disabled={busy}
                    >
                      Panel Tasarımını Kaydet
                    </button>
                  </form>
                </section>
              )}

              {activeSection ===
                'roles' && (
                <section className="platform-card">
                  <div className="platform-card-head platform-role-head">
                    <div>
                      <span className="platform-kicker">
                        DETAYLI YETKİ
                      </span>

                      <h3>
                        Personel İşlem Yetkileri
                      </h3>

                      <p>
                        Modüle girebilmek paket ile belirlenir.
                        Buradaki kontroller, o modül içindeki
                        hangi işlemlerin yapılabileceğini belirler.
                      </p>
                    </div>

                    <div className="platform-role-actions">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          replaceRolePermissions(
                            allPermissionKeys,
                            'Seçili rol için tüm detay yetkileri açıldı.',
                          )
                        }
                      >
                        Tümünü Aç
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          replaceRolePermissions(
                            [],
                            'Seçili rol için tüm detay yetkileri kapatıldı.',
                          )
                        }
                      >
                        Tümünü Kapat
                      </button>

                      <button
                        type="button"
                        className="primary"
                        disabled={busy}
                        onClick={
                          resetRolePermissions
                        }
                      >
                        Varsayılana Dön
                      </button>
                    </div>
                  </div>

                  <div className="platform-role-tabs">
                    {Object.keys(
                      roleLabels,
                    ).map(
                      (role) => (
                        <button
                          type="button"
                          key={
                            role
                          }
                          className={
                            selectedRole ===
                            role
                              ? 'active'
                              : ''
                          }
                          onClick={() =>
                            setSelectedRole(
                              role,
                            )
                          }
                        >
                          <strong>
                            {
                              roleLabels[
                                role
                              ]
                            }
                          </strong>

                          <span>
                            {
                              selected
                                .effectiveRolePermissions?.[
                                role
                              ]?.effective
                                ?.length ||
                              0
                            }{' '}
                            yetki
                          </span>
                        </button>
                      ),
                    )}
                  </div>

                  <div className="platform-role-description">
                    <div>
                      <strong>
                        {
                          roleLabels[
                            selectedRole
                          ]
                        }
                      </strong>

                      <span>
                        {
                          roleDescriptions[
                            selectedRole
                          ]
                        }
                      </span>
                    </div>

                    <div className="platform-role-meter">
                      <span>
                        Aktif Yetki
                      </span>

                      <strong>
                        {
                          roleEffective.length
                        }
                        /
                        {
                          allPermissionKeys.length
                        }
                      </strong>
                    </div>
                  </div>

                  <div className="platform-permission-groups">
                    {permissionGroups.map(
                      (group) => (
                        <div
                          className="platform-permission-group"
                          key={
                            group.title
                          }
                        >
                          <div className="platform-permission-title">
                            <h4>
                              {group.title}
                            </h4>

                            <span>
                              {
                                group.items.filter(
                                  ([key]) =>
                                    roleEffective.includes(
                                      key,
                                    ),
                                ).length
                              }
                              /
                              {
                                group.items.length
                              }
                            </span>
                          </div>

                          <div className="platform-permission-list">
                            {group.items.map(
                              ([
                                permission,
                                label,
                              ]) => {
                                const state =
                                  permissionState(
                                    permission,
                                  );

                                return (
                                  <div
                                    className={
                                      state.enabled
                                        ? 'platform-permission-row active'
                                        : 'platform-permission-row'
                                    }
                                    key={
                                      permission
                                    }
                                  >
                                    <div>
                                      <strong>
                                        {label}
                                      </strong>

                                      <span>
                                        {state.override
                                          ? state.enabled
                                            ? 'Özel olarak açık'
                                            : 'Özel olarak kapalı'
                                          : state.defaultEnabled
                                            ? 'Rol varsayılanı: açık'
                                            : 'Rol varsayılanı: kapalı'}
                                      </span>
                                    </div>

                                    <Toggle
                                      checked={
                                        state.enabled
                                      }
                                      disabled={
                                        busy
                                      }
                                      onChange={() =>
                                        togglePermission(
                                          permission,
                                        )
                                      }
                                    />
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

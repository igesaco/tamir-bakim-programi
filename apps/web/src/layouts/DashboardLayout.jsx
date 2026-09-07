import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  NavLink,
  Outlet,
} from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

const menu = [
  {
    path: '/',
    label: 'Dashboard',
    short: 'DB',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
    ],
  },
  {
    path: '/customers',
    label: 'Müşteriler',
    short: 'MŞ',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
    ],
  },
  {
    path: '/service-orders',
    label: 'İş Emirleri',
    short: 'İE',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
      'TECHNICIAN',
    ],
  },
  {
    path: '/inventory',
    label: 'Stok',
    short: 'ST',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/suppliers',
    label: 'Tedarikçiler',
    short: 'TD',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/users',
    label: 'Personel',
    short: 'PN',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/branches',
    label: 'Şubeler',
    short: 'ŞB',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/notifications',
    label: 'Bildirimler',
    short: 'BL',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
    ],
  },
  {
    path: '/cashier',
    label: 'Kasa / Tahsilat',
    short: '₺',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/reports',
    label: 'Raporlar',
    short: 'RP',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/settings',
    label: 'Ayarlar',
    short: 'AY',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/account',
    label: 'Hesabım',
    short: 'HS',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
      'TECHNICIAN',
    ],
  },
];

const roleLabels = {
  OWNER: 'Kurucu',
  MANAGER: 'Yönetici',
  SERVICE_ADVISOR:
    'Servis Danışmanı',
  TECHNICIAN:
    'Teknik Bakım Personeli',
};

const uiModes = [
  {
    value: 'classic',
    label: 'Klasik',
    description:
      'Mevcut sol menülü yönetim görünümü.',
  },
  {
    value: 'desktop',
    label: 'Masaüstü',
    description:
      'Windows masaüstü hissi, uygulama penceresi ve kısayol ikonları.',
  },
  {
    value: 'focus',
    label: 'Odak',
    description:
      'Yüzen üst bar, alt dock ve cam efektli odak görünümü.',
  },
];

export default function DashboardLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const storageKey =
    `tb-ui-mode:${user?.id || 'default'}`;

  const [uiMode, setUiMode] =
    useState(() => {
      const stored =
        localStorage.getItem(
          storageKey,
        );

      return [
        'classic',
        'desktop',
        'focus',
      ].includes(stored)
        ? stored
        : 'classic';
    });

  useEffect(() => {
    const stored =
      localStorage.getItem(
        storageKey,
      );

    if (
      stored &&
      [
        'classic',
        'desktop',
        'focus',
      ].includes(stored)
    ) {
      setUiMode(stored);
    } else {
      setUiMode('classic');
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(
      storageKey,
      uiMode,
    );
  }, [storageKey, uiMode]);

  const visibleMenu =
    useMemo(
      () =>
        menu.filter(
          (item) =>
            item.roles.includes(
              user?.role,
            ),
        ),
      [user?.role],
    );

  const currentMode =
    uiModes.find(
      (item) =>
        item.value === uiMode,
    ) ?? uiModes[0];

  return (
    <div
      className={
        `app-shell ui-mode-${uiMode}`
      }
    >
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            TB
          </div>

          <div className="brand-copy">
            <strong>
              Tamir Bakım
            </strong>

            <span>
              Yönetim Paneli
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleMenu.map(
            (item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={
                  item.path === '/'
                }
                title={
                  item.label
                }
                className={({
                  isActive,
                }) =>
                  isActive
                    ? 'nav-item active'
                    : 'nav-item'
                }
              >
                <span className="nav-icon">
                  {item.short}
                </span>

                <span className="nav-label">
                  {item.label}
                </span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="sidebar-user">
          <div className="sidebar-user-copy">
            <strong>
              {user?.firstName}{' '}
              {user?.lastName}
            </strong>

            <span>
              {roleLabels[
                user?.role
              ] ||
                user?.role}
            </span>
          </div>

          <button onClick={logout}>
            Çıkış
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-identity">
            <h2>
              {user?.organization
                ?.name ||
                'Servis Yönetimi'}
            </h2>

            <span>
              {user?.branch?.name ||
                'Şube seçilmedi'}
            </span>
          </div>

          <div className="ui-mode-control">
            <div className="ui-mode-copy">
              <strong>
                Görünüm
              </strong>

              <span>
                {
                  currentMode.description
                }
              </span>
            </div>

            <div
              className="ui-mode-buttons"
              role="group"
              aria-label="Görünüm modu"
            >
              {uiModes.map(
                (mode) => (
                  <button
                    key={
                      mode.value
                    }
                    type="button"
                    title={
                      mode.description
                    }
                    className={
                      uiMode ===
                      mode.value
                        ? 'ui-mode-button active'
                        : 'ui-mode-button'
                    }
                    onClick={() =>
                      setUiMode(
                        mode.value,
                      )
                    }
                  >
                    {mode.label}
                  </button>
                ),
              )}
            </div>
          </div>
        </header>

        <section className="page-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

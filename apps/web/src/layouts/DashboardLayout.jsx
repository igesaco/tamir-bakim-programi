import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
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
      'Sol menülü standart yönetim görünümü.',
  },
  {
    value: 'desktop',
    label: 'Masaüstü',
    description:
      'Ortada uygulama kısayolları, pencere mantığı ve çoklu sekmeler.',
  },
  {
    value: 'focus',
    label: 'Çalışma Alanı',
    description:
      'Üst yatay uygulama şeridi ve geniş çalışma ekranı.',
  },
];

function getPageLabel(
  pathname,
  visibleMenu,
) {
  const direct =
    visibleMenu.find(
      (item) =>
        item.path === pathname,
    );

  if (direct) {
    return direct.label;
  }

  if (
    pathname.startsWith(
      '/customers/',
    )
  ) {
    return 'Müşteri Paneli';
  }

  if (
    pathname.startsWith(
      '/vehicles/',
    )
  ) {
    return 'Araç Detayı';
  }

  if (
    pathname.startsWith(
      '/service-orders/',
    )
  ) {
    return 'İş Emri';
  }

  if (
    pathname.startsWith(
      '/appointments',
    )
  ) {
    return 'Randevular';
  }

  if (
    pathname.startsWith(
      '/quotes',
    )
  ) {
    return 'Teklifler';
  }

  if (
    pathname.startsWith(
      '/maintenance',
    )
  ) {
    return 'Bakım';
  }

  return 'Tamir Bakım';
}

export default function DashboardLayout() {
  const {
    user,
    logout,
  } = useAuth();

  const location =
    useLocation();
  const navigate =
    useNavigate();

  const modeStorageKey =
    `tb-ui-mode:${user?.id || 'default'}`;

  const themeStorageKey =
    `tb-ui-theme:${user?.id || 'default'}`;

  const tabsStorageKey =
    `tb-desktop-tabs:${user?.id || 'default'}`;

  const [uiMode, setUiMode] =
    useState(() => {
      const stored =
        localStorage.getItem(
          modeStorageKey,
        );

      return [
        'classic',
        'desktop',
        'focus',
      ].includes(stored)
        ? stored
        : 'classic';
    });

  const [theme, setTheme] =
    useState(() => {
      const stored =
        localStorage.getItem(
          themeStorageKey,
        );

      return stored === 'light'
        ? 'light'
        : 'dark';
    });

  const [openTabs, setOpenTabs] =
    useState(() => {
      try {
        const stored =
          sessionStorage.getItem(
            tabsStorageKey,
          );

        const parsed =
          stored
            ? JSON.parse(stored)
            : [];

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch {
        return [];
      }
    });

  useEffect(() => {
    const stored =
      localStorage.getItem(
        modeStorageKey,
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
  }, [modeStorageKey]);

  useEffect(() => {
    const stored =
      localStorage.getItem(
        themeStorageKey,
      );

    setTheme(
      stored === 'light'
        ? 'light'
        : 'dark',
    );
  }, [themeStorageKey]);

  useEffect(() => {
    localStorage.setItem(
      modeStorageKey,
      uiMode,
    );
  }, [
    modeStorageKey,
    uiMode,
  ]);

  useEffect(() => {
    localStorage.setItem(
      themeStorageKey,
      theme,
    );

    document.documentElement.dataset.theme =
      theme;
  }, [
    themeStorageKey,
    theme,
  ]);

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

  const currentLabel =
    getPageLabel(
      location.pathname,
      visibleMenu,
    );

  useEffect(() => {
    if (
      uiMode !== 'desktop'
    ) {
      return;
    }

    setOpenTabs(
      (current) => {
        const exists =
          current.some(
            (tab) =>
              tab.path ===
              location.pathname,
          );

        if (exists) {
          return current;
        }

        return [
          ...current,
          {
            path:
              location.pathname,
            label:
              currentLabel,
          },
        ].slice(-8);
      },
    );
  }, [
    uiMode,
    location.pathname,
    currentLabel,
  ]);

  useEffect(() => {
    sessionStorage.setItem(
      tabsStorageKey,
      JSON.stringify(
        openTabs,
      ),
    );
  }, [
    tabsStorageKey,
    openTabs,
  ]);

  function closeDesktopTab(
    event,
    path,
  ) {
    event.preventDefault();
    event.stopPropagation();

    setOpenTabs(
      (current) => {
        const remaining =
          current.filter(
            (tab) =>
              tab.path !== path,
          );

        if (
          path ===
          location.pathname
        ) {
          const next =
            remaining[
              remaining.length - 1
            ];

          navigate(
            next?.path || '/',
          );
        }

        return remaining;
      },
    );
  }

  return (
    <div
      className={
        `app-shell ui-mode-${uiMode} theme-${theme}`
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
              className="theme-switch"
              role="group"
              aria-label="Renk teması"
            >
              <button
                type="button"
                className={
                  theme === 'dark'
                    ? 'theme-button active'
                    : 'theme-button'
                }
                onClick={() =>
                  setTheme('dark')
                }
              >
                Koyu
              </button>

              <button
                type="button"
                className={
                  theme === 'light'
                    ? 'theme-button active'
                    : 'theme-button'
                }
                onClick={() =>
                  setTheme('light')
                }
              >
                Aydınlık
              </button>
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

        {uiMode ===
          'desktop' && (
          <div className="desktop-tabs">
            {openTabs.map(
              (tab) => (
                <button
                  key={
                    tab.path
                  }
                  type="button"
                  className={
                    tab.path ===
                    location.pathname
                      ? 'desktop-tab active'
                      : 'desktop-tab'
                  }
                  onClick={() =>
                    navigate(
                      tab.path,
                    )
                  }
                >
                  <span>
                    {
                      tab.label
                    }
                  </span>

                  <span
                    className="desktop-tab-close"
                    role="button"
                    tabIndex="0"
                    onClick={(event) =>
                      closeDesktopTab(
                        event,
                        tab.path,
                      )
                    }
                  >
                    ×
                  </span>
                </button>
              ),
            )}

            {!openTabs.length && (
              <span className="desktop-tabs-empty">
                Bir uygulama açın.
              </span>
            )}
          </div>
        )}

        <section className="page-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

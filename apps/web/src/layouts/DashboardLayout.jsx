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
    icon: 'dashboard',
    feature: 'DASHBOARD',
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
    icon: 'customers',
    feature: 'CUSTOMERS',
    permission: 'CUSTOMER_VIEW',
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
    icon: 'service',
    feature: 'SERVICE_ORDERS',
    permission: 'SERVICE_ORDER_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
      'TECHNICIAN',
      'ACCOUNTING',
    ],
  },
  {
    path: '/pricing',
    label: 'Fiyatlandırma',
    short: 'Fİ',
    icon: 'cash',
    feature: 'QUOTES',
    permission: 'SERVICE_ORDER_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
      'ACCOUNTING',
    ],
  },
  {
    path: '/quotes',
    label: 'Teklif / Proforma',
    short: 'TF',
    icon: 'reports',
    feature: 'QUOTES',
    permission: 'QUOTE_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
      'ACCOUNTING',
    ],
  },
  {
    path: '/inventory',
    label: 'Stok',
    short: 'ST',
    icon: 'inventory',
    feature: 'INVENTORY',
    permission: 'INVENTORY_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
      'WAREHOUSE',
    ],
  },
  {
    path: '/suppliers',
    label: 'Tedarikçiler',
    short: 'TD',
    icon: 'supplier',
    feature: 'SUPPLIERS',
    permission: 'SUPPLIER_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
      'WAREHOUSE',
    ],
  },
  {
    path: '/users',
    label: 'Personel',
    short: 'PN',
    icon: 'staff',
    feature: 'STAFF',
    permission: 'STAFF_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/branches',
    label: 'Şubeler',
    short: 'ŞB',
    icon: 'branch',
    feature: 'BRANCHES',
    permission: 'BRANCH_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/notifications',
    label: 'Bildirimler',
    short: 'BL',
    icon: 'bell',
    feature: 'NOTIFICATIONS',
    permission: 'NOTIFICATION_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
      'ACCOUNTING',
    ],
  },
  {
    path: '/cashier',
    label: 'Kasa / Tahsilat',
    short: '₺',
    icon: 'cash',
    feature: 'CASHIER',
    permission: 'CASHIER_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
      'ACCOUNTING',
    ],
  },
  {
    path: '/reports',
    label: 'Raporlar',
    short: 'RP',
    icon: 'reports',
    feature: 'REPORTS',
    permission: 'REPORTS_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
      'ACCOUNTING',
    ],
  },
  {
    path: '/settings',
    label: 'Ayarlar',
    short: 'AY',
    icon: 'settings',
    feature: 'SETTINGS',
    permission: 'SETTINGS_VIEW',
    roles: [
      'OWNER',
      'MANAGER',
    ],
  },
  {
    path: '/account',
    label: 'Hesabım',
    short: 'HS',
    icon: 'account',
    roles: [
      'OWNER',
      'MANAGER',
      'SERVICE_ADVISOR',
      'TECHNICIAN',
      'WAREHOUSE',
      'ACCOUNTING',
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
  WAREHOUSE:
    'Depo / Stok Personeli',
  ACCOUNTING:
    'Muhasebe / Kasa',
};

const desktopWallpapers = [
  {
    value: 'soft',
    label: 'Sade',
  },
  {
    value: 'technical',
    label: 'Teknik',
  },
  {
    value: 'graphite',
    label: 'Füme',
  },
];



function MenuIcon({
  name,
  size = 26,
}) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  };

  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    customers: (
      <>
        <path d="M3 7.5h6l2 2h10v9.5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M8 15a3 3 0 0 1 6 0" />
        <circle cx="11" cy="11.5" r="1.7" />
      </>
    ),
    service: (
      <>
        <path d="M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-3-3z" />
      </>
    ),
    inventory: (
      <>
        <path d="m4 7 8-4 8 4-8 4z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </>
    ),
    supplier: (
      <>
        <path d="M3 17h12V7H3z" />
        <path d="M15 11h3l3 3v3h-6z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    staff: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20a6 6 0 0 1 12 0" />
        <path d="M17 8h4M19 6v4" />
      </>
    ),
    branch: (
      <>
        <path d="M4 21V8l8-5 8 5v13" />
        <path d="M8 21v-5h8v5M8 10h.01M12 10h.01M16 10h.01" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
        <path d="M10 21h4" />
      </>
    ),
    cash: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M7 9H6M18 15h-1" />
      </>
    ),
    reports: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1L7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z" />
      </>
    ),
    account: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    folder: (
      <>
        <path d="M3 7h7l2 2h9v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      </>
    ),
  };

  return (
    <svg {...common}>
      {paths[name] ||
        paths.folder}
    </svg>
  );
}

function getPageInfo(
  pathname,
  visibleMenu,
) {
  const direct =
    visibleMenu.find(
      (item) =>
        item.path === pathname,
    );

  if (direct) {
    return {
      label: direct.label,
      icon: direct.icon,
    };
  }

  if (
    pathname.startsWith(
      '/customers/',
    )
  ) {
    return {
      label: 'Müşteri Paneli',
      icon: 'customers',
    };
  }

  if (
    pathname.startsWith(
      '/vehicles/',
    )
  ) {
    return {
      label: 'Araç Detayı',
      icon: 'service',
    };
  }

  if (
    pathname.startsWith(
      '/service-orders/',
    )
  ) {
    return {
      label: 'İş Emri',
      icon: 'service',
    };
  }

  if (
    pathname.startsWith(
      '/appointments',
    )
  ) {
    return {
      label: 'Randevular',
      icon: 'customers',
    };
  }

  if (
    pathname.startsWith(
      '/pricing',
    )
  ) {
    return {
      label: 'Fiyatlandırma',
      icon: 'cash',
    };
  }

  if (
    pathname.startsWith(
      '/quotes',
    )
  ) {
    return {
      label: 'Teklifler',
      icon: 'reports',
    };
  }

  if (
    pathname.startsWith(
      '/maintenance',
    )
  ) {
    return {
      label: 'Bakım',
      icon: 'service',
    };
  }

  return {
    label: 'Tamir Bakım',
    icon: 'folder',
  };
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

  const organization =
    user?.organization || {};

  const tenantPrimary =
    organization.primaryColor ||
    '#F59E0B';

  const tenantSecondary =
    organization.secondaryColor ||
    '#E9EDF2';

  const tenantSidebar =
    organization.sidebarColor ||
    '#111419';

  const tenantDefaultMode =
    ['classic', 'desktop', 'focus'].includes(
      organization.defaultPanelMode,
    )
      ? organization.defaultPanelMode
      : 'classic';

  const tenantDefaultWallpaper =
    desktopWallpapers.some(
      (item) =>
        item.value ===
        organization.defaultWallpaper,
    )
      ? organization.defaultWallpaper
      : 'soft';

  const tenantPanelTitle =
    organization.panelTitle ||
    'Yönetim Paneli';

  const tenantInitials =
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
      ) || 'TB';

  const brandingStyle = {
    '--tenant-primary':
      tenantPrimary,
    '--tenant-secondary':
      tenantSecondary,
    '--tenant-sidebar':
      tenantSidebar,
  };

  const [
    logoFailed,
    setLogoFailed,
  ] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [
    organization.logoUrl,
  ]);

  const themeStorageKey =
    `tb-ui-theme:${user?.id || 'default'}`;

  const tabsStorageKey =
    `tb-desktop-tabs:${user?.id || 'default'}`;

  const uiMode =
    tenantDefaultMode;

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

  const desktopWallpaper =
    tenantDefaultWallpaper;

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

  const [
    desktopWindowOpen,
    setDesktopWindowOpen,
  ] = useState(false);

  const [
    desktopWindowMaximized,
    setDesktopWindowMaximized,
  ] = useState(false);

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
            ) &&
            (
              !item.feature ||
              user?.features?.includes(
                item.feature,
              )
            ) &&
            (
              !item.permission ||
              user?.permissions?.includes(
                item.permission,
              )
            ),
        ),
      [
        user?.role,
        user?.features,
        user?.permissions,
      ],
    );

  const currentPage =
    getPageInfo(
      location.pathname,
      visibleMenu,
    );

  useEffect(() => {
    if (
      uiMode !== 'desktop' ||
      !desktopWindowOpen
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
              currentPage.label,
            icon:
              currentPage.icon,
          },
        ].slice(-8);
      },
    );
  }, [
    uiMode,
    desktopWindowOpen,
    location.pathname,
    currentPage.label,
    currentPage.icon,
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

  function openDesktopApp(
    path,
  ) {
    setDesktopWindowOpen(
      true,
    );
    setDesktopWindowMaximized(
      false,
    );
    navigate(path);
  }

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

          if (next) {
            navigate(
              next.path,
            );
          } else {
            setDesktopWindowOpen(
              false,
            );
          }
        }

        return remaining;
      },
    );
  }

  function closeDesktopWindow() {
    setDesktopWindowOpen(
      false,
    );
    setDesktopWindowMaximized(
      false,
    );
  }

  const themeControl = (
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
  );

  if (
    uiMode === 'desktop'
  ) {
    return (
      <div
        className={
          `app-shell ui-mode-desktop theme-${theme}`
        }
        style={brandingStyle}
      >
        <div
          className={
            `desktop-wallpaper wallpaper-${desktopWallpaper}`
          }
        >
          <div className="desktop-brand-badge">
            <div
              className={
                organization.logoUrl &&
                !logoFailed
                  ? 'brand-mark brand-mark-image'
                  : 'brand-mark'
              }
            >
              {organization.logoUrl &&
              !logoFailed ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name || 'İşletme logosu'}
                  onError={() =>
                    setLogoFailed(true)
                  }
                />
              ) : (
                tenantInitials
              )}
            </div>

            <div>
              <strong>
                {organization.name ||
                  'Tamir Bakım'}
              </strong>
              <span>
                {tenantPanelTitle}
              </span>
            </div>
          </div>

          <div className="desktop-icon-grid">
            {visibleMenu.map(
              (item) => (
                <button
                  type="button"
                  key={
                    item.path
                  }
                  className={
                    location.pathname ===
                    item.path
                      ? 'desktop-app-icon active'
                      : 'desktop-app-icon'
                  }
                  onDoubleClick={() =>
                    openDesktopApp(
                      item.path,
                    )
                  }
                  onClick={() =>
                    openDesktopApp(
                      item.path,
                    )
                  }
                >
                  <span className="desktop-app-glyph">
                    <MenuIcon
                      name={
                        item.icon
                      }
                      size={34}
                    />
                  </span>

                  <span className="desktop-app-label">
                    {
                      item.label
                    }
                  </span>
                </button>
              ),
            )}
          </div>

          {desktopWindowOpen && (
            <main
              className={
                desktopWindowMaximized
                  ? 'desktop-folder-window maximized'
                  : 'desktop-folder-window'
              }
            >
              <header className="desktop-folder-titlebar">
                <div className="desktop-folder-title">
                  <span className="desktop-folder-icon">
                    <MenuIcon
                      name={
                        currentPage.icon
                      }
                      size={22}
                    />
                  </span>

                  <div>
                    <strong>
                      {
                        currentPage.label
                      }
                    </strong>

                    <span>
                      {
                        user?.branch
                          ?.name ||
                        'Şube seçilmedi'
                      }
                    </span>
                  </div>
                </div>

                <div className="desktop-window-buttons">
                  <button
                    type="button"
                    title="Küçült"
                    onClick={() =>
                      setDesktopWindowOpen(
                        false,
                      )
                    }
                  >
                    —
                  </button>

                  <button
                    type="button"
                    title={
                      desktopWindowMaximized
                        ? 'Geri yükle'
                        : 'Büyüt'
                    }
                    onClick={() =>
                      setDesktopWindowMaximized(
                        (value) =>
                          !value,
                      )
                    }
                  >
                    {
                      desktopWindowMaximized
                        ? '❐'
                        : '□'
                    }
                  </button>

                  <button
                    type="button"
                    className="close"
                    title="Kapat"
                    onClick={
                      closeDesktopWindow
                    }
                  >
                    ×
                  </button>
                </div>
              </header>

              <div className="desktop-folder-toolbar">
                <button
                  type="button"
                  title="Geri"
                  onClick={() =>
                    navigate(-1)
                  }
                >
                  ←
                </button>

                <div className="desktop-folder-address">
                  <MenuIcon
                    name="folder"
                    size={16}
                  />
                  <span>
                    {organization.name ||
                      'Tamir Bakım'}
                  </span>
                  <b>›</b>
                  <strong>
                    {
                      currentPage.label
                    }
                  </strong>
                </div>
              </div>

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
                      onClick={() => {
                        setDesktopWindowOpen(
                          true,
                        );
                        navigate(
                          tab.path,
                        );
                      }}
                    >
                      <MenuIcon
                        name={
                          tab.icon ||
                          'folder'
                        }
                        size={14}
                      />

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
              </div>

              <section className="page-area desktop-folder-content">
                <Outlet />
              </section>
            </main>
          )}

          <div className="desktop-taskbar">
            <button
              type="button"
              className="desktop-start-button"
              onClick={() =>
                openDesktopApp(
                  '/',
                )
              }
              title="Başlat"
            >
              {tenantInitials}
            </button>

            <div className="desktop-taskbar-apps">
              {openTabs.map(
                (tab) => (
                  <button
                    type="button"
                    key={
                      tab.path
                    }
                    className={
                      desktopWindowOpen &&
                      tab.path ===
                        location.pathname
                        ? 'desktop-task-app active'
                        : 'desktop-task-app'
                    }
                    title={
                      tab.label
                    }
                    onClick={() => {
                      setDesktopWindowOpen(
                        true,
                      );
                      navigate(
                        tab.path,
                      );
                    }}
                  >
                    <MenuIcon
                      name={
                        tab.icon ||
                        'folder'
                      }
                      size={18}
                    />
                  </button>
                ),
              )}
            </div>

            <div className="desktop-taskbar-right">
              {themeControl}

              <button
                type="button"
                className="desktop-logout-button"
                onClick={logout}
              >
                Çıkış
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        `app-shell ui-mode-${uiMode} theme-${theme}`
      }
      style={brandingStyle}
    >
      <aside className="sidebar">
        <div className="brand">
          <div
            className={
              organization.logoUrl
                ? 'brand-mark brand-mark-image'
                : 'brand-mark'
            }
          >
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={organization.name || 'İşletme logosu'}
              />
            ) : (
              tenantInitials
            )}
          </div>

          <div className="brand-copy">
            <strong>
              {organization.name ||
                'Tamir Bakım'}
            </strong>

            <span>
              {tenantPanelTitle}
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
                  <MenuIcon
                    name={
                      item.icon
                    }
                    size={16}
                  />
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
                Tema
              </strong>

              <span>
                Kişisel görünüm
              </span>
            </div>

            {themeControl}
          </div>
        </header>

        <section className="page-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

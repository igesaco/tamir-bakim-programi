import {
  NavLink,
  Outlet,
} from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const menu = [
  {
    path: '/',
    label: 'Dashboard',
    roles: ['OWNER', 'MANAGER', 'SERVICE_ADVISOR'],
  },
  {
    path: '/customers',
    label: 'Müşteriler',
    roles: ['OWNER', 'MANAGER', 'SERVICE_ADVISOR'],
  },
  {
    path: '/service-orders',
    label: 'İş Emirleri',
    roles: ['OWNER', 'MANAGER', 'SERVICE_ADVISOR', 'TECHNICIAN'],
  },
  {
    path: '/inventory',
    label: 'Stok',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    path: '/suppliers',
    label: 'Tedarikçiler',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    path: '/users',
    label: 'Personel',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    path: '/branches',
    label: 'Şubeler',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    path: '/notifications',
    label: 'Bildirimler',
    roles: ['OWNER', 'MANAGER', 'SERVICE_ADVISOR'],
  },
  {
    path: '/cashier',
    label: 'Kasa / Tahsilat',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    path: '/reports',
    label: 'Raporlar',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    path: '/settings',
    label: 'Ayarlar',
    roles: ['OWNER', 'MANAGER'],
  },
  {
    path: '/account',
    label: 'Hesabım',
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
  SERVICE_ADVISOR: 'Servis Danışmanı',
  TECHNICIAN: 'Teknik Bakım Personeli',
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();

  const visibleMenu = menu.filter(
    (item) => item.roles.includes(user?.role),
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TB</div>
          <div>
            <strong>Tamir Bakım</strong>
            <span>Yönetim Paneli</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleMenu.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-item active' : 'nav-item'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div>
            <strong>
              {user?.firstName} {user?.lastName}
            </strong>
            <span>
              {roleLabels[user?.role] || user?.role}
            </span>
          </div>

          <button onClick={logout}>
            Çıkış
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <h2>
              {user?.organization?.name || 'Servis Yönetimi'}
            </h2>
            <span>
              {user?.branch?.name || 'Şube seçilmedi'}
            </span>
          </div>
        </header>

        <section className="page-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}

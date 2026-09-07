import {
  NavLink,
  Outlet,
} from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const menu = [
  ['/', 'Dashboard'],
  ['/customers', 'Müşteriler'],
  ['/vehicles', 'Araçlar'],
  ['/appointments', 'Randevular'],
  ['/service-orders', 'İş Emirleri'],
  ['/quotes', 'Teklifler'],
  ['/maintenance', 'Bakım'],
  ['/inventory', 'Stok'],
  ['/suppliers', 'Tedarikçiler'],
  ['/users', 'Personel'],
  ['/branches', 'Şubeler'],
  ['/notifications', 'Bildirimler'],
  ['/reports', 'Raporlar'],
  ['/settings', 'Ayarlar'],
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();

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
          {menu.map(([path, label]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                isActive ? 'nav-item active' : 'nav-item'
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <div>
            <strong>
              {user?.firstName} {user?.lastName}
            </strong>
            <span>{user?.role}</span>
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


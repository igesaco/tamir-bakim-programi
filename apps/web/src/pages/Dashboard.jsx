import {
  useEffect,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { statusLabel } from '../utils/status';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (
      user?.role === 'OWNER' ||
      user?.role === 'MANAGER'
    ) {
      api.get('/reports/dashboard')
        .then((response) => {
          setData(response.data);
        });

      return;
    }

    api.get('/service-orders')
      .then((response) => {
        setOrders(response.data);
      });
  }, [user?.role]);

  if (
    user?.role !== 'OWNER' &&
    user?.role !== 'MANAGER'
  ) {
    const active = orders.filter(
      (order) =>
        !['DELIVERED', 'CANCELLED'].includes(
          order.status,
        ),
    );

    return (
      <>
        <div className="page-heading">
          <div>
            <h1>
              {user?.role === 'TECHNICIAN'
                ? 'İşlerim'
                : 'Servis Dashboard'}
            </h1>
            <p>
              {user?.role === 'TECHNICIAN'
                ? 'Size atanmış bakım işlerini görüntüleyin ve durumunu güncelleyin.'
                : 'Şubenizdeki aktif servis işlerini takip edin.'}
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <span>Aktif İş</span>
            <strong>{active.length}</strong>
          </div>

          <div className="stat-card">
            <span>Parça Bekleyen</span>
            <strong>
              {orders.filter(
                (o) => o.status === 'PART_WAITING',
              ).length}
            </strong>
          </div>

          <div className="stat-card">
            <span>Teslime Hazır</span>
            <strong>
              {orders.filter(
                (o) => o.status === 'READY',
              ).length}
            </strong>
          </div>
        </div>

        <div className="panel-card spaced-card">
          <h3>Aktif İş Emirleri</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>İş Emri</th>
                  <th>Plaka</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {active.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.vehicle?.plate}</td>
                    <td>{statusLabel(order.status)}</td>
                    <td>
                      <Link
                        className="table-link"
                        to={`/service-orders/${order.id}`}
                      >
                        Aç
                      </Link>
                    </td>
                  </tr>
                ))}

                {!active.length && (
                  <tr>
                    <td colSpan="4">
                      Aktif iş emri bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  }

  if (!data) {
    return <div>Dashboard yükleniyor...</div>;
  }

  const cards = [
    ['Müşteri', data.customers],
    ['Araç', data.vehicles],
    ['Randevu', data.appointments],
    ['Açık İş Emri', data.openServiceOrders],
    ['Aktif Bakım', data.activeMaintenancePlans],
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Dashboard</h1>
          <p>Servisinizin güncel durumu.</p>
        </div>
      </div>

      <div className="stats-grid">
        {cards.map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <div className="panel-card">
          <span>Toplam Tahsilat</span>
          <strong>
            {Number(data.totalPaid || 0).toLocaleString('tr-TR')} ₺
          </strong>
        </div>

        <div className="panel-card">
          <span>Onaylanan Teklifler</span>
          <strong>
            {Number(
              data.approvedQuotesTotal || 0,
            ).toLocaleString('tr-TR')} ₺
          </strong>
        </div>
      </div>
    </>
  );
}

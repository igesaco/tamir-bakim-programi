import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [payments, setPayments] = useState([]);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/reports/dashboard'),
      api.get('/billing/payments'),
      api.get('/audit'),
    ]).then(([d, p, a]) => {
      setDashboard(d.data);
      setPayments(p.data);
      setAudit(a.data);
    });
  }, []);

  if (!dashboard) {
    return <div>Raporlar yükleniyor...</div>;
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Raporlar</h1>
          <p>Servis performansı ve finansal özet.</p>
        </div>
      </div>

      <div className="stats-grid reports-stats">
        <div className="stat-card">
          <span>Müşteri</span>
          <strong>{dashboard.customers}</strong>
        </div>

        <div className="stat-card">
          <span>Araç</span>
          <strong>{dashboard.vehicles}</strong>
        </div>

        <div className="stat-card">
          <span>Açık İş Emri</span>
          <strong>
            {dashboard.openServiceOrders}
          </strong>
        </div>

        <div className="stat-card">
          <span>Aktif Bakım</span>
          <strong>
            {dashboard.activeMaintenancePlans}
          </strong>
        </div>

        <div className="stat-card">
          <span>Tahsilat</span>
          <strong>
            {Number(
              dashboard.totalPaid || 0,
            ).toLocaleString('tr-TR')} ₺
          </strong>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel-card">
          <h3>Son Ödemeler</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Müşteri</th>
                  <th>Tutar</th>
                  <th>Yöntem</th>
                  <th>Durum</th>
                </tr>
              </thead>

              <tbody>
                {payments.slice(0, 10).map((p) => (
                  <tr key={p.id}>
                    <td>
                      {p.customer?.firstName}{' '}
                      {p.customer?.lastName}
                    </td>
                    <td>
                      {Number(p.amount).toLocaleString(
                        'tr-TR',
                      )} ₺
                    </td>
                    <td>{p.method}</td>
                    <td>{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel-card">
          <h3>Son Sistem Hareketleri</h3>

          <div className="audit-list">
            {audit.slice(0, 10).map((a) => (
              <div className="audit-item" key={a.id}>
                <strong>
                  {a.user
                    ? `${a.user.firstName} ${a.user.lastName}`
                    : 'Sistem'}
                </strong>

                <span>
                  {a.action} · {a.entityType}
                </span>

                <small>
                  {new Date(a.createdAt).toLocaleString(
                    'tr-TR',
                  )}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

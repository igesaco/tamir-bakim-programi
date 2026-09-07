import {
  useEffect,
  useState,
} from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((response) => {
        setData(response.data);
      });
  }, []);

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
            {Number(data.totalPaid || 0).toLocaleString('tr-TR')} ?
          </strong>
        </div>

        <div className="panel-card">
          <span>Onaylanan Teklifler</span>
          <strong>
            {Number(
              data.approvedQuotesTotal || 0,
            ).toLocaleString('tr-TR')} ?
          </strong>
        </div>
      </div>
    </>
  );
}


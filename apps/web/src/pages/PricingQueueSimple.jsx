import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../api/client';
import { statusLabel } from '../utils/status';

export default function PricingQueueSimple() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/service-orders')
      .then((response) => setOrders(response.data))
      .catch((err) => {
        const detail = err?.response?.data?.message;
        setError(Array.isArray(detail) ? detail.join(', ') : detail || 'Fiyatlandırma listesi yüklenemedi.');
      });
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');
    return orders
      .filter((order) => ['ACCEPTED', 'INSPECTION', 'QUOTE_WAITING'].includes(order.status))
      .filter((order) => {
        if (!term) return true;
        return [
          order.orderNumber,
          order.vehicle?.plate,
          order.customer?.firstName,
          order.customer?.lastName,
          order.complaint,
        ].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR').includes(term);
      });
  }, [orders, search]);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Fiyatlandırma</h1>
          <p>İş emrini ayrı ayrı dolaşmak yerine müşterinin çalışma alanını açıp teklifi orada hazırlayın.</p>
        </div>
      </div>
      {error && <div className="page-message error-message">{error}</div>}
      <div className="panel-card">
        <input className="search-input" style={{ width: '100%', marginBottom: 16 }} placeholder="Plaka, müşteri veya iş emri ara..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>İş Emri</th><th>Plaka</th><th>Müşteri</th><th>Talep</th><th>Durum</th><th></th></tr></thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td><strong>{order.vehicle?.plate || '-'}</strong></td>
                  <td>{order.customer?.firstName} {order.customer?.lastName}</td>
                  <td>{order.complaint || '-'}</td>
                  <td><span className="status-badge">{statusLabel(order.status)}</span></td>
                  <td>{order.customerId ? <Link className="primary-link-button" to={`/customers/${order.customerId}`}>Müşteri Panelinde Fiyatlandır →</Link> : '-'}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="6"><div className="empty-state">Fiyatlandırma bekleyen kayıt yok.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

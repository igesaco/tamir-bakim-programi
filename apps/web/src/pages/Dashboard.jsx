import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { statusLabel } from '../utils/status';

const BOARD_COLUMNS = [
  { key: 'intake', label: 'Giriş ve Kontrol', statuses: ['ARRIVED', 'ACCEPTED', 'INSPECTION'] },
  { key: 'approval', label: 'Müşteri Onayı', statuses: ['QUOTE_WAITING'] },
  { key: 'work', label: 'İşlemde', statuses: ['APPROVED', 'IN_PROGRESS'] },
  { key: 'parts', label: 'Parça Bekliyor', statuses: ['PART_WAITING'] },
  { key: 'quality', label: 'Kalite Kontrol', statuses: ['QUALITY_CONTROL'] },
  { key: 'delivery', label: 'Teslim ve Ödeme', statuses: ['READY', 'PAYMENT_WAITING'] },
];

function personName(person) {
  return [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'Atanmadı';
}

function formatDate(value) {
  if (!value) return 'Tarih girilmedi';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

function isOverdue(order) {
  return order.estimatedDeliveryAt && new Date(order.estimatedDeliveryAt).getTime() < Date.now();
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canUseReports = (user?.role === 'OWNER' || user?.role === 'MANAGER') &&
    user?.features?.includes('REPORTS');

  const load = useCallback(async () => {
    try {
      const requests = [api.get('/service-orders/board')];
      if (canUseReports) requests.push(api.get('/reports/dashboard'));
      const [boardResponse, reportResponse] = await Promise.all(requests);
      setOrders(boardResponse.data);
      if (reportResponse) setData(reportResponse.data);
      setError('');
    } catch {
      setError('Dashboard verileri alınamadı. Bağlantıyı kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [canUseReports]);

  useEffect(() => { void load(); }, [load]);
  useLiveRefresh(load);

  const groupedOrders = useMemo(() => BOARD_COLUMNS.map((column) => ({
    ...column,
    orders: orders.filter((order) => column.statuses.includes(order.status)),
  })), [orders]);
  const counts = useMemo(() => ({
    active: orders.length,
    approval: orders.filter((order) => order.status === 'QUOTE_WAITING').length,
    parts: orders.filter((order) => order.status === 'PART_WAITING').length,
    ready: orders.filter((order) => ['READY', 'PAYMENT_WAITING'].includes(order.status)).length,
    overdue: orders.filter(isOverdue).length,
  }), [orders]);

  if (loading) return <div className="dashboard-state">Atölye panosu yükleniyor...</div>;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{user?.role === 'TECHNICIAN' ? 'İşlerim' : 'Atölye Panosu'}</h1>
          <p>{user?.role === 'TECHNICIAN'
            ? 'Size atanmış işleri, ilerlemeyi ve teslim hedefini takip edin.'
            : 'Servisteki her aracın hangi aşamada olduğunu tek ekrandan izleyin.'}</p>
        </div>
        <button className="small-button" type="button" onClick={() => load()}>Yenile</button>
      </div>

      {error && (
        <div className="dashboard-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => load()}>Tekrar dene</button>
        </div>
      )}

      <div className="stats-grid workshop-stats">
        {[
          ['Aktif İş', counts.active], ['Onay Bekleyen', counts.approval],
          ['Parça Bekleyen', counts.parts], ['Teslim / Ödeme', counts.ready],
          ['Geciken', counts.overdue],
        ].map(([label, value]) => (
          <div className={`stat-card ${label === 'Geciken' && value ? 'danger-card' : ''}`} key={label}>
            <span>{label}</span><strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="workshop-board" aria-label="Aktif iş emirleri aşama panosu">
        {groupedOrders.map((column) => (
          <section className="workshop-column" key={column.key}>
            <header><h2>{column.label}</h2><span>{column.orders.length}</span></header>
            <div className="workshop-column-body">
              {column.orders.map((order) => {
                const progress = order.itemCount
                  ? Math.round((order.completedItemCount / order.itemCount) * 100) : 0;
                return (
                  <Link className="workshop-card" to={`/service-orders/${order.id}`} key={order.id}>
                    <div className="workshop-card-title">
                      <strong>{order.vehicle?.plate || 'Plaka yok'}</strong>
                      <span>{statusLabel(order.status)}</span>
                    </div>
                    <p>{personName(order.customer)}</p>
                    <small>{[order.vehicle?.brand, order.vehicle?.model].filter(Boolean).join(' ') || order.orderNumber}</small>
                    <div className="workshop-progress" aria-label={`İşlem ilerlemesi yüzde ${progress}`}>
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <div className="workshop-card-meta">
                      <span>{order.completedItemCount}/{order.itemCount} kalem</span>
                      <span className={isOverdue(order) ? 'overdue' : ''}>{formatDate(order.estimatedDeliveryAt)}</span>
                    </div>
                    <div className="workshop-card-footer">
                      <span>{personName(order.assignedTechnician)}</span>
                      {order.branch?.name && <span>{order.branch.name}</span>}
                    </div>
                  </Link>
                );
              })}
              {!column.orders.length && <div className="workshop-empty">Bu aşamada araç yok.</div>}
            </div>
          </section>
        ))}
      </div>

      {canUseReports && data && (
        <section className="dashboard-summary spaced-card">
          <div className="panel-card"><span>Müşteri / Araç</span><strong>{data.customers} / {data.vehicles}</strong></div>
          <div className="panel-card"><span>Toplam Tahsilat</span><strong>{Number(data.totalPaid || 0).toLocaleString('tr-TR')} ₺</strong></div>
          <div className="panel-card"><span>Onaylanan Teklifler</span><strong>{Number(data.approvedQuotesTotal || 0).toLocaleString('tr-TR')} ₺</strong></div>
        </section>
      )}
    </>
  );
}

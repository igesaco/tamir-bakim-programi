import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { useLiveRefresh } from '../hooks/useLiveRefresh';
import { statusLabel } from '../utils/status';

const BOARD_COLUMNS = [
  { key: 'intake', label: 'Giriş ve Kontrol', color: '#3b82f6', statuses: ['ARRIVED', 'ACCEPTED', 'INSPECTION'] },
  { key: 'approval', label: 'Müşteri Onayı', color: '#f59e0b', statuses: ['QUOTE_WAITING'] },
  { key: 'work', label: 'İşlemde', color: '#8b5cf6', statuses: ['APPROVED', 'IN_PROGRESS'] },
  { key: 'parts', label: 'Parça Bekliyor', color: '#ec4899', statuses: ['PART_WAITING'] },
  { key: 'quality', label: 'Kalite Kontrol', color: '#06b6d4', statuses: ['QUALITY_CONTROL'] },
  { key: 'delivery', label: 'Teslim ve Ödeme', color: '#10b981', statuses: ['READY', 'PAYMENT_WAITING'] },
];

function money(value) {
  return Number(value || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

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
  const [todaySummary, setTodaySummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const canUseReports = (user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.role === 'ACCOUNTING') &&
    user?.features?.includes('REPORTS');

  const canUseCashier = (user?.role === 'OWNER' || user?.role === 'MANAGER' || user?.role === 'ACCOUNTING') &&
    user?.features?.includes('CASHIER');

  const load = useCallback(async () => {
    try {
      const todayIso = new Date().toISOString().split('T')[0];
      const requests = [api.get('/service-orders/board')];

      if (canUseReports) requests.push(api.get('/reports/dashboard'));
      if (canUseCashier) requests.push(api.get(`/billing/summary?from=${todayIso}`));

      const results = await Promise.allSettled(requests);

      if (results[0].status === 'fulfilled') {
        setOrders(results[0].value.data || []);
      }

      if (canUseReports && results[1]?.status === 'fulfilled') {
        setData(results[1].value.data);
      }

      const cashierIdx = canUseReports ? 2 : 1;
      if (canUseCashier && results[cashierIdx]?.status === 'fulfilled') {
        setTodaySummary(results[cashierIdx].value.data);
      }

      setError('');
    } catch {
      setError('Dashboard verileri alınamadı. Bağlantıyı kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }, [canUseReports, canUseCashier]);

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

  // Status Distribution Calculation
  const stageDistribution = useMemo(() => {
    const total = orders.length || 1;
    return BOARD_COLUMNS.map((col) => {
      const count = orders.filter((o) => col.statuses.includes(o.status)).length;
      return {
        key: col.key,
        label: col.label,
        color: col.color,
        count,
        percent: Math.round((count / total) * 100),
      };
    });
  }, [orders]);

  if (loading && !orders.length) return <div className="dashboard-state">Atölye panosu yükleniyor...</div>;

  return (
    <>
      {/* Heading & Fast Actions */}
      <div className="page-heading">
        <div>
          <h1>{user?.role === 'TECHNICIAN' ? 'İşlerim & Atölye' : 'Atölye ve Yönetim Panosu'}</h1>
          <p>{user?.role === 'TECHNICIAN'
            ? 'Size atanmış işleri, ilerlemeyi ve teslim hedefini takip edin.'
            : 'Servisteki her aracın hangi aşamada olduğunu canlı olarak izleyin.'}</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link to="/service-orders" className="primary-button" style={{ fontSize: '13px', padding: '9px 18px', borderRadius: '10px' }}>
            + Yeni İş Emri
          </Link>
          {canUseCashier && (
            <Link to="/cashier" className="secondary-button" style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '10px' }}>
              💵 Kasa & Tahsilat
            </Link>
          )}
          <Link to="/appointments" className="secondary-button" style={{ fontSize: '13px', padding: '9px 16px', borderRadius: '10px' }}>
            📅 Randevular
          </Link>
          <button className="secondary-button" type="button" onClick={() => load()} title="Yenile" style={{ padding: '9px 14px', borderRadius: '10px' }}>
            ↻
          </button>
        </div>
      </div>

      {error && (
        <div className="dashboard-alert" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => load()}>Tekrar dene</button>
        </div>
      )}

      {/* Overdue Warning Alert Strip */}
      {counts.overdue > 0 && (
        <div
          style={{
            padding: '12px 18px',
            marginBottom: '16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <strong style={{ color: '#ef4444', fontSize: '14px' }}>
                {counts.overdue} adet iş emrinde teslimat süresi aşıldı!
              </strong>
              <div style={{ fontSize: '12px', color: '#a0a8b2', marginTop: '2px' }}>
                Müşteri memnuniyetini korumak için geciken araçların aşamalarını kontrol ediniz.
              </div>
            </div>
          </div>
          <Link
            to="/service-orders"
            className="small-button"
            style={{ fontSize: '11px', borderColor: '#ef4444', color: '#ef4444' }}
          >
            İncele →
          </Link>
        </div>
      )}

      {/* Live Financial & Workshop Summary Strip */}
      {todaySummary && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '16px',
          }}
        >
          <div className="stat-card" style={{ padding: '14px 18px' }}>
            <span style={{ fontSize: '11px', color: '#747e89' }}>Bugünkü Kasa Tahsilatı</span>
            <strong style={{ color: '#22c55e', fontSize: '20px' }}>{money(todaySummary.TOTAL)} ₺</strong>
            <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#636c76', marginTop: '4px' }}>
              <span>Nakit: {money(todaySummary.CASH)} ₺</span>
              <span>Kart: {money(todaySummary.CARD)} ₺</span>
            </div>
          </div>

          <div className="stat-card" style={{ padding: '14px 18px' }}>
            <span style={{ fontSize: '11px', color: '#747e89' }}>Havale / EFT Tahsilatı</span>
            <strong style={{ color: '#3b82f6', fontSize: '20px' }}>{money(todaySummary.TRANSFER)} ₺</strong>
            <div style={{ fontSize: '11px', color: '#636c76', marginTop: '4px' }}>
              {todaySummary.count} işlem kaydedildi
            </div>
          </div>

          {data && (
            <div className="stat-card" style={{ padding: '14px 18px' }}>
              <span style={{ fontSize: '11px', color: '#747e89' }}>Onaylı Bekleyen Teklifler</span>
              <strong style={{ color: '#f59e0b', fontSize: '20px' }}>{money(data.approvedQuotesTotal)} ₺</strong>
              <div style={{ fontSize: '11px', color: '#636c76', marginTop: '4px' }}>
                {data.pendingQuotes} teklif onay bekliyor
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workshop Stage Distribution Bar */}
      <div
        className="panel-card"
        style={{
          padding: '16px 20px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <strong style={{ fontSize: '13px' }}>Atölye Süreç Dağılımı ({orders.length} Araç)</strong>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '11px' }}>
            {stageDistribution.map((s) => (
              <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                <span style={{ color: 'var(--text-secondary, #64748b)' }}>{s.label}:</span>
                <strong style={{ color: 'var(--text-primary, #0f172a)' }}>{s.count}</strong>
              </span>
            ))}
          </div>
        </div>

        <div style={{ width: '100%', height: '8px', background: 'var(--tenant-border, rgba(148, 163, 184, 0.2))', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
          {stageDistribution.map((s) => (
            <div
              key={s.key}
              style={{
                width: `${s.percent}%`,
                height: '100%',
                background: s.color,
                transition: 'width .3s ease',
              }}
              title={`${s.label}: ${s.count} araç (%${s.percent})`}
            />
          ))}
        </div>
      </div>

      {/* Stage Stat Cards */}
      <div className="stats-grid workshop-stats">
        {[
          ['Aktif İş', counts.active],
          ['Onay Bekleyen', counts.approval],
          ['Parça Bekleyen', counts.parts],
          ['Teslim / Ödeme', counts.ready],
          ['Geciken', counts.overdue],
        ].map(([label, value]) => (
          <div className={`stat-card ${label === 'Geciken' && value ? 'danger-card' : ''}`} key={label}>
            <span>{label}</span>
            <strong style={{ color: label === 'Geciken' && value ? '#ef4444' : undefined }}>{value}</strong>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="workshop-board" aria-label="Aktif iş emirleri aşama panosu">
        {groupedOrders.map((column) => (
          <section className="workshop-column" key={column.key}>
            <header>
              <h2>{column.label}</h2>
              <span>{column.orders.length}</span>
            </header>
            <div className="workshop-column-body">
              {column.orders.map((order) => {
                const progress = order.itemCount
                  ? Math.round((order.completedItemCount / order.itemCount) * 100)
                  : 0;
                return (
                  <Link className="workshop-card" to={`/service-orders/${order.id}`} key={order.id}>
                    <div className="workshop-card-title">
                      <strong>{order.vehicle?.plate || 'Plaka yok'}</strong>
                      <span>{statusLabel(order.status)}</span>
                    </div>
                    <p>{personName(order.customer)}</p>
                    <small>
                      {[order.vehicle?.brand, order.vehicle?.model].filter(Boolean).join(' ') ||
                        order.orderNumber}
                    </small>
                    <div className="workshop-progress" aria-label={`İşlem ilerlemesi yüzde ${progress}`}>
                      <span style={{ width: `${progress}%` }} />
                    </div>
                    <div className="workshop-card-meta">
                      <span>
                        {order.completedItemCount}/{order.itemCount} kalem
                      </span>
                      <span className={isOverdue(order) ? 'overdue' : ''}>
                        {formatDate(order.estimatedDeliveryAt)}
                      </span>
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

      {/* Extra KPI Summary Footer */}
      {canUseReports && data && (
        <section className="dashboard-summary spaced-card" style={{ marginTop: '20px' }}>
          <div className="panel-card">
            <span>Kayıtlı Müşteri / Filo</span>
            <strong>
              {data.customers} / {data.vehicles}
            </strong>
          </div>
          <div className="panel-card">
            <span>Toplam Tahsilat</span>
            <strong style={{ color: '#22c55e' }}>{Number(data.totalPaid || 0).toLocaleString('tr-TR')} ₺</strong>
          </div>
          <div className="panel-card">
            <span>Aktif Bakım Planları</span>
            <strong>{data.activeMaintenancePlans} plan</strong>
          </div>
          <div className="panel-card">
            <span>Garanti Dönüşleri</span>
            <strong style={{ color: data.warrantyReturns > 0 ? '#ef4444' : undefined }}>
              {data.warrantyReturns}
            </strong>
          </div>
        </section>
      )}
    </>
  );
}

import { useLiveRefresh } from '../hooks/useLiveRefresh';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import api from '../api/client';
import { statusLabel } from '../utils/status';
import ActionNotice from '../components/ActionNotice';

function money(value) {
  return Number(value || 0).toLocaleString(
    'tr-TR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

const methodLabels = {
  CASH: 'Nakit',
  CARD: 'Kart',
  TRANSFER: 'Havale / EFT',
  OTHER: 'Diğer',
};

export default function Cashier() {
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'aging'
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  // Customer open balance tracking
  const [customerBalance, setCustomerBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Aging report state
  const [agingReport, setAgingReport] = useState(null);
  const [loadingAging, setLoadingAging] = useState(false);

  // Filters & Pagination
  const [dateFilter, setDateFilter] = useState('all'); // 'today' | 'this_week' | 'this_month' | 'all' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const [form, setForm] = useState({
    customerId: '',
    branchId: '',
    serviceOrderId: '',
    quoteId: '',
    amount: '',
    method: 'CASH',
    reference: '',
  });

  useLiveRefresh(() => load(true), !busy);

  async function load() {
    const [
      paymentRes,
      customerRes,
      orderRes,
      quoteRes,
      branchRes,
    ] = await Promise.all([
      api.get('/billing/payments'),
      api.get('/customers'),
      api.get('/service-orders'),
      api.get('/quotes'),
      api.get('/branches/options'),
    ]);

    setPayments(paymentRes.data);
    setCustomers(customerRes.data);
    setOrders(orderRes.data);
    setQuotes(quoteRes.data);
    setBranches(branchRes.data);
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Kasa verileri yüklenemedi.',
      );
    });
  }, []);

  // Fetch customer balance when customerId changes
  useEffect(() => {
    if (!form.customerId) {
      setCustomerBalance(null);
      return;
    }

    let isMounted = true;
    setLoadingBalance(true);

    api
      .get(`/billing/customer-balance/${form.customerId}`)
      .then((res) => {
        if (isMounted) {
          setCustomerBalance(res.data);
        }
      })
      .catch(() => {
        if (isMounted) setCustomerBalance(null);
      })
      .finally(() => {
        if (isMounted) setLoadingBalance(false);
      });

    return () => {
      isMounted = false;
    };
  }, [form.customerId]);

  // Fetch aging report when active tab is 'aging'
  async function fetchAgingReport() {
    setLoadingAging(true);
    setError('');
    try {
      const res = await api.get('/billing/aging-report');
      setAgingReport(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Yaşlandırma raporu yüklenemedi.',
      );
    } finally {
      setLoadingAging(false);
    }
  }

  useEffect(() => {
    if (activeTab === 'aging') {
      fetchAgingReport();
    }
  }, [activeTab]);

  const filteredOrders = orders.filter(
    (order) =>
      !form.customerId ||
      order.customerId === form.customerId,
  );

  const filteredQuotes = quotes.filter(
    (quote) =>
      (!form.customerId ||
        quote.customerId ===
          form.customerId) &&
      (!form.serviceOrderId ||
        quote.serviceOrderId ===
          form.serviceOrderId),
  );

  function quoteRemaining(quote) {
    const paid = payments
      .filter((payment) => payment.quoteId === quote.id && payment.status === 'PAID')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return Math.max(0, Number(quote.total || 0) - paid);
  }

  // Filtered payments by date, search, method, status
  const filteredPayments = useMemo(() => {
    const now = new Date();
    const todayStr = now.toDateString();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return payments.filter((p) => {
      const pDate = new Date(p.paidAt || p.createdAt);

      // Date range filter
      if (dateFilter === 'today') {
        if (pDate.toDateString() !== todayStr) return false;
      } else if (dateFilter === 'this_week') {
        if (pDate < weekAgo) return false;
      } else if (dateFilter === 'this_month') {
        if (pDate < monthAgo) return false;
      } else if (dateFilter === 'custom') {
        if (customFrom && pDate < new Date(customFrom)) return false;
        if (customTo) {
          const toD = new Date(customTo);
          toD.setHours(23, 59, 59, 999);
          if (pDate > toD) return false;
        }
      }

      // Method filter
      if (methodFilter && p.method !== methodFilter) return false;

      // Status filter
      if (statusFilter && p.status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const custName = `${p.customer?.firstName || ''} ${p.customer?.lastName || ''}`.toLowerCase();
        const orderNum = (p.serviceOrder?.orderNumber || '').toLowerCase();
        const plate = (p.serviceOrder?.vehicle?.plate || '').toLowerCase();
        const ref = (p.reference || '').toLowerCase();
        const branchName = (p.branch?.name || '').toLowerCase();

        if (
          !custName.includes(q) &&
          !orderNum.includes(q) &&
          !plate.includes(q) &&
          !ref.includes(q) &&
          !branchName.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [payments, dateFilter, customFrom, customTo, methodFilter, statusFilter, searchQuery]);

  // Selected period summary
  const periodSummary = useMemo(() => {
    const result = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      OTHER: 0,
      TOTAL: 0,
      COUNT: 0,
    };

    filteredPayments.forEach((payment) => {
      if (payment.status !== 'PAID') return;
      const amount = Number(payment.amount || 0);
      result[payment.method] = (result[payment.method] || 0) + amount;
      result.TOTAL += amount;
      result.COUNT += 1;
    });

    return result;
  }, [filteredPayments]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, customFrom, customTo, searchQuery, methodFilter, statusFilter]);

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.post(
        '/billing/payments',
        {
          customerId:
            form.customerId,
          branchId:
            form.branchId ||
            customers.find((customer) => customer.id === form.customerId)?.branchId ||
            undefined,
          serviceOrderId:
            form.serviceOrderId ||
            undefined,
          quoteId:
            form.quoteId ||
            undefined,
          amount:
            Number(form.amount),
          method:
            form.method,
          status: 'PAID',
          reference:
            form.reference ||
            undefined,
        },
      );

      setForm({
        customerId: '',
        branchId: '',
        serviceOrderId: '',
        quoteId: '',
        amount: '',
        method: 'CASH',
        reference: '',
      });
      setCustomerBalance(null);

      setMessage(
        'Tahsilat başarıyla kaydedildi.',
      );

      await load();
      if (activeTab === 'aging') await fetchAgingReport();
    } catch (err) {
      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'Tahsilat kaydedilemedi.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function updatePaymentStatus(
    payment,
    status,
  ) {
    const label =
      status === 'REFUNDED'
        ? 'iade'
        : 'iptal';

    const approved =
      window.confirm(
        `${payment.customer?.firstName || ''} ${payment.customer?.lastName || ''} için ${money(payment.amount)} ₺ tahsilatı ${label} etmek istediğinize emin misiniz?`,
      );

    if (!approved) {
      return;
    }

    setError('');
    setMessage('');

    try {
      await api.patch(
        `/billing/payments/${payment.id}/status`,
        { status },
      );

      setMessage(
        status === 'REFUNDED'
          ? 'Tahsilat iade olarak işaretlendi.'
          : 'Tahsilat iptal edildi.',
      );

      await load();
      if (activeTab === 'aging') await fetchAgingReport();
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Tahsilat durumu güncellenemedi.',
      );
    }
  }

  function chooseOrder(orderId) {
    const order = orders.find(
      (item) =>
        item.id === orderId,
    );

    setForm({
      ...form,
      serviceOrderId:
        orderId,
      branchId:
        order?.branchId ||
        form.branchId,
      quoteId: '',
    });
  }

  function chooseQuote(quoteId) {
    const quote = quotes.find(
      (item) =>
        item.id === quoteId,
    );

    setForm({
      ...form,
      quoteId,
      branchId:
        quote?.branchId ||
        form.branchId,
      amount:
        quote
          ? quoteRemaining(quote).toFixed(2)
          : form.amount,
    });
  }

  function startCollectionForCustomer(customerId) {
    setActiveTab('payments');
    setForm((prev) => ({
      ...prev,
      customerId,
      branchId: customers.find((c) => c.id === customerId)?.branchId || prev.branchId,
      serviceOrderId: '',
      quoteId: '',
      amount: '',
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Kasa & Cari Hesap Yönetimi</h1>
          <p>
            Nakit, kart ve banka tahsilatları, müşteri bakiye takibi ve alacak yaşlandırma raporları.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={activeTab === 'payments' ? 'primary-button' : 'small-button'}
            onClick={() => setActiveTab('payments')}
          >
            💵 Tahsilat & Kasa
          </button>
          <button
            className={activeTab === 'aging' ? 'primary-button' : 'small-button'}
            onClick={() => setActiveTab('aging')}
          >
            📊 Cari Yaşlandırma Raporu
          </button>
        </div>
      </div>

      <ActionNotice message={message} error={error} />

      {activeTab === 'payments' && (
        <>
          {/* Summary Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <span>{dateFilter === 'today' ? 'Bugün Toplam' : dateFilter === 'this_week' ? 'Bu Hafta Toplam' : dateFilter === 'this_month' ? 'Bu Ay Toplam' : 'Filtrelenen Toplam'}</span>
              <strong>
                {money(periodSummary.TOTAL)} ₺
              </strong>
              <small style={{ color: '#747e89', fontSize: '11px', marginTop: '4px' }}>
                {periodSummary.COUNT} işlem
              </small>
            </div>

            <div className="stat-card">
              <span>Nakit</span>
              <strong>
                {money(periodSummary.CASH)} ₺
              </strong>
            </div>

            <div className="stat-card">
              <span>Kart</span>
              <strong>
                {money(periodSummary.CARD)} ₺
              </strong>
            </div>

            <div className="stat-card">
              <span>Havale / EFT</span>
              <strong>
                {money(periodSummary.TRANSFER)} ₺
              </strong>
            </div>
          </div>

          <div className="content-grid spaced-card">
            {/* New Payment Form */}
            <div className="panel-card">
              <h3>Yeni Tahsilat Girişi</h3>

              <form
                className="form-grid"
                onSubmit={submit}
              >
                <select
                  className="full"
                  value={form.customerId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      customerId: e.target.value,
                      branchId: customers.find((customer) => customer.id === e.target.value)?.branchId || '',
                      serviceOrderId: '',
                      quoteId: '',
                      amount: '',
                    })
                  }
                  required
                >
                  <option value="">
                    Müşteri seçiniz *
                  </option>

                  {customers.map((customer) => (
                    <option
                      key={customer.id}
                      value={customer.id}
                    >
                      {customer.firstName}{' '}
                      {customer.lastName}
                      {customer.phone
                        ? ` · ${customer.phone}`
                        : ''}
                    </option>
                  ))}
                </select>

                {/* Customer Balance Live Card */}
                {loadingBalance && (
                  <div className="full" style={{ padding: '8px 12px', background: '#181c22', borderRadius: '8px', fontSize: '12px', color: '#747e89' }}>
                    Müşteri bakiyesi kontrol ediliyor...
                  </div>
                )}

                {customerBalance && (
                  <div
                    className="full"
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: customerBalance.openBalance > 0 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                      border: `1px solid ${customerBalance.openBalance > 0 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: customerBalance.openBalance > 0 ? '#f59e0b' : '#22c55e', fontWeight: 600 }}>
                        {customerBalance.openBalance > 0 ? '⚠️ AÇIK CARİ BAKİYE' : '✓ CARİ HESAP KAPALI'}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>
                        {money(customerBalance.openBalance)} ₺
                      </div>
                      <div style={{ fontSize: '11px', color: '#747e89', marginTop: '3px' }}>
                        Toplam Faturalanan: {money(customerBalance.totalBilled)} ₺ · Ödenen: {money(customerBalance.totalPaid)} ₺
                      </div>
                    </div>

                    {customerBalance.openBalance > 0 && (
                      <button
                        type="button"
                        className="small-button"
                        style={{ fontSize: '11px', padding: '6px 10px', background: '#f59e0b', color: '#111', fontWeight: 700, border: 'none' }}
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            amount: customerBalance.openBalance.toFixed(2),
                          }))
                        }
                      >
                        Bakiyeyi Doldur ↵
                      </button>
                    )}
                  </div>
                )}

                <select
                  value={form.branchId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branchId:
                        e.target.value,
                    })
                  }
                  required={
                    !form.serviceOrderId &&
                    !form.quoteId
                  }
                >
                  <option value="">
                    Şube seçiniz
                  </option>

                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.name}
                    </option>
                  ))}
                </select>

                <select
                  value={form.serviceOrderId}
                  onChange={(e) =>
                    chooseOrder(
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    İş emri (opsiyonel)
                  </option>

                  {filteredOrders
                    .filter(
                      (order) =>
                        order.status !== 'CANCELLED' &&
                        (!quotes.some((quote) => quote.serviceOrderId === order.id) ||
                          quotes.some((quote) => quote.serviceOrderId === order.id && quote.status === 'APPROVED')),
                    )
                    .map((order) => (
                      <option
                        key={order.id}
                        value={order.id}
                      >
                        {order.orderNumber}
                        {' · '}
                        {order.vehicle?.plate}
                        {' · '}
                        {statusLabel(
                          order.status,
                        )}
                      </option>
                    ))}
                </select>

                {form.customerId && filteredQuotes.length > 0 && !filteredQuotes.some((quote) => quote.status === 'APPROVED') && (
                  <p className="form-hint full">Bu müşterinin teklifleri henüz onaylanmamış. Teklife bağlı tahsilat için müşteri onayını bekleyin.</p>
                )}

                <select
                  value={form.quoteId}
                  onChange={(e) =>
                    chooseQuote(
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Teklif / Proforma (opsiyonel)
                  </option>

                  {filteredQuotes
                    .filter((quote) => quote.status === 'APPROVED' && quoteRemaining(quote) > 0.009)
                    .map((quote) => (
                      <option
                        key={quote.id}
                        value={quote.id}
                      >
                        {quote.quoteNumber}
                        {' · '}
                        {money(
                          quoteRemaining(quote),
                        )}{' '}
                        ₺ kalan
                      </option>
                    ))}
                </select>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Tahsilat tutarı ₺ *"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount:
                        e.target.value,
                    })
                  }
                  required
                />

                <select
                  value={form.method}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      method:
                        e.target.value,
                    })
                  }
                >
                  <option value="CASH">
                    Nakit
                  </option>
                  <option value="CARD">
                    Banka / Kredi Kartı
                  </option>
                  <option value="TRANSFER">
                    Havale / EFT
                  </option>
                  <option value="OTHER">
                    Diğer
                  </option>
                </select>

                <input
                  className="full"
                  type="text"
                  placeholder="Referans / Makbuz / Dekont No (opsiyonel)"
                  value={form.reference}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      reference:
                        e.target.value,
                    })
                  }
                />

                <button
                  className="primary-button full"
                  disabled={busy}
                >
                  {busy
                    ? 'Kaydediliyor...'
                    : 'Tahsilatı Kaydet'}
                </button>
              </form>
            </div>

            {/* Payments List & Filter */}
            <div className="panel-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <h3 style={{ margin: 0 }}>Tahsilat Kayıtları ({filteredPayments.length})</h3>

                {/* Date Quick Filter Pills */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'all', label: 'Tümü' },
                    { key: 'today', label: 'Bugün' },
                    { key: 'this_week', label: 'Bu Hafta' },
                    { key: 'this_month', label: 'Bu Ay' },
                    { key: 'custom', label: 'Özel Tarih' },
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      className={`small-button ${dateFilter === p.key ? 'active' : ''}`}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        background: dateFilter === p.key ? 'var(--tenant-primary, #f59e0b)' : undefined,
                        color: dateFilter === p.key ? '#111' : undefined,
                        fontWeight: dateFilter === p.key ? 700 : undefined,
                      }}
                      onClick={() => setDateFilter(p.key)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Pickers & Search Toolbar */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Müşteri, plaka, iş emri, dekont ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ flex: '1 1 200px', minWidth: '180px', padding: '7px 12px', fontSize: '12px' }}
                />

                {dateFilter === 'custom' && (
                  <>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      title="Başlangıç Tarihi"
                      style={{ padding: '7px 10px', fontSize: '12px' }}
                    />
                    <input
                      type="date"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      title="Bitiş Tarihi"
                      style={{ padding: '7px 10px', fontSize: '12px' }}
                    />
                  </>
                )}

                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: '12px' }}
                >
                  <option value="">Tüm Yöntemler</option>
                  <option value="CASH">Nakit</option>
                  <option value="CARD">Kart</option>
                  <option value="TRANSFER">Havale / EFT</option>
                  <option value="OTHER">Diğer</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '7px 10px', fontSize: '12px' }}
                >
                  <option value="">Tüm Durumlar</option>
                  <option value="PAID">Ödendi</option>
                  <option value="CANCELLED">İptal</option>
                  <option value="REFUNDED">İade</option>
                  <option value="PENDING">Bekleyen</option>
                </select>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>Müşteri</th>
                      <th>Şube</th>
                      <th>İş Emri</th>
                      <th>Yöntem</th>
                      <th>Durum</th>
                      <th>Tutar</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td>
                          {new Date(
                            payment.paidAt ||
                              payment.createdAt,
                          ).toLocaleString(
                            'tr-TR',
                          )}
                        </td>

                        <td>
                          <strong>
                            {payment.customer?.firstName}{' '}
                            {payment.customer?.lastName}
                          </strong>
                          {payment.reference && (
                            <div style={{ fontSize: '11px', color: '#747e89' }}>
                              Ref: {payment.reference}
                            </div>
                          )}
                        </td>

                        <td>
                          {payment.branch?.name ||
                            '-'}
                        </td>

                        <td>
                          {payment.serviceOrder?.orderNumber ? (
                            <span>
                              {payment.serviceOrder.orderNumber}
                              {payment.serviceOrder?.vehicle?.plate && ` (${payment.serviceOrder.vehicle.plate})`}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td>
                          {methodLabels[
                            payment.method
                          ] ||
                            payment.method}
                        </td>

                        <td>
                          <span
                            className={
                              payment.status === 'PAID'
                                ? 'status-badge success'
                                : payment.status === 'PENDING'
                                ? 'status-badge warning'
                                : 'status-badge danger'
                            }
                          >
                            {statusLabel(
                              payment.status,
                            )}
                          </span>
                        </td>

                        <td>
                          <strong style={{ color: payment.status === 'PAID' ? '#22c55e' : undefined }}>
                            {money(
                              payment.amount,
                            )}{' '}
                            ₺
                          </strong>
                        </td>

                        <td>
                          {payment.status ===
                            'PAID' && (
                            <div className="action-row">
                              <button
                                className="table-action danger-text"
                                onClick={() =>
                                  updatePaymentStatus(
                                    payment,
                                    'CANCELLED',
                                  )
                                }
                              >
                                İptal
                              </button>

                              <button
                                className="table-action"
                                onClick={() =>
                                  updatePaymentStatus(
                                    payment,
                                    'REFUNDED',
                                  )
                                }
                              >
                                İade
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {!filteredPayments.length && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '32px' }}>
                          Filtrelere uygun tahsilat kaydı bulunamadı.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #242930',
                    fontSize: '12px',
                    color: '#a0a8b2',
                  }}
                >
                  <div>
                    Toplam {filteredPayments.length} kayıttan {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, filteredPayments.length)} arası gösteriliyor
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      className="small-button"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      ‹ Önceki
                    </button>

                    <span style={{ padding: '0 8px', fontWeight: 600 }}>
                      Sayfa {currentPage} / {totalPages}
                    </span>

                    <button
                      className="small-button"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sonraki ›
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Aging Report Tab */}
      {activeTab === 'aging' && (
        <div className="panel-card" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Cari Hesap Yaşlandırma Raporu</h3>
              <p style={{ margin: '4px 0 0', color: '#747e89', fontSize: '13px' }}>
                Müşterilerin vadesi geçmiş açık alacaklarının gün aralıklarına göre analizi.
              </p>
            </div>

            <button
              className="small-button"
              disabled={loadingAging}
              onClick={fetchAgingReport}
            >
              {loadingAging ? 'Yenileniyor...' : '↻ Yenile'}
            </button>
          </div>

          {loadingAging && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#747e89' }}>
              Yaşlandırma raporu hazırlanıyor...
            </div>
          )}

          {agingReport && (
            <>
              {/* Aging Summary Badges */}
              <div className="stats-grid" style={{ marginBottom: '20px' }}>
                <div className="stat-card">
                  <span>Toplam Açık Alacak</span>
                  <strong style={{ color: '#ef4444' }}>
                    {money(agingReport.summary.totalOutstanding)} ₺
                  </strong>
                  <small style={{ color: '#747e89', fontSize: '11px', marginTop: '4px' }}>
                    {agingReport.summary.customerCount} borçlu müşteri
                  </small>
                </div>

                <div className="stat-card">
                  <span>0 - 30 Gün (Güncel)</span>
                  <strong style={{ color: '#22c55e' }}>
                    {money(agingReport.summary.current)} ₺
                  </strong>
                </div>

                <div className="stat-card">
                  <span>31 - 60 Gün</span>
                  <strong style={{ color: '#f59e0b' }}>
                    {money(agingReport.summary.days31to60)} ₺
                  </strong>
                </div>

                <div className="stat-card">
                  <span>61 - 90 Gün</span>
                  <strong style={{ color: '#f97316' }}>
                    {money(agingReport.summary.days61to90)} ₺
                  </strong>
                </div>

                <div className="stat-card">
                  <span>90+ Gün (Kritik)</span>
                  <strong style={{ color: '#ef4444' }}>
                    {money(agingReport.summary.over90)} ₺
                  </strong>
                </div>
              </div>

              {/* Aging Customers Table */}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Müşteri</th>
                      <th>İletişim</th>
                      <th>Toplam Bakiye</th>
                      <th>0 - 30 Gün</th>
                      <th>31 - 60 Gün</th>
                      <th>61 - 90 Gün</th>
                      <th>90+ Gün</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {agingReport.customers.map((c) => (
                      <tr key={c.customerId}>
                        <td>
                          <strong>{c.customerName}</strong>
                          {c.oldestDate && (
                            <div style={{ fontSize: '11px', color: '#747e89' }}>
                              En eski işlem: {new Date(c.oldestDate).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                        </td>

                        <td>{c.phone || '-'}</td>

                        <td>
                          <strong style={{ color: '#ef4444' }}>
                            {money(c.totalBalance)} ₺
                          </strong>
                        </td>

                        <td>
                          {c.current > 0 ? (
                            <span style={{ color: '#22c55e' }}>{money(c.current)} ₺</span>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td>
                          {c.days31to60 > 0 ? (
                            <span style={{ color: '#f59e0b' }}>{money(c.days31to60)} ₺</span>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td>
                          {c.days61to90 > 0 ? (
                            <span style={{ color: '#f97316' }}>{money(c.days61to90)} ₺</span>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td>
                          {c.over90 > 0 ? (
                            <span style={{ color: '#ef4444', fontWeight: 700 }}>
                              {money(c.over90)} ₺
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td>
                          <button
                            className="small-button"
                            style={{ fontSize: '11px', padding: '6px 12px' }}
                            onClick={() => startCollectionForCustomer(c.customerId)}
                          >
                            Tahsilat Al →
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!agingReport.customers.length && (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#22c55e' }}>
                          ✓ Tebrikler! Hiçbir müşterinin vadesi geçmiş açık bakiyesi bulunmamaktadır.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

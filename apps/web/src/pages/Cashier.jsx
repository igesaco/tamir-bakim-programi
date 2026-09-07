import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import api from '../api/client';
import { statusLabel } from '../utils/status';

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
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    branchId: '',
    serviceOrderId: '',
    quoteId: '',
    amount: '',
    method: 'CASH',
    reference: '',
  });

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
      api.get('/branches'),
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

  const todaySummary = useMemo(() => {
    const today =
      new Date().toDateString();

    const result = {
      CASH: 0,
      CARD: 0,
      TRANSFER: 0,
      OTHER: 0,
      TOTAL: 0,
    };

    payments.forEach((payment) => {
      if (
        payment.status !== 'PAID' ||
        new Date(
          payment.paidAt ||
            payment.createdAt,
        ).toDateString() !== today
      ) {
        return;
      }

      const amount =
        Number(payment.amount || 0);

      result[payment.method] =
        (result[payment.method] || 0) +
        amount;

      result.TOTAL += amount;
    });

    return result;
  }, [payments]);

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

      setMessage(
        'Tahsilat kaydedildi.',
      );

      await load();
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
          ? Number(
              quote.total || 0,
            )
          : form.amount,
    });
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Kasa / Tahsilat</h1>
          <p>
            Nakit, kart ve banka tahsilatlarını
            müşteri, iş emri ve teklifle ilişkilendirin.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span>Bugün Toplam</span>
          <strong>
            {money(todaySummary.TOTAL)} ₺
          </strong>
        </div>

        <div className="stat-card">
          <span>Nakit</span>
          <strong>
            {money(todaySummary.CASH)} ₺
          </strong>
        </div>

        <div className="stat-card">
          <span>Kart</span>
          <strong>
            {money(todaySummary.CARD)} ₺
          </strong>
        </div>

        <div className="stat-card">
          <span>Havale / EFT</span>
          <strong>
            {money(
              todaySummary.TRANSFER,
            )}{' '}
            ₺
          </strong>
        </div>
      </div>

      {message && (
        <div className="page-message success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="page-message error-message">
          {error}
        </div>
      )}

      <div className="content-grid spaced-card">
        <div className="panel-card">
          <h3>Yeni Tahsilat</h3>

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
                  customerId:
                    e.target.value,
                  serviceOrderId: '',
                  quoteId: '',
                  amount: '',
                })
              }
              required
            >
              <option value="">
                Müşteri seç
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
                Şube seç
              </option>

              {branches
                .filter(
                  (branch) =>
                    branch.active,
                )
                .map((branch) => (
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

              {filteredOrders.map(
                (order) => (
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
                ),
              )}
            </select>

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

              {filteredQuotes.map(
                (quote) => (
                  <option
                    key={quote.id}
                    value={quote.id}
                  >
                    {quote.quoteNumber}
                    {' · '}
                    {money(
                      quote.total,
                    )}{' '}
                    ₺
                  </option>
                ),
              )}
            </select>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Tahsilat tutarı ₺"
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
                Kart
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
              placeholder="Referans / açıklama (opsiyonel)"
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

        <div className="panel-card">
          <h3>Son Tahsilatlar</h3>

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
                {payments
                  .slice(0, 30)
                  .map((payment) => (
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
                        {payment.customer
                          ?.firstName}{' '}
                        {payment.customer
                          ?.lastName}
                      </td>

                      <td>
                        {payment.branch?.name ||
                          '-'}
                      </td>

                      <td>
                        {payment.serviceOrder
                          ?.orderNumber ||
                          '-'}
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
                            payment.status ===
                            'PAID'
                              ? 'status-badge success'
                              : 'status-badge danger'
                          }
                        >
                          {statusLabel(
                            payment.status,
                          )}
                        </span>
                      </td>

                      <td>
                        <strong>
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

                {!payments.length && (
                  <tr>
                    <td colSpan="8">
                      Henüz tahsilat kaydı yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

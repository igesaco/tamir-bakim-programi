import { useLiveRefresh } from '../hooks/useLiveRefresh';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import api from '../api/client';
import { statusLabel } from '../utils/status';

const emptyItem = () => ({
  type: 'LABOR',
  name: '',
  description: '',
  quantity: 1,
  unitPrice: '',
  discountAmount: 0,
  vatRate: 20,
});

function money(value) {
  return Number(value || 0).toLocaleString(
    'tr-TR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

export default function Quotes() {
  const [searchParams] =
    useSearchParams();

  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] =
    useState([]);
  const [vehicles, setVehicles] =
    useState([]);
  const [orders, setOrders] = useState([]);
  const [packages, setPackages] =
    useState([]);

  const [form, setForm] = useState({
    customerId: '',
    vehicleId: '',
    serviceOrderId: '',
    notes: '',
  });

  const [items, setItems] = useState([
    emptyItem(),
  ]);

  const [selectedPackageId, setSelectedPackageId] =
    useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useLiveRefresh(() => load(true), !busy);

  async function load() {
    const [q, c, v, o, p] =
      await Promise.all([
        api.get('/quotes'),
        api.get('/customers'),
        api.get('/vehicles'),
        api.get('/service-orders'),
        api
          .get(
            '/maintenance/packages',
          )
          .catch(
            () => ({
              data: [],
            }),
          ),
      ]);

    setQuotes(q.data);
    setCustomers(c.data);
    setVehicles(v.data);
    setOrders(o.data);
    setPackages(p.data);

    const orderId =
      searchParams.get(
        'order',
      );

    if (orderId) {
      const selectedOrder =
        o.data.find(
          (order) =>
            order.id ===
            orderId,
        );

      if (selectedOrder) {
        setForm({
          customerId:
            selectedOrder.customerId,
          vehicleId:
            selectedOrder.vehicleId,
          serviceOrderId:
            selectedOrder.id,
          notes:
            selectedOrder.complaint
              ? `Müşteri talebi: ${selectedOrder.complaint}`
              : '',
        });

        if (
          selectedOrder.items
            ?.length
        ) {
          setItems(
            selectedOrder.items.filter(item => !item.approvedQuoteId).map(
              (item) => ({
                serviceOrderItemId: item.id,
                type:
                  item.type,
                name:
                  item.name,
                description:
                  item.description ||
                  '',
                quantity:
                  Number(
                    item.quantity,
                  ) || 1,
                unitPrice:
                  Number(
                    item.unitPrice,
                  ) || '',
                discountAmount:
                  Number(
                    item.discountAmount,
                  ) || 0,
                vatRate:
                  Number(
                    item.vatRate,
                  ) || 20,
              }),
            ),
          );
        }
      }
    }
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Teklif verileri yüklenemedi.',
      );
    });
  }, []);

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      !form.customerId ||
      vehicle.customerId ===
        form.customerId,
  );

  const filteredOrders = orders.filter(
    (order) =>
      (!form.customerId ||
        order.customerId ===
          form.customerId) &&
      (!form.vehicleId ||
        order.vehicleId ===
          form.vehicleId),
  );

  const totals = useMemo(() => {
    return items.reduce(
      (result, item) => {
        const quantity =
          Number(item.quantity) || 0;
        const unitPrice =
          Number(item.unitPrice) || 0;
        const discount =
          Number(item.discountAmount) || 0;
        const vatRate =
          Number(item.vatRate) || 0;

        const base =
          quantity * unitPrice;
        const net = Math.max(
          0,
          base - discount,
        );
        const tax =
          net * (vatRate / 100);

        result.subtotal += base;
        result.discount += discount;
        result.tax += tax;
        result.total += net + tax;

        return result;
      },
      {
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
      },
    );
  }, [items]);

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      emptyItem(),
    ]);
  }

  function removeItem(index) {
    setItems((current) => {
      if (current.length === 1) {
        return [emptyItem()];
      }

      return current.filter(
        (_, itemIndex) =>
          itemIndex !== index,
      );
    });
  }

  function applyPackage(packageId) {
    setSelectedPackageId(packageId);

    const selected = packages.find(
      (item) => item.id === packageId,
    );

    if (!selected) {
      return;
    }

    setItems(
      selected.items.map((item) => ({
        type: item.type,
        name: item.name,
        description:
          item.description || '',
        quantity:
          Number(item.quantity) || 1,
        unitPrice:
          Number(item.unitPrice) || '',
        discountAmount: 0,
        vatRate:
          Number(item.vatRate) || 20,
      })),
    );
  }

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      await api.post('/quotes', {
        customerId: form.customerId,
        vehicleId: form.vehicleId,
        serviceOrderId:
          form.serviceOrderId ||
          undefined,
        notes: form.notes || undefined,
        items: items.map((item) => ({
          serviceOrderItemId: item.serviceOrderItemId,
          type: item.type,
          name: item.name.trim(),
          description:
            item.description.trim() ||
            undefined,
          quantity:
            Number(item.quantity),
          unitPrice:
            Number(item.unitPrice),
          discountAmount:
            Number(
              item.discountAmount || 0,
            ),
          vatRate:
            Number(item.vatRate || 0),
        })),
      });

      setForm({
        customerId: '',
        vehicleId: '',
        serviceOrderId: '',
        notes: '',
      });

      setItems([emptyItem()]);
      setSelectedPackageId('');

      await load();
    } catch (err) {
      const message =
        err?.response?.data?.message;

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'Teklif oluşturulamadı.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendQuote(id) {
    await api.patch(
      `/quotes/${id}/status`,
      {
        status: 'SENT',
      },
    );

    await load();
  }

  async function approve(id) {
    await api.patch(
      `/quotes/${id}/status`,
      {
        status: 'APPROVED',
      },
    );

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Teklifler</h1>
          <p>
            KDV dahil servis teklifleri ve
            proforma faturaları yönetin.
          </p>
        </div>
      </div>

      {error && (
        <div className="page-message error-message">
          {error}
        </div>
      )}

      <div className="panel-card">
        <h3>Yeni Teklif / Proforma</h3>

        <form
          className="quote-form"
          onSubmit={submit}
        >
          <div className="form-grid">
            <select
              value={form.customerId}
              onChange={(e) =>
                setForm({
                  ...form,
                  customerId:
                    e.target.value,
                  vehicleId: '',
                  serviceOrderId: '',
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
                </option>
              ))}
            </select>

            <select
              value={form.vehicleId}
              onChange={(e) =>
                setForm({
                  ...form,
                  vehicleId:
                    e.target.value,
                  serviceOrderId: '',
                })
              }
              required
            >
              <option value="">
                Araç seç
              </option>

              {filteredVehicles.map(
                (vehicle) => (
                  <option
                    key={vehicle.id}
                    value={vehicle.id}
                  >
                    {vehicle.plate} -{' '}
                    {vehicle.brand}{' '}
                    {vehicle.model}
                  </option>
                ),
              )}
            </select>

            <select
              value={form.serviceOrderId}
              onChange={(e) =>
                setForm({
                  ...form,
                  serviceOrderId:
                    e.target.value,
                })
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
                  </option>
                ),
              )}
            </select>

            <select
              value={selectedPackageId}
              onChange={(e) =>
                applyPackage(
                  e.target.value,
                )
              }
            >
              <option value="">
                Hazır bakım paketi seç
              </option>

              {packages
                .filter(
                  (item) => item.active,
                )
                .map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="quote-items">
            <div className="quote-items-header">
              <div>
                <strong>
                  Teklif Kalemleri
                </strong>
                <span>
                  Parça, işçilik ve KDV
                  oranlarını ayrı ayrı
                  belirleyebilirsiniz.
                </span>
              </div>

              <button
                type="button"
                className="small-button"
                onClick={addItem}
              >
                + Kalem Ekle
              </button>
            </div>

            {items.map((item, index) => (
              <div
                className="quote-item-row"
                key={index}
              >
                <select
                  value={item.type}
                  onChange={(e) =>
                    updateItem(
                      index,
                      'type',
                      e.target.value,
                    )
                  }
                >
                  <option value="LABOR">
                    İşçilik
                  </option>
                  <option value="PART">
                    Parça
                  </option>
                  <option value="OTHER">
                    Diğer
                  </option>
                </select>

                <input
                  className="quote-item-name"
                  placeholder="Kalem adı"
                  value={item.name}
                  onChange={(e) =>
                    updateItem(
                      index,
                      'name',
                      e.target.value,
                    )
                  }
                  required
                />

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Miktar"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(
                      index,
                      'quantity',
                      e.target.value,
                    )
                  }
                  required
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Birim ₺"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(
                      index,
                      'unitPrice',
                      e.target.value,
                    )
                  }
                  required
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="İndirim ₺"
                  value={
                    item.discountAmount
                  }
                  onChange={(e) =>
                    updateItem(
                      index,
                      'discountAmount',
                      e.target.value,
                    )
                  }
                />

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="KDV %"
                  value={item.vatRate}
                  onChange={(e) =>
                    updateItem(
                      index,
                      'vatRate',
                      e.target.value,
                    )
                  }
                  required
                />

                <button
                  type="button"
                  className="table-action danger-text"
                  onClick={() =>
                    removeItem(index)
                  }
                >
                  Sil
                </button>
              </div>
            ))}
          </div>

          <textarea
            className="quote-notes"
            placeholder="Teklif / proforma notu"
            value={form.notes}
            onChange={(e) =>
              setForm({
                ...form,
                notes: e.target.value,
              })
            }
          />

          <div className="quote-summary">
            <div>
              <span>Ara Toplam</span>
              <strong>
                {money(totals.subtotal)} ₺
              </strong>
            </div>

            <div>
              <span>İndirim</span>
              <strong>
                -{money(totals.discount)} ₺
              </strong>
            </div>

            <div>
              <span>KDV</span>
              <strong>
                {money(totals.tax)} ₺
              </strong>
            </div>

            <div className="quote-grand-total">
              <span>Genel Toplam</span>
              <strong>
                {money(totals.total)} ₺
              </strong>
            </div>
          </div>

          <button
            className="primary-button"
            disabled={busy}
          >
            {busy
              ? 'Oluşturuluyor...'
              : 'Teklif Oluştur'}
          </button>
        </form>
      </div>

      <div className="panel-card spaced-card">
        <h3>Teklif Listesi</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Müşteri</th>
                <th>Plaka</th>
                <th>Ara Toplam</th>
                <th>KDV</th>
                <th>Genel Toplam</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>
                    {quote.quoteNumber}
                  </td>

                  <td>
                    {quote.customer?.firstName}{' '}
                    {quote.customer?.lastName}
                  </td>

                  <td>
                    {quote.vehicle?.plate}
                  </td>

                  <td>
                    {money(
                      Number(
                        quote.subtotal || 0,
                      ) -
                        Number(
                          quote.discountTotal ||
                            0,
                        ),
                    )}{' '}
                    ₺
                  </td>

                  <td>
                    {money(
                      quote.taxTotal || 0,
                    )}{' '}
                    ₺
                  </td>

                  <td>
                    <strong>
                      {money(
                        quote.total || 0,
                      )}{' '}
                      ₺
                    </strong>
                  </td>

                  <td>
                    <span className="status-badge">
                      {statusLabel(
                        quote.status,
                      )}
                    </span>
                  </td>

                  <td>
                    <div className="action-row">
                      <Link
                        className="table-link"
                        to={`/quotes/${quote.id}/proforma`}
                        target="_blank"
                      >
                        Proforma
                      </Link>

                      {quote.status ===
                        'DRAFT' && (
                        <button
                          className="small-button"
                          onClick={() =>
                            sendQuote(
                              quote.id,
                            )
                          }
                        >
                          Müşteriye Gönder
                        </button>
                      )}

                      {[
                        'SENT',
                        'PARTIALLY_APPROVED',
                      ].includes(
                        quote.status,
                      ) && (
                        <button
                          className="small-button"
                          onClick={() =>
                            approve(
                              quote.id,
                            )
                          }
                        >
                          Manuel Onayla
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!quotes.length && (
                <tr>
                  <td colSpan="8">
                    Henüz teklif yok.
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

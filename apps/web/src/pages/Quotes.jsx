import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Quotes() {
  const [quotes, setQuotes] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);

  const [form, setForm] = useState({
    customerId: '',
    vehicleId: '',
    serviceOrderId: '',
    itemName: '',
    type: 'LABOR',
    quantity: 1,
    unitPrice: '',
    discountAmount: 0,
    notes: '',
  });

  async function load() {
    const [q, c, v, o] = await Promise.all([
      api.get('/quotes'),
      api.get('/customers'),
      api.get('/vehicles'),
      api.get('/service-orders'),
    ]);

    setQuotes(q.data);
    setCustomers(c.data);
    setVehicles(v.data);
    setOrders(o.data);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) => !form.customerId || v.customerId === form.customerId,
  );

  async function submit(e) {
    e.preventDefault();

    await api.post('/quotes', {
      customerId: form.customerId,
      vehicleId: form.vehicleId,
      serviceOrderId: form.serviceOrderId || undefined,
      notes: form.notes,
      items: [
        {
          type: form.type,
          name: form.itemName,
          quantity: Number(form.quantity),
          unitPrice: Number(form.unitPrice),
          discountAmount: Number(form.discountAmount || 0),
        },
      ],
    });

    setForm({
      customerId: '',
      vehicleId: '',
      serviceOrderId: '',
      itemName: '',
      type: 'LABOR',
      quantity: 1,
      unitPrice: '',
      discountAmount: 0,
      notes: '',
    });

    await load();
  }

  async function approve(id) {
    await api.patch(`/quotes/${id}/status`, {
      status: 'APPROVED',
    });

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Teklifler</h1>
          <p>Servis tekliflerini ve fiyatlandırmayı yönetin.</p>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel-card">
          <h3>Yeni Teklif</h3>

          <form className="form-grid" onSubmit={submit}>
            <select
              value={form.customerId}
              onChange={(e) =>
                setForm({
                  ...form,
                  customerId: e.target.value,
                  vehicleId: '',
                })
              }
              required
            >
              <option value="">Müşteri seç</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>

            <select
              value={form.vehicleId}
              onChange={(e) =>
                setForm({
                  ...form,
                  vehicleId: e.target.value,
                })
              }
              required
            >
              <option value="">Araç seç</option>
              {filteredVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} - {v.brand} {v.model}
                </option>
              ))}
            </select>

            <select
              value={form.serviceOrderId}
              onChange={(e) =>
                setForm({
                  ...form,
                  serviceOrderId: e.target.value,
                })
              }
            >
              <option value="">İş emri (opsiyonel)</option>
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.orderNumber}
                </option>
              ))}
            </select>

            <select
              value={form.type}
              onChange={(e) =>
                setForm({
                  ...form,
                  type: e.target.value,
                })
              }
            >
              <option value="LABOR">İşçilik</option>
              <option value="PART">Parça</option>
              <option value="OTHER">Diğer</option>
            </select>

            <input
              placeholder="Kalem adı"
              value={form.itemName}
              onChange={(e) =>
                setForm({
                  ...form,
                  itemName: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              placeholder="Adet"
              value={form.quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  quantity: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              placeholder="Birim fiyat"
              value={form.unitPrice}
              onChange={(e) =>
                setForm({
                  ...form,
                  unitPrice: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              placeholder="İndirim"
              value={form.discountAmount}
              onChange={(e) =>
                setForm({
                  ...form,
                  discountAmount: e.target.value,
                })
              }
            />

            <textarea
              className="full"
              placeholder="Teklif notu"
              value={form.notes}
              onChange={(e) =>
                setForm({
                  ...form,
                  notes: e.target.value,
                })
              }
            />

            <button className="primary-button full">
              Teklif Oluştur
            </button>
          </form>
        </div>

        <div className="panel-card">
          <h3>Teklif Listesi</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Müşteri</th>
                  <th>Plaka</th>
                  <th>Tutar</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {quotes.map((q) => (
                  <tr key={q.id}>
                    <td>{q.quoteNumber}</td>

                    <td>
                      {q.customer?.firstName}{' '}
                      {q.customer?.lastName}
                    </td>

                    <td>{q.vehicle?.plate}</td>

                    <td>
                      {Number(q.total || 0).toLocaleString('tr-TR')} ₺
                    </td>

                    <td>
                      <span className="status-badge">
                        {q.status}
                      </span>
                    </td>

                    <td>
                      {q.status !== 'APPROVED' && (
                        <button
                          className="small-button"
                          onClick={() => approve(q.id)}
                        >
                          Onayla
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

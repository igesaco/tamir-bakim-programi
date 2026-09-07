import { useEffect, useState } from 'react';
import api from '../api/client';

export default function ServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [form, setForm] = useState({
    customerId: '',
    vehicleId: '',
    mileage: '',
    complaint: '',
    internalNote: '',
  });

  async function load() {
    const [orderRes, customerRes, vehicleRes] =
      await Promise.all([
        api.get('/service-orders'),
        api.get('/customers'),
        api.get('/vehicles'),
      ]);

    setOrders(orderRes.data);
    setCustomers(customerRes.data);
    setVehicles(vehicleRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      !form.customerId ||
      vehicle.customerId === form.customerId,
  );

  async function submit(e) {
    e.preventDefault();

    await api.post('/service-orders', {
      ...form,
      mileage: Number(form.mileage || 0),
    });

    setForm({
      customerId: '',
      vehicleId: '',
      mileage: '',
      complaint: '',
      internalNote: '',
    });

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>İş Emirleri</h1>
          <p>Servisteki aktif işleri yönetin.</p>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel-card">
          <h3>Yeni İş Emri</h3>

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

              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.firstName} {customer.lastName}
                </option>
              ))}
            </select>

            <select
              value={form.vehicleId}
              onChange={(e) => {
                const selected = vehicles.find(
                  (vehicle) => vehicle.id === e.target.value,
                );

                setForm({
                  ...form,
                  vehicleId: e.target.value,
                  mileage: selected?.mileage ?? '',
                });
              }}
              required
            >
              <option value="">Araç seç</option>

              {filteredVehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate} - {vehicle.brand} {vehicle.model}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Kilometre"
              value={form.mileage}
              onChange={(e) =>
                setForm({ ...form, mileage: e.target.value })
              }
              required
            />

            <textarea
              className="full"
              placeholder="Müşteri şikayeti / yapılacak işlem"
              value={form.complaint}
              onChange={(e) =>
                setForm({ ...form, complaint: e.target.value })
              }
            />

            <textarea
              className="full"
              placeholder="Servis iç notu"
              value={form.internalNote}
              onChange={(e) =>
                setForm({ ...form, internalNote: e.target.value })
              }
            />

            <button className="primary-button full">
              İş Emri Aç
            </button>
          </form>
        </div>

        <div className="panel-card">
          <h3>İş Emirleri</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Plaka</th>
                  <th>Müşteri</th>
                  <th>Durum</th>
                  <th>KM</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>

                    <td>
                      <strong>{order.vehicle?.plate}</strong>
                    </td>

                    <td>
                      {order.customer?.firstName}{' '}
                      {order.customer?.lastName}
                    </td>

                    <td>
                      <span className="status-badge">
                        {order.status}
                      </span>
                    </td>

                    <td>
                      {Number(order.mileage || 0).toLocaleString('tr-TR')}
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

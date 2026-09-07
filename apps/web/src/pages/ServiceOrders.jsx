import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { statusLabel } from '../utils/status';

export default function ServiceOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const [form, setForm] = useState({
    customerId: '',
    vehicleId: '',
    mileage: '',
    complaint: '',
    internalNote: '',
  });

  async function load() {
    const [
      orderRes,
      customerRes,
      vehicleRes,
    ] = await Promise.all([
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

  const customerVehicles = vehicles.filter(
    (vehicle) =>
      !form.customerId ||
      vehicle.customerId === form.customerId,
  );

  const filteredOrders = useMemo(() => {
    const term = search
      .trim()
      .toLocaleLowerCase('tr-TR');

    return orders.filter((order) => {
      if (
        status &&
        order.status !== status
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      const text = [
        order.orderNumber,
        order.vehicle?.plate,
        order.vehicle?.brand,
        order.vehicle?.model,
        order.customer?.firstName,
        order.customer?.lastName,
        order.customer?.phone,
        order.complaint,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR');

      return text.includes(term);
    });
  }, [orders, search, status]);

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

          <form
            className="form-grid"
            onSubmit={submit}
          >
            <select
              value={form.customerId}
              onChange={(e) =>
                setForm({
                  ...form,
                  customerId:
                    e.target.value,
                  vehicleId: '',
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
              onChange={(e) => {
                const selected =
                  vehicles.find(
                    (vehicle) =>
                      vehicle.id ===
                      e.target.value,
                  );

                setForm({
                  ...form,
                  vehicleId:
                    e.target.value,
                  mileage:
                    selected?.mileage ??
                    '',
                });
              }}
              required
            >
              <option value="">
                Araç seç
              </option>

              {customerVehicles.map(
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

            <input
              type="number"
              placeholder="Kilometre"
              value={form.mileage}
              onChange={(e) =>
                setForm({
                  ...form,
                  mileage:
                    e.target.value,
                })
              }
              required
            />

            <textarea
              className="full"
              placeholder="Müşteri şikayeti / yapılacak işlem"
              value={form.complaint}
              onChange={(e) =>
                setForm({
                  ...form,
                  complaint:
                    e.target.value,
                })
              }
            />

            <textarea
              className="full"
              placeholder="Servis iç notu"
              value={form.internalNote}
              onChange={(e) =>
                setForm({
                  ...form,
                  internalNote:
                    e.target.value,
                })
              }
            />

            <button className="primary-button full">
              İş Emri Aç
            </button>
          </form>
        </div>

        <div className="panel-card">
          <div className="card-title-row">
            <h3>İş Emirleri</h3>

            <div className="filter-row">
              <input
                className="search-input"
                placeholder="Plaka, müşteri, iş emri..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              <select
                className="filter-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >
                <option value="">
                  Tüm durumlar
                </option>
                <option value="ACCEPTED">
                  Kabul Edildi
                </option>
                <option value="INSPECTION">
                  Kontrol Ediliyor
                </option>
                <option value="QUOTE_WAITING">
                  Teklif Bekliyor
                </option>
                <option value="APPROVED">
                  Onaylandı
                </option>
                <option value="IN_PROGRESS">
                  İşlemde
                </option>
                <option value="PART_WAITING">
                  Parça Bekliyor
                </option>
                <option value="QUALITY_CONTROL">
                  Kalite Kontrol
                </option>
                <option value="READY">
                  Teslime Hazır
                </option>
                <option value="PAYMENT_WAITING">
                  Ödeme Bekliyor
                </option>
                <option value="DELIVERED">
                  Teslim Edildi
                </option>
                <option value="CANCELLED">
                  İptal Edildi
                </option>
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Plaka</th>
                  <th>Müşteri</th>
                  <th>Durum</th>
                  <th>KM</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(
                  (order) => (
                    <tr key={order.id}>
                      <td>
                        {order.orderNumber}
                      </td>

                      <td>
                        <strong>
                          {order.vehicle?.plate}
                        </strong>
                      </td>

                      <td>
                        {order.customer
                          ?.firstName}{' '}
                        {order.customer
                          ?.lastName}
                      </td>

                      <td>
                        <span className="status-badge">
                          {statusLabel(
                            order.status,
                          )}
                        </span>
                      </td>

                      <td>
                        {Number(
                          order.mileage || 0,
                        ).toLocaleString(
                          'tr-TR',
                        )}
                      </td>

                      <td>
                        <Link
                          className="table-link"
                          to={`/service-orders/${order.id}`}
                        >
                          Detay
                        </Link>
                      </td>
                    </tr>
                  ),
                )}

                {!filteredOrders.length && (
                  <tr>
                    <td colSpan="6">
                      İş emri bulunamadı.
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

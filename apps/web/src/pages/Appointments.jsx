import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [form, setForm] = useState({
    customerId: '',
    vehicleId: '',
    startAt: '',
    serviceType: '',
    customerNote: '',
  });

  async function load() {
    const [a, c, v] = await Promise.all([
      api.get('/appointments'),
      api.get('/customers'),
      api.get('/vehicles'),
    ]);

    setAppointments(a.data);
    setCustomers(c.data);
    setVehicles(v.data);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) => !form.customerId || v.customerId === form.customerId,
  );

  async function submit(e) {
    e.preventDefault();

    await api.post('/appointments', {
      ...form,
      startAt: new Date(form.startAt).toISOString(),
    });

    setForm({
      customerId: '',
      vehicleId: '',
      startAt: '',
      serviceType: '',
      customerNote: '',
    });

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Randevular</h1>
          <p>Servis randevularını planlayın.</p>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel-card">
          <h3>Yeni Randevu</h3>

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

            <input
              type="datetime-local"
              value={form.startAt}
              onChange={(e) =>
                setForm({
                  ...form,
                  startAt: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Hizmet türü"
              value={form.serviceType}
              onChange={(e) =>
                setForm({
                  ...form,
                  serviceType: e.target.value,
                })
              }
            />

            <textarea
              className="full"
              placeholder="Müşteri notu"
              value={form.customerNote}
              onChange={(e) =>
                setForm({
                  ...form,
                  customerNote: e.target.value,
                })
              }
            />

            <button className="primary-button full">
              Randevu Oluştur
            </button>
          </form>
        </div>

        <div className="panel-card">
          <h3>Randevu Listesi</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Müşteri</th>
                  <th>Araç</th>
                  <th>Hizmet</th>
                  <th>Durum</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {new Date(a.startAt).toLocaleString('tr-TR')}
                    </td>

                    <td>
                      {a.customer?.firstName}{' '}
                      {a.customer?.lastName}
                    </td>

                    <td>{a.vehicle?.plate}</td>

                    <td>{a.serviceType || '-'}</td>

                    <td>
                      <span className="status-badge">
                        {a.status}
                      </span>
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

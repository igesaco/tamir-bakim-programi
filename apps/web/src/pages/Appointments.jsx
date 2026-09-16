import { useEffect, useState } from 'react';
import api from '../api/client';
import ActionNotice from '../components/ActionNotice';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    customerId: '',
    vehicleId: '',
    startAt: '',
    assignedTechnicianId: '',
    estimatedDurationMinutes: 60,
    serviceType: '',
    customerNote: '',
  });

  async function load() {
    const [a, c, v, t] = await Promise.all([
      api.get('/appointments'),
      api.get('/customers'),
      api.get('/vehicles'),
      api.get('/users/technicians'),
    ]);

    setAppointments(a.data);
    setCustomers(c.data);
    setVehicles(v.data);
    setTechnicians(t.data);
  }

  useEffect(() => {
    load().catch(() => setError('Randevular yüklenemedi. Lütfen tekrar deneyin.'));
  }, []);

  const filteredVehicles = vehicles.filter(
    (v) => !form.customerId || v.customerId === form.customerId,
  );

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const date = new Date(form.startAt);
      if (!Number.isFinite(date.getTime()) || date <= new Date()) {
        setError('Gelecekteki bir randevu tarihini seçin.');
        return;
      }
      await api.post('/appointments', {
        ...form,
        assignedTechnicianId: form.assignedTechnicianId || undefined,
        startAt: date.toISOString(),
      });
      setForm({ customerId: '', vehicleId: '', startAt: '', assignedTechnicianId: '', estimatedDurationMinutes: 60, serviceType: '', customerNote: '' });
      await load();
      setMessage('Randevu oluşturuldu; müşterinin kaydına eklendi.');
    } catch (err) {
      const detail = err?.response?.data?.message;
      setError(Array.isArray(detail) ? detail.join(', ') : detail || 'Randevu oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Randevular</h1>
          <p>Servis randevularını planlayın.</p>
        </div>
      </div>

      <ActionNotice message={message} error={error} />

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

            <select
              value={form.assignedTechnicianId}
              onChange={(e) => setForm({ ...form, assignedTechnicianId: e.target.value })}
            >
              <option value="">Teknisyen sonra atanacak</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.firstName} {technician.lastName}
                  {technician.branch?.name ? ` - ${technician.branch.name}` : ''}
                </option>
              ))}
            </select>

            <select
              value={form.estimatedDurationMinutes}
              onChange={(e) => setForm({ ...form, estimatedDurationMinutes: Number(e.target.value) })}
            >
              <option value={30}>30 dakika</option>
              <option value={60}>1 saat</option>
              <option value={90}>1,5 saat</option>
              <option value={120}>2 saat</option>
              <option value={180}>3 saat</option>
              <option value={240}>4 saat</option>
            </select>

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
                  <th>Teknisyen / Süre</th>
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
                      {a.assignedTechnician
                        ? `${a.assignedTechnician.firstName} ${a.assignedTechnician.lastName}`
                        : 'Atanmadı'}
                      {' · '}{a.estimatedDurationMinutes || 60} dk
                    </td>

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

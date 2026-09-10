import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

function apiMessage(error, fallback) {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
}

export default function CustomersSimple() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '' });

  const canManage = ['OWNER', 'MANAGER', 'SERVICE_ADVISOR'].includes(user?.role);

  async function load() {
    const response = await api.get('/customers');
    setCustomers(response.data);
  }

  useEffect(() => {
    load().catch((err) => setError(apiMessage(err, 'Müşteriler yüklenemedi.')));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');
    if (!term) return customers;
    return customers.filter((customer) => [
      customer.firstName,
      customer.lastName,
      customer.phone,
      customer.email,
      ...(customer.vehicles || []).map((vehicle) => vehicle.plate),
    ].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR').includes(term));
  }, [customers, search]);

  async function createCustomer(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/customers', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
      });
      setForm({ firstName: '', lastName: '', phone: '', email: '' });
      setShowNew(false);
      setMessage('Müşteri oluşturuldu.');
      await load();
    } catch (err) {
      setError(apiMessage(err, 'Müşteri oluşturulamadı.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Müşteriler</h1>
          <p>Ad, telefon veya plaka ile bulun; ardından tüm servis işlemlerini tek müşteri ekranından yönetin.</p>
        </div>
        {canManage && <button className="primary-button" type="button" onClick={() => setShowNew((value) => !value)}>+ Yeni Müşteri</button>}
      </div>

      {message && <div className="page-message success-message">{message}</div>}
      {error && <div className="page-message error-message">{error}</div>}

      {showNew && canManage && (
        <div className="panel-card" style={{ marginBottom: 14 }}>
          <h3>Hızlı Müşteri Kaydı</h3>
          <form className="form-grid" onSubmit={createCustomer}>
            <input placeholder="Ad" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
            <input placeholder="Soyad" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <input placeholder="Telefon (opsiyonel)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input type="email" placeholder="E-posta (opsiyonel)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <button className="primary-button full" disabled={busy}>{busy ? 'Kaydediliyor...' : 'Müşteriyi Kaydet'}</button>
          </form>
        </div>
      )}

      <div className="panel-card">
        <input
          className="search-input"
          style={{ width: '100%', marginBottom: 16 }}
          placeholder="Müşteri adı, telefon veya plaka ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Müşteri</th><th>Telefon</th><th>Araçlar</th><th>Son İşlem</th><th></th></tr></thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.firstName} {customer.lastName}</strong><div className="sub-text">{customer.email || 'E-posta yok'}</div></td>
                  <td>{customer.phone || '-'}</td>
                  <td>{(customer.vehicles || []).map((vehicle) => vehicle.plate).join(', ') || '-'}</td>
                  <td>{customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString('tr-TR') : '-'}</td>
                  <td><Link className="primary-link-button" to={`/customers/${customer.id}`}>Müşteri Panelini Aç →</Link></td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan="5"><div className="empty-state">Müşteri bulunamadı.</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

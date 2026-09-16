import { useEffect, useState } from 'react';
import api from '../api/client';
import ActionNotice from '../components/ActionNotice';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
  });

  async function load() {
    const response = await api.get('/branches');
    setBranches(response.data);
  }

  useEffect(() => {
    load().catch(() => setError('Şube listesi yüklenemedi.'));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/branches', form);
      setForm({ name: '', phone: '', address: '', city: '' });
      setMessage('Şube oluşturuldu ve seçim listelerine eklendi.');
      await load();
    } catch (err) {
      const detail = err?.response?.data?.message;
      setError(Array.isArray(detail) ? detail.join(', ') : detail || 'Şube oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  }

  async function toggle(branch) {
    setError('');
    setMessage('');
    try {
      await api.patch(`/branches/${branch.id}/active`, { active: !branch.active });
      setMessage(`Şube ${branch.active ? 'pasif' : 'aktif'} duruma alındı.`);
      await load();
    } catch (err) {
      const detail = err?.response?.data?.message;
      setError(Array.isArray(detail) ? detail.join(', ') : detail || 'Şube durumu değiştirilemedi.');
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Şubeler</h1>
          <p>İşletmenize bağlı servis noktalarını yönetin.</p>
        </div>
      </div>

      <ActionNotice message={message} error={error} />

      <div className="content-grid">
        <div className="panel-card">
          <h3>Yeni Şube</h3>

          <form className="form-grid" onSubmit={submit}>
            <input
              className="full"
              placeholder="Şube adı"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Telefon"
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value,
                })
              }
            />

            <input
              placeholder="Şehir"
              value={form.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  city: e.target.value,
                })
              }
            />

            <input
              className="full"
              placeholder="Adres"
              value={form.address}
              onChange={(e) =>
                setForm({
                  ...form,
                  address: e.target.value,
                })
              }
            />

            <button className="primary-button full" disabled={busy}>
              {busy ? 'Oluşturuluyor...' : 'Şube Oluştur'}
            </button>
          </form>
        </div>

        <div className="panel-card">
          <h3>Şube Listesi</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Şube</th>
                  <th>Şehir</th>
                  <th>Personel</th>
                  <th>Araç</th>
                  <th>İş Emri</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {branches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <strong>{b.name}</strong>
                    </td>
                    <td>{b.city || '-'}</td>
                    <td>{b._count?.users || 0}</td>
                    <td>{b._count?.vehicles || 0}</td>
                    <td>
                      {b._count?.serviceOrders || 0}
                    </td>
                    <td>
                      {b.active ? 'Aktif' : 'Pasif'}
                    </td>
                    <td>
                      <button
                        className="small-button"
                        onClick={() => toggle(b)}
                      >
                        {b.active
                          ? 'Pasif Yap'
                          : 'Aktif Yap'}
                      </button>
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

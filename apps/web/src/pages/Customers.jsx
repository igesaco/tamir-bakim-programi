import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

function getApiMessage(error) {
  const message = error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || 'İşlem sırasında bir hata oluştu.';
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
  });

  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const response = await api.get('/customers');
    setCustomers(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search
      .trim()
      .toLocaleLowerCase('tr-TR');

    if (!term) {
      return customers;
    }

    return customers.filter((customer) => {
      const text = [
        customer.firstName,
        customer.lastName,
        customer.phone,
        customer.email,
        ...(customer.vehicles || []).map(
          (vehicle) => vehicle.plate,
        ),
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR');

      return text.includes(term);
    });
  }, [customers, search]);

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.post('/customers', {
        firstName: form.firstName,
        lastName: form.lastName || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
      });

      setForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
      });

      setMessage('Müşteri başarıyla eklendi.');
      await load();
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function openEdit(customer) {
    setError('');
    setMessage('');

    setEditing({
      id: customer.id,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
  }

  async function saveEdit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.patch(
        `/customers/${editing.id}`,
        {
          firstName: editing.firstName,
          lastName: editing.lastName || undefined,
          phone: editing.phone || undefined,
          email: editing.email || undefined,
          address: editing.address || undefined,
          notes: editing.notes || undefined,
        },
      );

      setEditing(null);
      setMessage('Müşteri bilgileri güncellendi.');
      await load();
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(customer) {
    const approved = window.confirm(
      `${customer.firstName} ${customer.lastName || ''} isimli müşteriyi silmek istediğinize emin misiniz?`,
    );

    if (!approved) {
      return;
    }

    setError('');
    setMessage('');

    try {
      await api.delete(`/customers/${customer.id}`);

      setMessage('Müşteri silindi.');
      await load();
    } catch (err) {
      setError(getApiMessage(err));
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Müşteriler</h1>
          <p>Müşteri ve araç sahiplerini yönetin.</p>
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

      <div className="content-grid">
        <div className="panel-card">
          <h3>Yeni Müşteri</h3>

          <form
            className="form-grid"
            onSubmit={submit}
          >
            <input
              placeholder="Ad"
              value={form.firstName}
              onChange={(e) =>
                setForm({
                  ...form,
                  firstName: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Soyad"
              value={form.lastName}
              onChange={(e) =>
                setForm({
                  ...form,
                  lastName: e.target.value,
                })
              }
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
              type="email"
              placeholder="E-posta"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
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

            <button
              className="primary-button full"
              disabled={busy}
            >
              {busy
                ? 'Kaydediliyor...'
                : 'Müşteri Ekle'}
            </button>
          </form>
        </div>

        <div className="panel-card">
          <div className="card-title-row">
            <h3>Müşteri Listesi</h3>

            <input
              className="search-input"
              placeholder="Ad, telefon, plaka ara..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ad Soyad</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Araç</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer) => (
                    <tr key={customer.id}>
                      <td>
                        {customer.firstName}{' '}
                        {customer.lastName}
                      </td>

                      <td>
                        {customer.phone || '-'}
                      </td>

                      <td>
                        {customer.email || '-'}
                      </td>

                      <td>
                        {customer.vehicles?.length || 0}
                      </td>

                      <td>
                        <div className="action-row">
                          <Link
                            className="table-link"
                            to={`/customers/${customer.id}`}
                          >
                            Detay
                          </Link>

                          <button
                            className="table-action"
                            onClick={() =>
                              openEdit(customer)
                            }
                          >
                            Düzenle
                          </button>

                          <button
                            className="table-action danger-text"
                            onClick={() =>
                              remove(customer)
                            }
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}

                {!filteredCustomers.length && (
                  <tr>
                    <td colSpan="5">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setEditing(null)}
        >
          <div
            className="modal-card"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>Müşteri Düzenle</h2>
                <p>
                  Müşteri bilgilerini güncelleyin.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setEditing(null)}
              >
                ×
              </button>
            </div>

            <form
              className="form-grid"
              onSubmit={saveEdit}
            >
              <input
                placeholder="Ad"
                value={editing.firstName}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    firstName: e.target.value,
                  })
                }
                required
              />

              <input
                placeholder="Soyad"
                value={editing.lastName}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    lastName: e.target.value,
                  })
                }
              />

              <input
                placeholder="Telefon"
                value={editing.phone}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    phone: e.target.value,
                  })
                }
              />

              <input
                type="email"
                placeholder="E-posta"
                value={editing.email}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    email: e.target.value,
                  })
                }
              />

              <input
                className="full"
                placeholder="Adres"
                value={editing.address}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    address: e.target.value,
                  })
                }
              />

              <textarea
                className="full"
                placeholder="Notlar"
                value={editing.notes}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    notes: e.target.value,
                  })
                }
              />

              <div className="modal-actions full">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setEditing(null)
                  }
                >
                  Vazgeç
                </button>

                <button
                  className="primary-button"
                  disabled={busy}
                >
                  {busy
                    ? 'Kaydediliyor...'
                    : 'Değişiklikleri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

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

  const [busy, setBusy] = useState(false);

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

    try {
      await api.post('/customers', form);

      setForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
      });

      await load();
    } finally {
      setBusy(false);
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
                        {customer.vehicles?.length ||
                          0}
                      </td>

                      <td>
                        <Link
                          className="table-link"
                          to={`/customers/${customer.id}`}
                        >
                          Detay
                        </Link>
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
    </>
  );
}

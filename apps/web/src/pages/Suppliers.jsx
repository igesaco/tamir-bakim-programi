import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
  });

  async function load() {
    const response = await api.get('/suppliers');
    setSuppliers(response.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();

    await api.post('/suppliers', form);

    setForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      taxNumber: '',
    });

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Tedarikçiler</h1>
          <p>Yedek parça ve ürün tedarikçilerini yönetin.</p>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel-card">
          <h3>Yeni Tedarikçi</h3>

          <form className="form-grid" onSubmit={submit}>
            <input
              className="full"
              placeholder="Firma adı"
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
              placeholder="Vergi no"
              value={form.taxNumber}
              onChange={(e) =>
                setForm({
                  ...form,
                  taxNumber: e.target.value,
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

            <button className="primary-button full">
              Tedarikçi Ekle
            </button>
          </form>
        </div>

        <div className="panel-card">
          <h3>Tedarikçi Listesi</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Firma</th>
                  <th>Telefon</th>
                  <th>E-posta</th>
                  <th>Parça</th>
                </tr>
              </thead>

              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.name}</strong>
                    </td>
                    <td>{s.phone || '-'}</td>
                    <td>{s.email || '-'}</td>
                    <td>{s.parts?.length || 0}</td>
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

import {
  useEffect,
  useState,
} from 'react';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

const roleLabels = {
  OWNER: 'Kurucu',
  MANAGER: 'Yönetici',
  SERVICE_ADVISOR: 'Servis Danışmanı',
  TECHNICIAN: 'Teknik Bakım Personeli',
};

export default function Users() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'TECHNICIAN',
    branchId: '',
  });

  async function load() {
    const [u, b] = await Promise.all([
      api.get('/users'),
      api.get('/branches'),
    ]);

    setUsers(u.data);
    setBranches(b.data);
  }

  useEffect(() => {
    load();
  }, []);

  const branchRequired = [
    'MANAGER',
    'SERVICE_ADVISOR',
    'TECHNICIAN',
  ].includes(form.role);

  async function submit(e) {
    e.preventDefault();

    await api.post('/users', {
      ...form,
      branchId:
        form.branchId || undefined,
    });

    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      role: 'TECHNICIAN',
      branchId: '',
    });

    await load();
  }

  async function toggle(user) {
    await api.patch(
      `/users/${user.id}/active`,
      {
        active: !user.active,
      },
    );

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Personel</h1>
          <p>
            Kullanıcıları, rolleri ve şube erişimini yönetin.
          </p>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel-card">
          <h3>Yeni Personel</h3>

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
                  firstName:
                    e.target.value,
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
                  lastName:
                    e.target.value,
                })
              }
              required
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
              type="password"
              placeholder="Şifre"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password:
                    e.target.value,
                })
              }
              required
            />

            <select
              value={form.role}
              onChange={(e) =>
                setForm({
                  ...form,
                  role: e.target.value,
                  branchId: '',
                })
              }
            >
              <option value="MANAGER">
                Yönetici
              </option>

              <option value="SERVICE_ADVISOR">
                Servis Danışmanı
              </option>

              <option value="TECHNICIAN">
                Teknik Bakım Personeli
              </option>

              {currentUser?.role ===
                'OWNER' && (
                <option value="OWNER">
                  Kurucu
                </option>
              )}
            </select>

            <select
              className="full"
              value={form.branchId}
              onChange={(e) =>
                setForm({
                  ...form,
                  branchId:
                    e.target.value,
                })
              }
              required={branchRequired}
            >
              <option value="">
                {branchRequired
                  ? 'Şube seç (zorunlu)'
                  : 'Şube seç (opsiyonel)'}
              </option>

              {branches.map((b) => (
                <option
                  key={b.id}
                  value={b.id}
                >
                  {b.name}
                </option>
              ))}
            </select>

            <button className="primary-button full">
              Personel Ekle
            </button>
          </form>
        </div>

        <div className="panel-card">
          <h3>Personel Listesi</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Personel</th>
                  <th>Rol</th>
                  <th>Şube</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>
                        {u.firstName}{' '}
                        {u.lastName}
                      </strong>

                      <div className="sub-text">
                        {u.email}
                      </div>
                    </td>

                    <td>
                      {roleLabels[u.role] ||
                        u.role}
                    </td>

                    <td>
                      {u.branch?.name || '-'}
                    </td>

                    <td>
                      <span
                        className={
                          u.active
                            ? 'status-badge success'
                            : 'status-badge danger'
                        }
                      >
                        {u.active
                          ? 'Aktif'
                          : 'Pasif'}
                      </span>
                    </td>

                    <td>
                      <button
                        className="small-button"
                        onClick={() =>
                          toggle(u)
                        }
                      >
                        {u.active
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

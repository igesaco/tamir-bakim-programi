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
  WAREHOUSE: 'Depo / Stok Personeli',
  ACCOUNTING: 'Muhasebe / Kasa',
};

export default function Users() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    'WAREHOUSE',
    'ACCOUNTING',
  ].includes(form.role);

  async function submit(e) {
    e.preventDefault();

    setMessage('');
    setError('');

    try {
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
      setMessage('Personel oluşturuldu.');
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Personel oluşturulamadı.',
      );
    }
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

  async function changeBranch(
    user,
    branchId,
  ) {
    setMessage('');
    setError('');

    try {
      await api.patch(
        `/users/${user.id}/branch`,
        {
          branchId:
            branchId || undefined,
        },
      );

      await load();
      setMessage(
        'Personel şubesi güncellendi.',
      );
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Şube değiştirilemedi.',
      );
    }
  }

  async function changeRole(
    user,
    role,
  ) {
    setMessage('');
    setError('');

    try {
      await api.patch(
        `/users/${user.id}/role`,
        { role },
      );

      await load();
      setMessage(
        'Personel rolü güncellendi.',
      );
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Rol değiştirilemedi.',
      );
    }
  }

  async function resetPassword(user) {
    const password =
      window.prompt(
        `${user.firstName} ${user.lastName} için yeni şifreyi yazın (en az 8 karakter):`,
      );

    if (!password) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await api.patch(
        `/users/${user.id}/password`,
        { password },
      );

      setMessage(
        'Personel şifresi yenilendi.',
      );
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Şifre yenilenemedi.',
      );
    }
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
              minLength="8"
              placeholder="Şifre (en az 8 karakter)"
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

              <option value="WAREHOUSE">
                Depo / Stok Personeli
              </option>

              <option value="ACCOUNTING">
                Muhasebe / Kasa
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
                      <select
                        className="inline-select"
                        value={u.role}
                        disabled={
                          u.id ===
                            currentUser?.id ||
                          (u.role ===
                            'OWNER' &&
                            currentUser?.role !==
                              'OWNER')
                        }
                        onChange={(e) =>
                          changeRole(
                            u,
                            e.target.value,
                          )
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

                        <option value="WAREHOUSE">
                          Depo / Stok Personeli
                        </option>

                        <option value="ACCOUNTING">
                          Muhasebe / Kasa
                        </option>

                        {currentUser?.role ===
                          'OWNER' && (
                          <option value="OWNER">
                            Kurucu
                          </option>
                        )}
                      </select>
                    </td>

                    <td>
                      <select
                        className="inline-select"
                        value={
                          u.branchId || ''
                        }
                        disabled={
                          u.role === 'OWNER' &&
                          currentUser?.role !==
                            'OWNER'
                        }
                        onChange={(e) =>
                          changeBranch(
                            u,
                            e.target.value,
                          )
                        }
                      >
                        <option value="">
                          Şube yok
                        </option>

                        {branches.map(
                          (branch) => (
                            <option
                              key={
                                branch.id
                              }
                              value={
                                branch.id
                              }
                            >
                              {
                                branch.name
                              }
                            </option>
                          ),
                        )}
                      </select>
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
                      <div className="action-row">
                        <button
                          className="small-button"
                          onClick={() =>
                            resetPassword(u)
                          }
                        >
                          Şifre Yenile
                        </button>

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
                      </div>
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

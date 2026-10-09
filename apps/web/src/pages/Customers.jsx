import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import ActionNotice from '../components/ActionNotice';

function getApiMessage(error) {
  const message =
    error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return (
    message ||
    'İşlem sırasında bir hata oluştu.'
  );
}

function parseCsvLine(line, separator) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"' && quoted) {
      value += '"'; index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === separator && !quoted) { values.push(value.trim()); value = ''; }
    else value += character;
  }
  values.push(value.trim());
  return values;
}

export default function Customers() {
  const { user } = useAuth();

  const [customers, setCustomers] =
    useState([]);
  const [branches, setBranches] =
    useState([]);
  const [search, setSearch] =
    useState('');

  const canChooseBranch = [
    'OWNER',
    'MANAGER',
  ].includes(user?.role);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    taxNumber: '',
    nationalId: '',
    address: '',
    branchId: user?.branchId || '',
  });

  const [editing, setEditing] =
    useState(null);
  const [busy, setBusy] =
    useState(false);
  const [message, setMessage] =
    useState('');
  const [error, setError] =
    useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importRows, setImportRows] = useState([]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  async function previewCsv(file) {
    setError(''); setMessage(''); setImportPreview(null); setImportRows([]);
    try {
      const text = (await file.text()).replace(/^\uFEFF/, '');
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) throw new Error('CSV dosyasında başlık ve en az bir veri satırı olmalı.');
      const separator = lines[0].includes(';') ? ';' : ',';
      const headers = parseCsvLine(lines[0], separator).map(value => value.trim().toLowerCase());
      const keyMap = {
        ad: 'firstName', firstname: 'firstName', soyad: 'lastName', lastname: 'lastName',
        telefon: 'phone', phone: 'phone', eposta: 'email', email: 'email',
        subeid: 'branchId', branchid: 'branchId', adres: 'address', address: 'address',
        plaka: 'plate', plate: 'plate', marka: 'brand', brand: 'brand', model: 'model',
        modelyili: 'modelYear', modelyear: 'modelYear', kilometre: 'mileage', mileage: 'mileage',
      };
      const rows = lines.slice(1).map(line => {
        const values = parseCsvLine(line, separator);
        const row = {};
        headers.forEach((header, index) => {
          const normalized = header.replace(/[^a-z0-9ğüşöçı]/g, '')
            .replaceAll('ı', 'i').replaceAll('ş', 's').replaceAll('ğ', 'g').replaceAll('ü', 'u').replaceAll('ö', 'o').replaceAll('ç', 'c');
          const key = keyMap[normalized];
          if (key && values[index]) row[key] = ['modelYear', 'mileage'].includes(key) ? Number(values[index]) : values[index];
        });
        return row;
      });
      const response = await api.post('/customers/import/preview', { rows });
      setImportRows(rows); setImportPreview(response.data);
    } catch (err) { setError(getApiMessage(err)); }
  }

  async function commitImport() {
    setBusy(true); setError(''); setMessage('');
    try {
      const response = await api.post('/customers/import/commit', { rows: importRows });
      setMessage(`${response.data.imported} müşteri başarıyla içe aktarıldı.`);
      setImportRows([]); setImportPreview(null);
      setShowImportModal(false);
      await load();
    } catch (err) { setError(getApiMessage(err)); }
    finally { setBusy(false); }
  }

  async function load() {
    const requests = [
      api.get('/customers'),
    ];

    if (canChooseBranch) {
      requests.push(
        api.get('/branches'),
      );
    }

    const responses =
      await Promise.all(requests);

    setCustomers(
      responses[0].data,
    );

    if (canChooseBranch) {
      setBranches(
        responses[1]?.data || [],
      );
    }
  }

  useEffect(() => {
    load();
  }, [canChooseBranch]);

  const filteredCustomers =
    useMemo(() => {
      const term = search
        .trim()
        .toLocaleLowerCase('tr-TR');

      if (!term) {
        return customers;
      }

      return customers.filter(
        (customer) => {
          const text = [
            customer.firstName,
            customer.lastName,
            customer.phone,
            customer.email,
            customer.taxNumber,
            customer.branch?.name,
            ...(
              customer.vehicles ||
              []
            ).map(
              (vehicle) =>
                vehicle.plate,
            ),
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              'tr-TR',
            );

          return text.includes(term);
        },
      );
    }, [customers, search]);

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.post(
        '/customers',
        {
          firstName:
            form.firstName,
          lastName:
            form.lastName ||
            undefined,
          phone:
            form.phone ||
            undefined,
          email:
            form.email ||
            undefined,
          taxNumber:
            form.taxNumber ||
            undefined,
          nationalId:
            form.nationalId ||
            undefined,
          address:
            form.address ||
            undefined,
          branchId:
            canChooseBranch
              ? form.branchId ||
                undefined
              : undefined,
        },
      );

      setForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        taxNumber: '',
        nationalId: '',
        address: '',
        branchId:
          user?.branchId || '',
      });

      setMessage(
        'Müşteri başarıyla eklendi.',
      );

      setShowNewModal(false);

      await load();
    } catch (err) {
      setError(
        getApiMessage(err),
      );
    } finally {
      setBusy(false);
    }
  }

  function openEdit(customer) {
    setError('');
    setMessage('');

    setEditing({
      id: customer.id,
      firstName:
        customer.firstName ||
        '',
      lastName:
        customer.lastName || '',
      phone:
        customer.phone || '',
      email:
        customer.email || '',
      taxNumber:
        customer.taxNumber || '',
      nationalId: '',
      nationalIdLast4:
        customer.nationalIdLast4 ||
        '',
      address:
        customer.address || '',
      notes:
        customer.notes || '',
      branchId:
        customer.branchId || '',
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
          firstName:
            editing.firstName,
          lastName:
            editing.lastName ||
            undefined,
          phone:
            editing.phone ||
            undefined,
          email:
            editing.email ||
            undefined,
          taxNumber:
            editing.taxNumber ||
            undefined,
          nationalId:
            editing.nationalId ||
            undefined,
          address:
            editing.address ||
            undefined,
          notes:
            editing.notes ||
            undefined,
          branchId:
            canChooseBranch
              ? editing.branchId ||
                undefined
              : undefined,
        },
      );

      setEditing(null);

      setMessage(
        'Müşteri bilgileri güncellendi.',
      );

      await load();
    } catch (err) {
      setError(
        getApiMessage(err),
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove(customer) {
    const approved =
      window.confirm(
        `${customer.firstName} ${customer.lastName || ''} isimli müşteriyi silmek istediğinize emin misiniz?`,
      );

    if (!approved) {
      return;
    }

    setError('');
    setMessage('');

    try {
      await api.delete(
        `/customers/${customer.id}`,
      );

      setMessage(
        'Müşteri silindi.',
      );

      await load();
    } catch (err) {
      setError(
        getApiMessage(err),
      );
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Müşteriler</h1>
          <p>Kayıtlı müşteri ve araç portföyünü yönetin.</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {canChooseBranch && (
            <button
              type="button"
              className="small-button"
              onClick={() => { setError(''); setMessage(''); setShowImportModal(true); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 15px', borderRadius: '10px', fontSize: '13px' }}
            >
              📥 Toplu CSV İçe Aktar
            </button>
          )}

          <button
            type="button"
            className="primary-button"
            onClick={() => { setError(''); setMessage(''); setShowNewModal(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '10px', fontSize: '13px' }}
          >
            + Yeni Müşteri Ekle
          </button>
        </div>
      </div>

      <ActionNotice message={message} error={error} />

      {/* Metrics Row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '18px' }}>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Kayıtlı Müşteri</span>
          <strong style={{ fontSize: '24px' }}>{customers.length}</strong>
        </div>
        <div className="stat-card" style={{ padding: '16px 20px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Kayıtlı Araç</span>
          <strong style={{ fontSize: '24px', color: '#3b82f6' }}>
            {customers.reduce((acc, c) => acc + (c.vehicles?.length || 0), 0)}
          </strong>
        </div>
        {canChooseBranch && (
          <div className="stat-card" style={{ padding: '16px 20px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>Aktif Şube</span>
            <strong style={{ fontSize: '24px', color: '#10b981' }}>
              {branches.filter(b => b.active).length || 1}
            </strong>
          </div>
        )}
      </div>
      {/* Müşteri Listesi - Full Width Modern Card */}
      <div className="panel-card" style={{ padding: '20px 24px' }}>
          <div className="card-title-row">
            <h3>
              Müşteri Listesi
            </h3>

            <input
              className="search-input"
              placeholder="Ad, telefon, plaka, şube ara..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value,
                )
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
                  <th>Şube</th>
                  <th>Araç</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map(
                  (customer) => (
                    <tr
                      key={
                        customer.id
                      }
                    >
                      <td>
                        {
                          customer.firstName
                        }{' '}
                        {
                          customer.lastName
                        }
                      </td>

                      <td>
                        {customer.phone ||
                          '-'}
                      </td>

                      <td>
                        {customer.email ||
                          '-'}
                      </td>

                      <td>
                        {customer.branch
                          ?.name ||
                          '-'}
                      </td>

                      <td>
                        {customer
                          .vehicles
                          ?.length ||
                          0}
                      </td>

                      <td>
                        <div className="action-row">
                          <Link
                            className="table-link"
                            to={`/customers/${customer.id}`}
                          >
                            Müşteri Paneli
                          </Link>

                          <button
                            className="table-action"
                            onClick={() =>
                              openEdit(
                                customer,
                              )
                            }
                          >
                            Düzenle
                          </button>

                          <button
                            className="table-action danger-text"
                            onClick={() =>
                              remove(
                                customer,
                              )
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
                    <td colSpan="6">
                      Kayıt bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Yeni Müşteri Modalı */}
      {showNewModal && (
        <div className="modal-backdrop" onMouseDown={() => setShowNewModal(false)}>
          <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Yeni Müşteri Ekle</h2>
                <p>Müşteri ve iletişim bilgilerini tanımlayın.</p>
              </div>
              <button className="modal-close" onClick={() => setShowNewModal(false)}>×</button>
            </div>

            <form className="form-grid" onSubmit={submit}>
              {canChooseBranch && (
                <select
                  className="full"
                  value={form.branchId}
                  onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  required
                >
                  <option value="">Şube seç</option>
                  {branches.filter(b => b.active).map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}

              <input
                placeholder="Ad *"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
              <input
                placeholder="Soyad"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
              <input
                placeholder="Telefon"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <input
                type="email"
                placeholder="E-posta"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                placeholder="Vergi numarası"
                value={form.taxNumber}
                onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
              />
              <input
                inputMode="numeric"
                maxLength="11"
                placeholder="T.C. Kimlik No (opsiyonel)"
                value={form.nationalId}
                onChange={(e) => setForm({ ...form, nationalId: e.target.value.replace(/\D/g, '') })}
              />
              <input
                className="full"
                placeholder="Adres"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />

              <div className="modal-actions full">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowNewModal(false)}
                >
                  Vazgeç
                </button>
                <button
                  className="primary-button"
                  disabled={busy}
                >
                  {busy ? 'Kaydediliyor...' : 'Müşteri Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toplu CSV İçe Aktarma Modalı */}
      {showImportModal && (
        <div className="modal-backdrop" onMouseDown={() => { setShowImportModal(false); setImportPreview(null); setImportRows([]); }}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>CSV ile Toplu İçe Aktarma</h2>
                <p>Müşteri ve araç listesini Excel/CSV formatında topluca yükleyin.</p>
              </div>
              <button className="modal-close" onClick={() => { setShowImportModal(false); setImportPreview(null); setImportRows([]); }}>×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '12px 16px', background: 'rgba(59, 130, 246, 0.06)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                <strong>Örnek Sütun Başlıkları:</strong><br />
                <code>ad, soyad, telefon, eposta, subeId, plaka, marka, model, modelYili, kilometre</code>
              </div>

              <div>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) previewCsv(file);
                  }}
                  style={{ fontSize: '13px' }}
                />
              </div>

              {importPreview && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', padding: '4px 10px', borderRadius: '6px' }}>
                      Eklenecek Müşteri: <strong>{importPreview.customersToCreate}</strong>
                    </span>
                    <span style={{ fontSize: '13px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', padding: '4px 10px', borderRadius: '6px' }}>
                      Eklenecek Araç: <strong>{importPreview.vehiclesToCreate}</strong>
                    </span>
                    {importPreview.skippedDuplicates > 0 && (
                      <span style={{ fontSize: '13px', background: 'rgba(245, 158, 11, 0.1)', color: '#d97706', padding: '4px 10px', borderRadius: '6px' }}>
                        Atlanan (Mevcut): <strong>{importPreview.skippedDuplicates}</strong>
                      </span>
                    )}
                  </div>

                  <div className="modal-actions" style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => { setImportPreview(null); setImportRows([]); }}
                    >
                      Temizle
                    </button>
                    <button
                      className="primary-button"
                      disabled={busy}
                      onClick={commitImport}
                    >
                      {busy ? 'Yükleniyor...' : `${importRows.length} Kaydı İçe Aktar`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editing && (
        <div
          className="modal-backdrop"
          onMouseDown={() =>
            setEditing(null)
          }
        >
          <div
            className="modal-card"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>
                  Müşteri Düzenle
                </h2>
                <p>
                  Müşteri bilgilerini güncelleyin.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setEditing(null)
                }
              >
                ×
              </button>
            </div>

            <form
              className="form-grid"
              onSubmit={saveEdit}
            >
              {canChooseBranch && (
                <select
                  className="full"
                  value={
                    editing.branchId
                  }
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      branchId:
                        e.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Şube seç
                  </option>

                  {branches
                    .filter(
                      (branch) =>
                        branch.active,
                    )
                    .map(
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
              )}

              <input
                placeholder="Ad"
                value={
                  editing.firstName
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    firstName:
                      e.target.value,
                  })
                }
                required
              />

              <input
                placeholder="Soyad"
                value={
                  editing.lastName
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    lastName:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Telefon"
                value={
                  editing.phone
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    phone:
                      e.target.value,
                  })
                }
              />

              <input
                type="email"
                placeholder="E-posta"
                value={
                  editing.email
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    email:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Vergi numarası"
                value={
                  editing.taxNumber
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    taxNumber:
                      e.target.value,
                  })
                }
              />

              <div>
                <input
                  inputMode="numeric"
                  maxLength="11"
                  placeholder="T.C. Kimlik No (değiştirmek için)"
                  value={
                    editing.nationalId
                  }
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      nationalId:
                        e.target.value
                          .replace(
                            /\D/g,
                            '',
                          ),
                    })
                  }
                />

                <div className="sub-text">
                  {editing.nationalIdLast4
                    ? `Kayıtlı T.C. son 4 hane: ${editing.nationalIdLast4}`
                    : 'Yalnızca fatura veya resmi kayıt gerekiyorsa ekleyin.'}
                </div>
              </div>

              <input
                className="full"
                placeholder="Adres"
                value={
                  editing.address
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    address:
                      e.target.value,
                  })
                }
              />

              <textarea
                className="full"
                placeholder="Notlar"
                value={
                  editing.notes
                }
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    notes:
                      e.target.value,
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

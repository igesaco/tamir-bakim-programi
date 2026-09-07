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

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    customerId: '',
    plate: '',
    brand: '',
    model: '',
    modelYear: '',
    fuelType: '',
    transmission: '',
    mileage: '',
  });

  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const [
      vehicleResponse,
      customerResponse,
    ] = await Promise.all([
      api.get('/vehicles'),
      api.get('/customers'),
    ]);

    setVehicles(vehicleResponse.data);
    setCustomers(customerResponse.data);
  }

  useEffect(() => {
    load();
  }, []);

  const filteredVehicles = useMemo(() => {
    const term = search
      .trim()
      .toLocaleLowerCase('tr-TR');

    if (!term) {
      return vehicles;
    }

    return vehicles.filter((vehicle) => {
      const text = [
        vehicle.plate,
        vehicle.brand,
        vehicle.model,
        vehicle.modelYear,
        vehicle.vin,
        vehicle.customer?.firstName,
        vehicle.customer?.lastName,
        vehicle.customer?.phone,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR');

      return text.includes(term);
    });
  }, [vehicles, search]);

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.post('/vehicles', {
        customerId: form.customerId,
        plate: form.plate,
        brand: form.brand,
        model: form.model,

        modelYear: form.modelYear
          ? Number(form.modelYear)
          : undefined,

        fuelType:
          form.fuelType || undefined,

        transmission:
          form.transmission || undefined,

        mileage: form.mileage
          ? Number(form.mileage)
          : 0,
      });

      setForm({
        customerId: '',
        plate: '',
        brand: '',
        model: '',
        modelYear: '',
        fuelType: '',
        transmission: '',
        mileage: '',
      });

      setMessage('Araç başarıyla eklendi.');
      await load();
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function openEdit(vehicle) {
    setMessage('');
    setError('');

    setEditing({
      id: vehicle.id,
      customerId: vehicle.customerId || '',
      plate: vehicle.plate || '',
      vin: vehicle.vin || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      modelYear: vehicle.modelYear || '',
      fuelType: vehicle.fuelType || '',
      transmission: vehicle.transmission || '',
      color: vehicle.color || '',
      mileage: vehicle.mileage ?? '',
      notes: vehicle.notes || '',
      qrActive: vehicle.qrActive !== false,
    });
  }

  async function saveEdit(e) {
    e.preventDefault();

    setBusy(true);
    setError('');
    setMessage('');

    try {
      await api.patch(
        `/vehicles/${editing.id}`,
        {
          customerId: editing.customerId,
          plate: editing.plate,

          vin:
            editing.vin || undefined,

          brand: editing.brand,
          model: editing.model,

          modelYear: editing.modelYear
            ? Number(editing.modelYear)
            : undefined,

          fuelType:
            editing.fuelType || undefined,

          transmission:
            editing.transmission || undefined,

          color:
            editing.color || undefined,

          mileage:
            editing.mileage !== ''
              ? Number(editing.mileage)
              : undefined,

          notes:
            editing.notes || undefined,

          qrActive: editing.qrActive,
        },
      );

      setEditing(null);
      setMessage('Araç bilgileri güncellendi.');
      await load();
    } catch (err) {
      setError(getApiMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function remove(vehicle) {
    const approved = window.confirm(
      `${vehicle.plate} plakalı aracı silmek istediğinize emin misiniz?`,
    );

    if (!approved) {
      return;
    }

    setMessage('');
    setError('');

    try {
      await api.delete(`/vehicles/${vehicle.id}`);

      setMessage('Araç silindi.');
      await load();
    } catch (err) {
      setError(getApiMessage(err));
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Araçlar</h1>
          <p>Servise kayıtlı araçları yönetin.</p>
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
          <h3>Yeni Araç</h3>

          <form
            className="form-grid"
            onSubmit={submit}
          >
            <select
              value={form.customerId}
              onChange={(e) =>
                setForm({
                  ...form,
                  customerId: e.target.value,
                })
              }
              required
            >
              <option value="">
                Müşteri seç
              </option>

              {customers.map((customer) => (
                <option
                  key={customer.id}
                  value={customer.id}
                >
                  {customer.firstName}{' '}
                  {customer.lastName}
                </option>
              ))}
            </select>

            <input
              placeholder="Plaka"
              value={form.plate}
              onChange={(e) =>
                setForm({
                  ...form,
                  plate: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Marka"
              value={form.brand}
              onChange={(e) =>
                setForm({
                  ...form,
                  brand: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Model"
              value={form.model}
              onChange={(e) =>
                setForm({
                  ...form,
                  model: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              placeholder="Model yılı"
              value={form.modelYear}
              onChange={(e) =>
                setForm({
                  ...form,
                  modelYear: e.target.value,
                })
              }
            />

            <input
              placeholder="Yakıt"
              value={form.fuelType}
              onChange={(e) =>
                setForm({
                  ...form,
                  fuelType: e.target.value,
                })
              }
            />

            <input
              placeholder="Şanzıman"
              value={form.transmission}
              onChange={(e) =>
                setForm({
                  ...form,
                  transmission: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Kilometre"
              value={form.mileage}
              onChange={(e) =>
                setForm({
                  ...form,
                  mileage: e.target.value,
                })
              }
            />

            <button
              className="primary-button full"
              disabled={busy}
            >
              {busy
                ? 'Kaydediliyor...'
                : 'Araç Ekle'}
            </button>
          </form>
        </div>

        <div className="panel-card">
          <div className="card-title-row">
            <h3>Araç Listesi</h3>

            <input
              className="search-input"
              placeholder="Plaka, marka, model ara..."
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
                  <th>Plaka</th>
                  <th>Araç</th>
                  <th>Müşteri</th>
                  <th>KM</th>
                  <th>QR</th>
                  <th>İşlem</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map(
                  (vehicle) => (
                    <tr key={vehicle.id}>
                      <td>
                        <strong>
                          {vehicle.plate}
                        </strong>
                      </td>

                      <td>
                        {vehicle.brand}{' '}
                        {vehicle.model}
                      </td>

                      <td>
                        {vehicle.customer?.firstName}{' '}
                        {vehicle.customer?.lastName}
                      </td>

                      <td>
                        {Number(
                          vehicle.mileage || 0,
                        ).toLocaleString('tr-TR')}
                      </td>

                      <td>
                        <a
                          className="table-link"
                          href={`/qr/${vehicle.qrToken}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Aç
                        </a>
                      </td>

                      <td>
                        <div className="action-row">
                          <Link
                            className="table-link"
                            to={`/vehicles/${vehicle.id}`}
                          >
                            Detay
                          </Link>

                          <button
                            className="table-action"
                            onClick={() =>
                              openEdit(vehicle)
                            }
                          >
                            Düzenle
                          </button>

                          <button
                            className="table-action danger-text"
                            onClick={() =>
                              remove(vehicle)
                            }
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}

                {!filteredVehicles.length && (
                  <tr>
                    <td colSpan="6">
                      Araç bulunamadı.
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
            className="modal-card large-modal"
            onMouseDown={(e) =>
              e.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <h2>Araç Düzenle</h2>
                <p>
                  Araç ve QR bilgilerini güncelleyin.
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
              <select
                className="full"
                value={editing.customerId}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    customerId: e.target.value,
                  })
                }
                required
              >
                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.firstName}{' '}
                    {customer.lastName}
                  </option>
                ))}
              </select>

              <input
                placeholder="Plaka"
                value={editing.plate}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    plate: e.target.value,
                  })
                }
                required
              />

              <input
                placeholder="VIN"
                value={editing.vin}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    vin: e.target.value,
                  })
                }
              />

              <input
                placeholder="Marka"
                value={editing.brand}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    brand: e.target.value,
                  })
                }
                required
              />

              <input
                placeholder="Model"
                value={editing.model}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    model: e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                placeholder="Model yılı"
                value={editing.modelYear}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    modelYear: e.target.value,
                  })
                }
              />

              <input
                placeholder="Yakıt"
                value={editing.fuelType}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    fuelType: e.target.value,
                  })
                }
              />

              <input
                placeholder="Şanzıman"
                value={editing.transmission}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    transmission: e.target.value,
                  })
                }
              />

              <input
                placeholder="Renk"
                value={editing.color}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    color: e.target.value,
                  })
                }
              />

              <input
                type="number"
                placeholder="Kilometre"
                value={editing.mileage}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    mileage: e.target.value,
                  })
                }
              />

              <textarea
                className="full"
                placeholder="Araç notları"
                value={editing.notes}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    notes: e.target.value,
                  })
                }
              />

              <label className="switch-row full">
                <input
                  type="checkbox"
                  checked={editing.qrActive}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      qrActive: e.target.checked,
                    })
                  }
                />

                <div>
                  <strong>
                    QR Dijital Bakım Kartı
                  </strong>

                  <span>
                    Kapalı olduğunda müşterinin QR
                    bağlantısı çalışmaz.
                  </span>
                </div>
              </label>

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
import { useEffect, useState } from 'react';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { statusLabel } from '../utils/status';

export default function Maintenance() {
  const { user } = useAuth();

  const [plans, setPlans] = useState([]);
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [packages, setPackages] = useState([]);

  const [form, setForm] = useState({
    vehicleId: '',
    title: '',
    category: '',
    intervalKm: '',
    intervalMonths: '',
    nextDueKm: '',
    nextDueDate: '',
    estimatedPriceMin: '',
    estimatedPriceMax: '',
  });

  async function load() {
    const [p, r, v, packageResponse] =
      await Promise.all([
        api.get('/maintenance/plans'),
        api.get('/maintenance/records'),
        api.get('/vehicles'),
        api.get('/maintenance/packages'),
      ]);

    setPlans(p.data);
    setRecords(r.data);
    setVehicles(v.data);
    setPackages(packageResponse.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();

    await api.post('/maintenance/plans', {
      vehicleId: form.vehicleId,
      title: form.title,
      category: form.category || undefined,
      intervalKm: form.intervalKm
        ? Number(form.intervalKm)
        : undefined,
      intervalMonths: form.intervalMonths
        ? Number(form.intervalMonths)
        : undefined,
      nextDueKm: form.nextDueKm
        ? Number(form.nextDueKm)
        : undefined,
      nextDueDate: form.nextDueDate
        ? new Date(form.nextDueDate).toISOString()
        : undefined,
      estimatedPriceMin: form.estimatedPriceMin
        ? Number(form.estimatedPriceMin)
        : undefined,
      estimatedPriceMax: form.estimatedPriceMax
        ? Number(form.estimatedPriceMax)
        : undefined,
    });

    setForm({
      vehicleId: '',
      title: '',
      category: '',
      intervalKm: '',
      intervalMonths: '',
      nextDueKm: '',
      nextDueDate: '',
      estimatedPriceMin: '',
      estimatedPriceMax: '',
    });

    await load();
  }

  const canManagePackages =
    user?.role === 'OWNER' ||
    user?.role === 'MANAGER';

  async function togglePackage(
    maintenancePackage,
  ) {
    await api.patch(
      `/maintenance/packages/${maintenancePackage.id}/active`,
      {
        active:
          !maintenancePackage.active,
      },
    );

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Bakım</h1>
          <p>Geçmiş bakımları ve gelecek bakım planlarını yönetin.</p>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel-card">
          <h3>Yeni Bakım Planı</h3>

          <form className="form-grid" onSubmit={submit}>
            <select
              className="full"
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

              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} - {v.brand} {v.model}
                </option>
              ))}
            </select>

            <input
              className="full"
              placeholder="Bakım adı"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
              required
            />

            <input
              placeholder="Kategori"
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Periyot KM"
              value={form.intervalKm}
              onChange={(e) =>
                setForm({
                  ...form,
                  intervalKm: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Periyot Ay"
              value={form.intervalMonths}
              onChange={(e) =>
                setForm({
                  ...form,
                  intervalMonths: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Sonraki KM"
              value={form.nextDueKm}
              onChange={(e) =>
                setForm({
                  ...form,
                  nextDueKm: e.target.value,
                })
              }
            />

            <input
              type="datetime-local"
              value={form.nextDueDate}
              onChange={(e) =>
                setForm({
                  ...form,
                  nextDueDate: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Tahmini min. fiyat"
              value={form.estimatedPriceMin}
              onChange={(e) =>
                setForm({
                  ...form,
                  estimatedPriceMin: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Tahmini maks. fiyat"
              value={form.estimatedPriceMax}
              onChange={(e) =>
                setForm({
                  ...form,
                  estimatedPriceMax: e.target.value,
                })
              }
            />

            <button className="primary-button full">
              Bakım Planı Oluştur
            </button>
          </form>
        </div>

        <div>
          <div className="panel-card">
            <h3>Aktif Bakım Planları</h3>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Araç</th>
                    <th>Bakım</th>
                    <th>Sonraki KM</th>
                    <th>Tarih</th>
                    <th>Durum</th>
                  </tr>
                </thead>

                <tbody>
                  {plans.map((p) => (
                    <tr key={p.id}>
                      <td>{p.vehicle?.plate}</td>
                      <td>{p.title}</td>
                      <td>
                        {p.nextDueKm
                          ? Number(p.nextDueKm).toLocaleString('tr-TR')
                          : '-'}
                      </td>
                      <td>
                        {p.nextDueDate
                          ? new Date(p.nextDueDate).toLocaleDateString('tr-TR')
                          : '-'}
                      </td>
                      <td>
                        {statusLabel(p.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel-card spaced-card">
            <h3>Bakım Geçmişi</h3>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Araç</th>
                    <th>KM</th>
                    <th>Tarih</th>
                    <th>Tutar</th>
                  </tr>
                </thead>

                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{r.vehicle?.plate}</td>

                      <td>
                        {Number(r.mileage || 0).toLocaleString('tr-TR')}
                      </td>

                      <td>
                        {new Date(r.performedAt).toLocaleDateString('tr-TR')}
                      </td>

                      <td>
                        {Number(r.totalAmount || 0).toLocaleString('tr-TR')} ₺
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-card spaced-card">
        <div className="card-title-row">
          <div>
            <h3>Hazır Bakım Paketleri</h3>
            <p className="sub-text">
              Bu paketler teklif oluştururken tek seçimle teklif kalemlerine aktarılır.
            </p>
          </div>
        </div>

        <div className="maintenance-package-grid">
          {packages.map(
            (maintenancePackage) => (
              <div
                className="maintenance-package-card"
                key={maintenancePackage.id}
              >
                <div className="maintenance-package-head">
                  <div>
                    <strong>
                      {maintenancePackage.name}
                    </strong>

                    <span>
                      {maintenancePackage.description ||
                        'Bakım paketi'}
                    </span>
                  </div>

                  <span
                    className={
                      maintenancePackage.active
                        ? 'status-badge success'
                        : 'status-badge danger'
                    }
                  >
                    {maintenancePackage.active
                      ? 'Aktif'
                      : 'Pasif'}
                  </span>
                </div>

                <div className="maintenance-package-items">
                  {maintenancePackage.items.map(
                    (item) => (
                      <div key={item.id}>
                        <span>
                          {statusLabel(item.type)}
                        </span>

                        <strong>
                          {item.name}
                        </strong>

                        <small>
                          {Number(item.quantity)} adet · KDV %{Number(item.vatRate || 0)}
                        </small>
                      </div>
                    ),
                  )}
                </div>

                {canManagePackages && (
                  <button
                    className="small-button"
                    onClick={() =>
                      togglePackage(
                        maintenancePackage,
                      )
                    }
                  >
                    {maintenancePackage.active
                      ? 'Paketi Pasif Yap'
                      : 'Paketi Aktif Yap'}
                  </button>
                )}
              </div>
            ),
          )}

          {!packages.length && (
            <div className="empty-state">
              Bakım paketi bulunamadı.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

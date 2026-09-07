import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);

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

  async function submit(e) {
    e.preventDefault();

    await api.post('/vehicles', {
      ...form,
      modelYear: form.modelYear
        ? Number(form.modelYear)
        : undefined,
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

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Araçlar</h1>
          <p>Servise kayıtlı araçları yönetin.</p>
        </div>
      </div>

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

            <button className="primary-button full">
              Araç Ekle
            </button>
          </form>
        </div>

        <div className="panel-card">
          <h3>Araç Listesi</h3>

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
                {vehicles.map((vehicle) => (
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
                        href={`http://localhost:3000/vehicles/qr/${vehicle.qrToken}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Aç
                      </a>
                    </td>

                    <td>
                      <Link
                        className="table-link"
                        to={`/vehicles/${vehicle.id}`}
                      >
                        Detay
                      </Link>
                    </td>
                  </tr>
                ))}

                {!vehicles.length && (
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
    </>
  );
}
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function VehicleDetail() {
  const { id } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/vehicles/${id}`),
      api.get('/service-orders'),
      api.get('/quotes'),
    ]).then(([v, o, q]) => {
      setVehicle(v.data);

      setOrders(
        o.data.filter(
          (item) => item.vehicleId === id,
        ),
      );

      setQuotes(
        q.data.filter(
          (item) => item.vehicleId === id,
        ),
      );
    });
  }, [id]);

  if (!vehicle) {
    return <div>Araç yükleniyor...</div>;
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{vehicle.plate}</h1>
          <p>
            {vehicle.brand} {vehicle.model}
          </p>
        </div>

        <a
          className="small-button"
          href="/vehicles"
        >
          ← Araçlara Dön
        </a>
      </div>

      <div className="detail-stats">
        <div className="stat-card">
          <span>Kilometre</span>
          <strong>
            {Number(
              vehicle.mileage || 0,
            ).toLocaleString('tr-TR')}
          </strong>
        </div>

        <div className="stat-card">
          <span>Bakım Geçmişi</span>
          <strong>
            {vehicle.maintenanceRecords
              ?.length || 0}
          </strong>
        </div>

        <div className="stat-card">
          <span>Bakım Planı</span>
          <strong>
            {vehicle.maintenancePlans
              ?.length || 0}
          </strong>
        </div>

        <div className="stat-card">
          <span>Fotoğraf / Belge</span>
          <strong>
            {vehicle.media?.length || 0}
          </strong>
        </div>
      </div>

      <div className="dashboard-grid spaced-card">
        <div className="panel-card">
          <h3>Araç Bilgileri</h3>

          <div className="detail-info">
            <div>
              <span>Marka / Model</span>
              <strong>
                {vehicle.brand}{' '}
                {vehicle.model}
              </strong>
            </div>

            <div>
              <span>Model Yılı</span>
              <strong>
                {vehicle.modelYear || '-'}
              </strong>
            </div>

            <div>
              <span>Yakıt</span>
              <strong>
                {vehicle.fuelType || '-'}
              </strong>
            </div>

            <div>
              <span>Şanzıman</span>
              <strong>
                {vehicle.transmission || '-'}
              </strong>
            </div>

            <div>
              <span>VIN</span>
              <strong>
                {vehicle.vin || '-'}
              </strong>
            </div>

            <div>
              <span>Müşteri</span>
              <strong>
                {vehicle.customer?.firstName}{' '}
                {vehicle.customer?.lastName}
              </strong>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <h3>QR Dijital Bakım Kartı</h3>

          <p className="muted-text">
            Bu bağlantı aracın QR kodundan
            açılacak genel bakım görünümüdür.
          </p>

          <a
            className="primary-link-button"
            target="_blank"
            rel="noreferrer"
            href={`http://localhost:3000/vehicles/qr/${vehicle.qrToken}`}
          >
            QR Sayfasını Aç
          </a>

          <div className="qr-token-box">
            {vehicle.qrToken}
          </div>
        </div>
      </div>

      <div className="panel-card spaced-card">
        <h3>Bakım Geçmişi</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>KM</th>
                <th>İşlemler</th>
                <th>Tutar</th>
              </tr>
            </thead>

            <tbody>
              {vehicle.maintenanceRecords?.map(
                (record) => (
                  <tr key={record.id}>
                    <td>
                      {new Date(
                        record.performedAt,
                      ).toLocaleDateString(
                        'tr-TR',
                      )}
                    </td>

                    <td>
                      {Number(
                        record.mileage,
                      ).toLocaleString(
                        'tr-TR',
                      )}
                    </td>

                    <td>
                      {record.items
                        ?.map(
                          (item) =>
                            item.name,
                        )
                        .join(', ') || '-'}
                    </td>

                    <td>
                      {Number(
                        record.totalAmount || 0,
                      ).toLocaleString(
                        'tr-TR',
                      )}{' '}
                      ₺
                    </td>
                  </tr>
                ),
              )}

              {!vehicle.maintenanceRecords
                ?.length && (
                <tr>
                  <td colSpan="4">
                    Bakım geçmişi yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel-card spaced-card">
        <h3>Gelecek Bakım Planları</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bakım</th>
                <th>Sonraki KM</th>
                <th>Tarih</th>
                <th>Tahmini Fiyat</th>
                <th>Durum</th>
              </tr>
            </thead>

            <tbody>
              {vehicle.maintenancePlans?.map(
                (plan) => (
                  <tr key={plan.id}>
                    <td>{plan.title}</td>

                    <td>
                      {plan.nextDueKm
                        ? Number(
                            plan.nextDueKm,
                          ).toLocaleString(
                            'tr-TR',
                          )
                        : '-'}
                    </td>

                    <td>
                      {plan.nextDueDate
                        ? new Date(
                            plan.nextDueDate,
                          ).toLocaleDateString(
                            'tr-TR',
                          )
                        : '-'}
                    </td>

                    <td>
                      {plan.estimatedPriceMin ||
                      plan.estimatedPriceMax
                        ? `${Number(
                            plan.estimatedPriceMin ||
                              0,
                          ).toLocaleString(
                            'tr-TR',
                          )} - ${Number(
                            plan.estimatedPriceMax ||
                              0,
                          ).toLocaleString(
                            'tr-TR',
                          )} ₺`
                        : '-'}
                    </td>

                    <td>{plan.status}</td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel-card spaced-card">
        <h3>İş Emirleri</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Durum</th>
                <th>Şikayet</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>

                  <td>
                    <span className="status-badge">
                      {order.status}
                    </span>
                  </td>

                  <td>
                    {order.complaint || '-'}
                  </td>

                  <td>
                    <a
                      className="table-link"
                      href={`/service-orders/${order.id}`}
                    >
                      Detay
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

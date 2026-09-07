import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/client';

export default function CustomerDetail() {
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get(`/customers/${id}`),
      api.get('/service-orders'),
      api.get('/quotes'),
      api.get('/billing/payments'),
    ]).then(([c, o, q, p]) => {
      setCustomer(c.data);

      setOrders(
        o.data.filter(
          (item) => item.customerId === id,
        ),
      );

      setQuotes(
        q.data.filter(
          (item) => item.customerId === id,
        ),
      );

      setPayments(
        p.data.filter(
          (item) => item.customerId === id,
        ),
      );
    });
  }, [id]);

  if (!customer) {
    return <div>Müşteri yükleniyor...</div>;
  }

  const totalPaid = payments.reduce(
    (sum, item) =>
      sum + Number(item.amount || 0),
    0,
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            {customer.firstName}{' '}
            {customer.lastName}
          </h1>

          <p>Müşteri detayları ve servis geçmişi.</p>
        </div>

        <a
          className="small-button"
          href="/customers"
        >
          ← Müşterilere Dön
        </a>
      </div>

      <div className="detail-stats">
        <div className="stat-card">
          <span>Araç</span>
          <strong>
            {customer.vehicles?.length || 0}
          </strong>
        </div>

        <div className="stat-card">
          <span>İş Emri</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="stat-card">
          <span>Teklif</span>
          <strong>{quotes.length}</strong>
        </div>

        <div className="stat-card">
          <span>Toplam Tahsilat</span>
          <strong>
            {totalPaid.toLocaleString('tr-TR')} ₺
          </strong>
        </div>
      </div>

      <div className="dashboard-grid spaced-card">
        <div className="panel-card">
          <h3>İletişim Bilgileri</h3>

          <div className="detail-info">
            <div>
              <span>Telefon</span>
              <strong>
                {customer.phone || '-'}
              </strong>
            </div>

            <div>
              <span>E-posta</span>
              <strong>
                {customer.email || '-'}
              </strong>
            </div>

            <div>
              <span>Adres</span>
              <strong>
                {customer.address || '-'}
              </strong>
            </div>

            <div>
              <span>Notlar</span>
              <strong>
                {customer.notes || '-'}
              </strong>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Araçları</h3>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Plaka</th>
                  <th>Araç</th>
                  <th>KM</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {customer.vehicles?.map(
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
                        {Number(
                          vehicle.mileage || 0,
                        ).toLocaleString(
                          'tr-TR',
                        )}
                      </td>

                      <td>
                        <a
                          className="table-link"
                          href={`/vehicles/${vehicle.id}`}
                        >
                          Detay
                        </a>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="panel-card spaced-card">
        <h3>İş Emirleri</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Araç</th>
                <th>Durum</th>
                <th>Tarih</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    {order.vehicle?.plate}
                  </td>
                  <td>
                    <span className="status-badge">
                      {order.status}
                    </span>
                  </td>
                  <td>
                    {new Date(
                      order.createdAt,
                    ).toLocaleDateString(
                      'tr-TR',
                    )}
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

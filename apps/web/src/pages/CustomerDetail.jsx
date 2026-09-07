import {
  useEffect,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { statusLabel } from '../utils/status';

export default function CustomerDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [customer, setCustomer] =
    useState(null);
  const [orders, setOrders] =
    useState([]);
  const [quotes, setQuotes] =
    useState([]);
  const [payments, setPayments] =
    useState([]);
  const [error, setError] =
    useState('');

  const canViewFinance =
    user?.role === 'OWNER' ||
    user?.role === 'MANAGER';

  useEffect(() => {
    const requests = [
      api.get(`/customers/${id}`),
      api.get('/service-orders'),
      api.get('/quotes'),
    ];

    if (canViewFinance) {
      requests.push(
        api.get('/billing/payments'),
      );
    }

    Promise.all(requests)
      .then((responses) => {
        const [c, o, q, p] =
          responses;

        setCustomer(c.data);

        setOrders(
          o.data.filter(
            (item) =>
              item.customerId === id,
          ),
        );

        setQuotes(
          q.data.filter(
            (item) =>
              item.customerId === id,
          ),
        );

        setPayments(
          p
            ? p.data.filter(
                (item) =>
                  item.customerId ===
                  id,
              )
            : [],
        );
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            'Müşteri bilgileri yüklenemedi.',
        );
      });
  }, [id, canViewFinance]);

  if (error) {
    return (
      <div className="page-message error-message">
        {error}
      </div>
    );
  }

  if (!customer) {
    return (
      <div>
        Müşteri yükleniyor...
      </div>
    );
  }

  const totalPaid =
    payments
      .filter(
        (item) =>
          item.status === 'PAID',
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0,
          ),
        0,
      );

  const totalBilled =
    orders.reduce(
      (orderSum, order) =>
        orderSum +
        (
          order.items?.reduce(
            (sum, item) => {
              const gross =
                Number(
                  item.grossTotal ||
                    0,
                );

              return (
                sum +
                (gross > 0
                  ? gross
                  : Number(
                      item.totalPrice ||
                        0,
                    ) +
                    Number(
                      item.vatAmount ||
                        0,
                    ))
              );
            },
            0,
          ) || 0
        ),
      0,
    );

  const openBalance =
    Math.max(
      0,
      totalBilled -
        totalPaid,
    );

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            {customer.firstName}{' '}
            {customer.lastName}
          </h1>

          <p>
            Müşteri detayları ve servis
            geçmişi.
          </p>
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
            {customer.vehicles?.length ||
              0}
          </strong>
        </div>

        <div className="stat-card">
          <span>İş Emri</span>
          <strong>
            {orders.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>Teklif</span>
          <strong>
            {quotes.length}
          </strong>
        </div>

        {canViewFinance && (
          <>
            <div className="stat-card">
              <span>Toplam Tahsilat</span>
              <strong>
                {totalPaid.toLocaleString(
                  'tr-TR',
                )}{' '}
                ₺
              </strong>
            </div>

            <div className="stat-card">
              <span>Açık Bakiye</span>
              <strong>
                {openBalance.toLocaleString(
                  'tr-TR',
                )}{' '}
                ₺
              </strong>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid spaced-card">
        <div className="panel-card">
          <h3>
            İletişim Bilgileri
          </h3>

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
              <span>Şube</span>
              <strong>
                {customer.branch?.name ||
                  '-'}
              </strong>
            </div>

            <div>
              <span>Vergi No</span>
              <strong>
                {customer.taxNumber ||
                  '-'}
              </strong>
            </div>

            <div>
              <span>Adres</span>
              <strong>
                {customer.address ||
                  '-'}
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
                    <tr
                      key={
                        vehicle.id
                      }
                    >
                      <td>
                        <strong>
                          {
                            vehicle.plate
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          vehicle.brand
                        }{' '}
                        {
                          vehicle.model
                        }
                      </td>

                      <td>
                        {Number(
                          vehicle.mileage ||
                            0,
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

                {!customer.vehicles
                  ?.length && (
                  <tr>
                    <td colSpan="4">
                      Araç kaydı yok.
                    </td>
                  </tr>
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
              {orders.map(
                (order) => (
                  <tr key={order.id}>
                    <td>
                      {
                        order.orderNumber
                      }
                    </td>

                    <td>
                      {
                        order.vehicle
                          ?.plate
                      }
                    </td>

                    <td>
                      <span className="status-badge">
                        {statusLabel(
                          order.status,
                        )}
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
                ),
              )}

              {!orders.length && (
                <tr>
                  <td colSpan="5">
                    İş emri kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel-card spaced-card">
        <h3>Teklifler / Proforma</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Araç</th>
                <th>Durum</th>
                <th>Toplam</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {quotes.map(
                (quote) => (
                  <tr key={quote.id}>
                    <td>
                      {
                        quote.quoteNumber
                      }
                    </td>

                    <td>
                      {
                        quote.vehicle
                          ?.plate
                      }
                    </td>

                    <td>
                      {statusLabel(
                        quote.status,
                      )}
                    </td>

                    <td>
                      {Number(
                        quote.total || 0,
                      ).toLocaleString(
                        'tr-TR',
                      )}{' '}
                      ₺
                    </td>

                    <td>
                      <a
                        className="table-link"
                        href={`/quotes/${quote.id}/proforma`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Proforma
                      </a>
                    </td>
                  </tr>
                ),
              )}

              {!quotes.length && (
                <tr>
                  <td colSpan="5">
                    Teklif kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

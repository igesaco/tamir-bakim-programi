import { useLiveRefresh } from '../hooks/useLiveRefresh';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
} from 'react-router-dom';

import api from '../api/client';
import { statusLabel } from '../utils/status';

export default function PricingQueue() {
  const [orders, setOrders] =
    useState([]);
  const [search, setSearch] =
    useState('');
  const [error, setError] =
    useState('');

  useLiveRefresh(() => load(true));

  async function load() {
    const response =
      await api.get(
        '/service-orders',
      );

    setOrders(
      response.data,
    );
  }

  useEffect(() => {
    load().catch((err) => {
      const message =
        err?.response?.data
          ?.message;

      setError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'Fiyatlandırma kuyruğu yüklenemedi.',
      );
    });
  }, []);

  const waitingOrders =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLocaleLowerCase(
            'tr-TR',
          );

      return orders.filter(
        (order) => {
          if (
            order.status !==
            'QUOTE_WAITING'
          ) {
            return false;
          }

          if (!term) {
            return true;
          }

          return [
            order.orderNumber,
            order.vehicle?.plate,
            order.vehicle?.brand,
            order.vehicle?.model,
            order.customer?.firstName,
            order.customer?.lastName,
            order.customer?.phone,
            order.complaint,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              'tr-TR',
            )
            .includes(term);
        },
      );
    }, [
      orders,
      search,
    ]);

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            Fiyatlandırma Bekleyen Araçlar
          </h1>
          <p>
            Mobil araç kabulünden gelen iş emirlerini inceleyin, fotoğrafları kontrol edin ve proforma hazırlayın.
          </p>
        </div>
      </div>

      {error && (
        <div className="page-message error-message">
          {error}
        </div>
      )}

      <div className="panel-card">
        <div className="card-title-row">
          <div>
            <h3>
              Muhasebe Kuyruğu
            </h3>
            <p className="muted-text">
              {waitingOrders.length}{' '}
              iş emri fiyatlandırma bekliyor.
            </p>
          </div>

          <input
            className="search-input"
            placeholder="Plaka, müşteri, iş emri..."
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
                <th>İş Emri</th>
                <th>Plaka</th>
                <th>Müşteri</th>
                <th>Talep</th>
                <th>Planlanan İşlem</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>

            <tbody>
              {waitingOrders.map(
                (order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>
                        {order.orderNumber}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {order.vehicle?.plate}
                      </strong>
                      <div className="muted-text">
                        {order.vehicle?.brand}{' '}
                        {order.vehicle?.model}
                      </div>
                    </td>

                    <td>
                      {order.customer?.firstName}{' '}
                      {order.customer?.lastName}
                      <div className="muted-text">
                        {order.customer?.phone ||
                          '-'}
                      </div>
                    </td>

                    <td>
                      {order.complaint ||
                        '-'}
                    </td>

                    <td>
                      {order.items?.length
                        ? order.items
                            .slice(
                              0,
                              3,
                            )
                            .map(
                              (item) =>
                                item.name,
                            )
                            .join(', ')
                        : 'Henüz kalem yok'}
                      {order.items?.length >
                      3
                        ? ` +${order.items.length - 3}`
                        : ''}
                    </td>

                    <td>
                      <span className="status-badge">
                        {statusLabel(
                          order.status,
                        )}
                      </span>
                    </td>

                    <td>
                      <div className="action-row">
                        <Link
                          className="table-link"
                          to={`/service-orders/${order.id}`}
                        >
                          Fotoğraf / Detay
                        </Link>

                        <Link
                          className="small-button"
                          to={`/quotes?order=${order.id}`}
                        >
                          Fiyatlandır
                        </Link>
                      </div>
                    </td>
                  </tr>
                ),
              )}

              {!waitingOrders.length && (
                <tr>
                  <td colSpan="7">
                    Fiyatlandırma bekleyen iş emri yok.
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

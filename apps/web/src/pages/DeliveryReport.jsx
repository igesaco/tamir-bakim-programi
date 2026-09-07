import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';

import api from '../api/client';
import { statusLabel } from '../utils/status';

function money(value) {
  return Number(value || 0).toLocaleString(
    'tr-TR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

export default function DeliveryReport() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/service-orders/${id}`)
      .then((response) => {
        setOrder(response.data);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            'Teslim tutanağı yüklenemedi.',
        );
      });
  }, [id]);

  const totals = useMemo(() => {
    if (!order) {
      return {
        total: 0,
        paid: 0,
        remaining: 0,
      };
    }

    const total =
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
      ) || 0;

    const paid =
      order.payments?.reduce(
        (sum, payment) =>
          payment.status === 'PAID'
            ? sum +
              Number(
                payment.amount || 0,
              )
            : sum,
        0,
      ) || 0;

    return {
      total,
      paid,
      remaining:
        Math.max(0, total - paid),
    };
  }, [order]);

  if (error) {
    return (
      <div className="proforma-screen">
        <div className="proforma-sheet">
          {error}
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="proforma-screen">
        <div className="proforma-sheet">
          Teslim tutanağı yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="proforma-screen">
      <div className="proforma-toolbar">
        <Link
          className="secondary-button"
          to={`/service-orders/${id}`}
        >
          ← İş Emrine Dön
        </Link>

        <button
          className="primary-button"
          onClick={() =>
            window.print()
          }
        >
          Yazdır / PDF Kaydet
        </button>
      </div>

      <article className="proforma-sheet delivery-sheet">
        <header className="proforma-header">
          <div>
            <div className="proforma-brand">
              ARAÇ TESLİM TUTANAĞI
            </div>

            <div className="proforma-muted">
              İş Emri: {order.orderNumber}
            </div>

            <div className="proforma-muted">
              Tarih:{' '}
              {new Date().toLocaleDateString(
                'tr-TR',
              )}
            </div>
          </div>

          <div className="proforma-title-block">
            <strong>
              {order.vehicle?.plate}
            </strong>

            <span>
              {order.vehicle?.brand}{' '}
              {order.vehicle?.model}
            </span>

            <span>
              Durum:{' '}
              {statusLabel(
                order.status,
              )}
            </span>
          </div>
        </header>

        <section className="proforma-info-grid">
          <div>
            <h3>Müşteri Bilgileri</h3>

            <strong>
              {order.customer?.firstName}{' '}
              {order.customer?.lastName}
            </strong>

            <span>
              Telefon:{' '}
              {order.customer?.phone ||
                '-'}
            </span>

            <span>
              E-posta:{' '}
              {order.customer?.email ||
                '-'}
            </span>

            <span>
              Adres:{' '}
              {order.customer?.address ||
                '-'}
            </span>
          </div>

          <div>
            <h3>Araç Bilgileri</h3>

            <strong>
              {order.vehicle?.plate}
            </strong>

            <span>
              {order.vehicle?.brand}{' '}
              {order.vehicle?.model}
            </span>

            <span>
              Model Yılı:{' '}
              {order.vehicle?.modelYear ||
                '-'}
            </span>

            <span>
              Kilometre:{' '}
              {Number(
                order.mileage || 0,
              ).toLocaleString('tr-TR')}
            </span>
          </div>
        </section>

        <section className="delivery-note-box">
          <strong>
            Müşteri Şikayeti / Talebi
          </strong>
          <p>
            {order.complaint || '-'}
          </p>
        </section>

        <table className="proforma-table">
          <thead>
            <tr>
              <th>#</th>
              <th>İşlem / Parça</th>
              <th>Tür</th>
              <th>Miktar</th>
              <th>Birim Fiyat</th>
              <th>İndirim</th>
              <th>KDV</th>
              <th>Genel Toplam</th>
              <th>Durum</th>
            </tr>
          </thead>

          <tbody>
            {order.items?.map(
              (item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>

                  <td>
                    <strong>
                      {item.name}
                    </strong>

                    {item.description && (
                      <div className="proforma-muted">
                        {item.description}
                      </div>
                    )}
                  </td>

                  <td>
                    {statusLabel(
                      item.type,
                    )}
                  </td>

                  <td>
                    {Number(
                      item.quantity,
                    )}
                  </td>

                  <td>
                    {money(
                      item.unitPrice,
                    )}{' '}
                    ₺
                  </td>

                  <td>
                    {money(
                      item.discountAmount,
                    )}{' '}
                    ₺
                  </td>

                  <td>
                    %{Number(
                      item.vatRate ??
                        20,
                    )}{' '}
                    /{' '}
                    {money(
                      item.vatAmount ||
                        0,
                    )}{' '}
                    ₺
                  </td>

                  <td>
                    {money(
                      Number(
                        item.grossTotal ||
                          0,
                      ) > 0
                        ? item.grossTotal
                        : Number(
                            item.totalPrice ||
                              0,
                          ) +
                          Number(
                            item.vatAmount ||
                              0,
                          ),
                    )}{' '}
                    ₺
                  </td>

                  <td>
                    {item.completed
                      ? 'Tamamlandı'
                      : 'Bekliyor'}
                  </td>
                </tr>
              ),
            )}

            {!order.items?.length && (
              <tr>
                <td colSpan="9">
                  İşlem kaydı bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <section className="proforma-totals">
          <div>
            <span>İşlem Toplamı</span>
            <strong>
              {money(
                totals.total,
              )}{' '}
              ₺
            </strong>
          </div>

          <div>
            <span>Tahsil Edilen</span>
            <strong>
              {money(
                totals.paid,
              )}{' '}
              ₺
            </strong>
          </div>

          <div className="proforma-total-final">
            <span>KALAN BAKİYE</span>
            <strong>
              {money(
                totals.remaining,
              )}{' '}
              ₺
            </strong>
          </div>
        </section>

        <section className="delivery-declaration">
          Araç tarafıma kontrol edilerek
          teslim edilmiştir. Yapılan işlemler,
          araç kilometresi ve yukarıdaki bilgiler
          tarafımdan görülmüş ve teslim alınmıştır.
        </section>

        <section className="delivery-signatures">
          <div>
            <strong>
              Servis Yetkilisi
            </strong>
            <span>
              Ad Soyad / İmza
            </span>
          </div>

          <div>
            <strong>
              Müşteri
            </strong>
            <span>
              Ad Soyad / İmza
            </span>
          </div>
        </section>

        <footer className="proforma-footer">
          Bu belge araç teslim ve servis kayıt
          tutanağı olarak düzenlenmiştir.
        </footer>
      </article>
    </div>
  );
}

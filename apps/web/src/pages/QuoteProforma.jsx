import {
  useEffect,
  useState,
} from 'react';
import {
  Link,
  useParams,
} from 'react-router-dom';

import api from '../api/client';

function money(value) {
  return Number(value || 0).toLocaleString(
    'tr-TR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

export default function QuoteProforma() {
  const { id } = useParams();
  const [quote, setQuote] =
    useState(null);
  const [error, setError] =
    useState('');

  useEffect(() => {
    api.get(`/quotes/${id}`)
      .then((response) => {
        setQuote(response.data);
      })
      .catch((err) => {
        setError(
          err?.response?.data?.message ||
            'Proforma yüklenemedi.',
        );
      });
  }, [id]);

  if (error) {
    return (
      <div className="proforma-screen">
        <div className="proforma-sheet">
          {error}
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="proforma-screen">
        <div className="proforma-sheet">
          Proforma yükleniyor...
        </div>
      </div>
    );
  }

  const organization =
    quote.organization || {};
  const branch = quote.branch || {};
  const customer =
    quote.customer || {};
  const vehicle =
    quote.vehicle || {};

  return (
    <div className="proforma-screen">
      <div className="proforma-toolbar">
        <Link
          className="secondary-button"
          to="/quotes"
        >
          ← Tekliflere Dön
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

      <article className="proforma-sheet">
        <header className="proforma-header">
          <div>
            <div className="proforma-brand">
              {organization.name}
            </div>

            <div className="proforma-muted">
              {branch.name || 'Merkez Şube'}
            </div>

            {branch.address && (
              <div className="proforma-muted">
                {branch.address}
                {branch.city
                  ? ` / ${branch.city}`
                  : ''}
              </div>
            )}

            <div className="proforma-muted">
              {organization.phone ||
                branch.phone ||
                ''}
            </div>

            <div className="proforma-muted">
              {organization.email || ''}
            </div>

            {organization.taxNumber && (
              <div className="proforma-muted">
                Vergi No:{' '}
                {organization.taxNumber}
              </div>
            )}
          </div>

          <div className="proforma-title-block">
            <h1>PROFORMA FATURA</h1>
            <strong>
              {quote.quoteNumber}
            </strong>
            <span>
              {new Date(
                quote.createdAt,
              ).toLocaleDateString(
                'tr-TR',
              )}
            </span>
          </div>
        </header>

        <section className="proforma-info-grid">
          <div>
            <h3>Müşteri</h3>
            <strong>
              {customer.firstName}{' '}
              {customer.lastName}
            </strong>
            <span>
              {customer.phone || '-'}
            </span>
            <span>
              {customer.email || '-'}
            </span>
            <span>
              {customer.address || '-'}
            </span>
            {customer.taxNumber && (
              <span>
                Vergi No:{' '}
                {customer.taxNumber}
              </span>
            )}
          </div>

          <div>
            <h3>Araç</h3>
            <strong>
              {vehicle.plate}
            </strong>
            <span>
              {vehicle.brand}{' '}
              {vehicle.model}
            </span>
            <span>
              Model Yılı:{' '}
              {vehicle.modelYear ||
                '-'}
            </span>
            <span>
              VIN:{' '}
              {vehicle.vin || '-'}
            </span>
            {quote.serviceOrder && (
              <span>
                İş Emri:{' '}
                {
                  quote
                    .serviceOrder
                    .orderNumber
                }
              </span>
            )}
          </div>
        </section>

        <table className="proforma-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Açıklama</th>
              <th>Miktar</th>
              <th>Birim Fiyat</th>
              <th>İndirim</th>
              <th>KDV</th>
              <th>Toplam</th>
            </tr>
          </thead>

          <tbody>
            {quote.items.map(
              (item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>
                      {item.name}
                    </strong>

                    {item.description && (
                      <div className="proforma-muted">
                        {
                          item.description
                        }
                      </div>
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
                    %
                    {Number(
                      item.vatRate,
                    )}{' '}
                    /{' '}
                    {money(
                      item.vatAmount,
                    )}{' '}
                    ₺
                  </td>
                  <td>
                    {money(
                      item.grossTotal ||
                        Number(
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
                </tr>
              ),
            )}
          </tbody>
        </table>

        <section className="proforma-totals">
          <div>
            <span>Ara Toplam</span>
            <strong>
              {money(
                quote.subtotal,
              )}{' '}
              ₺
            </strong>
          </div>

          <div>
            <span>İndirim</span>
            <strong>
              -{money(
                quote.discountTotal,
              )}{' '}
              ₺
            </strong>
          </div>

          <div>
            <span>KDV Toplamı</span>
            <strong>
              {money(
                quote.taxTotal,
              )}{' '}
              ₺
            </strong>
          </div>

          <div className="proforma-total-final">
            <span>GENEL TOPLAM</span>
            <strong>
              {money(quote.total)} ₺
            </strong>
          </div>
        </section>

        {quote.notes && (
          <section className="proforma-notes">
            <strong>Not</strong>
            <p>{quote.notes}</p>
          </section>
        )}

        <footer className="proforma-footer">
          Bu belge proforma amaçlıdır.
          Mali fatura yerine geçmez.
        </footer>
      </article>
    </div>
  );
}

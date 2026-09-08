import {
  useState,
} from 'react';
import {
  useSearchParams,
} from 'react-router-dom';

const API_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000'
).replace(/\/+$/, '');

function money(value) {
  return Number(
    value || 0,
  ).toLocaleString(
    'tr-TR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

async function portalRequest(
  path,
  {
    method = 'GET',
    body,
    token,
  } = {},
) {
  const response =
    await fetch(
      `${API_URL}${path}`,
      {
        method,
        headers: {
          Accept:
            'application/json',
          'Content-Type':
            'application/json',
          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
        },
        body:
          body === undefined
            ? undefined
            : JSON.stringify(
                body,
              ),
      },
    );

  const data =
    await response.json()
      .catch(() => null);

  if (!response.ok) {
    const message =
      Array.isArray(
        data?.message,
      )
        ? data.message.join(', ')
        : data?.message ||
          'İşlem başarısız.';

    throw new Error(
      message,
    );
  }

  return data;
}

export default function CustomerPortal() {
  const [searchParams] =
    useSearchParams();

  const qrToken =
    searchParams
      .get('qr')
      ?.trim() || '';

  const fromMaintenanceCard =
    Boolean(qrToken);

  const [step, setStep] =
    useState('identity');

  const [identity, setIdentity] =
    useState({
      nationalId: '',
      plate: '',
    });

  const [
    challenge,
    setChallenge,
  ] = useState(null);

  const [code, setCode] =
    useState('');

  const [data, setData] =
    useState(null);

  const [busy, setBusy] =
    useState(false);
  const [error, setError] =
    useState('');

  async function start(event) {
    event.preventDefault();

    setBusy(true);
    setError('');

    try {
      const result =
        await portalRequest(
          fromMaintenanceCard
            ? '/customer-portal/access/qr/start'
            : '/customer-portal/access/start',
          {
            method: 'POST',
            body:
              fromMaintenanceCard
                ? {
                    nationalId:
                      identity.nationalId,
                    qrToken,
                  }
                : identity,
          },
        );

      setChallenge(
        result,
      );
      setStep('otp');
    } catch (err) {
      setError(
        err.message,
      );
    } finally {
      setBusy(false);
    }
  }

  async function verify(event) {
    event.preventDefault();

    setBusy(true);
    setError('');

    try {
      const result =
        await portalRequest(
          '/customer-portal/access/verify',
          {
            method: 'POST',
            body: {
              challengeId:
                challenge.challengeId,
              code,
            },
          },
        );

      const portalData =
        await portalRequest(
          '/customer-portal/me',
          {
            token:
              result.token,
          },
        );

      setData(
        portalData,
      );
      setStep('account');
    } catch (err) {
      setError(
        err.message,
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="customer-portal-page">
      <header className="customer-portal-header">
        <div className="customer-portal-logo">
          TB
        </div>

        <div>
          <strong>
            Dijital Servis
          </strong>
          <span>
            Müşteri Bilgi Merkezi
          </span>
        </div>
      </header>

      <main className="customer-portal-shell">
        {step ===
          'identity' && (
          <section className="customer-portal-auth-card">
            <span className="platform-kicker">
              GÜVENLİ ERİŞİM
            </span>

            <h1>
              Aracınızı görüntüleyin
            </h1>

            <p>
              {fromMaintenanceCard
                ? 'Bakım kartındaki araca ait müşteri bilgilerini açmak için T.C. kimlik numaranızla doğrulama başlatın.'
                : 'T.C. kimlik numaranız ve araç plakanız ile doğrulama başlatın.'}
            </p>

            <form
              onSubmit={start}
              className="customer-portal-form"
            >
              <label>
                T.C. Kimlik No
                <input
                  inputMode="numeric"
                  maxLength="11"
                  value={
                    identity.nationalId
                  }
                  onChange={(event) =>
                    setIdentity({
                      ...identity,
                      nationalId:
                        event.target.value
                          .replace(
                            /\D/g,
                            '',
                          ),
                    })
                  }
                  required
                />
              </label>

              {!fromMaintenanceCard && (
                <label>
                  Plaka
                  <input
                    value={
                      identity.plate
                    }
                    onChange={(event) =>
                      setIdentity({
                        ...identity,
                        plate:
                          event.target.value
                            .toUpperCase(),
                      })
                    }
                    required
                  />
                </label>
              )}

              {error && (
                <div className="page-message error-message">
                  {error}
                </div>
              )}

              <button
                className="primary-button"
                disabled={busy}
              >
                {busy
                  ? 'Kontrol ediliyor...'
                  : 'Doğrulama Kodu Gönder'}
              </button>
            </form>

            <div className="customer-portal-security">
              {fromMaintenanceCard
                ? 'QR kod yalnızca dijital bakım kartını açar. Kişisel ve finansal bilgiler SMS doğrulaması sonrasında gösterilir.'
                : 'Cari ve ödeme bilgileri yalnızca SMS doğrulaması sonrasında gösterilir.'}
            </div>
          </section>
        )}

        {step === 'otp' && (
          <section className="customer-portal-auth-card">
            <span className="platform-kicker">
              SMS DOĞRULAMA
            </span>

            <h1>
              Kodu girin
            </h1>

            <p>
              Doğrulama kodu{' '}
              <strong>
                {
                  challenge.maskedPhone
                }
              </strong>{' '}
              numarasına gönderildi.
            </p>

            {challenge.developmentCode && (
              <div className="customer-portal-dev-code">
                Local test kodu:{' '}
                <strong>
                  {
                    challenge.developmentCode
                  }
                </strong>
              </div>
            )}

            <form
              onSubmit={verify}
              className="customer-portal-form"
            >
              <label>
                6 Haneli Kod
                <input
                  className="customer-portal-otp"
                  inputMode="numeric"
                  maxLength="6"
                  value={code}
                  onChange={(event) =>
                    setCode(
                      event.target.value
                        .replace(
                          /\D/g,
                          '',
                        ),
                    )
                  }
                  required
                />
              </label>

              {error && (
                <div className="page-message error-message">
                  {error}
                </div>
              )}

              <button
                className="primary-button"
                disabled={
                  busy ||
                  code.length !== 6
                }
              >
                {busy
                  ? 'Doğrulanıyor...'
                  : 'Bilgilerimi Aç'}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setStep(
                    'identity',
                  );
                  setCode('');
                  setError('');
                }}
              >
                Geri Dön
              </button>
            </form>
          </section>
        )}

        {step ===
          'account' &&
          data && (
          <section className="customer-portal-account">
            <div className="customer-portal-welcome">
              <div>
                <span className="platform-kicker">
                  MÜŞTERİ PANELİ
                </span>

                <h1>
                  Merhaba{' '}
                  {
                    data.customer
                      .firstName
                  }
                </h1>

                <p>
                  {
                    data.vehicle
                      .plate
                  }{' '}
                  ·{' '}
                  {
                    data.vehicle
                      .brand
                  }{' '}
                  {
                    data.vehicle
                      .model
                  }
                </p>
              </div>

              <button
                className="secondary-button"
                onClick={() => {
                  setStep(
                    'identity',
                  );
                  setData(null);
                  setChallenge(null);
                  setCode('');
                }}
              >
                Güvenli Çıkış
              </button>
            </div>

            <div className="customer-portal-stats">
              <div>
                <span>
                  Toplam İşlem
                </span>
                <strong>
                  {money(
                    data.currentAccount
                      .billed,
                  )}{' '}
                  ₺
                </strong>
              </div>

              <div>
                <span>
                  Ödenen
                </span>
                <strong>
                  {money(
                    data.currentAccount
                      .paid,
                  )}{' '}
                  ₺
                </strong>
              </div>

              <div className="customer-portal-balance">
                <span>
                  Açık Bakiye
                </span>
                <strong>
                  {money(
                    data.currentAccount
                      .openBalance,
                  )}{' '}
                  ₺
                </strong>
              </div>
            </div>

            <div className="customer-portal-grid">
              <div className="customer-portal-card">
                <h3>
                  Bilgilerim
                </h3>

                <dl>
                  <div>
                    <dt>
                      Ad Soyad
                    </dt>
                    <dd>
                      {
                        data.customer
                          .firstName
                      }{' '}
                      {
                        data.customer
                          .lastName
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Telefon
                    </dt>
                    <dd>
                      {data.customer
                        .phone ||
                        '-'}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      E-posta
                    </dt>
                    <dd>
                      {data.customer
                        .email ||
                        '-'}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      T.C.
                    </dt>
                    <dd>
                      *** *** *{
                        data.customer
                          .nationalIdLast4 ||
                        '----'
                      }
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="customer-portal-card">
                <h3>
                  Araç Bilgileri
                </h3>

                <dl>
                  <div>
                    <dt>
                      Plaka
                    </dt>
                    <dd>
                      {
                        data.vehicle
                          .plate
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Araç
                    </dt>
                    <dd>
                      {
                        data.vehicle
                          .brand
                      }{' '}
                      {
                        data.vehicle
                          .model
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Model Yılı
                    </dt>
                    <dd>
                      {data.vehicle
                        .modelYear ||
                        '-'}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      KM
                    </dt>
                    <dd>
                      {Number(
                        data.vehicle
                          .mileage ||
                          0,
                      ).toLocaleString(
                        'tr-TR',
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="customer-portal-card spaced-card">
              <h3>
                Ödeme Bilgileri
              </h3>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>
                        Tarih
                      </th>
                      <th>
                        Referans
                      </th>
                      <th>
                        Yöntem
                      </th>
                      <th>
                        Durum
                      </th>
                      <th>
                        Tutar
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.payments.map(
                      (payment) => (
                        <tr
                          key={
                            payment.id
                          }
                        >
                          <td>
                            {new Date(
                              payment.paidAt ||
                                payment.createdAt,
                            ).toLocaleDateString(
                              'tr-TR',
                            )}
                          </td>

                          <td>
                            {payment.reference ||
                              payment
                                .serviceOrder
                                ?.orderNumber ||
                              payment
                                .quote
                                ?.quoteNumber ||
                              '-'}
                          </td>

                          <td>
                            {
                              payment.method
                            }
                          </td>

                          <td>
                            {
                              payment.status
                            }
                          </td>

                          <td>
                            <strong>
                              {money(
                                payment.amount,
                              )}{' '}
                              ₺
                            </strong>
                          </td>
                        </tr>
                      ),
                    )}

                    {!data.payments
                      .length && (
                      <tr>
                        <td colSpan="5">
                          Ödeme kaydı
                          bulunmuyor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

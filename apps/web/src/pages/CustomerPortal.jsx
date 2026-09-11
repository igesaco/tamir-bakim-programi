import {
  useEffect,
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


const maintenanceStatusLabels = {
  OVERDUE: 'Gecikmiş',
  DUE_SOON: 'Yaklaşıyor',
  UPCOMING: 'Planlandı',
};

const serviceStatusLabels = {
  APPOINTMENT: 'Randevu',
  ARRIVED: 'Araç Geldi',
  ACCEPTED: 'Bakıma Alındı',
  INSPECTION: 'Kontrol Ediliyor',
  QUOTE_WAITING: 'Teklif Bekleniyor',
  APPROVED: 'Onaylandı',
  IN_PROGRESS: 'Bakım Devam Ediyor',
  PART_WAITING: 'Parça Bekleniyor',
  QUALITY_CONTROL: 'Kalite Kontrol',
  READY: 'Teslimata Hazır',
  PAYMENT_WAITING: 'Ödeme Bekleniyor',
  DELIVERED: 'Teslim Edildi',
  CANCELLED: 'İptal',
};

function serviceStatus(value) {
  return (
    serviceStatusLabels[value] ||
    value ||
    '-'
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
      phone: '',
    });

  const [deliveryChannel, setDeliveryChannel] =
    useState('WHATSAPP');

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
            : '/customer-portal/access/phone/start',
          {
            method: 'POST',
            body: {
              phone:
                identity.phone,
              channel:
                deliveryChannel,
              ...(fromMaintenanceCard
                ? { qrToken }
                : {}),
            },
          },
        );

      setChallenge(
        result,
      );
      if (
        result.deliveryChannel ===
          'WHATSAPP' &&
        !result.developmentCode
      ) {
        setStep('whatsapp');
        window.open(
          result.whatsappUrl,
          '_blank',
          'noopener,noreferrer',
        );
      } else {
        setStep('otp');
      }
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

  useEffect(() => {
    if (
      step !== 'whatsapp' ||
      !challenge?.challengeId
    ) {
      return undefined;
    }

    let stopped = false;
    let checking = false;
    let completed = false;

    const check = async () => {
      if (
        stopped ||
        checking ||
        completed
      ) {
        return;
      }

      checking = true;
      try {
        const result =
          await portalRequest(
            '/customer-portal/access/whatsapp/status',
            {
              method: 'POST',
              body: {
                challengeId:
                  challenge.challengeId,
                client: 'WEB',
              },
            },
          );

        if (
          !stopped &&
          result.confirmed
        ) {
          completed = true;
          const portalData =
            await portalRequest(
              '/customer-portal/me',
              {
                token: result.token,
              },
            );
          setData(portalData);
          setStep('account');
        }
      } catch (err) {
        if (!stopped) {
          setError(err.message);
        }
      } finally {
        checking = false;
      }
    };

    check();
    const timer =
      window.setInterval(
        check,
        challenge.pollingIntervalMs ||
          2000,
      );

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [step, challenge]);

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
              Servis kaydındaki telefon numaranızı kullanın. T.C. kimlik numarası istenmez.
            </p>

            <form
              onSubmit={start}
              className="customer-portal-form"
            >
              <label>
                Telefon Numarası
                <input
                  inputMode="tel"
                  placeholder="05xx xxx xx xx"
                  value={identity.phone}
                  onChange={(event) =>
                    setIdentity({
                      phone:
                        event.target.value,
                    })
                  }
                  required
                />
              </label>

              <div className="portal-channel-picker">
                <button
                  type="button"
                  className={
                    deliveryChannel ===
                    'WHATSAPP'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setDeliveryChannel(
                      'WHATSAPP',
                    )
                  }
                >
                  WhatsApp — ücretsiz
                </button>

                <button
                  type="button"
                  className={
                    deliveryChannel ===
                    'SMS'
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    setDeliveryChannel(
                      'SMS',
                    )
                  }
                >
                  SMS
                </button>
              </div>

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
                  : deliveryChannel ===
                      'WHATSAPP'
                    ? 'WhatsApp ile Doğrula'
                    : 'SMS Kodu Gönder'}
              </button>
            </form>

            <div className="customer-portal-security">
              Kişisel ve finansal bilgiler, kayıtlı telefon WhatsApp veya SMS ile doğrulanmadan gösterilmez.
            </div>
          </section>
        )}

        {step === 'whatsapp' && (
          <section className="customer-portal-auth-card">
            <span className="platform-kicker">
              WHATSAPP DOĞRULAMA
            </span>

            <h1>Mesajı gönderin</h1>

            <p>
              Açılan WhatsApp ekranındaki hazır mesajı değiştirmeden gönderin. Bu sayfa doğrulamayı otomatik algılayacaktır.
            </p>

            <a
              className="primary-button portal-whatsapp-link"
              href={challenge?.whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp'ı Aç
            </a>

            <div className="customer-portal-security">
              Kod uygulamadan gönderilmez; kayıtlı numaranızdan gelen mesaj doğrulanır. Bu nedenle ücretli OTP mesajı gerekmez.
            </div>

            {error && (
              <div className="page-message error-message">
                {error}
              </div>
            )}
          </section>
        )}

        {step === 'otp' && (
          <section className="customer-portal-auth-card">
            <span className="platform-kicker">
              {deliveryChannel} DOĞRULAMA
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

            {data.currentServiceOrder && (
              <div className="customer-portal-card spaced-card">
                <h3>
                  Servis Durumu
                </h3>

                <div className="customer-portal-grid">
                  <div>
                    <span className="sub-text">
                      İş Emri
                    </span>
                    <strong>
                      {
                        data.currentServiceOrder
                          .orderNumber
                      }
                    </strong>
                  </div>

                  <div>
                    <span className="sub-text">
                      Güncel Durum
                    </span>
                    <strong>
                      {serviceStatus(
                        data.currentServiceOrder
                          .status,
                      )}
                    </strong>
                  </div>

                  <div>
                    <span className="sub-text">
                      Servis KM
                    </span>
                    <strong>
                      {Number(
                        data.currentServiceOrder
                          .mileage ||
                          0,
                      ).toLocaleString(
                        'tr-TR',
                      )}
                    </strong>
                  </div>

                  <div>
                    <span className="sub-text">
                      Tahmini Teslim
                    </span>
                    <strong>
                      {data.currentServiceOrder
                        .estimatedDeliveryAt
                        ? new Date(
                            data.currentServiceOrder
                              .estimatedDeliveryAt,
                          ).toLocaleString(
                            'tr-TR',
                          )
                        : '-'}
                    </strong>
                  </div>
                </div>

                {data.currentServiceOrder
                  .complaint && (
                  <p className="sub-text">
                    Servis kaydı:{' '}
                    {
                      data.currentServiceOrder
                        .complaint
                    }
                  </p>
                )}
              </div>
            )}

            <div className="customer-portal-card spaced-card">
              <h3>
                Yaklaşan Bakımlar
              </h3>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bakım</th>
                      <th>Durum</th>
                      <th>Sonraki KM</th>
                      <th>Tarih</th>
                      <th>Periyot</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(data.maintenancePlans || [])
                      .map((plan) => (
                        <tr key={plan.id}>
                          <td>
                            <strong>
                              {plan.title}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={
                                plan.alertStatus ===
                                'OVERDUE'
                                  ? 'status-badge danger'
                                  : plan.alertStatus ===
                                      'UPCOMING'
                                    ? 'status-badge success'
                                    : 'status-badge'
                              }
                            >
                              {maintenanceStatusLabels[
                                plan.alertStatus
                              ] ||
                                'Planlandı'}
                            </span>
                          </td>

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
                            {[
                              plan.intervalKm
                                ? `${Number(
                                    plan.intervalKm,
                                  ).toLocaleString(
                                    'tr-TR',
                                  )} KM`
                                : '',
                              plan.intervalMonths
                                ? `${plan.intervalMonths} ay`
                                : '',
                            ]
                              .filter(Boolean)
                              .join(' / ') ||
                              '-'}
                          </td>
                        </tr>
                      ))}

                    {!(data.maintenancePlans || [])
                      .length && (
                      <tr>
                        <td colSpan="5">
                          Aktif bakım planı
                          bulunmuyor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="customer-portal-card spaced-card">
              <h3>
                Bakım Geçmişi
              </h3>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Tarih</th>
                      <th>KM</th>
                      <th>Yapılan İşlemler</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(data.maintenanceHistory || [])
                      .map((record) => (
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
                              record.mileage ||
                                0,
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
                              .join(', ') ||
                              record.notes ||
                              'Bakım kaydı'}
                          </td>
                        </tr>
                      ))}

                    {!(data.maintenanceHistory || [])
                      .length && (
                      <tr>
                        <td colSpan="3">
                          Henüz bakım kaydı
                          bulunmuyor.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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

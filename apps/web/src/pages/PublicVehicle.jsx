import {
  useEffect,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';

import api from '../api/client';

const maintenanceStatusLabels = {
  OVERDUE: 'Gecikmiş',
  DUE_SOON: 'Yaklaşıyor',
  UPCOMING: 'Planlandı',
};

function whatsappUrl(phone) {
  if (!phone) {
    return '';
  }

  let digits =
    phone.replace(/\D/g, '');

  if (
    digits.length === 11 &&
    digits.startsWith('0')
  ) {
    digits =
      `90${digits.slice(1)}`;
  }

  if (
    digits.length === 10
  ) {
    digits =
      `90${digits}`;
  }

  return digits
    ? `https://wa.me/${digits}`
    : '';
}

export default function PublicVehicle() {
  const { token } = useParams();

  const [data, setData] =
    useState(null);
  const [error, setError] =
    useState('');

  useEffect(() => {
    api
      .get(
        `/vehicles/qr/${token}`,
      )
      .then((response) => {
        setData(response.data);
      })
      .catch(() => {
        setError(
          'Araç bakım kartı bulunamadı.',
        );
      });
  }, [token]);

  if (error) {
    return (
      <div className="public-page">
        <div className="public-error">
          <h1>Bakım Kartı</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="public-page">
        <div className="public-loading">
          Bakım kartı yükleniyor...
        </div>
      </div>
    );
  }

  const vehicle =
    data.vehicle || data;

  const serviceProvider =
    data.serviceProvider ||
    null;

  const serviceWhatsapp =
    whatsappUrl(
      serviceProvider?.phone,
    );

  const googlePlayHref =
    `/uygulama?store=android&qr=${encodeURIComponent(
      token,
    )}`;

  const appStoreHref =
    `/uygulama?store=ios&qr=${encodeURIComponent(
      token,
    )}`;

  const lastMaintenance =
    data.lastMaintenanceRecord ||
    data.lastMaintenance ||
    vehicle
      .maintenanceRecords?.[0] ||
    null;

  const history =
    data.maintenanceHistory ||
    vehicle.maintenanceRecords ||
    [];

  const plans =
    data.maintenancePlans ||
    vehicle.maintenancePlans ||
    [];

  return (
    <div className="public-page">
      <div className="public-container">
        <div className="public-brand">
          DİJİTAL BAKIM KARTI
        </div>

        {serviceProvider && (
          <div className="public-service-card">
            <div className="public-service-mark">
              {serviceProvider.name
                ?.trim()
                ?.slice(0, 2)
                ?.toUpperCase() ||
                'TB'}
            </div>

            <div className="public-service-copy">
              <span>
                BAKIM KARTINI OLUŞTURAN SERVİS
              </span>
              <strong>
                {serviceProvider.name}
              </strong>

              {serviceProvider.address && (
                <small>
                  {serviceProvider.address}
                </small>
              )}
            </div>

            <div className="public-service-actions">
              {serviceWhatsapp && (
                <a
                  className="public-service-button whatsapp"
                  href={serviceWhatsapp}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              )}

              {serviceProvider.phone && (
                <a
                  className="public-service-button"
                  href={`tel:${serviceProvider.phone}`}
                >
                  Ara
                </a>
              )}
            </div>
          </div>
        )}

        <div className="public-vehicle-card">
          <div>
            <span className="public-label">
              PLAKA
            </span>

            <h1>
              {vehicle.plate || '-'}
            </h1>

            <p>
              {vehicle.brand || ''}{' '}
              {vehicle.model || ''}
            </p>
          </div>

          <div className="public-km">
            <span>Son Kayıtlı KM</span>

            <strong>
              {Number(
                vehicle.mileage || 0,
              ).toLocaleString(
                'tr-TR',
              )}
            </strong>
          </div>
        </div>

        <div className="public-grid">
          <div className="public-info-card">
            <span>Model Yılı</span>
            <strong>
              {vehicle.modelYear ||
                '-'}
            </strong>
          </div>

          <div className="public-info-card">
            <span>Yakıt</span>
            <strong>
              {vehicle.fuelType ||
                '-'}
            </strong>
          </div>

          <div className="public-info-card">
            <span>Şanzıman</span>
            <strong>
              {vehicle.transmission ||
                '-'}
            </strong>
          </div>

          <div className="public-info-card">
            <span>Son Bakım</span>
            <strong>
              {lastMaintenance
                ?.performedAt
                ? new Date(
                    lastMaintenance.performedAt,
                  ).toLocaleDateString(
                    'tr-TR',
                  )
                : '-'}
            </strong>
          </div>
        </div>

        <div className="public-section">
          <h2>Son Bakım Bilgisi</h2>

          {lastMaintenance ? (
            <div className="public-maintenance">
              <div>
                <span>Tarih</span>
                <strong>
                  {new Date(
                    lastMaintenance.performedAt,
                  ).toLocaleDateString(
                    'tr-TR',
                  )}
                </strong>
              </div>

              <div>
                <span>Kilometre</span>
                <strong>
                  {Number(
                    lastMaintenance.mileage ||
                      0,
                  ).toLocaleString(
                    'tr-TR',
                  )}
                </strong>
              </div>

              <div>
                <span>İşlemler</span>
                <strong>
                  {lastMaintenance.items
                    ?.map(
                      (item) =>
                        item.name,
                    )
                    .join(', ') ||
                    '-'}
                </strong>
              </div>
            </div>
          ) : (
            <div className="public-empty">
              Henüz bakım kaydı bulunmuyor.
            </div>
          )}
        </div>

        <div className="public-section">
          <h2>Bakım Geçmişi</h2>

          {history.length > 0 ? (
            <div className="public-plan-list">
              {history.map(
                (record) => (
                  <div
                    className="public-plan"
                    key={record.id}
                  >
                    <div>
                      <strong>
                        {record.items
                          ?.map(
                            (item) =>
                              item.name,
                          )
                          .join(
                            ', ',
                          ) ||
                          'Bakım Kaydı'}
                      </strong>

                      <span>
                        {new Date(
                          record.performedAt,
                        ).toLocaleDateString(
                          'tr-TR',
                        )}
                      </span>
                    </div>

                    <div className="public-plan-km">
                      {Number(
                        record.mileage ||
                          0,
                      ).toLocaleString(
                        'tr-TR',
                      )}{' '}
                      KM
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="public-empty">
              Bakım geçmişi bulunmuyor.
            </div>
          )}
        </div>

        <div className="public-section">
          <h2>Yaklaşan Bakımlar</h2>

          {plans.length > 0 ? (
            <div className="public-plan-list">
              {plans.map(
                (plan) => (
                  <div
                    className="public-plan"
                    key={plan.id}
                  >
                    <div>
                      <strong>
                        {plan.title}
                      </strong>

                      <span>
                        {plan.nextDueDate
                          ? new Date(
                              plan.nextDueDate,
                            ).toLocaleDateString(
                              'tr-TR',
                            )
                          : 'Tarih belirtilmedi'}
                      </span>

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
                    </div>

                    <div className="public-plan-km">
                      {plan.nextDueKm
                        ? `${Number(
                            plan.nextDueKm,
                          ).toLocaleString(
                            'tr-TR',
                          )} KM`
                        : '-'}

                      {plan.remainingKm !==
                        null &&
                      plan.remainingKm !==
                        undefined ? (
                        <span>
                          {plan.remainingKm <= 0
                            ? `${Number(
                                Math.abs(
                                  plan.remainingKm,
                                ),
                              ).toLocaleString(
                                'tr-TR',
                              )} KM geçti`
                            : `Son kayıtlı KM'ye göre ${Number(
                                plan.remainingKm,
                              ).toLocaleString(
                                'tr-TR',
                              )} KM fark var`}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="public-empty">
              Aktif bakım planı bulunmuyor.
            </div>
          )}
        </div>

        <div className="public-app-cta">
          <div className="public-app-cta-icon">
            <span>TB</span>
          </div>

          <div className="public-app-cta-copy">
            <span className="public-app-kicker">
              ARACINIZ HEP YANINIZDA
            </span>

            <h2>
              Aracınızın tüm geçmişini
              uygulamada görün
            </h2>

            <p>
              Geçmiş bakımlarınızı, yaklaşan
              bakım tarihlerini, servis sürecini
              ve aracınıza özel bildirimleri tek
              yerden takip edin.
            </p>

            <div className="public-app-benefits">
              <span>✓ Bakım geçmişi</span>
              <span>✓ Yaklaşan bakım uyarıları</span>
              <span>✓ Servis durumu</span>
              <span>✓ Anlık bildirimler</span>
            </div>

            <a
              className="public-app-cta-button"
              href={`/uygulama?qr=${encodeURIComponent(
                token,
              )}`}
            >
              Aracınızın Geçmişini Uygulamada Görün
              <span aria-hidden="true">→</span>
            </a>

            <div className="public-store-row">
              <a
                className="public-store-link"
                href={googlePlayHref}
              >
                <strong>Google Play</strong>
                <span>Android uygulaması</span>
              </a>

              <a
                className="public-store-link"
                href={appStoreHref}
              >
                <strong>App Store</strong>
                <span>iPhone uygulaması</span>
              </a>
            </div>

            <small>
              Uygulamada servis bildirimleri,
              bakım hatırlatmaları ve periyodik
              kilometre güncelleme talepleri
              alabilirsiniz.
            </small>
          </div>
        </div>

        <div className="public-footer">
          Araç bakım bilgileri servis
          kayıtlarından otomatik
          oluşturulmuştur. Finansal
          bilgiler bu açık kartta
          gösterilmez.
        </div>
      </div>
    </div>
  );
}

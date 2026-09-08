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
            <span>Güncel KM</span>

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
                            : `${Number(
                                plan.remainingKm,
                              ).toLocaleString(
                                'tr-TR',
                              )} KM kaldı`}
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

        <div className="public-section">
          <h2>Araç Sahibine Özel</h2>

          <p className="muted-text">
            Bu QR kod bir dijital bakım kartıdır.
            Bakım geçmişi ve yaklaşan bakım bilgileri
            açık kartta görüntülenir. Kişisel, finansal
            ve özel servis bilgileri için güvenli müşteri
            doğrulaması gerekir.
          </p>

          <div className="action-row">
            <a
              className="primary-link-button"
              href={`/musteri?qr=${encodeURIComponent(
                token,
              )}`}
            >
              Müşteri Paneline Güvenli Giriş
            </a>
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

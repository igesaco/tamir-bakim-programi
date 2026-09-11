import {
  useEffect,
  useState,
} from 'react';
import { useParams } from 'react-router-dom';

import api from '../api/client';

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

  const serviceProvider =
    data.serviceProvider ||
    null;

  const serviceWhatsapp =
    whatsappUrl(
      serviceProvider?.whatsappPhone ||
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

        <div className="public-section">
          <h1>Aracınızın bakım kartı</h1>
          <p>Bakım geçmişi, kilometre, teklifler ve servis durumunu görmek için uygulamada telefonunuzu doğrulayın.</p>
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
              <span>✓ Servis bildirimleri</span>
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

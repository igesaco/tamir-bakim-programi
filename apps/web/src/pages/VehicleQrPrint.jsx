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

  if (digits.length === 10) {
    digits =
      `90${digits}`;
  }

  return digits
    ? `https://wa.me/${digits}`
    : '';
}

export default function VehicleQrPrint() {
  const { id } = useParams();

  const [vehicle, setVehicle] =
    useState(null);
  const [error, setError] =
    useState('');
  const [printMode, setPrintMode] =
    useState('label');

  useEffect(() => {
    api.get(`/vehicles/${id}`)
      .then((response) => {
        setVehicle(response.data);
      })
      .catch((err) => {
        const message =
          err?.response?.data?.message;

        setError(
          Array.isArray(message)
            ? message.join(', ')
            : message ||
                'Araç QR bilgisi yüklenemedi.',
        );
      });
  }, [id]);

  const publicUrl =
    useMemo(() => {
      if (!vehicle?.qrToken) {
        return '';
      }

      return `${window.location.origin}/qr/${vehicle.qrToken}`;
    }, [vehicle]);

  const qrImageUrl =
    useMemo(() => {
      if (!publicUrl) {
        return '';
      }

      return (
        'https://quickchart.io/qr' +
        `?text=${encodeURIComponent(
          publicUrl,
        )}` +
        '&size=420' +
        '&margin=2' +
        '&ecLevel=H'
      );
    }, [publicUrl]);

  const organization =
    vehicle?.organization ||
    null;

  const whatsapp =
    whatsappUrl(
      organization?.phone,
    );

  if (error) {
    return (
      <div className="qr-print-screen">
        <div className="qr-print-sheet">
          <div className="page-message error-message">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="qr-print-screen">
        <div className="qr-print-sheet">
          QR hazırlanıyor...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`qr-print-screen qr-print-mode-${printMode}`}
    >
      <div className="qr-print-toolbar">
        <Link
          className="secondary-button"
          to={`/vehicles/${vehicle.id}`}
        >
          ← Araca Dön
        </Link>

        <div className="qr-print-mode-switch">
          <button
            type="button"
            className={
              printMode === 'label'
                ? 'small-button active'
                : 'small-button'
            }
            onClick={() =>
              setPrintMode('label')
            }
          >
            Etiket
          </button>

          <button
            type="button"
            className={
              printMode === 'a4'
                ? 'small-button active'
                : 'small-button'
            }
            onClick={() =>
              setPrintMode('a4')
            }
          >
            A4 Bilgi Sayfası
          </button>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            window.print()
          }
        >
          {printMode === 'label'
            ? 'Etiketi Yazdır'
            : 'A4 Sayfayı Yazdır'}
        </button>
      </div>

      {printMode === 'label' ? (
        <article className="qr-print-sheet qr-print-label-sheet">
          <div className="qr-label-service">
            {organization?.name ||
              'Tamir Bakım Servisi'}
          </div>

          <div className="qr-print-brand">
            DİJİTAL BAKIM KARTI
          </div>

          {vehicle.qrActive === false ? (
            <div className="page-message error-message">
              Bu aracın QR kartı pasif.
            </div>
          ) : (
            <>
              <div className="qr-print-code qr-label-code">
                <img
                  src={qrImageUrl}
                  alt={`${vehicle.plate} dijital bakım kartı QR kodu`}
                />
              </div>

              <h1>{vehicle.plate}</h1>

              <p className="qr-print-vehicle">
                {vehicle.brand}{' '}
                {vehicle.model}
              </p>

              <h2>
                Bakım geçmişi için QR kodu okutun
              </h2>

              {organization?.phone && (
                <div className="qr-label-contact">
                  {organization.phone}
                </div>
              )}
            </>
          )}
        </article>
      ) : (
        <article className="qr-print-sheet qr-print-a4-sheet">
          <div className="qr-a4-service-head">
            <div>
              <span>
                YETKİLİ SERVİS / TAMİR NOKTASI
              </span>
              <strong>
                {organization?.name ||
                  'Tamir Bakım Servisi'}
              </strong>

              {organization?.address && (
                <small>
                  {organization.address}
                </small>
              )}
            </div>

            <div className="qr-a4-service-contact">
              {organization?.phone && (
                <span>
                  Tel: {organization.phone}
                </span>
              )}

              {organization?.email && (
                <span>
                  {organization.email}
                </span>
              )}
            </div>
          </div>

          <div className="qr-print-brand">
            DİJİTAL BAKIM KARTI
          </div>

          <h1>{vehicle.plate}</h1>

          <p className="qr-print-vehicle">
            {vehicle.brand}{' '}
            {vehicle.model}
            {vehicle.modelYear
              ? ` · ${vehicle.modelYear}`
              : ''}
          </p>

          {vehicle.qrActive === false ? (
            <div className="page-message error-message">
              Bu aracın QR kartı pasif.
            </div>
          ) : (
            <>
              <div className="qr-print-code">
                <img
                  src={qrImageUrl}
                  alt={`${vehicle.plate} dijital bakım kartı QR kodu`}
                />
              </div>

              <h2>
                Aracınızın bakım geçmişini ve yaklaşan bakım bilgilerini görüntüleyin
              </h2>

              <div className="qr-a4-benefits">
                <div>
                  <strong>Bakım Geçmişi</strong>
                  <span>
                    Yapılan işlemleri ve kayıtlı servis kilometrelerini görün.
                  </span>
                </div>

                <div>
                  <strong>Bakım Hatırlatmaları</strong>
                  <span>
                    Mobil uygulamadan periyodik bakım uyarıları alın.
                  </span>
                </div>

                <div>
                  <strong>Servis Takibi</strong>
                  <span>
                    Aracınız servisteyken süreç bildirimlerini takip edin.
                  </span>
                </div>
              </div>

              <div className="qr-a4-actions">
                {whatsapp && (
                  <div>
                    <strong>WhatsApp</strong>
                    <span>
                      {organization.phone}
                    </span>
                  </div>
                )}

                <div>
                  <strong>Google Play</strong>
                  <span>
                    Tamir Bakım müşteri uygulaması
                  </span>
                </div>

                <div>
                  <strong>App Store</strong>
                  <span>
                    Tamir Bakım müşteri uygulaması
                  </span>
                </div>
              </div>

              <p className="qr-print-url">
                {publicUrl}
              </p>

              <div className="qr-print-note">
                QR kartı herkese açık yalnızca araç
                ve bakım bilgilerini gösterir.
                Müşteri adı, telefon ve finansal
                bilgiler bu sayfada yer almaz.
              </div>
            </>
          )}
        </article>
      )}
    </div>
  );
}

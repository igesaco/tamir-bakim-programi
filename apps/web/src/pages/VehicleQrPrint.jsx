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

export default function VehicleQrPrint() {
  const { id } = useParams();
  const [vehicle, setVehicle] =
    useState(null);
  const [error, setError] =
    useState('');

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
        '&size=360' +
        '&margin=2' +
        '&ecLevel=H'
      );
    }, [publicUrl]);

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
    <div className="qr-print-screen">
      <div className="qr-print-toolbar">
        <Link
          className="secondary-button"
          to={`/vehicles/${vehicle.id}`}
        >
          ← Araca Dön
        </Link>

        <button
          className="primary-button"
          onClick={() =>
            window.print()
          }
        >
          QR Kodunu Yazdır
        </button>
      </div>

      <article className="qr-print-sheet">
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
              Aracın bakım geçmişini görüntülemek için QR kodu okutun
            </h2>

            <p className="qr-print-url">
              {publicUrl}
            </p>

            <div className="qr-print-note">
              Bu QR kodu araç sahibine açık
              dijital bakım kartını gösterir.
              Finansal bilgiler ve müşteri
              kişisel bilgileri gösterilmez.
            </div>
          </>
        )}
      </article>
    </div>
  );
}

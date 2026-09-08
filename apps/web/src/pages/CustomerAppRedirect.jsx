import {
  useEffect,
  useMemo,
} from 'react';
import {
  useSearchParams,
} from 'react-router-dom';

function detectPlatform() {
  const userAgent =
    navigator.userAgent ||
    navigator.vendor ||
    '';

  if (
    /android/i.test(
      userAgent,
    )
  ) {
    return 'android';
  }

  if (
    /iPad|iPhone|iPod/.test(
      userAgent,
    )
  ) {
    return 'ios';
  }

  return 'desktop';
}

export default function CustomerAppRedirect() {
  const [searchParams] =
    useSearchParams();

  const qrToken =
    searchParams
      .get('qr')
      ?.trim() || '';

  const requestedStore =
    searchParams
      .get('store')
      ?.trim() || '';

  const platform =
    useMemo(
      detectPlatform,
      [],
    );

  const appScheme = (
    import.meta.env
      .VITE_CUSTOMER_APP_SCHEME ||
    'tamirbakimcustomer'
  ).replace(
    /:\/\/$/,
    '',
  );

  const googlePlayUrl =
    import.meta.env
      .VITE_CUSTOMER_APP_GOOGLE_PLAY_URL
      ?.trim() || '';

  const appStoreUrl =
    import.meta.env
      .VITE_CUSTOMER_APP_APP_STORE_URL
      ?.trim() || '';

  const appDeepLink =
    qrToken
      ? `${appScheme}://bakim-karti?qr=${encodeURIComponent(
          qrToken,
        )}`
      : `${appScheme}://home`;

  const storeUrl =
    requestedStore === 'android'
      ? googlePlayUrl
      : requestedStore === 'ios'
        ? appStoreUrl
        : platform === 'android'
          ? googlePlayUrl
          : platform === 'ios'
            ? appStoreUrl
            : '';

  useEffect(() => {
    if (!storeUrl) {
      return undefined;
    }

    if (
      requestedStore === 'android' ||
      requestedStore === 'ios'
    ) {
      window.location.href =
        storeUrl;

      return undefined;
    }

    if (
      platform ===
        'desktop'
    ) {
      return undefined;
    }

    let fallbackTimer;

    const cancelFallback = () => {
      if (
        document.visibilityState ===
        'hidden'
      ) {
        window.clearTimeout(
          fallbackTimer,
        );
      }
    };

    document.addEventListener(
      'visibilitychange',
      cancelFallback,
    );

    window.location.href =
      appDeepLink;

    fallbackTimer =
      window.setTimeout(
        () => {
          window.location.href =
            storeUrl;
        },
        1400,
      );

    return () => {
      window.clearTimeout(
        fallbackTimer,
      );
      document.removeEventListener(
        'visibilitychange',
        cancelFallback,
      );
    };
  }, [
    appDeepLink,
    platform,
    requestedStore,
    storeUrl,
  ]);

  return (
    <div className="customer-app-page">
      <div className="customer-app-card">
        <div className="customer-app-logo">
          TB
        </div>

        <span className="platform-kicker">
          TAMİR BAKIM MÜŞTERİ
        </span>

        <h1>
          Aracınızı uygulamadan takip edin
        </h1>

        <p>
          Bakım zamanı, servis durumu,
          teslimat ve diğer önemli
          bildirimler Tamir Bakım müşteri
          uygulaması üzerinden size
          gönderilir.
        </p>

        <div className="customer-app-actions">
          <a
            className="primary-link-button"
            href={appDeepLink}
          >
            Uygulamayı Aç
          </a>

          {googlePlayUrl && (
            <a
              className="customer-store-button"
              href={googlePlayUrl}
            >
              <strong>
                Google Play
              </strong>
              <span>
                Android için indir
              </span>
            </a>
          )}

          {appStoreUrl && (
            <a
              className="customer-store-button"
              href={appStoreUrl}
            >
              <strong>
                App Store
              </strong>
              <span>
                iPhone için indir
              </span>
            </a>
          )}
        </div>

        {!googlePlayUrl &&
          !appStoreUrl && (
          <div className="customer-app-note">
            Uygulama mağaza bağlantıları
            henüz tanımlanmadı. Uygulama
            Google Play ve App Store'da
            yayınlandığında bu ekran
            otomatik olarak doğru mağazaya
            yönlendirecek.
          </div>
        )}

        {qrToken && (
          <div className="customer-app-context">
            Dijital bakım kartındaki araç
            mevcut müşteri hesabınız üzerinden
            otomatik olarak açılacaktır. Ayrı
            bir araç eşleştirme işlemi
            gerekmeyecektir.
          </div>
        )}

        <a
          className="customer-app-back"
          href={
            qrToken
              ? `/qr/${encodeURIComponent(
                  qrToken,
                )}`
              : '/'
          }
        >
          ← Dijital Bakım Kartına Dön
        </a>
      </div>
    </div>
  );
}

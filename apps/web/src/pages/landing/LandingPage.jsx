import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import './LandingPage.css';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Navigation State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal State
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('PRO');
  const [leadForm, setLeadForm] = useState({
    name: '',
    shopName: '',
    phone: '',
    city: 'İstanbul',
    volume: '50-100 Araç',
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);

  // Interactive Plate Lookup Simulator State
  const [lookupPlate, setLookupPlate] = useState('34 TAMİR 01');
  const [lookupResult, setLookupResult] = useState({
    plate: '34 TAMİR 01',
    car: 'Fiat Egea 1.3 MultiJet 95 HP Easy (2022)',
    chassis: 'ZFA35600006782910',
    owner: 'Ahmet Karaca (0532 *** ** 14)',
    lastKm: '84.500 KM',
    lastServiceDate: '12 Ocak 2026',
    lastOperations: 'Mobil 1 ESP 5W-30 Yağ + Opar 3\'lü Filtre Seti + Ön Fren Balatası',
    nextKm: '94.500 KM',
    daysLeft: 'Kalan: 1.150 KM / 28 Gün',
    muayeneDate: '18 Kasım 2026',
  });

  function handlePlateSearch(e) {
    e.preventDefault();
    const cleanPlate = lookupPlate.trim().toUpperCase() || '34 TAMİR 01';
    setLookupResult({
      plate: cleanPlate,
      car: cleanPlate.includes('06')
        ? 'Renault Megane IV 1.5 dCi EDC Touch (2021)'
        : cleanPlate.includes('35')
        ? 'Ford Transit Custom 2.0 EcoBlue (2020)'
        : 'Fiat Egea 1.3 MultiJet 95 HP Easy (2022)',
      chassis: 'ZFA35600006' + Math.floor(100000 + Math.random() * 900000),
      owner: 'Hasan Yılmaz (0533 *** ** 88)',
      lastKm: '92.300 KM',
      lastServiceDate: '04 Şubat 2026',
      lastOperations: 'Castrol 5W-30 + Mann Filtre Seti + Triger Kayış Kontrolü + Antifriz (-36°C)',
      nextKm: '102.300 KM',
      daysLeft: 'Kalan: 2.100 KM / 42 Gün',
      muayeneDate: '24 Ekim 2026',
    });
  }

  // Interactive Live Approval Simulator State
  const [repairItems, setRepairItems] = useState([
    { id: 1, name: 'Ön Fren Balatası Takımı (Bosch)', price: 1850, checked: true, note: 'Aşınma sınırı %85, diskleri çizmek üzere' },
    { id: 2, name: 'Motor Yağı 5W-30 Tam Sentetik (Castrol Edge 4L)', price: 1450, checked: true, note: '10.000 KM periyodik dolum' },
    { id: 3, name: 'Yağ, Hava ve Polen Filtre Seti (Mann Filter)', price: 950, checked: true, note: 'Orijinal OEM standart' },
    { id: 4, name: 'V Kayışı & Gergi Rulmanı Değişimi', price: 1200, checked: false, note: 'Usta uyarısı: Kılcal çatlaklar var' },
  ]);
  const [isApprovedDemo, setIsApprovedDemo] = useState(false);

  function toggleRepairItem(id) {
    setRepairItems(items =>
      items.map(item => (item.id === id ? { ...item, checked: !item.checked } : item))
    );
  }

  const approvedTotal = repairItems
    .filter(i => i.checked)
    .reduce((sum, i) => sum + i.price, 0);

  // Active Management Tab State
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'inventory' | 'cashier'

  // Specialty Industry Branch State
  const [activeBranch, setActiveBranch] = useState('mechanic');

  // Targeted Campaign Simulator State
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');

  // ROI Calculator State
  const [monthlyCars, setMonthlyCars] = useState(120);
  const [avgTicket, setAvgTicket] = useState(8500);

  // Pricing Toggle State
  const [billingCycle, setBillingCycle] = useState('yearly');

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  function handleLeadSubmit(e) {
    e.preventDefault();
    setLeadSubmitted(true);
    setTimeout(() => {
      setLeadSubmitted(false);
      setIsDemoModalOpen(false);
    }, 2800);
  }

  const savedHours = Math.round(monthlyCars * 0.45);
  const preventedLoss = Math.round(monthlyCars * avgTicket * 0.06 * 12);
  const returningCustomerGrowth = Math.min(45, Math.round(22 + (monthlyCars / 300) * 20));

  const branchData = {
    mechanic: {
      badge: 'Mekanik & Motor Servisleri',
      title: 'Liftler Boş Beklemesin, Raftan Çıkan Her Parça Fişe Yazılsın',
      desc: 'Motor revizyonundan periyodik bakıma, triger değişiminden alt takıma kadar tüm arıza kalemlerini fotoğraflayın. Müşteri telefonundan tek tıkla onay versin, yedek parçalar depodan otomatik düşsün.',
      bullets: [
        'Ruhsat ve plaka ile 5 saniyede otomatik araç kabulü',
        'Usta bazlı montaj süresi ve yevmiye/prim hakediş tablosu',
        'Toptancı parça maliyeti üzerine otomatik servis kâr marjı',
        'Cama yapışan akıllı QR servis etiketi ile kaçmayan periyodik bakım',
      ],
      previewPlate: 'TR 34 BTM 420',
      previewCar: 'Fiat Egea 1.3 MultiJet (2021)',
      previewJob: '120.000 KM Ağır Bakım & Triger Zinciri Seti',
      previewCost: '14.250 ₺',
      previewBadge: 'Usta: Murat U. (Lift 1)',
    },
    bodywork: {
      badge: 'Kaporta & Fırın Boya Atölyeleri',
      title: 'Hasar Ekspertiz Şeması & Sigorta Evrakları Tek Dosyada',
      desc: '3D araç şeması üzerinden değişen/boyanan parçaları işaretleyin, kasko ve sigorta dosya numaralarını, eksper raporlarını ve kaza fotoğraflarını tek tıkla arşivleyin.',
      bullets: [
        'Görsel araç kaporta hasar işaretleme arayüzü',
        'Sigorta, kasko ve kaza tutanağı evrak yönetimi',
        'Renk kodu (OEM paint code) ve boya sarfiyat takibi',
        'Parça tedarikçisi ve çıkma parça sipariş havuzu',
      ],
      previewPlate: 'TR 06 HAS 402',
      previewCar: 'Renault Megane 1.3 TCe (2021)',
      previewJob: 'Sol Ön Çamurluk Değişim & Kaput Lokal Boya',
      previewCost: '22.800 ₺',
      previewBadge: 'Fırında Kuruyor',
    },
    electric: {
      badge: 'Oto Elektrik & Beyin (ECU)',
      title: 'DTC Arıza Kodları, Akü Test Raporları ve Yazılım Kayıtları',
      desc: 'Diyagnoz cihazından çıkan arıza kodlarını (DTC) doğrudan iş emrine ekleyin. Akü sağlık durumu, alternatör voltaj testleri ve beyin yazılım geçmişi plakayla sonsuza kadar saklansın.',
      bullets: [
        'DTC arıza kodları kütüphanesi ve çözüm önerileri',
        'Akü garanti başlangıcı ve voltaj test kayıtları',
        'Chip tuning, yazılım haritalama ve ECU sürüm arşivi',
        'Tesisat kontrol kontrol listesi ve sigorta şemaları',
      ],
      previewPlate: 'TR 35 ELK 770',
      previewCar: 'BMW 320i M Sport (2020)',
      previewJob: 'CAN-Bus Haberleşme Hatası & Akü Değişimi (AGM 80Ah)',
      previewCost: '9.400 ₺',
      previewBadge: 'Test Sürüşünde',
    },
    tires: {
      badge: 'Lastik & Rot Balans Servisleri',
      title: 'Otel Lastik Deposu, Diş Derinliği & Ebat Takibi',
      desc: 'Müşterilerinizin yazlık/kışlık lastiklerini raf ve sıra numarasıyla otelde saklayın. Sezon başında otomatik WhatsApp lastik değişim randevusu gitsin.',
      bullets: [
        'Dijital lastik oteli raf barkodlama ve emanet fişi',
        '4 teker diş derinliği (mm) ve DOT üretim yılı kaydı',
        'Rot balans tolerans değerleri ve ayar raporu',
        'Mevsim geçişlerinde otomatik toplu WhatsApp çağrısı',
      ],
      previewPlate: 'TR 16 LST 89',
      previewCar: 'Mercedes-Benz C200d (2021)',
      previewJob: '4 Adet Kışlık Lastik Oteli & Balans Ayarı',
      previewCost: '2.400 ₺',
      previewBadge: 'Otele Alındı (Raf C-14)',
    },
    inspection: {
      badge: 'Oto Ekspertiz & Muayene Öncesi',
      title: 'TÜVTÜRK Öncesi 42 Nokta Kontrolü & Detaylı Check-up',
      desc: 'Fren test bandı, süspansiyon, aydınlatma, egzoz emisyon ve alt takım kontrollerini eksiksiz yapın. Araç sahibine renkli PDF ve WhatsApp ekspertiz raporu gönderin.',
      bullets: [
        'TÜVTÜRK muayene standartlarında 42 nokta kontrol formu',
        'Fren sapma yüzdesi ve süspansiyon verimlilik testi',
        'Ağır / Hafif kusur otomatik risk sınıflandırması',
        'QR kodlu dijital ekspertiz onay belgesi',
      ],
      previewPlate: 'TR 34 EXP 910',
      previewCar: 'Ford Focus 1.5 EcoBlue (2019)',
      previewJob: 'TÜVTÜRK Öncesi Genel Check-up & Far Ayarı',
      previewCost: '1.750 ₺',
      previewBadge: 'Kusursuz Geçti',
    },
    detailing: {
      badge: 'Detailing & Seramik Kaplama',
      title: 'Aşama Aşama Öncesi/Sonrası Fotoğraflar ve Garanti Takibi',
      desc: 'Pastacila, seramik kaplama, PPF kaput koruma ve detaylı iç kuaför aşamalarını müşterinize canlı durum linki ile gösterin. Yıllık seramik bakımını kaçırmayın.',
      bullets: [
        'Mikron cinsinden boya kalınlığı (öncesi/sonrası ölçümü)',
        'Seramik kaplama garanti süresi ve periyodik yıkama kuralı',
        'Yüksek çözünürlüklü teslimat fotoğraf galerisi',
        'Paket bazlı randevu ve kurutma süresi planlama',
      ],
      previewPlate: 'TR 34 DTL 55',
      previewCar: 'Volkswagen Passat 2.0 TDI (2022)',
      previewJob: 'Pasta Cila & 5 Yıl Grafen Seramik Kaplama',
      previewCost: '16.000 ₺',
      previewBadge: 'Kürleşme Odasında',
    },
  };

  const currentBranch = branchData[activeBranch];

  return (
    <div className="tamir-dock-landing">
      {/* 🌟 Logged-in user banner */}
      {user && (
        <div
          style={{
            background: 'linear-gradient(90deg, #064e3b, #047857)',
            padding: '7px 16px',
            textAlign: 'center',
            fontSize: '12.5px',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            zIndex: 1100,
            position: 'relative',
          }}
        >
          <span>
            Aktif Giriş: <strong>{user.email || user.name}</strong> ({user.role})
          </span>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#ffffff',
              color: '#064e3b',
              border: 'none',
              padding: '3px 12px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '11px',
              cursor: 'pointer',
            }}
          >
            Yönetim Paneline Git →
          </button>
        </div>
      )}

      {/* 🌟 STICKY HEADER */}
      <header className="tm-header">
        <div className="tm-container">
          <nav className="tm-nav">
            <div className="tm-brand-group">
              <Link to="/" className="tm-brand-logo" aria-label="Tamircim Ana Sayfa">
                <div className="tm-logo-badge">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                </div>
                <div className="tm-logo-text">
                  <span className="tm-brand-name">TAMİRCİM</span>
                  <span className="tm-pro-pill">PRO</span>
                </div>
              </Link>

              <Link to="/musteri" className="tm-portal-link">
                <span>Müşteri Portalı</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            </div>

            <ul className="tm-nav-links">
              <li><a href="#plaka-sorgula" className="tm-nav-link">Plaka Sorgula</a></li>
              <li><a href="#nasil-calisir" className="tm-nav-link">Nasıl Çalışır?</a></li>
              <li><a href="#qr-etiket" className="tm-nav-link">QR Servis Karnesi</a></li>
              <li><a href="#servis-paneli" className="tm-nav-link">Atölye Paneli</a></li>
              <li><a href="#sektorler" className="tm-nav-link">Branşlar</a></li>
              <li><a href="#fiyatlar" className="tm-nav-link">Paketler</a></li>
              <li><a href="#sss" className="tm-nav-link">SSS</a></li>
            </ul>

            <div className="tm-nav-right">
              <div className="tm-lang-pill" title="Türkiye">
                <span className="tm-flag-icon">
                  <svg viewBox="0 0 1200 800" width="18" height="12" style={{ display: 'block' }}>
                    <rect width="1200" height="800" fill="#E30A17" />
                    <circle cx="420" cy="400" r="240" fill="#FFFFFF" />
                    <circle cx="480" cy="400" r="192" fill="#E30A17" />
                    <polygon points="680,400 600,426 630,344 570,400 650,426" fill="#FFFFFF" transform="rotate(-18 640 400)" />
                  </svg>
                </span>
                <span>TR</span>
              </div>

              <Link to="/login" className="tm-btn-ghost">
                Servis Girişi
              </Link>

              <button
                className="tm-btn-cta"
                onClick={() => {
                  setSelectedPlan('PRO');
                  setIsDemoModalOpen(true);
                }}
              >
                <span>Ücretsiz Başla</span>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>

              <button
                className="tm-menu-toggle"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menü"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </button>
            </div>
          </nav>
        </div>

        {mobileMenuOpen && (
          <div className="tm-mobile-drawer">
            <a href="#plaka-sorgula" className="tm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Canlı Plaka Sorgulama</a>
            <a href="#nasil-calisir" className="tm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Nasıl Çalışır?</a>
            <a href="#qr-etiket" className="tm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Akıllı QR Servis Etiketi</a>
            <a href="#servis-paneli" className="tm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Atölye & Lift Paneli</a>
            <a href="#sektorler" className="tm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Sanayi Branşları</a>
            <a href="#fiyatlar" className="tm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Paketler & Fiyat</a>
            <a href="#sss" className="tm-mobile-link" onClick={() => setMobileMenuOpen(false)}>Sıkça Sorulan Sorular</a>
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <Link to="/login" className="tm-btn-plan tm-btn-plan-outline" style={{ height: '42px', flex: 1 }}>
                Servis Girişi
              </Link>
              <button
                className="tm-btn-cta"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsDemoModalOpen(true);
                }}
              >
                Ücretsiz Başla
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 🚀 HERO SECTION (Dark Sanayi Vibe) */}
      <section className="tm-hero-section">
        <div className="tm-glow-orb-center" />
        <div className="tm-glow-orb-corner" />

        <div className="tm-container">
          <div className="tm-hero-grid">
            <div>
              <div className="tm-hero-badge-wrap">
                <div className="tm-hero-badge">
                  <span className="tm-pulse-dot" />
                  <span className="tm-hero-badge-text">🇹🇷 TÜRKİYE SANAYİLERİ İÇİN ÖZEL GELİŞTİRİLDİ • ÇIRAK BİLE KULLANIR</span>
                </div>
              </div>

              <h1 className="tm-hero-title">
                Dükkanda çay soğur,<br />
                <span className="tm-gradient-text">hesap bitmez devrine son.</span>
              </h1>

              <p className="tm-hero-subtitle">
                Ruhsatı kameraya tut 5 saniyede iş emrini aç. WhatsApp'tan müşteriye eski parçanın fotoğrafını at, tek tıkla fiyat onayını al. Raftan çıkan her balatanın, ustanın her kuruş yevmiyesinin hesabı cebinde olsun.
              </p>

              {/* 3 Value Cards */}
              <div className="tm-hero-highlights">
                <div className="tm-highlight-card">
                  <div className="tm-hl-header">
                    <span className="tm-hl-icon">⚡</span>
                    <span className="tm-hl-title">Ruhsatı Tut, İşi Aç</span>
                  </div>
                  <p className="tm-hl-desc">Plaka yazmaya gerek yok, ruhsat karekodunu okut araç anında lifte girsin.</p>
                </div>

                <div className="tm-highlight-card">
                  <div className="tm-hl-header">
                    <span className="tm-hl-icon">📲</span>
                    <span className="tm-hl-title">Fotoğraflı Onay</span>
                  </div>
                  <p className="tm-hl-desc">Eski balatanın resmini çek WhatsApp'tan yolla, müşteri tek tuşla onaylasın.</p>
                </div>

                <div className="tm-highlight-card">
                  <div className="tm-hl-header">
                    <span className="tm-hl-icon">🛡️</span>
                    <span className="tm-hl-title">Sıfır Parça Kaçağı</span>
                  </div>
                  <p className="tm-hl-desc">Depodan çıkan her filtre iş emrine otomatik işlenir, ay sonu zarar sıfırlanır.</p>
                </div>
              </div>

              {/* CTA Row */}
              <div className="tm-hero-actions">
                <button
                  className="tm-btn-hero-primary"
                  onClick={() => {
                    setSelectedPlan('PRO');
                    setIsDemoModalOpen(true);
                  }}
                >
                  <span>Tamircim'i Dükkanımda Başlat</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </button>

                <a href="#plaka-sorgula" className="tm-btn-hero-secondary">
                  <span>Plaka Sorgula (Canlı Demo)</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </a>
              </div>

              <div className="tm-hero-trust">
                <div className="tm-trust-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Ciro komisyonu yok</span>
                </div>
                <div className="tm-trust-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  <span>5 dakikada anında kurulum</span>
                </div>
                <div className="tm-trust-item">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span>Sınırsız araç ve usta kaydı</span>
                </div>
              </div>
            </div>

            {/* Right: Live Workshop Screen */}
            <div className="tm-hero-mockup-wrapper">
              <div className="tm-mockup-outer">
                <div className="tm-mockup-inner">
                  <div className="tm-mockup-topbar">
                    <div className="tm-window-dots">
                      <span className="tm-wdot tm-wdot-red" />
                      <span className="tm-wdot tm-wdot-yellow" />
                      <span className="tm-wdot tm-wdot-green" />
                    </div>
                    <div className="tm-mockup-title">
                      <span className="tm-pulse-dot" style={{ width: '6px', height: '6px' }} />
                      <span>Tamircim Atölye Ekranı</span>
                    </div>
                    <span className="tm-mockup-status-tag">4 LİFT DOLU</span>
                  </div>

                  <div className="tm-mockup-body">
                    <div className="tm-mockup-stats-grid">
                      <div className="tm-mstat-card">
                        <div className="tm-mstat-label">Bugünkü Araç</div>
                        <div className="tm-mstat-val">22</div>
                        <div className="tm-mstat-trend">+%28 bu hafta</div>
                      </div>
                      <div className="tm-mstat-card">
                        <div className="tm-mstat-label">Lift Doluluğu</div>
                        <div className="tm-mstat-val">%100</div>
                        <div className="tm-mstat-trend">4/4 Lift Çalışıyor</div>
                      </div>
                      <div className="tm-mstat-card">
                        <div className="tm-mstat-label">Onay Bekleyen</div>
                        <div className="tm-mstat-val" style={{ color: '#f59e0b' }}>2</div>
                        <div className="tm-mstat-trend tm-mstat-trend-alert">WhatsApp teklifi gitti</div>
                      </div>
                      <div className="tm-mstat-card">
                        <div className="tm-mstat-label">Günlük Kasa</div>
                        <div className="tm-mstat-val" style={{ color: '#34d399' }}>68.400 ₺</div>
                        <div className="tm-mstat-trend">Nakit / POS denk</div>
                      </div>
                    </div>

                    <div className="tm-lift-items">
                      <div className="tm-lift-row">
                        <div className="tm-lift-car-info">
                          <div className="tm-tr-plate">
                            <span className="tm-tr-strip">TR</span>
                            <span className="tm-tr-plate-text">34 BTM 420</span>
                          </div>
                          <div>
                            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '12px' }}>Fiat Egea 1.3 MJet (Lift 1)</div>
                            <span className="tm-car-action">Ön Fren Balatası & Disk Değişimi</span>
                          </div>
                        </div>
                        <span className="tm-lift-badge tm-lift-badge-active">Usta: Murat U. (İşlemde)</span>
                      </div>

                      <div className="tm-lift-row">
                        <div className="tm-lift-car-info">
                          <div className="tm-tr-plate">
                            <span className="tm-tr-strip">TR</span>
                            <span className="tm-tr-plate-text">06 ANK 890</span>
                          </div>
                          <div>
                            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '12px' }}>Renault Megane IV (Lift 2)</div>
                            <span className="tm-car-action">Ağır Bakım & V Kayışı</span>
                          </div>
                        </div>
                        <span className="tm-lift-badge tm-lift-badge-wait">WhatsApp Onayı Bekliyor</span>
                      </div>

                      <div className="tm-lift-row">
                        <div className="tm-lift-car-info">
                          <div className="tm-tr-plate">
                            <span className="tm-tr-strip">TR</span>
                            <span className="tm-tr-plate-text">35 IZM 102</span>
                          </div>
                          <div>
                            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '12px' }}>Ford Transit Custom (Lift 3)</div>
                            <span className="tm-car-action">Enjektör Pul Değişimi & Yağ Kaçağı</span>
                          </div>
                        </div>
                        <span className="tm-lift-badge tm-lift-badge-ready">Test Bitti (Hazır)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tm-floating-qr-tag">
                <div className="tm-qr-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="5" height="5" x="3" y="3" rx="1" />
                    <rect width="5" height="5" x="16" y="3" rx="1" />
                    <rect width="5" height="5" x="3" y="16" rx="1" />
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                    <path d="M21 21v.01" />
                    <path d="M12 7v3a2 2 0 0 1-2 2H7" />
                  </svg>
                </div>
                <div>
                  <div className="tm-qr-tag-title">Karekodlu Araç Servis Etiketi</div>
                  <div className="tm-qr-tag-sub">Ön Cama Yapışır • Müşteriyi Dükkana Bağlar</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🔍 CANLI PLAKA SORGULAMA SİMÜLATÖRÜ */}
      <section id="plaka-sorgula" className="tm-section-white" style={{ background: '#f8fafc', padding: '70px 0' }}>
        <div className="tm-container">
          <div className="tm-section-header" style={{ marginBottom: '28px' }}>
            <span className="tm-badge-primary">CANLI SİMÜLATÖR</span>
            <h2 className="tm-section-title">
              Plakayı yaz, saniyeler içinde<br />
              <span style={{ color: '#10b981' }}>bütün geçmişi önüne getir.</span>
            </h2>
            <p className="tm-section-desc">
              Aşağıdaki kutuya bir plaka yazıp "Sorgula" butonuna basarak Tamircim'in araç hafızasını canlı test edin.
            </p>
          </div>

          <div className="tm-plate-lookup-card">
            <form onSubmit={handlePlateSearch} className="tm-lookup-form">
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  value={lookupPlate}
                  onChange={e => setLookupPlate(e.target.value)}
                  placeholder="Örn: 34 USTA 01 veya 06 ANK 890"
                  className="tm-lookup-input"
                />
              </div>
              <button type="submit" className="tm-lookup-btn">
                <span>Araç Geçmişini Getir</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" x2="16.65" y1="21" y2="16.65" />
                </svg>
              </button>
            </form>

            {lookupResult && (
              <div className="tm-lookup-result">
                <div className="tm-result-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="tm-tr-plate">
                      <span className="tm-tr-strip">TR</span>
                      <span className="tm-tr-plate-text">{lookupResult.plate}</span>
                    </div>
                    <div>
                      <div className="tm-result-car-title">{lookupResult.car}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Şasi: {lookupResult.chassis} • {lookupResult.owner}</div>
                    </div>
                  </div>
                  <span className="tm-pro-pill" style={{ background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                    SİSTEMDE KAYITLI
                  </span>
                </div>

                <div className="tm-result-details-grid">
                  <div className="tm-rdetail-item">
                    <div className="tm-rdetail-label">Son Servis Kilometresi:</div>
                    <div className="tm-rdetail-val">{lookupResult.lastKm}</div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>Tarih: {lookupResult.lastServiceDate}</div>
                  </div>

                  <div className="tm-rdetail-item">
                    <div className="tm-rdetail-label">Gelecek Periyodik Bakım:</div>
                    <div className="tm-rdetail-val" style={{ color: '#059669' }}>{lookupResult.nextKm}</div>
                    <div style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, marginTop: '2px' }}>{lookupResult.daysLeft}</div>
                  </div>

                  <div className="tm-rdetail-item">
                    <div className="tm-rdetail-label">TÜVTÜRK Muayene Tarihi:</div>
                    <div className="tm-rdetail-val">{lookupResult.muayeneDate}</div>
                    <div style={{ fontSize: '10px', color: '#059669', fontWeight: 700, marginTop: '2px' }}>WhatsApp Hatırlatması Aktif</div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', padding: '10px 14px', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '12px', color: '#334155' }}>
                  <strong>🔧 Son Yapılan İşlemler:</strong> {lookupResult.lastOperations}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 🛑 PROBLEM SECTION (Sanayicinin Çilesi) */}
      <section id="problem" className="tm-section-white">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-danger">SANAYİCİNİN GÖRÜNMEYEN 3 BÜYÜK DERT VE ZARARI</span>
            <h2 className="tm-section-title">
              Araç lifte çıkıyor.<br />
              <span style={{ color: '#ef4444' }}>Peki sonra ne oluyor?</span>
            </h2>
            <p className="tm-section-desc">
              Oto servislerinin en büyük kâr kaybı telefon trafiğinde harcanan saatler, iş emrine yazılmadan depodan çıkan parçalar ve servisten çıktıktan sonra unutulan araç sahipleridir.
            </p>
          </div>

          <div className="tm-problems-grid">
            <div className="tm-problem-card">
              <div>
                <div className="tm-prob-top">
                  <div className="tm-prob-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      <line x1="1" x2="23" y1="1" y2="23" />
                    </svg>
                  </div>
                  <span className="tm-prob-num">DERT 01</span>
                </div>
                <h3 className="tm-prob-title">Telefonda 'Kaç para tutar?' pazarlığı & kavga.</h3>
                <p className="tm-prob-desc">
                  Parça fiyatı onaylatmak için müşteriyi 5 kere ararsın, açmaz. Lift saatlerce kilitli kalır. Teslimatta "Ben buna onay vermedim" deyip fatura kırpmaya çalışır.
                </p>
                <div className="tm-prob-bullets">
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>Müşteri telefonda parçayı ve arızayı gözüyle görmez</span>
                  </div>
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>Teslimatta "Ustam çok yazmışsın" tartışması çıkar</span>
                  </div>
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>Günde 2 saat telefonda onay kovalamakla geçer</span>
                  </div>
                </div>
              </div>
              <div className="tm-prob-impact">
                Yazılı ve fotoğraflı onay belgesi olmadığı için hem ustanın hakkı gider hem de lift saatlerce boş bekler.
              </div>
            </div>

            <div className="tm-problem-card">
              <div>
                <div className="tm-prob-top">
                  <div className="tm-prob-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <line x1="2" x2="22" y1="10" y2="10" />
                    </svg>
                  </div>
                  <span className="tm-prob-num">DERT 02</span>
                </div>
                <h3 className="tm-prob-title">Raftan kaybolan yedek parça ve sarf malzemeler.</h3>
                <p className="tm-prob-desc">
                  Çırak veya kalfa depodan balatayı, filtreyi alır, arabaya takar. Aceleyle iş emrine yazmayı unutur. Ay sonu parçacıya 90.000 ₺ borç ödenir, kasada para yoktur.
                </p>
                <div className="tm-prob-bullets">
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>Hangi araca hangi yağ konuldu takibi kaybolur</span>
                  </div>
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>Ustanın yaptığı ek işçilik faturaya yansımaz</span>
                  </div>
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>Toptancı borçları ile tahsilat birbirini tutmaz</span>
                  </div>
                </div>
              </div>
              <div className="tm-prob-impact">
                Oto servislerinin her ay ortalama %6-10 kârı, iş emrine yazılmayan parçalar yüzünden buharlaşır.
              </div>
            </div>

            <div className="tm-problem-card">
              <div>
                <div className="tm-prob-top">
                  <div className="tm-prob-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 19H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.7.7 0 0 1 2 21.286V5a2 2 0 0 1 1.184-1.826" />
                      <path d="m2 2 20 20" />
                    </svg>
                  </div>
                  <span className="tm-prob-num">DERT 03</span>
                </div>
                <h3 className="tm-prob-title">Geri gelmeyen araçlar & yırtılan veresiye defteri.</h3>
                <p className="tm-prob-desc">
                  Araç dükkandan çıktığı an bağ kopar. 10.000 km dolunca hatırlatan olmaz, müşteri başka tamirciye gider. Açık hesap bırakan müşterinin parası defter sayfalarında kaybolur.
                </p>
                <div className="tm-prob-bullets">
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>Periyodik bakım zamanı gelen araç takip edilmez</span>
                  </div>
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>TÜVTÜRK muayenesi yaklaşan araç kaçırılır</span>
                  </div>
                  <div className="tm-prob-bullet">
                    <span className="tm-prob-bullet-dot" />
                    <span>Açık hesap veresiyeler tahsil edilemez</span>
                  </div>
                </div>
              </div>
              <div className="tm-prob-impact">
                Eski müşteriyi elinde tutamayan servis, sürekli yüksek maliyetle dükkana yeni müşteri sokmaya çalışır.
              </div>
            </div>
          </div>

          <div className="tm-arrow-down-divider">
            <span className="tm-arrow-down-text">Çözüm: Bütün Döngüyü Tek Yerde Birleştirmek</span>
            <div className="tm-arrow-bounce">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* 🔄 SECTION: NASIL ÇALIŞIR? */}
      <section id="nasil-calisir" className="tm-section-mint">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">KESİNTİSİZ SANAYİ İŞ AKIŞI</span>
            <h2 className="tm-section-title">
              Tamircim bütün servis döngüsünü<br />
              <span style={{ color: '#10b981' }}>tek yerde birleştirir.</span>
            </h2>
            <p className="tm-section-desc">
              Plaka girişinden toptancı parçasına, WhatsApp onayından ön cam etiketine kadar tüm adımlar tıkır tıkır işler.
            </p>
          </div>

          <div className="tm-steps-grid">
            <div className="tm-step-card tm-step-card-dark">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 01</span>
                  <div className="tm-step-icon-wrap">🚗</div>
                </div>
                <h3 className="tm-step-title">Plaka & Ruhsat Kabul</h3>
                <p className="tm-step-desc">Ruhsatı kameraya tut, 5 saniyede araç marka, model, motor kodu ve önceki kilometre ekrana gelsin.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Giriş yapıldı</span>
                <span className="tm-step-next">Sonraki →</span>
              </div>
            </div>

            <div className="tm-step-card">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 02</span>
                  <div className="tm-step-icon-wrap">📸</div>
                </div>
                <h3 className="tm-step-title">Fotoğraflı Arıza Tespiti</h3>
                <p className="tm-step-desc">Usta liftteyken telefonla aşınan balatayı, patlak körüğü veya damlatan contayı çeker.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Kayıt hazır</span>
                <span className="tm-step-next">Sonraki →</span>
              </div>
            </div>

            <div className="tm-step-card">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 03</span>
                  <div className="tm-step-icon-wrap">💰</div>
                </div>
                <h3 className="tm-step-title">Hızlı Fiyat & Kâr Marjı</h3>
                <p className="tm-step-desc">Toptancı parça maliyeti ve dükkanın işçilik ücreti eklenir, kalem kalem fiyat dökülür.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Teklif çıktı</span>
                <span className="tm-step-next">Sonraki →</span>
              </div>
            </div>

            <div className="tm-step-card">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 04</span>
                  <div className="tm-step-icon-wrap">📲</div>
                </div>
                <h3 className="tm-step-title">WhatsApp Tek Tıkla Onay</h3>
                <p className="tm-step-desc">Müşterinin cebine fotoğraflı link gider. İnceleyip "Onayla"ya basar, hukuki onay elinde olur.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Onaylandı</span>
                <span className="tm-step-next">Sonraki →</span>
              </div>
            </div>

            <div className="tm-step-card">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 05</span>
                  <div className="tm-step-icon-wrap">🛠️</div>
                </div>
                <h3 className="tm-step-title">İş Emri & Usta Ataması</h3>
                <p className="tm-step-desc">Lift kanban panosuna düşer, ilgili ustaya atanır ve yapılan iş ustanın primine işlenir.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Montajda</span>
                <span className="tm-step-next">Sonraki →</span>
              </div>
            </div>

            <div className="tm-step-card">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 06</span>
                  <div className="tm-step-icon-wrap">📦</div>
                </div>
                <h3 className="tm-step-title">Raftan Otomatik Düşüm</h3>
                <p className="tm-step-desc">Takılan filtre ve balata depodan otomatik eksilir. Rafta 2 kutu kalınca sipariş alarmı verir.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Stok güncel</span>
                <span className="tm-step-next">Sonraki →</span>
              </div>
            </div>

            <div className="tm-step-card">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 07</span>
                  <div className="tm-step-icon-wrap">💳</div>
                </div>
                <h3 className="tm-step-title">Kasa, Fatura & Açık Hesap</h3>
                <p className="tm-step-desc">Nakit, POS veya veresiye açık hesap cariye tek tuşla geçer; fiş ve resmi fatura yazdırılır.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Tahsil edildi</span>
                <span className="tm-step-next">Sonraki →</span>
              </div>
            </div>

            <div className="tm-step-card">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 08</span>
                  <div className="tm-step-icon-wrap">🏷️</div>
                </div>
                <h3 className="tm-step-title">Ön Cama Akıllı QR Etiket</h3>
                <p className="tm-step-desc">Aracın ön camına şık servis etiketi yapıştırılır. Müşteri telefonla baktığında tüm geçmişi görür.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Teslim edildi</span>
                <span className="tm-step-next">Sonraki →</span>
              </div>
            </div>

            <div className="tm-step-card tm-step-card-dark">
              <div>
                <div className="tm-step-header">
                  <span className="tm-step-pill">ADIM 09</span>
                  <div className="tm-step-icon-wrap">🔄</div>
                </div>
                <h3 className="tm-step-title">Otomatik Bakım Daveti</h3>
                <p className="tm-step-desc">10.000 km veya 365 gün dolduğunda WhatsApp'tan samimi davet gider, araç tekrar senin dükkanına gelir.</p>
              </div>
              <div className="tm-step-footer">
                <span className="tm-step-status">Sonsuz döngü</span>
                <span className="tm-step-next">Başa Döndü ↺</span>
              </div>
            </div>
          </div>

          <div className="tm-callout-banner">
            <div className="tm-callout-left">
              <div className="tm-callout-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </div>
              <div>
                <h4 className="tm-callout-title">Kayıp Yok. Kaçak Yok. Tek Bir Akış.</h4>
                <p className="tm-callout-desc">
                  Müşteri dükkana girdiği andan sonraki periyodik bakımına kadar tüm usta yevmiyesi, depo stok düşümü ve kasa birbirine bağlanır.
                </p>
              </div>
            </div>

            <a href="#qr-etiket" className="tm-btn-cta" style={{ flexShrink: 0 }}>
              <span>QR Etiketi İncele</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* 🏷️ SECTION: QR ETİKET & FİZİKSEL ENTEGRASYON */}
      <section id="qr-etiket" className="tm-section-white">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">ÖN CAM SERVİS ETİKETİ</span>
            <h2 className="tm-section-title">
              İlk temas fiziksel.<br />
              <span style={{ color: '#10b981' }}>Devamı dijital.</span>
            </h2>
            <p className="tm-section-desc">
              Torpido gözünde kaybolan, ıslanan kağıt bakım kartlarına son. Cama yapışan şık QR etiketle müşteri başka dükkan aramaz.
            </p>
          </div>

          <div className="tm-qr-grid">
            <div className="tm-qr-visual-card">
              <div className="tm-qr-visual-glow" />

              <div className="tm-qr-card-top">
                <span className="tm-pro-pill">ÖN CAM SERVİS ETİKETİ</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>UV KORUMALI & DAYANIKLI</span>
              </div>

              <div className="tm-qr-sticker-mockup">
                <div className="tm-big-qr-box">
                  <svg width="78" height="78" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="6" height="6" x="3" y="3" rx="1" />
                    <rect width="6" height="6" x="15" y="3" rx="1" />
                    <rect width="6" height="6" x="3" y="15" rx="1" />
                    <path d="M21 15h-3a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4" />
                    <path d="M10 3h4" />
                    <path d="M10 7h4" />
                    <path d="M10 11h4" />
                    <path d="M3 11h4" />
                    <path d="M17 11h4" />
                  </svg>
                </div>
                <div className="tm-sticker-details">
                  <span className="tm-sticker-brand">TAMİRCİM OTO BAKIM KARNESİ</span>
                  <div className="tm-tr-plate" style={{ alignSelf: 'flex-start' }}>
                    <span className="tm-tr-strip">TR</span>
                    <span className="tm-tr-plate-text">34 BTM 420</span>
                  </div>
                  <span className="tm-sticker-note">Güneşten Solmaz • Su Geçirmez • İze Bırakmaz</span>
                  <span style={{ fontSize: '11px', color: '#34d399', fontWeight: 800, marginTop: '4px' }}>
                    Sonraki Bakım: 94.500 KM (Mobil 1 5W-30)
                  </span>
                </div>
              </div>

              <div className="tm-live-scans-feed">
                <div className="tm-feed-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="tm-pulse-dot" style={{ width: '6px', height: '6px' }} />
                    <span>Son Taranan Araçlar</span>
                  </div>
                  <span style={{ color: '#94a3b8', fontSize: '10px' }}>Canlı Akış</span>
                </div>

                <div className="tm-feed-item">
                  <span className="tm-feed-plate">34 BTM 420 — Fiat Egea</span>
                  <span className="tm-feed-time">1 dk önce (Müşteri Baktı)</span>
                </div>
                <div className="tm-feed-item">
                  <span className="tm-feed-plate">06 ANK 890 — Renault Megane</span>
                  <span className="tm-feed-time">12 dk önce (Usta Okuttu)</span>
                </div>
                <div className="tm-feed-item">
                  <span className="tm-feed-plate">35 IZM 102 — Ford Transit</span>
                  <span className="tm-feed-time">38 dk önce (Muayene Uyarısı)</span>
                </div>
              </div>
            </div>

            <div className="tm-qr-steps-list">
              <div className="tm-qr-step-item">
                <div className="tm-qr-step-num">1</div>
                <div>
                  <h4 className="tm-qr-step-title">Aracın Ön Camına Yapıştırılır</h4>
                  <p className="tm-qr-step-desc">Bakım bittiğinde aracın sol ön camına kaliteli, güneşten solmayan şık Tamircim QR servis etiketi yapıştırılır.</p>
                </div>
              </div>

              <div className="tm-qr-step-item">
                <div className="tm-qr-step-num">2</div>
                <div>
                  <h4 className="tm-qr-step-title">Kamera ile Anında Okunur</h4>
                  <p className="tm-qr-step-desc">Müşterinin uygulama indirmesine gerek yoktur. Telefon kamerasını tuttuğu an aracının dijital karnesi açılır.</p>
                </div>
              </div>

              <div className="tm-qr-step-item">
                <div className="tm-qr-step-num">3</div>
                <div>
                  <h4 className="tm-qr-step-title">Bütün Bakım Geçmişi Dökülür</h4>
                  <p className="tm-qr-step-desc">Hangi tarihte hangi yağ konuldu, balata kaç kilometrede değişti, hangi usta baktı şeffafça listelenir.</p>
                </div>
              </div>

              <div className="tm-qr-step-item">
                <div className="tm-qr-step-num">4</div>
                <div>
                  <h4 className="tm-qr-step-title">Gelecek Bakım & Muayene Sayacı</h4>
                  <p className="tm-qr-step-desc">Sonraki periyodik bakıma kaç kilometre kaldığı ve TÜVTÜRK muayene bitiş tarihi otomatik hesaplanır.</p>
                </div>
              </div>

              <div className="tm-qr-step-item">
                <div className="tm-qr-step-num">5</div>
                <div>
                  <h4 className="tm-qr-step-title">Dükkanınıza Tek Tuşla Ulaşır</h4>
                  <p className="tm-qr-step-desc">Müşteri karneden tek tıkla servisinizi arayabilir, WhatsApp'tan yazabilir veya bakım randevusu alabilir.</p>
                </div>
              </div>

              <div className="tm-qr-step-item">
                <div className="tm-qr-step-num">6</div>
                <div>
                  <h4 className="tm-qr-step-title">İkinci El Satışında Güven Kazandırır</h4>
                  <p className="tm-qr-step-desc">Aracını satarken alıcıya dükkanınızın kayıtlı karnesini gösterir; aracın değeri ve servisinize olan sadakat artar.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📱 SECTION: WHATSAPP TRANSPARENT APPROVAL */}
      <section className="tm-section-white" style={{ background: '#f8fafc' }}>
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">TELEFON TRAFİĞİNE VE KAVGAYA SON</span>
            <h2 className="tm-section-title">
              Müşteriye fotoğraflı teklif atın,<br />
              <span style={{ color: '#10b981' }}>onayı WhatsApp'tan saniyede alın.</span>
            </h2>
            <p className="tm-section-desc">
              Telefonda "Ustam ne kadara biter?", kapıda "Ben bu fiyata dememiştim" tartışması tarihe karışıyor.
            </p>
          </div>

          <div className="tm-approval-grid">
            <div className="tm-interactive-phone-card">
              <div className="tm-phone-header">
                <div className="tm-phone-brand-info">
                  <div className="tm-service-avatar">TB</div>
                  <div>
                    <div className="tm-phone-title">Yıldız Oto Mekanik & Bakım</div>
                    <div className="tm-phone-subtitle">İş Emri #9402 • Fiat Egea 1.3 MJet</div>
                  </div>
                </div>
                <div className="tm-tr-plate" style={{ fontSize: '10px' }}>
                  <span className="tm-tr-strip">TR</span>
                  <span className="tm-tr-plate-text">34 BTM 420</span>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '14px' }}>
                Değişecek parçaları inceleyip onaylayabilir veya iptal etmek istediğiniz kalemi kaldırabilirsiniz:
              </div>

              <div className="tm-repair-items-list">
                {repairItems.map(item => (
                  <div
                    key={item.id}
                    className={`tm-repair-row ${item.checked ? 'selected' : ''}`}
                    onClick={() => toggleRepairItem(item.id)}
                  >
                    <div className="tm-repair-checkbox">
                      <div className="tm-check-box-icon">
                        {item.checked && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <div>{item.name}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{item.note}</div>
                      </div>
                    </div>
                    <span className="tm-repair-price">{item.price.toLocaleString('tr-TR')} ₺</span>
                  </div>
                ))}
              </div>

              <div className="tm-repair-total-bar">
                <span>Onaylanan Toplam Fiyat:</span>
                <span className="tm-total-amount">{approvedTotal.toLocaleString('tr-TR')} ₺</span>
              </div>

              {!isApprovedDemo ? (
                <button
                  className="tm-btn-approve-demo"
                  onClick={() => setIsApprovedDemo(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>[ Teklifi Onaylıyorum • Montaja Başlayın ]</span>
                </button>
              ) : (
                <div className="tm-approved-feedback">
                  ✓ Tebrikler! Müşteri onay verdi. Ustanın tabletine "Montaja Başla" bildirimi düştü.
                  <button
                    onClick={() => setIsApprovedDemo(false)}
                    style={{
                      display: 'block',
                      margin: '6px auto 0',
                      background: 'transparent',
                      border: 'none',
                      color: '#047857',
                      fontSize: '11px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                    }}
                  >
                    Simülatörü Sıfırla
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                    1
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>
                    Liftler Saatlerce Boş Beklemez
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                  Müşteri toplantıda bile olsa WhatsApp linkine tıklar. Değişecek parçayı, eski parçanın fotoğrafını ve net fiyatı görerek 10 saniyede onay verir.
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                    2
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>
                    İtiraz Edilemeyen Hukuki İzin
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                  Müşterinin onay verdiği saat, IP adresi ve seçtiği kalemler sisteme dijital imza olarak kaydedilir. Teslimatta hiçbir itiraz veya tartışma yaşanmaz.
                </p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '22px', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                    3
                  </div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>
                    Usta ve Parça Otomatik Başlar
                  </h4>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
                  Onay geldiği an depocunun ekranına parça çıkışı düşer, usta montaja başlar. Bekleme olmadan araç gün içinde teslim edilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💻 SECTION: BULUT SERVİS & ATÖLYE ERP PANELİ (Dark) */}
      <section id="servis-paneli" className="tm-section-dark">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">ATÖLYE YÖNETİM & ERP PANELİ</span>
            <h2 className="tm-section-title" style={{ color: '#ffffff' }}>
              Dükkanınızı tek ekrandan<br />
              <span className="tm-gradient-text">usta titizliğiyle yönetin.</span>
            </h2>
            <p className="tm-section-desc" style={{ color: '#94a3b8' }}>
              Bilgisayardan, dükkandaki tabletten veya ustanın cep telefonundan her şey kontrol altında.
            </p>
          </div>

          <div className="tm-tab-buttons-row">
            <button
              className={`tm-panel-tab-btn ${activeTab === 'kanban' ? 'active' : ''}`}
              onClick={() => setActiveTab('kanban')}
            >
              <span>🚗</span>
              <span>Lift & Atölye Kanbanı</span>
            </button>

            <button
              className={`tm-panel-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <span>📦</span>
              <span>Yedek Parça & Depo Takibi</span>
            </button>

            <button
              className={`tm-panel-tab-btn ${activeTab === 'cashier' ? 'active' : ''}`}
              onClick={() => setActiveTab('cashier')}
            >
              <span>💰</span>
              <span>Kasa, Veresiye & Usta Yevmiyesi</span>
            </button>
          </div>

          <div className="tm-panel-preview-box">
            <div className="tm-preview-topbar">
              <div className="tm-window-dots">
                <span className="tm-wdot tm-wdot-red" />
                <span className="tm-wdot tm-wdot-yellow" />
                <span className="tm-wdot tm-wdot-green" />
              </div>
              <span className="tm-preview-url">panel.tamircim.com/{activeTab}</span>
              <div className="tm-preview-live-tag">
                <span className="tm-pulse-dot" style={{ width: '6px', height: '6px' }} />
                <span>Canlı Sanayi Paneli</span>
              </div>
            </div>

            <div className="tm-preview-canvas">
              {activeTab === 'kanban' && (
                <div className="tm-kanban-cols">
                  <div className="tm-kcol">
                    <div className="tm-kcol-header">
                      <span>DÜKKANA GİRENLER (3)</span>
                      <span className="tm-kcol-count">Kabul</span>
                    </div>
                    <div className="tm-kcard">
                      <div className="tm-tr-plate tm-kcard-plate">
                        <span className="tm-tr-strip">TR</span>
                        <span className="tm-tr-plate-text">34 BTM 420</span>
                      </div>
                      <div className="tm-kcard-task">Passat 2.0 TDI • Yağ kaçağı ve ses</div>
                      <div className="tm-kcard-foot">
                        <span className="tm-kcard-tech">Kabul: Erkan U.</span>
                        <span className="tm-kcard-cost">Ekspertiz</span>
                      </div>
                    </div>
                    <div className="tm-kcard">
                      <div className="tm-tr-plate tm-kcard-plate">
                        <span className="tm-tr-strip">TR</span>
                        <span className="tm-tr-plate-text">41 KCL 90</span>
                      </div>
                      <div className="tm-kcard-task">Clio V 1.0 TCe • 60.000 Bakım</div>
                      <div className="tm-kcard-foot">
                        <span className="tm-kcard-tech">Kabul: Erkan U.</span>
                        <span className="tm-kcard-cost">Sıra Bekliyor</span>
                      </div>
                    </div>
                  </div>

                  <div className="tm-kcol">
                    <div className="tm-kcol-header">
                      <span>LİFTTEKİLER (4)</span>
                      <span className="tm-kcol-count" style={{ background: '#10b981' }}>Lift</span>
                    </div>
                    <div className="tm-kcard" style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}>
                      <div className="tm-tr-plate tm-kcard-plate">
                        <span className="tm-tr-strip">TR</span>
                        <span className="tm-tr-plate-text">06 ANK 890</span>
                      </div>
                      <div className="tm-kcard-task">Megane IV • Ön Disk & Balata</div>
                      <div className="tm-kcard-foot">
                        <span className="tm-kcard-tech">Usta: Murat U.</span>
                        <span className="tm-kcard-cost">4.250 ₺</span>
                      </div>
                    </div>
                    <div className="tm-kcard">
                      <div className="tm-tr-plate tm-kcard-plate">
                        <span className="tm-tr-strip">TR</span>
                        <span className="tm-tr-plate-text">35 IZM 102</span>
                      </div>
                      <div className="tm-kcard-task">BMW 320d • Triger Zincir Seti</div>
                      <div className="tm-kcard-foot">
                        <span className="tm-kcard-tech">Usta: Hasan U.</span>
                        <span className="tm-kcard-cost">18.500 ₺</span>
                      </div>
                    </div>
                  </div>

                  <div className="tm-kcol">
                    <div className="tm-kcol-header">
                      <span>PARÇA BEKLEYEN (2)</span>
                      <span className="tm-kcol-count" style={{ background: '#f59e0b' }}>Sipariş</span>
                    </div>
                    <div className="tm-kcard" style={{ borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                      <div className="tm-tr-plate tm-kcard-plate">
                        <span className="tm-tr-strip">TR</span>
                        <span className="tm-tr-plate-text">16 BUR 77</span>
                      </div>
                      <div className="tm-kcard-task">Audi A4 • Sol Aks Kafası & Körük</div>
                      <div className="tm-kcard-foot">
                        <span className="tm-kcard-tech">Martaş Oto Tedarik</span>
                        <span className="tm-kcard-cost">Yolda</span>
                      </div>
                    </div>
                  </div>

                  <div className="tm-kcol">
                    <div className="tm-kcol-header">
                      <span>TESLİME HAZIR (5)</span>
                      <span className="tm-kcol-count" style={{ background: '#3b82f6' }}>Hazır</span>
                    </div>
                    <div className="tm-kcard" style={{ borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                      <div className="tm-tr-plate tm-kcard-plate">
                        <span className="tm-tr-strip">TR</span>
                        <span className="tm-tr-plate-text">34 EXP 910</span>
                      </div>
                      <div className="tm-kcard-task">Ford Transit • 90.000 Bakım + Yıkama</div>
                      <div className="tm-kcard-foot">
                        <span className="tm-kcard-tech">Etiket Yapıştırıldı</span>
                        <span className="tm-kcard-cost">7.800 ₺</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800 }}>Dükkan Raf Stoğu (1.420 Kalem)</div>
                    <span className="tm-pro-pill">KRİTİK STOK ALARMI AKTİF</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>OEM NO</th>
                        <th style={{ padding: '8px' }}>ÜRÜN & MARKA</th>
                        <th style={{ padding: '8px' }}>MEVCUT ADET</th>
                        <th style={{ padding: '8px' }}>TOPTANCI ALIŞ</th>
                        <th style={{ padding: '8px' }}>MÜŞTERİ SATIŞ</th>
                        <th style={{ padding: '8px' }}>DURUM</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>0986424797</td>
                        <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 700 }}>Ön Fren Balatası (Bosch)</td>
                        <td style={{ padding: '10px 8px' }}>14 Takım</td>
                        <td style={{ padding: '10px 8px' }}>1.150 ₺</td>
                        <td style={{ padding: '10px 8px', color: '#34d399', fontWeight: 800 }}>1.850 ₺</td>
                        <td style={{ padding: '10px 8px' }}><span style={{ color: '#34d399' }}>Rafta Var</span></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>HU7020Z</td>
                        <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 700 }}>Yağ Filtresi (Mann Filter)</td>
                        <td style={{ padding: '10px 8px', color: '#f59e0b', fontWeight: 800 }}>2 Adet (Kritik)</td>
                        <td style={{ padding: '10px 8px' }}>180 ₺</td>
                        <td style={{ padding: '10px 8px', color: '#34d399', fontWeight: 800 }}>350 ₺</td>
                        <td style={{ padding: '10px 8px' }}><span style={{ color: '#f59e0b' }}>Sipariş Verilmeli</span></td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px 8px', fontFamily: 'monospace' }}>EDGE-5W30</td>
                        <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 700 }}>Castrol Edge 5W-30 (4L)</td>
                        <td style={{ padding: '10px 8px' }}>28 Teneke</td>
                        <td style={{ padding: '10px 8px' }}>920 ₺</td>
                        <td style={{ padding: '10px 8px', color: '#34d399', fontWeight: 800 }}>1.450 ₺</td>
                        <td style={{ padding: '10px 8px' }}><span style={{ color: '#34d399' }}>Stokta Var</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'cashier' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '16px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Bugünkü Kasa Cirosu</div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#34d399', fontFamily: 'monospace' }}>68.400 ₺</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Nakit: 24.000 ₺ • POS: 44.400 ₺</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Net Parça & İşçilik Kârı</div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>%38.2</div>
                      <div style={{ fontSize: '11px', color: '#34d399', marginTop: '2px' }}>+26.100 ₺ brüt kâr</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Usta Hakedişleri & Primler</div>
                      <div style={{ fontSize: '24px', fontWeight: 900, color: '#60a5fa', fontFamily: 'monospace' }}>9.800 ₺</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>4 Usta • İşçilik puanına göre</div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: '#e2e8f0' }}>
                      ⚡ <strong>Veresiye & Açık Hesap Koruması:</strong> Hangi müşterinin ne kadar borcu kaldığı, hangi toptancıya ne ödeneceği tek tuşla dökülür; unutulan para kalmaz.
                    </span>
                    <span style={{ color: '#34d399', fontWeight: 800 }}>Kasa Raporunu WhatsApp'a At →</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 🏎️ SECTION: SEKTÖRE ÖZEL UZMAN MODÜLLER */}
      <section id="sektorler" className="tm-section-branches">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">SANAYİ BRANŞLARINA ÖZEL EKRANLAR</span>
            <h2 className="tm-section-title" style={{ color: '#ffffff' }}>
              Atölyenizin branşı ne olursa olsun,<br />
              <span className="tm-gradient-text">Tamircim tam dükkanına göre.</span>
            </h2>
            <p className="tm-section-desc" style={{ color: '#94a3b8' }}>
              Kaportacının ihtiyacı ile mekanikçinin ihtiyacı bir değildir. Branşını seç, Tamircim ekranlarının nasıl uyarlandığını gör.
            </p>
          </div>

          <div className="tm-branch-btns-row">
            <button className={`tm-branch-btn ${activeBranch === 'mechanic' ? 'active' : ''}`} onClick={() => setActiveBranch('mechanic')}>
              <span>🔧</span>
              <span>Mekanik & Motor</span>
            </button>
            <button className={`tm-branch-btn ${activeBranch === 'bodywork' ? 'active' : ''}`} onClick={() => setActiveBranch('bodywork')}>
              <span>🚗</span>
              <span>Kaporta & Fırın Boya</span>
            </button>
            <button className={`tm-branch-btn ${activeBranch === 'electric' ? 'active' : ''}`} onClick={() => setActiveBranch('electric')}>
              <span>⚡</span>
              <span>Oto Elektrik & Beyin</span>
            </button>
            <button className={`tm-branch-btn ${activeBranch === 'tires' ? 'active' : ''}`} onClick={() => setActiveBranch('tires')}>
              <span>🛞</span>
              <span>Lastik Oteli & Balans</span>
            </button>
            <button className={`tm-branch-btn ${activeBranch === 'inspection' ? 'active' : ''}`} onClick={() => setActiveBranch('inspection')}>
              <span>🔍</span>
              <span>Ekspertiz & Muayene</span>
            </button>
            <button className={`tm-branch-btn ${activeBranch === 'detailing' ? 'active' : ''}`} onClick={() => setActiveBranch('detailing')}>
              <span>✨</span>
              <span>Detailing & Seramik</span>
            </button>
          </div>

          <div className="tm-branch-content-box">
            <div>
              <span className="tm-branch-badge">{currentBranch.badge}</span>
              <h3 className="tm-branch-title">{currentBranch.title}</h3>
              <p className="tm-branch-desc">{currentBranch.desc}</p>

              <div className="tm-branch-bullets">
                {currentBranch.bullets.map((b, idx) => (
                  <div key={idx} className="tm-branch-bullet-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="16 9 10 15 8 13" />
                    </svg>
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <button
                className="tm-btn-cta"
                onClick={() => {
                  setSelectedPlan('PRO');
                  setIsDemoModalOpen(true);
                }}
              >
                <span>{currentBranch.badge} İçin Başlat</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>
            </div>

            <div>
              <div className="tm-phone-frame-mockup">
                <div className="tm-phone-notch" />
                <div className="tm-phone-inner-screen">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 900, color: '#10b981' }}>CANLI İŞ EMRİ</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>14:32</span>
                  </div>

                  <div style={{ background: '#f1f5f9', borderRadius: '12px', padding: '12px', marginBottom: '10px' }}>
                    <div className="tm-tr-plate" style={{ marginBottom: '6px' }}>
                      <span className="tm-tr-strip">TR</span>
                      <span className="tm-tr-plate-text">{currentBranch.previewPlate.replace('TR ', '')}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#334155', fontWeight: 800 }}>
                      {currentBranch.previewCar}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px' }}>Yapılan İşlem:</div>
                  <div style={{ background: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px', fontSize: '11px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                    {currentBranch.previewJob}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #e2e8f0', marginTop: 'auto' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>İşlem Tutarı</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>
                        {currentBranch.previewCost}
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#047857' }}>
                      {currentBranch.previewBadge}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 📊 ROI CALCULATOR */}
      <section id="hesaplayici" className="tm-section-mint">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">KAZANÇ VE ZARAR ÖNLEME HESABI</span>
            <h2 className="tm-section-title">
              Tamircim dükkanına<br />
              <span style={{ color: '#10b981' }}>ayda ne kazandırır?</span>
            </h2>
            <p className="tm-section-desc">
              Dükkanına ayda giren araç sayısını kaydır; kaçak parçalardan önlenen yıllık zararı ve kurtarılan usta saatlerini gör.
            </p>
          </div>

          <div className="tm-calc-box">
            <div className="tm-calc-grid">
              <div>
                <div className="tm-slider-group">
                  <div className="tm-slider-header">
                    <span className="tm-slider-label">Aylık Servise Giren Araç Sayısı:</span>
                    <span className="tm-slider-val">{monthlyCars} Araç</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="400"
                    step="10"
                    value={monthlyCars}
                    onChange={e => setMonthlyCars(Number(e.target.value))}
                    className="tm-calc-slider"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                    <span>20 Araç</span>
                    <span>200 Araç</span>
                    <span>400 Araç</span>
                  </div>
                </div>

                <div className="tm-slider-group">
                  <div className="tm-slider-header">
                    <span className="tm-slider-label">Ortalama İş Emri Tutarı:</span>
                    <span className="tm-slider-val">{avgTicket.toLocaleString('tr-TR')} ₺</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="30000"
                    step="500"
                    value={avgTicket}
                    onChange={e => setAvgTicket(Number(e.target.value))}
                    className="tm-calc-slider"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                    <span>2.000 ₺</span>
                    <span>15.000 ₺</span>
                    <span>30.000 ₺</span>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                  * Sanayi ortalamalarında fişe yazılmayan parçalar (balata, yağ, klips, sprey) cironun %6'sını eritir. Tamircim ile bu kayıp tamamen sıfırlanır.
                </p>
              </div>

              <div className="tm-calc-results">
                <div className="tm-cresult-item">
                  <span className="tm-cresult-label">Yıllık Önlenen Parça & İşçilik Kaçağı:</span>
                  <span className="tm-cresult-num tm-cresult-highlight">
                    {preventedLoss.toLocaleString('tr-TR')} ₺
                  </span>
                </div>

                <div className="tm-cresult-item">
                  <span className="tm-cresult-label">Aylık Kurtarılan Telefon & Onay Saati:</span>
                  <span className="tm-cresult-num">
                    {savedHours} Saat / Ay
                  </span>
                </div>

                <div className="tm-cresult-item">
                  <span className="tm-cresult-label">Geri Dönen Periyodik Bakım Artışı:</span>
                  <span className="tm-cresult-num tm-cresult-highlight">
                    +%{returningCustomerGrowth}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏷️ SECTION: FİYATLAR */}
      <section id="fiyatlar" className="tm-section-white">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">SANAYİCİ USULÜ ŞEFFAF FİYAT</span>
            <h2 className="tm-section-title">
              Kafa karıştırmak yok.<br />
              <span style={{ color: '#10b981' }}>Net, sürprizsiz paketler.</span>
            </h2>
            <p className="tm-section-desc">
              Cirodan yüzde almak yok. Gizli fatura yok. 14 gün bedava dene, memnun kalmazsan tek kuruş ödeme.
            </p>
          </div>

          <div className="tm-billing-toggle-row">
            <div className="tm-toggle-pill">
              <button
                className={`tm-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('monthly')}
              >
                Aylık Ödeme
              </button>
              <button
                className={`tm-toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                onClick={() => setBillingCycle('yearly')}
              >
                Yıllık Ödeme
              </button>
            </div>
            <span className="tm-discount-badge">%20 İndirimli</span>
          </div>

          <div className="tm-pricing-grid">
            <div className="tm-price-card">
              <div>
                <div className="tm-plan-category">Tek Atölye & Butik Dükkan</div>
                <h3 className="tm-plan-title">ATÖLYE BAŞLANGIÇ</h3>
                <p className="tm-plan-desc">
                  Küçük dükkanlar için temel araç kabul, iş emri ve parça stok takibi.
                </p>

                <div className="tm-price-amount-row">
                  <span className="tm-price-number">
                    {billingCycle === 'yearly' ? '450 ₺' : '550 ₺'}
                  </span>
                  <span className="tm-price-period">/ ay</span>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '14px' }}>
                  Yıllık ödemede 2 ay dükkandan hediye
                </div>

                <div className="tm-plan-features">
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span>Sınırsız Plaka ve Araç Kaydı</span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span>Dijital İş Emri & Usta Ataması</span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span>Yedek Parça & Raf Stok Takibi</span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span>Kasa, Fiş ve Fatura Kayıtları</span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span>2 Kullanıcı Girişi</span>
                  </div>
                </div>
              </div>

              <button
                className="tm-btn-plan tm-btn-plan-outline"
                onClick={() => {
                  setSelectedPlan('ATOLYE');
                  setIsDemoModalOpen(true);
                }}
              >
                <span>Atölye Paketini Başlat</span>
                <span>→</span>
              </button>
            </div>

            <div className="tm-price-card tm-price-card-pro">
              <span className="tm-recommended-badge">SANAYİNİN TERCİHİ</span>

              <div>
                <div className="tm-plan-category">Tam Kapsamlı Dijital Servis</div>
                <h3 className="tm-plan-title">TAMİRCİM PRO</h3>
                <p className="tm-plan-desc">
                  Fotoğraflı WhatsApp onayı, cama yapışan akıllı QR etiketler ve usta primleri dahil.
                </p>

                <div className="tm-price-amount-row">
                  <span className="tm-price-number">
                    {billingCycle === 'yearly' ? '790 ₺' : '950 ₺'}
                  </span>
                  <span className="tm-price-period">/ ay</span>
                </div>
                <div style={{ fontSize: '11px', color: '#34d399', marginBottom: '14px', fontWeight: 800 }}>
                  100 Adet Ön Cam QR Servis Etiketi Pakete Dahil
                </div>

                <div className="tm-plan-features">
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span><strong>Atölye paketindeki her şey</strong></span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span><strong>WhatsApp Fotoğraflı Tek Tıkla Onay</strong></span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span><strong>Cama Yapışan Akıllı QR Servis Karnesi</strong></span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span><strong>Otomatik Periyodik Bakım & Muayene Çağrısı</strong></span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span><strong>Usta Yevmiye ve Parça Prim Hesaplama</strong></span>
                  </div>
                  <div className="tm-feat-item">
                    <div className="tm-feat-check-icon">✓</div>
                    <span><strong>Sınırsız Kullanıcı ve Cihaz Erişimi</strong></span>
                  </div>
                </div>
              </div>

              <button
                className="tm-btn-plan tm-btn-plan-solid"
                onClick={() => {
                  setSelectedPlan('PRO');
                  setIsDemoModalOpen(true);
                }}
              >
                <span>Tamircim Pro'yu Başlat</span>
                <span>→</span>
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
            🔒 14 gün boyunca tüm özellikleri ücretsiz test edin. Kredi kartı gerekmez. İstediğin an iptal edebilirsin.
          </div>
        </div>
      </section>

      {/* 💬 SANAYİCİ YORUMLARI */}
      <section className="tm-section-mint">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">SANAYİNİN ESNAFI NE DİYOR?</span>
            <h2 className="tm-section-title">
              Sanayide güven kazanan<br />
              <span style={{ color: '#10b981' }}>ustaların gerçek tecrübesi.</span>
            </h2>
          </div>

          <div className="tm-testimonials-grid">
            <div className="tm-testimonial-card">
              <div className="tm-stars-row">★★★★★</div>
              <p className="tm-test-quote">
                "Günde 25 araba giriyor dükkana. Eskiden parça fiyatı onaylatmak için müşteriyi arar dururduk, liftler kilitlenirdi. Şimdi usta resmi çekiyor, WhatsApp'tan link gidiyor. Müşteri 'onaylıyorum' deyince montaja hemen giriyoruz. Dükkanda kavga bitti."
              </p>
              <div className="tm-test-author">
                <div className="tm-author-avatar">BU</div>
                <div>
                  <div className="tm-author-name">Bekir Usta</div>
                  <div className="tm-author-shop">Bekir Otomotiv • Maslak Atatürk Oto Sanayi 2. Kısım</div>
                </div>
              </div>
            </div>

            <div className="tm-testimonial-card">
              <div className="tm-stars-row">★★★★★</div>
              <p className="tm-test-quote">
                "Cama yapıştırdığımız o karekodlu etiket olayı sanayide devrim. Müşteri arabasını satarken bile 'Bak abi Bostancı'da Salih Usta'da bütün bakımları işli' diye gösteriyor. Bize gelen müşteri bir daha başka dükkana adım atamaz."
              </p>
              <div className="tm-test-author">
                <div className="tm-author-avatar">SU</div>
                <div>
                  <div className="tm-author-name">Salih Usta</div>
                  <div className="tm-author-shop">Salih Usta Fren & Ön Takım • Bostancı Sanayi</div>
                </div>
              </div>
            </div>

            <div className="tm-testimonial-card">
              <div className="tm-stars-row">★★★★★</div>
              <p className="tm-test-quote">
                "Ay sonu sayımında sürekli eksik filtre, kayıp balata çıkıyordu. Çırak depodan alıp araca takıyor ama fişe eklemiyordu. Tamircim'e geçtikten sonra depodan çıkan her cıvata bile fişe yazıldı. İlk aydan program parasını 10'a katladı."
              </p>
              <div className="tm-test-author">
                <div className="tm-author-avatar">KU</div>
                <div>
                  <div className="tm-author-name">Kemal Usta</div>
                  <div className="tm-author-shop">Öz Kemal Motor & Mekanik • Ostim Sanayi, Ankara</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ❓ SECTION: SSS */}
      <section id="sss" className="tm-section-white">
        <div className="tm-container">
          <div className="tm-section-header">
            <span className="tm-badge-primary">AKLINIZA TAKILANLAR</span>
            <h2 className="tm-section-title">
              Sıkça Sorulan Sorular
            </h2>
            <p className="tm-section-desc">
              Tamircim hakkında sanayi ustalarının en çok sorduğu soruları netçe yanıtladık.
            </p>
          </div>

          <div className="tm-faq-list">
            {[
              {
                q: 'Özel bir bilgisayar veya pahalı bir cihaz almam gerekir mi?',
                a: 'Hayır. Dükkanındaki eski laptop, tablet, masaüstü bilgisayar veya ustanın kendi cep telefonundan internet tarayıcısıyla anında açılır. Ekstra hiçbir donanım almana gerek yoktur.',
              },
              {
                q: 'WhatsApp onay mesajları için ekstra fatura öder miyim?',
                a: 'Hayır. Tamircim Pro paketinde fotoğraflı onay linkleri ve temel servis bilgilendirme şablonları paket kapsamına dahildir. Müşteriniz onay verdiğinde servis ekranınıza otomatik yansır.',
              },
              {
                q: 'Akıllı QR Servis Etiketi cama nasıl yapışır, güneşten solar mı?',
                a: 'Özel UV korumalı, su geçirmez ve iz bırakmayan malzemeden üretilmiştir. Aracın sol ön camına yapıştırılır; 3 yıl boyunca güneşten, sıcaktan veya yıkamadan kesinlikle etkilenmez.',
              },
              {
                q: 'Eski defterdeki veya programdaki müşteri ve araçlarımı aktarabilir misiniz?',
                a: 'Evet. Eski programından veya Excel listenden bize ilettiğin tüm müşteri ve araç kayıtlarını teknik ekibimiz 1 saat içinde sisteme ücretsiz aktarır.',
              },
              {
                q: 'Birden fazla ustam ve çırağım var, hepsine ayrı giriş açabilir miyim?',
                a: 'Evet. Her ustaya ayrı şifre verebilirsin. Hangi ustanın hangi araca baktığını ve ay sonu ne kadar işçilik primi hak ettiğini kuruşu kuruşuna görürsün.',
              },
              {
                q: '14 günlük ücretsiz denemede kredi kartı girmem şart mı?',
                a: 'Kesinlikle hayır. Kredi kartı bilgisi girmeden 14 gün boyunca tüm PRO özelliklerini canlı olarak dükkanında test edebilirsin.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className={`tm-faq-item ${openFaq === index ? 'open' : ''}`}
              >
                <div
                  className="tm-faq-q"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                >
                  <span>{faq.q}</span>
                  <span className="tm-faq-arrow">▼</span>
                </div>
                {openFaq === index && (
                  <div className="tm-faq-a">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔥 SECTION: FINAL CALL TO ACTION */}
      <section className="tm-section-cta">
        <div className="tm-cta-glow" />
        <div className="tm-container">
          <div className="tm-cta-inner">
            <div className="tm-hero-badge-wrap" style={{ justifyContent: 'center' }}>
              <div className="tm-hero-badge">
                <span className="tm-pulse-dot" />
                <span className="tm-hero-badge-text">14 GÜN ÜCRETSİZ TEST ET</span>
              </div>
            </div>

            <h2 className="tm-cta-title">
              Oto servisini sanayide bir numara yapmaya<br />
              <span className="tm-gradient-text">hazır mısın usta?</span>
            </h2>

            <p className="tm-cta-desc">
              Hemen başla; araç kabulünden fotoğraflı WhatsApp onayına, parça takibinden karekodlu cam etiketine kadar farkı ilk günden yaşa.
            </p>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                className="tm-btn-hero-primary"
                onClick={() => {
                  setSelectedPlan('PRO');
                  setIsDemoModalOpen(true);
                }}
              >
                <span>Hemen Ücretsiz Başla</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </button>

              <a
                href="https://wa.me/905550000000?text=Selam%20ustam,%20Tamircim%20oto%20servis%20programı%20hakkında%20bilgi%20almak%20istiyorum."
                target="_blank"
                rel="noreferrer"
                className="tm-btn-hero-secondary"
              >
                <span>WhatsApp'tan Ulaş</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 🦶 FOOTER */}
      <footer className="tm-footer">
        <div className="tm-container">
          <div className="tm-footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="tm-logo-badge" style={{ width: '34px', height: '34px', fontSize: '16px' }}>TB</div>
                <span className="tm-brand-name" style={{ fontSize: '18px' }}>TAMİRCİM</span>
                <span className="tm-pro-pill">PRO</span>
              </div>
              <p className="tm-footer-brand-desc">
                Türkiye genelinde oto tamir, periyodik bakım, kaporta boya ve özel servisler için geliştirilmiş yeni nesil bulut atölye yönetim sistemi.
              </p>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Destek Hattı: <span style={{ color: '#ffffff' }}>destek@tamircim.com</span>
              </div>
            </div>

            <div>
              <div className="tm-footer-col-title">Modüller</div>
              <ul className="tm-footer-links">
                <li><a href="#plaka-sorgula">Canlı Plaka Sorgulama</a></li>
                <li><a href="#nasil-calisir">Ruhsat ile Hızlı Kabul</a></li>
                <li><a href="#qr-etiket">Akıllı QR Servis Etiketi</a></li>
                <li><a href="#servis-paneli">Yedek Parça & Stok Takibi</a></li>
                <li><a href="#servis-paneli">Kasa & Usta Yevmiyeleri</a></li>
              </ul>
            </div>

            <div>
              <div className="tm-footer-col-title">Sanayi Branşları</div>
              <ul className="tm-footer-links">
                <li><a href="#sektorler">Mekanik & Motor</a></li>
                <li><a href="#sektorler">Kaporta & Fırın Boya</a></li>
                <li><a href="#sektorler">Oto Elektrik & ECU</a></li>
                <li><a href="#sektorler">Lastik Oteli & Balans</a></li>
                <li><a href="#sektorler">Ekspertiz & Muayene</a></li>
              </ul>
            </div>

            <div>
              <div className="tm-footer-col-title">Hızlı Bağlantılar</div>
              <ul className="tm-footer-links">
                <li><Link to="/login">Servis Girişi</Link></li>
                <li><Link to="/musteri">Müşteri Portalı</Link></li>
                <li><a href="#fiyatlar">Fiyatlar & Paketler</a></li>
                <li><a href="#sss">Sıkça Sorulan Sorular</a></li>
                <li><a href="#gizlilik">KVKK & Gizlilik</a></li>
              </ul>
            </div>
          </div>

          <div className="tm-footer-bottom">
            <span>© 2026 Tamircim Pro — Tüm hakları saklıdır.</span>
            <span>Türkiye Sanayi & Oto Servis Yönetim Sistemleri</span>
          </div>
        </div>
      </footer>

      {/* 🪟 LEAD MODAL */}
      {isDemoModalOpen && (
        <div className="tm-modal-backdrop" onClick={() => setIsDemoModalOpen(false)}>
          <div className="tm-modal-box" onClick={e => e.stopPropagation()}>
            <button
              className="tm-modal-close-btn"
              onClick={() => setIsDemoModalOpen(false)}
            >
              ✕
            </button>

            {!leadSubmitted ? (
              <>
                <h3 className="tm-modal-title">Tamircim Pro'yu 14 Gün Ücretsiz Dene</h3>
                <p className="tm-modal-sub">
                  Kredi kartı gerekmez. Kurulum ekibimiz dükkanını 5 dakika içinde sisteme bağlar.
                </p>

                <form onSubmit={handleLeadSubmit}>
                  <div className="tm-form-field">
                    <label className="tm-form-label">Usta / Yetkili Adı Soyadı</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Ahmet Usta"
                      value={leadForm.name}
                      onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                      className="tm-form-input"
                    />
                  </div>

                  <div className="tm-form-field">
                    <label className="tm-form-label">Servis / Atölye Adı</label>
                    <input
                      type="text"
                      required
                      placeholder="Örn: Yıldız Oto Özel Servis"
                      value={leadForm.shopName}
                      onChange={e => setLeadForm({ ...leadForm, shopName: e.target.value })}
                      className="tm-form-input"
                    />
                  </div>

                  <div className="tm-form-field">
                    <label className="tm-form-label">Cep Telefonu (WhatsApp)</label>
                    <input
                      type="tel"
                      required
                      placeholder="05XX XXX XX XX"
                      value={leadForm.phone}
                      onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                      className="tm-form-input"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div className="tm-form-field">
                      <label className="tm-form-label">Şehir</label>
                      <select
                        value={leadForm.city}
                        onChange={e => setLeadForm({ ...leadForm, city: e.target.value })}
                        className="tm-form-select"
                      >
                        <option value="İstanbul">İstanbul</option>
                        <option value="Ankara">Ankara</option>
                        <option value="İzmir">İzmir</option>
                        <option value="Bursa">Bursa</option>
                        <option value="Antalya">Antalya</option>
                        <option value="Adana">Adana</option>
                        <option value="Konya">Konya</option>
                        <option value="Gaziantep">Gaziantep</option>
                        <option value="Kocaeli">Kocaeli</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>

                    <div className="tm-form-field">
                      <label className="tm-form-label">Aylık Araç Girişi</label>
                      <select
                        value={leadForm.volume}
                        onChange={e => setLeadForm({ ...leadForm, volume: e.target.value })}
                        className="tm-form-select"
                      >
                        <option value="20-50 Araç">20-50 Araç</option>
                        <option value="50-100 Araç">50-100 Araç</option>
                        <option value="100-200 Araç">100-200 Araç</option>
                        <option value="200+ Araç">200+ Araç</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', marginBottom: '12px' }}>
                    Seçilen Paket: <strong>{selectedPlan === 'PRO' ? 'TAMİRCİM PRO (100 QR Etiket Dahil)' : 'ATÖLYE BAŞLANGIÇ'}</strong>
                  </div>

                  <button type="submit" className="tm-form-submit-btn">
                    14 Gün Ücretsiz Denemeyi Başlat
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 10px' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  ✓
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', marginBottom: '8px' }}>
                  Başvurunuz Alındı Ustam!
                </h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
                  Sayın <strong>{leadForm.name}</strong>, servis giriş bilgileriniz ve 14 günlük ücretsiz deneme linkiniz <strong>{leadForm.phone}</strong> WhatsApp hattınıza iletiliyor.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import api from '../api/client';

function money(value) {
  return Number(value || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Reports() {
  const [dashboard, setDashboard] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [popularServices, setPopularServices] = useState([]);
  const [vehicleStats, setVehicleStats] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState(null);
  const [revenueMonths, setRevenueMonths] = useState(12);
  const [loading, setLoading] = useState(true);
  const [activeReportTab, setActiveReportTab] = useState('overview'); // 'overview' | 'revenue' | 'technicians' | 'services' | 'vehicles'

  async function loadData() {
    setLoading(true);
    try {
      const [
        dashRes,
        revRes,
        techRes,
        servicesRes,
        vehRes,
        pmRes,
      ] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get(`/reports/revenue?months=${revenueMonths}`),
        api.get('/reports/technician-performance'),
        api.get('/reports/popular-services?limit=10'),
        api.get('/reports/vehicle-stats'),
        api.get('/reports/payment-methods'),
      ]);

      setDashboard(dashRes.data);
      setRevenueData(revRes.data);
      setTechnicians(techRes.data);
      setPopularServices(servicesRes.data);
      setVehicleStats(vehRes.data);
      setPaymentMethods(pmRes.data);
    } catch (err) {
      console.error('Raporlar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [revenueMonths]);

  // Max revenue for scaling chart bars
  const maxRevenue = useMemo(() => {
    if (!revenueData.length) return 1;
    const max = Math.max(...revenueData.map((d) => d.revenue || 0));
    return max > 0 ? max : 1;
  }, [revenueData]);

  // Color palette for methods & brands
  const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

  if (loading && !dashboard) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#747e89' }}>
        <div style={{ fontSize: '18px', fontWeight: 600 }}>Raporlar ve Analitikler Hazırlanıyor...</div>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Raporlar & İş Zekası (BI)</h1>
          <p>Finansal gelir trendleri, atölye verimliliği, marka dağılımları ve servis analizleri.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Genel Bakış' },
            { id: 'revenue', label: '📈 Gelir Trendi' },
            { id: 'technicians', label: '🔧 Teknisyenler' },
            { id: 'services', label: '🛠️ Popüler Hizmetler' },
            { id: 'vehicles', label: '🚗 Araç İstatistikleri' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={activeReportTab === tab.id ? 'primary-button' : 'small-button'}
              onClick={() => setActiveReportTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {dashboard && (
        <div className="stats-grid reports-stats">
          <div className="stat-card">
            <span>Toplam Tahsilat</span>
            <strong style={{ color: '#22c55e' }}>{money(dashboard.totalPaid)} ₺</strong>
          </div>

          <div className="stat-card">
            <span>Onaylı Teklifler</span>
            <strong style={{ color: '#f59e0b' }}>{money(dashboard.approvedQuotesTotal)} ₺</strong>
          </div>

          <div className="stat-card">
            <span>Açık İş Emri</span>
            <strong>{dashboard.openServiceOrders}</strong>
          </div>

          <div className="stat-card">
            <span>Geciken İşler</span>
            <strong style={{ color: dashboard.delayedOrders > 0 ? '#ef4444' : undefined }}>
              {dashboard.delayedOrders}
            </strong>
          </div>

          <div className="stat-card">
            <span>Parça Bekleyen</span>
            <strong style={{ color: dashboard.partWaitingOrders > 0 ? '#f59e0b' : undefined }}>
              {dashboard.partWaitingOrders}
            </strong>
          </div>

          <div className="stat-card">
            <span>Aktif İşçilik (Çalışan)</span>
            <strong style={{ color: '#3b82f6' }}>{dashboard.activeWorkSessions}</strong>
          </div>

          <div className="stat-card">
            <span>Kayıtlı Müşteri</span>
            <strong>{dashboard.customers}</strong>
          </div>

          <div className="stat-card">
            <span>Kayıtlı Araç</span>
            <strong>{dashboard.vehicles}</strong>
          </div>
        </div>
      )}

      {/* OVERVIEW / REVENUE SECTION */}
      {(activeReportTab === 'overview' || activeReportTab === 'revenue') && (
        <div className="content-grid spaced-card">
          {/* Revenue Chart Card */}
          <div className="panel-card" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Aylık Gelir ve Tahsilat Trendi</h3>
                <p style={{ margin: '3px 0 0', color: '#747e89', fontSize: '12px' }}>
                  Aylara göre toplam tahsilat ve teslim edilen iş emri hacmi
                </p>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {[6, 12, 24].map((m) => (
                  <button
                    key={m}
                    className={`small-button ${revenueMonths === m ? 'active' : ''}`}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      background: revenueMonths === m ? 'var(--tenant-primary, #f59e0b)' : undefined,
                      color: revenueMonths === m ? '#111' : undefined,
                      fontWeight: revenueMonths === m ? 700 : undefined,
                    }}
                    onClick={() => setRevenueMonths(m)}
                  >
                    Son {m} Ay
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Bar / Trend Chart */}
            <div style={{ width: '100%', height: '260px', position: 'relative', marginTop: '16px' }}>
              <svg width="100%" height="100%" viewBox="0 0 800 240" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
                  </linearGradient>
                  <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => (
                  <g key={idx}>
                    <line
                      x1="40"
                      y1={200 - ratio * 170}
                      x2="780"
                      y2={200 - ratio * 170}
                      stroke="#222730"
                      strokeDasharray={ratio > 0 && ratio < 1 ? '4 4' : undefined}
                    />
                    <text
                      x="35"
                      y={204 - ratio * 170}
                      fill="#636c76"
                      fontSize="10"
                      textAnchor="end"
                    >
                      {money(maxRevenue * ratio)}
                    </text>
                  </g>
                ))}

                {/* Revenue Bars */}
                {revenueData.map((d, idx) => {
                  const barCount = revenueData.length;
                  const availableWidth = 720;
                  const slotWidth = availableWidth / barCount;
                  const barWidth = Math.min(36, slotWidth * 0.65);
                  const x = 50 + idx * slotWidth + (slotWidth - barWidth) / 2;
                  const barHeight = (d.revenue / maxRevenue) * 170;
                  const y = 200 - barHeight;

                  return (
                    <g key={d.key} className="chart-bar-group">
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={Math.max(2, barHeight)}
                        rx="4"
                        fill="url(#barGradient)"
                        style={{ transition: 'all .2s' }}
                      >
                        <title>{`${d.label}: ${money(d.revenue)} ₺ (${d.ordersCount} iş emri)`}</title>
                      </rect>

                      {/* Bar top label if non-zero */}
                      {d.revenue > 0 && (
                        <text
                          x={x + barWidth / 2}
                          y={y - 6}
                          fill="#c0c7cf"
                          fontSize="9"
                          fontWeight="600"
                          textAnchor="middle"
                        >
                          {d.revenue >= 1000 ? `${Math.round(d.revenue / 1000)}k` : d.revenue}
                        </text>
                      )}

                      {/* Month bottom label */}
                      <text
                        x={x + barWidth / 2}
                        y="222"
                        fill="#747e89"
                        fontSize="10"
                        textAnchor="middle"
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW / PAYMENT METHODS & VEHICLES */}
      {activeReportTab === 'overview' && (
        <div className="content-grid spaced-card" style={{ marginTop: '16px' }}>
          {/* Payment Methods Breakdown */}
          {paymentMethods && (
            <div className="panel-card">
              <h3>Ödeme Yöntemi Dağılımı</h3>
              <p style={{ color: '#747e89', fontSize: '12px', marginTop: '2px', marginBottom: '16px' }}>
                Toplam {paymentMethods.totalCount} tahsilat işleminin yöntemlere göre oranı
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {paymentMethods.methods.map((m, idx) => (
                  <div key={m.method}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{m.label}</span>
                      <span>
                        <strong>{money(m.amount)} ₺</strong> ({m.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#1c2027', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${m.percentage}%`,
                          height: '100%',
                          background: colors[idx % colors.length],
                          borderRadius: '4px',
                          transition: 'width .3s ease',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Vehicle Brands */}
          {vehicleStats && (
            <div className="panel-card">
              <h3>En Çok Gelen Araç Markaları</h3>
              <p style={{ color: '#747e89', fontSize: '12px', marginTop: '2px', marginBottom: '16px' }}>
                Kayıtlı {vehicleStats.totalVehicles} araç içinde öne çıkan marka dağılımı (Ort. KM: {vehicleStats.averageMileage.toLocaleString('tr-TR')} km)
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {vehicleStats.topBrands.map((b, idx) => (
                  <div key={b.brand}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>
                        {idx + 1}. {b.brand}
                      </span>
                      <span>
                        <strong>{b.count} araç</strong> ({b.percentage}%)
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '7px', background: '#1c2027', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${b.percentage}%`,
                          height: '100%',
                          background: colors[(idx + 2) % colors.length],
                          borderRadius: '4px',
                        }}
                      />
                    </div>
                  </div>
                ))}

                {!vehicleStats.topBrands.length && (
                  <div style={{ color: '#747e89', textAlign: 'center', padding: '20px' }}>
                    Henüz araç kaydı bulunmuyor.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TECHNICIAN PERFORMANCE TAB */}
      {(activeReportTab === 'overview' || activeReportTab === 'technicians') && (
        <div className="panel-card" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>Teknisyen Performans & Verimlilik Tablosu</h3>
              <p style={{ margin: '3px 0 0', color: '#747e89', fontSize: '12px' }}>
                Tamamlanan iş emri sayısı, toplam çalışma süreleri ve başarı oranları
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Teknisyen / Personel</th>
                  <th>Atanan İş Emri</th>
                  <th>Tamamlanan İş</th>
                  <th>Başarı Oranı</th>
                  <th>Kayıtlı Çalışma Saati</th>
                  <th>Aktif Çalışma</th>
                </tr>
              </thead>
              <tbody>
                {technicians.map((t, idx) => (
                  <tr key={t.id}>
                    <td>
                      <span
                        style={{
                          display: 'inline-grid',
                          placeItems: 'center',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#1e2229',
                          color: idx < 3 ? '#111' : '#a0a8b2',
                          fontWeight: 700,
                          fontSize: '11px',
                        }}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td>
                      <strong>{t.name}</strong>
                    </td>
                    <td>{t.assignedOrders}</td>
                    <td>
                      <strong style={{ color: '#22c55e' }}>{t.completedOrders}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', background: '#1c2027', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${t.completionRate}%`,
                              height: '100%',
                              background: t.completionRate >= 75 ? '#22c55e' : t.completionRate >= 40 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>%{t.completionRate}</span>
                      </div>
                    </td>
                    <td>{t.totalWorkHours} saat</td>
                    <td>
                      {t.activeSessions > 0 ? (
                        <span className="status-badge success" style={{ fontSize: '11px' }}>
                          🟢 {t.activeSessions} aktif görevde
                        </span>
                      ) : (
                        <span style={{ color: '#636c76', fontSize: '12px' }}>Boşta</span>
                      )}
                    </td>
                  </tr>
                ))}

                {!technicians.length && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#747e89' }}>
                      Henüz atanmış teknisyen kaydı bulunmamaktadır.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POPULAR SERVICES TAB */}
      {(activeReportTab === 'overview' || activeReportTab === 'services') && (
        <div className="panel-card" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0 }}>En Çok Talep Edilen İşlemler & Yedek Parçalar</h3>
              <p style={{ margin: '3px 0 0', color: '#747e89', fontSize: '12px' }}>
                İş emirlerinde en sık kullanılan işçilikler ve malzeme kalemleri
              </p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sıra</th>
                  <th>Hizmet / Parça Adı</th>
                  <th>Tür</th>
                  <th>Kullanım Adedi</th>
                  <th>Üretilen Ciro</th>
                </tr>
              </thead>
              <tbody>
                {popularServices.map((item, idx) => (
                  <tr key={idx}>
                    <td>#{idx + 1}</td>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>
                      <span className={`status-badge ${item.type === 'LABOR' ? 'info' : 'warning'}`}>
                        {item.type === 'LABOR' ? 'İşçilik' : item.type === 'PART' ? 'Yedek Parça' : 'Diğer'}
                      </span>
                    </td>
                    <td>
                      <strong>{item.count}</strong> adet
                    </td>
                    <td>
                      <strong style={{ color: '#22c55e' }}>{money(item.totalRevenue)} ₺</strong>
                    </td>
                  </tr>
                ))}

                {!popularServices.length && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#747e89' }}>
                      Henüz iş emri kalemi kaydı bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VEHICLES DETAIL TAB */}
      {activeReportTab === 'vehicles' && vehicleStats && (
        <div className="panel-card" style={{ marginTop: '16px' }}>
          <h3>Araç Filosu & Kilometre Analizi</h3>
          <div className="stats-grid" style={{ margin: '16px 0' }}>
            <div className="stat-card">
              <span>Toplam Araç Sayısı</span>
              <strong>{vehicleStats.totalVehicles}</strong>
            </div>
            <div className="stat-card">
              <span>Ortalama Araç Kilometresi</span>
              <strong>{vehicleStats.averageMileage.toLocaleString('tr-TR')} KM</strong>
            </div>
            <div className="stat-card">
              <span>Lider Marka</span>
              <strong style={{ color: '#f59e0b' }}>{vehicleStats.topBrands[0]?.brand || '-'}</strong>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Marka</th>
                  <th>Kayıtlı Araç Adedi</th>
                  <th>Filodaki Payı</th>
                </tr>
              </thead>
              <tbody>
                {vehicleStats.topBrands.map((b) => (
                  <tr key={b.brand}>
                    <td>
                      <strong>{b.brand}</strong>
                    </td>
                    <td>{b.count} adet</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '120px', height: '8px', background: '#1c2027', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${b.percentage}%`, height: '100%', background: '#3b82f6', borderRadius: '4px' }} />
                        </div>
                        <span>%{b.percentage}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

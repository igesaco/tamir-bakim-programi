import { useState, useEffect } from 'react';
import api from '../api/client';

export default function AiDiagnoseModal({
  isOpen,
  onClose,
  vehicle,
  initialComplaint = '',
  onApplyPart,
}) {
  const [complaint, setComplaint] = useState(initialComplaint);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setComplaint(initialComplaint || '');
      if (initialComplaint && !result) {
        runDiagnosis(initialComplaint);
      }
    }
  }, [isOpen, initialComplaint]);

  if (!isOpen) return null;

  async function runDiagnosis(queryText) {
    const textToAnalyze = queryText || complaint;
    if (!textToAnalyze.trim()) {
      setError('Lütfen analiz edilecek müşteri şikayetini veya belirtileri giriniz.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/ai/diagnose', {
        vehicleBrand: vehicle?.brand || '',
        vehicleModel: vehicle?.model || '',
        vehicleYear: vehicle?.year ? Number(vehicle.year) : undefined,
        vehicleFuel: vehicle?.fuelType || '',
        mileage: vehicle?.mileage ? Number(vehicle.mileage) : undefined,
        complaint: textToAnalyze.trim(),
      });

      setResult(res.data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'AI analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'grid',
        placeItems: 'center',
        padding: '20px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: 'min(720px, 95vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#12151b',
          border: '1px solid #2a303c',
          borderRadius: '16px',
          boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(139, 92, 246, 0.2)',
          overflow: 'hidden',
          animation: 'paletteSlideIn 0.2s ease',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 22px',
            background: 'linear-gradient(90deg, #181c24, #1f1b2e)',
            borderBottom: '1px solid #282f3d',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                display: 'grid',
                placeItems: 'center',
                fontSize: '16px',
              }}
            >
              🧠
            </div>
            <div>
              <strong style={{ fontSize: '15px', color: '#fff' }}>Gemini AI Arıza Ön Teşhis Asistanı</strong>
              <div style={{ fontSize: '11px', color: '#8e96a5' }}>
                {vehicle
                  ? `${vehicle.brand || ''} ${vehicle.model || ''} (${vehicle.year || ''}) · ${vehicle.mileage ? `${vehicle.mileage.toLocaleString('tr-TR')} km` : ''}`
                  : 'Araç Bilgisi'}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="small-button"
            style={{ padding: '4px 10px', fontSize: '13px' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {/* Complaint Input & Trigger */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#a0a8b2', marginBottom: '6px' }}>
              Müşteri Şikâyeti / Arıza Belirtileri:
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Örn: 80 km üstü fren yapınca direksiyon titriyor, motor soğukken tekleme yapıyor..."
                value={complaint}
                onChange={(e) => setComplaint(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runDiagnosis();
                }}
                style={{ flex: 1, padding: '9px 14px', fontSize: '13px' }}
              />
              <button
                type="button"
                className="primary-button"
                disabled={loading}
                onClick={() => runDiagnosis()}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  color: '#fff',
                  padding: '9px 18px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {loading ? 'Analiz Ediliyor...' : '🔍 Analiz Et'}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#a0a8b2' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚡</div>
              <div style={{ fontWeight: 600 }}>Otomotiv Yapay Zekası Verileri İnceliyor...</div>
              <small style={{ color: '#636c76', marginTop: '4px', display: 'block' }}>
                Hata kodları, aşınma olasılıkları ve parça gereksinimleri hesaplanıyor
              </small>
            </div>
          )}

          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary & Urgency Card */}
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: '12px',
                  background: '#161a22',
                  border: `1px solid ${result.urgencyColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '6px',
                        background: `${result.urgencyColor}20`,
                        color: result.urgencyColor,
                        fontSize: '11px',
                        fontWeight: 700,
                        border: `1px solid ${result.urgencyColor}50`,
                      }}
                    >
                      Aciliyet: {result.urgency}
                    </span>
                    <span style={{ fontSize: '11px', color: '#747e89' }}>
                      {result.source === 'GEMINI_AI' ? '✨ Gemini Flash AI' : '⚙️ Uzman Teşhis Motoru'}
                    </span>
                  </div>
                  <strong style={{ fontSize: '14px', color: '#e5e9ed' }}>{result.summary}</strong>
                </div>
              </div>

              {/* Possible Causes Breakdown */}
              {result.possibleCauses?.length > 0 && (
                <div className="panel-card" style={{ padding: '14px 16px', background: '#161a22' }}>
                  <strong style={{ fontSize: '13px', display: 'block', marginBottom: '10px' }}>
                    🔎 Olası Arıza Nedenleri ve Olasılıklar
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.possibleCauses.map((c, idx) => (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, color: '#c0c7cf' }}>{c.cause}</span>
                          <span style={{ color: c.probability >= 70 ? '#f59e0b' : '#3b82f6', fontWeight: 700 }}>
                            %{c.probability} Olasılık
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: '#101216', borderRadius: '3px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${c.probability}%`,
                              height: '100%',
                              background: c.probability >= 70 ? 'linear-gradient(90deg, #f59e0b, #ef4444)' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                              borderRadius: '3px',
                            }}
                          />
                        </div>
                        {c.details && (
                          <div style={{ fontSize: '11px', color: '#747e89', marginTop: '3px' }}>
                            {c.details}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {result.recommendedActions?.length > 0 && (
                <div className="panel-card" style={{ padding: '14px 16px', background: '#161a22' }}>
                  <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px', color: '#38bdf8' }}>
                    🔧 Teknisyen Kontrol ve Test Listesi
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#a0a8b2', lineHeight: 1.6 }}>
                    {result.recommendedActions.map((action, idx) => (
                      <li key={idx}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Parts */}
              {result.suggestedParts?.length > 0 && (
                <div className="panel-card" style={{ padding: '14px 16px', background: '#161a22' }}>
                  <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px', color: '#f59e0b' }}>
                    📦 Olası Gerekli Yedek Parçalar
                  </strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {result.suggestedParts.map((part, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          background: '#1d222b',
                          border: '1px solid #2d3543',
                          fontSize: '12px',
                        }}
                      >
                        <span>{part}</span>
                        {onApplyPart && (
                          <button
                            type="button"
                            title="İş emrine kalem olarak ekle"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#38bdf8',
                              cursor: 'pointer',
                              padding: '0 2px',
                              fontWeight: 700,
                            }}
                            onClick={() => onApplyPart(part)}
                          >
                            + Ekle
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technician Notes & Customer Advice */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {result.technicianNotes && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#181b24', border: '1px solid #242a36', fontSize: '12px' }}>
                    <strong style={{ display: 'block', color: '#a78bfa', marginBottom: '4px' }}>💡 Teknisyene Not</strong>
                    <span style={{ color: '#a0a8b2', lineHeight: 1.4 }}>{result.technicianNotes}</span>
                  </div>
                )}

                {result.customerAdvice && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#181b24', border: '1px solid #242a36', fontSize: '12px' }}>
                    <strong style={{ display: 'block', color: '#34d399', marginBottom: '4px' }}>🗣️ Müşteri İzahı</strong>
                    <span style={{ color: '#a0a8b2', lineHeight: 1.4 }}>{result.customerAdvice}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '12px 22px',
            background: '#15181f',
            borderTop: '1px solid #242930',
          }}
        >
          <button type="button" className="small-button" onClick={onClose}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

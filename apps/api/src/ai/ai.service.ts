import { Injectable, Logger } from '@nestjs/common';
import { DiagnoseDto } from './dto/diagnose.dto';

export interface DiagnosticResult {
  source: 'GEMINI_AI' | 'EXPERT_SYSTEM';
  summary: string;
  urgency: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK' | 'KRİTİK';
  urgencyColor: string;
  possibleCauses: { cause: string; probability: number; details: string }[];
  recommendedActions: string[];
  suggestedParts: string[];
  technicianNotes: string;
  customerAdvice: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  async diagnose(dto: DiagnoseDto): Promise<DiagnosticResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const aiResult = await this.callGemini(apiKey, dto);
        if (aiResult) return aiResult;
      } catch (err: any) {
        this.logger.warn(`Gemini API çağrısı başarısız oldu, uzman sistem devreye giriyor: ${err?.message}`);
      }
    }

    return this.fallbackExpertSystem(dto);
  }

  private async callGemini(apiKey: string, dto: DiagnoseDto): Promise<DiagnosticResult | null> {
    const prompt = `Sen kıdemli bir otomotiv baş teknisyeni ve arıza tespit uzmanısın.
Aşağıdaki araç ve müşteri şikayeti bilgilerini analiz ederek Türkçe JSON formatında ön teşhis ve öneriler sun.

Araç Bilgisi:
- Marka: ${dto.vehicleBrand || 'Belirtilmedi'}
- Model: ${dto.vehicleModel || 'Belirtilmedi'}
- Yıl: ${dto.vehicleYear || 'Belirtilmedi'}
- Yakıt Türü: ${dto.vehicleFuel || 'Belirtilmedi'}
- Kilometre: ${dto.mileage ? `${dto.mileage} km` : 'Belirtilmedi'}

Müşteri Şikâyeti:
"${dto.complaint}"

Lütfen SADECE aşağıdaki JSON şemasına uygun geçerli bir JSON nesnesi döndür (markdown kod bloğu olmadan, sadece saf JSON):
{
  "summary": "Tek cümlelik arıza özeti",
  "urgency": "DÜŞÜK veya ORTA veya YÜKSEK veya KRİTİK",
  "possibleCauses": [
    { "cause": "Olası neden başlığı", "probability": 80, "details": "Kısa açıklama" }
  ],
  "recommendedActions": [
    "Teknisyenin yapması gereken 1. kontrol",
    "2. kontrol"
  ],
  "suggestedParts": [
    "Olası değişecek parça 1",
    "Parça 2"
  ],
  "technicianNotes": "Teknisyene yönelik özel teknik ipucu veya dikkat edilmesi gereken nokta",
  "customerAdvice": "Müşteriye durumu izah etmek için sade, güven veren açıklama"
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API HTTP ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);
    const urgency = ['DÜŞÜK', 'ORTA', 'YÜKSEK', 'KRİTİK'].includes(parsed.urgency)
      ? parsed.urgency
      : 'ORTA';

    const urgencyColor =
      urgency === 'KRİTİK' ? '#ef4444' : urgency === 'YÜKSEK' ? '#f97316' : urgency === 'ORTA' ? '#f59e0b' : '#22c55e';

    return {
      source: 'GEMINI_AI',
      summary: parsed.summary || 'Ön inceleme tamamlandı.',
      urgency,
      urgencyColor,
      possibleCauses: Array.isArray(parsed.possibleCauses) ? parsed.possibleCauses : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      suggestedParts: Array.isArray(parsed.suggestedParts) ? parsed.suggestedParts : [],
      technicianNotes: parsed.technicianNotes || '',
      customerAdvice: parsed.customerAdvice || '',
    };
  }

  private fallbackExpertSystem(dto: DiagnoseDto): DiagnosticResult {
    const text = (dto.complaint || '').toLowerCase();
    const km = Number(dto.mileage || 0);

    let summary = 'Genel araç kontrolü ve diyagnostik tarama önerilir.';
    let urgency: DiagnosticResult['urgency'] = 'ORTA';
    const possibleCauses: { cause: string; probability: number; details: string }[] = [];
    const recommendedActions: string[] = [];
    const suggestedParts: string[] = [];
    let technicianNotes = 'OBD2 cihazı ile hata kodlarını (DTC) okuyun ve canlı değerleri izleyin.';
    let customerAdvice = 'Aracınız atölyemizde uzman teknisyenlerimiz tarafından detaylı incelemeye alınacaktır.';

    // Brake symptoms
    if (text.includes('fren') || text.includes('balata') || text.includes('disk') || text.includes('durmuyor')) {
      summary = 'Fren sistemi aşınması veya hidrolik basınç uyarısı.';
      urgency = text.includes('tutmyor') || text.includes('boşaldı') ? 'KRİTİK' : 'YÜKSEK';
      possibleCauses.push(
        { cause: 'Fren Balatası Aşınması', probability: 75, details: 'Balata kalınlığı kritik seviyeye inmiş olabilir.' },
        { cause: 'Fren Diski Eğrilmesi / Çizilmesi', probability: 55, details: 'Frenleme anında pedala veya direksiyona vuruntu yapabilir.' },
        { cause: 'Fren Hidroliği Düşüklüğü / Nem Oranı', probability: 40, details: 'Hidrolik nem oranı %3 üstüne çıkmış veya kaçak olabilir.' },
      );
      recommendedActions.push('Ön ve arka balata kalınlıklarını kumpas ile ölçün.');
      recommendedActions.push('Fren disklerinde kılcal çatlak veya salgı kontrolü yapın.');
      recommendedActions.push('Fren hortumlarını ve rekorlarını kaçak yönünden inceleyin.');
      suggestedParts.push('Ön Fren Balata Takımı', 'Ön Fren Diski (Çift)', 'DOT4 Fren Hidroliği');
      technicianNotes = 'Disk kalınlığı minimum toleransın altındaysa taşlama yapmayın, doğrudan değişim önerin.';
      customerAdvice = 'Güvenliğiniz için aracın fren test cihazına alınması ve balata-disk durumunun kontrol edilmesi gerekir.';
    }
    // Heating / Cooling symptoms
    else if (text.includes('hararet') || text.includes('su eksilt') || text.includes('radyatör') || text.includes('antifriz')) {
      summary = 'Motor soğutma sistemi arızası veya su kaçağı.';
      urgency = 'KRİTİK';
      possibleCauses.push(
        { cause: 'Termostat Arızası (Kapalı Kalma)', probability: 65, details: 'Soğutma sıvısı radyatöre geçemiyor olabilir.' },
        { cause: 'Devirdaim Su Pompası Arızası', probability: 50, details: 'Pervane sıyırmış veya kasnak boşluk yapmış olabilir.' },
        { cause: 'Radyatör veya Hortum Kaçağı', probability: 60, details: 'Basınç altında soğutma sıvısı sızıntısı.' },
        { cause: 'Silindir Kapak Contası Yanması', probability: 35, details: 'Suya kompresyon veya yağa su karışma riski.' },
      );
      recommendedActions.push('Soğutma sistemine basınç testi uygulayın.');
      recommendedActions.push('Motor yağı kapağını ve çubuğunu kremleşme/köpük yönünden inceleyin.');
      recommendedActions.push('Radyatör fanının kademeli devreye girip girmediğini kontrol edin.');
      suggestedParts.push('Termostat', 'Devirdaim Su Pompası', 'Kırmızı Antifriz (Organik)', 'Radyatör Üst Hortumu');
      technicianNotes = 'Motor sıcakken radyatör kapağını açmayın. CO2 kaçak test kiti ile genleşme kabından test yapın.';
      customerAdvice = 'Motorun hararet yapması yüksek maliyetli hasarlara yol açabilir. Araç soğuyana kadar kullanılmamalıdır.';
    }
    // Engine shake / Misfire / Power loss
    else if (text.includes('titreme') || text.includes('tekleme') || text.includes('çekmiyor') || text.includes('gaz yemiyor') || text.includes('sarsıntı')) {
      summary = 'Ateşleme / Yakıt püskürtme veya motor takozu sarsıntısı.';
      urgency = 'YÜKSEK';
      possibleCauses.push(
        { cause: 'Buji / Ateşleme Bobini Arızası', probability: 70, details: 'Silindirlerden birinde tekleme (misfire) oluşuyor.' },
        { cause: 'Enjektör Tıkanıklığı veya Geri Dönüş Kaçağı', probability: 50, details: 'Yakıt atomizasyonu bozulmuş.' },
        { cause: 'Motor / Şanzıman Kulağı (Takozu) Kopması', probability: 45, details: 'Rölantide veya kalkışta kabine yoğun titreşim verir.' },
        { cause: 'Boğaz Kelebeği / MAF Sensörü Kirliliği', probability: 40, details: 'Hava-yakıt karışımı kararsız kalıyor.' },
      );
      recommendedActions.push('Diyagnostik cihazla P0300-P0304 silindir tekleme kodlarını kontrol edin.');
      recommendedActions.push('Ateşleme bobinlerinin sekonder dirençlerini ve buji tırnak aralıklarını ölçün.');
      recommendedActions.push('Motor kulaklarını manivela ile esneterek boşluk kontrolü yapın.');
      suggestedParts.push('Buji Takımı (İridyum/Nikel)', 'Ateşleme Bobini', 'Boğaz Kelebeği Temizleme Spreyi');
      technicianNotes = 'Tekleme durumunda katalitik konvertör aşırı ısınabilir. Uzun süre bu şekilde çalıştırılmamalıdır.';
      customerAdvice = 'Ateşleme veya yakıt sistemindeki düzensizlik giderildiğinde çekiş normale dönecek ve yakıt tüketimi düşecektir.';
    }
    // Starting / Battery / Alternator
    else if (text.includes('çalışmıyor') || text.includes('marş') || text.includes('akü') || text.includes('basmıyor')) {
      summary = 'Marş motoru, akü veya şarj dinamosu elektrik arızası.';
      urgency = 'YÜKSEK';
      possibleCauses.push(
        { cause: 'Akü Voltaj Düşüklüğü / Ömür Sonu', probability: 70, details: 'Akü marş basma akımını (CCA) karşılayamıyor.' },
        { cause: 'Marş Motoru Kömür / Otomatik Arızası', probability: 50, details: 'Marş basıldığında tık sesi geliyor ama motor dönmüyor.' },
        { cause: 'Şarj Dinamosu (Alternatör) Şarj Etmeme', probability: 45, details: 'Akü seyir halindeyken şarj olmuyor.' },
      );
      recommendedActions.push('Akü test cihazı ile CCA ve sağlık (SOH/SOC) durumunu ölçün.');
      recommendedActions.push('Motor çalışırken şarj voltajını kontrol edin (13.8V - 14.4V aralığında olmalı).');
      suggestedParts.push('Akü (Araç tipine göre EFB/AGM/Standart)', 'Marş Otomatiği / Kömür Takımı');
      technicianNotes = 'Şarj dinamosu kaçak akım testini de yapın; araç stop halindeyken akü drenajı (parasitic draw) olabilir.';
      customerAdvice = 'Akünüzün ölçümü yapılarak marş ve şarj sistemleri test edilecek, yolda kalmanız önlenecektir.';
    }
    // Sound / Suspension
    else if (text.includes('ses') || text.includes('tıkırtı') || text.includes('lokurtu') || text.includes('kasiste')) {
      summary = 'Ön takım / süspansiyon elemanları boşluğu.';
      urgency = 'ORTA';
      possibleCauses.push(
        { cause: 'Z-Rot (Viraj Demir Askı Rotu) Boşluğu', probability: 80, details: 'Kasislerde ve parke taşlı yollarda lokurtu sesi yapar.' },
        { cause: 'Rotil / Rot Başı Aşınması', probability: 60, details: 'Direksiyon hassasiyetini bozar ve boşluk hissi verir.' },
        { cause: 'Amortisör Üst Takoz / Bilyası', probability: 50, details: 'Direksiyon çevrilirken yay gerilme sesi veya takırtı.' },
      );
      recommendedActions.push('Aracı lifte kaldırarak levye ile ön takım boşluklarını kontrol edin.');
      recommendedActions.push('Amortisörlerde yağ sızıntısı ve kule takozu esnemesi inceleyin.');
      suggestedParts.push('Z-Rot Takımı (Ön)', 'Rot Başı', 'Salıncak Burcu', 'Amortisör Takozu');
      technicianNotes = 'Parça değişiminden sonra rot ayarı (ön düzen) yapılmasını iş emrine ekleyin.';
      customerAdvice = 'Ön takım boşlukları sürüş konforunu ve lastik ömrünü doğrudan etkiler. Güvenli yol tutuş için giderilmelidir.';
    }
    // General high-km recommendations
    else {
      if (km > 100000) {
        summary = `${km.toLocaleString('tr-TR')} km periyodik ağır bakım ve mekanik kontrol gereksinimi.`;
        possibleCauses.push(
          { cause: 'Periyodik Yağ ve Filtre Değişim Zamanı', probability: 85, details: 'Motor yağı ve filtrelerin servis ömrü.' },
          { cause: 'Triger / V Kayışı Aşınması', probability: 60, details: 'Ağır bakım kilometre sınırına ulaşılmış olabilir.' },
        );
        suggestedParts.push('Motor Yağı (Onaylı Viskozite)', 'Yağ Filtresi', 'Hava Filtresi', 'Polen Filtresi');
      } else {
        summary = 'Standart periyodik bakım ve arıza tespit prosedürü.';
        possibleCauses.push(
          { cause: 'Rutin Servis Gereksinimi', probability: 90, details: 'Sıvı seviyeleri, balatalar ve filtreler kontrol edilmeli.' },
        );
        suggestedParts.push('Periyodik Bakım Filtre Seti', 'Motor Yağı');
      }
      recommendedActions.push('Diyagnostik cihaz ile tam sistem hata taraması (full scan) yapın.');
      recommendedActions.push('Tüm sıvı seviyelerini ve sızıntı durumlarını inceleyin.');
    }

    const urgencyColor =
      urgency === 'KRİTİK' ? '#ef4444' : urgency === 'YÜKSEK' ? '#f97316' : urgency === 'ORTA' ? '#f59e0b' : '#22c55e';

    return {
      source: 'EXPERT_SYSTEM',
      summary,
      urgency,
      urgencyColor,
      possibleCauses,
      recommendedActions,
      suggestedParts,
      technicianNotes,
      customerAdvice,
    };
  }
}

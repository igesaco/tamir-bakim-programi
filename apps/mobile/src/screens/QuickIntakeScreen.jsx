import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field, Message, ScreenTitle } from '../components/UI';
import { readDocument } from '../documentOcr';
import { colors, radius, spacing } from '../theme';

const EMPTY_ITEM = () => ({ type: 'LABOR', name: '', quantity: '1' });

function apiMessage(error, fallback) {
  const message = error?.response?.data?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
}

export default function QuickIntakeScreen({
  initialCustomerId = '',
  initialVehicleId = '',
  onSeedConsumed,
}) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [vehicleId, setVehicleId] = useState(initialVehicleId);
  const [busy, setBusy] = useState(false);
  const [scanBusy, setScanBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '',
    plate: '', brand: '', model: '', modelYear: '', vin: '',
    fuelType: '', transmission: '', color: '', mileage: '',
    complaint: '', internalNote: '',
  });
  const [items, setItems] = useState([EMPTY_ITEM()]);

  async function loadCustomers() {
    const response = await api.get('/customers');
    setCustomers(response.data);
    return response.data;
  }

  useEffect(() => {
    loadCustomers()
      .then((list) => {
        const seededCustomer = list.find((item) => item.id === initialCustomerId);
        if (seededCustomer) selectCustomer(seededCustomer, initialVehicleId);
        onSeedConsumed?.();
      })
      .catch((err) => setError(apiMessage(err, 'Müşteri listesi yüklenemedi.')));
  }, []);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');
    if (!term) return customers.slice(0, 8);
    return customers.filter((customer) => {
      const text = [
        customer.firstName, customer.lastName, customer.phone,
        ...(customer.vehicles || []).map((vehicle) => vehicle.plate),
      ].filter(Boolean).join(' ').toLocaleLowerCase('tr-TR');
      return text.includes(term);
    }).slice(0, 8);
  }, [customers, search]);

  function selectCustomer(customer, preferredVehicleId = '') {
    const vehicles = customer.vehicles || [];
    const vehicle = vehicles.find((item) => item.id === preferredVehicleId) || vehicles[0];
    setCustomerId(customer.id);
    setVehicleId(vehicle?.id || '');
    setForm((current) => ({
      ...current,
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      phone: customer.phone || '',
      email: customer.email || '',
      plate: vehicle?.plate || '',
      brand: vehicle?.brand || '',
      model: vehicle?.model || '',
      modelYear: vehicle?.modelYear ? String(vehicle.modelYear) : '',
      vin: vehicle?.vin || '',
      fuelType: vehicle?.fuelType || '',
      transmission: vehicle?.transmission || '',
      color: vehicle?.color || '',
      mileage: String(vehicle?.mileage || 0),
    }));
    setSearch('');
  }

  function newCustomer() {
    setCustomerId('');
    setVehicleId('');
    setForm({
      firstName: '', lastName: '', phone: '', email: '',
      plate: '', brand: '', model: '', modelYear: '', vin: '',
      fuelType: '', transmission: '', color: '', mileage: '',
      complaint: '', internalNote: '',
    });
  }

  async function scan(kind) {
    setError('');
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Belge okumak için kamera izni gerekli.');
      return;
    }

    const shot = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });
    if (shot.canceled || !shot.assets?.[0]?.uri) return;

    setScanBusy(kind);
    try {
      const result = await readDocument(shot.assets[0].uri, kind);
      if (kind === 'identity') {
        setForm((current) => ({
          ...current,
          firstName: result.firstName || current.firstName,
          lastName: result.lastName || current.lastName,
        }));
        setMessage('Kimlik okundu. Ad ve soyadı kontrol edin. Kimlik numarası kaydedilmedi.');
      } else {
        setForm((current) => ({
          ...current,
          plate: result.plate || current.plate,
          brand: result.brand || current.brand,
          model: result.model || current.model,
          modelYear: result.modelYear || current.modelYear,
          vin: result.vin || current.vin,
        }));
        setMessage('Ruhsat okundu. Algılanan araç bilgilerini kontrol edip gerekirse düzeltin.');
      }
    } catch (err) {
      setError(`Belge okunamadı: ${err?.message || 'OCR hatası'}. Bilgileri manuel girebilirsiniz.`);
    } finally {
      setScanBusy('');
    }
  }

  function updateItem(index, field, value) {
    setItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  }

  async function submit() {
    if (!customerId && !form.firstName.trim()) {
      setError('Yeni müşteri için en az ad bilgisi gerekli.');
      return;
    }
    if (!vehicleId && !form.plate.trim()) {
      setError('Araç plakası gerekli.');
      return;
    }
    if (!form.mileage.trim()) {
      setError('Araç kabul kilometresi gerekli.');
      return;
    }

    setBusy(true);
    setError('');
    setMessage('');
    try {
      await api.post('/inspections/mobile-intake-v3', {
        branchId: user?.branchId || undefined,
        customerId: customerId || undefined,
        customerFirstName: customerId ? undefined : form.firstName.trim(),
        customerLastName: customerId ? undefined : form.lastName.trim() || undefined,
        customerPhone: customerId ? undefined : form.phone.trim() || undefined,
        customerEmail: customerId ? undefined : form.email.trim() || undefined,
        vehicleId: vehicleId || undefined,
        plate: vehicleId ? undefined : form.plate.trim(),
        brand: vehicleId ? undefined : form.brand.trim() || undefined,
        model: vehicleId ? undefined : form.model.trim() || undefined,
        modelYear: !vehicleId && form.modelYear ? Number(form.modelYear) : undefined,
        vin: vehicleId ? undefined : form.vin.trim() || undefined,
        fuelType: vehicleId ? undefined : form.fuelType.trim() || undefined,
        transmission: vehicleId ? undefined : form.transmission.trim() || undefined,
        color: vehicleId ? undefined : form.color.trim() || undefined,
        mileage: Number(form.mileage || 0),
        customerComplaint: form.complaint.trim() || undefined,
        internalNote: form.internalNote.trim() || undefined,
        plannedItems: items.filter((item) => item.name.trim()).map((item) => ({
          type: item.type,
          name: item.name.trim(),
          quantity: Number(item.quantity || 1),
          unitPrice: 0,
          vatRate: 20,
        })),
      });

      Alert.alert('Araç kabul edildi', 'İş emri oluşturuldu ve fiyatlandırma için muhasebeye gönderildi.');
      setMessage('Kabul tamamlandı. Yeni araç kabulüne hazırsınız.');
      newCustomer();
      setItems([EMPTY_ITEM()]);
      await loadCustomers();
    } catch (err) {
      setError(apiMessage(err, 'Araç kabul işlemi tamamlanamadı.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenTitle title="Hızlı Araç Kabul" subtitle="Belgeyi okut, bilgileri kontrol et, müşteri talebini yaz ve kabulü tamamla." />
        <Message text={error} />
        <Message text={message} tone="success" />

        <Card style={styles.scanCard}>
          <Text style={styles.sectionTitle}>1. Belgeden otomatik doldur</Text>
          <View style={styles.buttonRow}>
            <View style={styles.flex}><Button title={scanBusy === 'identity' ? 'Okunuyor...' : 'Kimlik Oku'} onPress={() => scan('identity')} disabled={!!scanBusy || busy} /></View>
            <View style={styles.flex}><Button title={scanBusy === 'registration' ? 'Okunuyor...' : 'Ruhsat Oku'} onPress={() => scan('registration')} disabled={!!scanBusy || busy} tone="ghost" /></View>
          </View>
          <Text style={styles.help}>Kimlikten yalnızca ad/soyad alınır. T.C. kimlik numarası okunmaz veya kaydedilmez. OCR sonucu her zaman aşağıdan kontrol edilebilir.</Text>
        </Card>

        <Card style={styles.cardGap}>
          <View style={styles.sectionHead}><Text style={styles.sectionTitle}>2. Müşteri</Text><Pressable onPress={newCustomer}><Text style={styles.link}>+ Yeni müşteri</Text></Pressable></View>
          <Field label="Kayıtlı müşteri / plaka ara" placeholder="Ad, telefon veya plaka" value={search} onChangeText={setSearch} />
          {!!search && filteredCustomers.map((customer) => (
            <Pressable key={customer.id} style={styles.result} onPress={() => selectCustomer(customer)}>
              <Text style={styles.resultTitle}>{customer.firstName} {customer.lastName}</Text>
              <Text style={styles.resultSub}>{customer.phone || 'Telefon yok'} • {(customer.vehicles || []).map((vehicle) => vehicle.plate).join(', ') || 'Araç yok'}</Text>
            </Pressable>
          ))}
          {customerId ? <Text style={styles.selected}>✓ Kayıtlı müşteri seçildi</Text> : null}
          <View style={styles.twoCol}>
            <View style={styles.flex}><Field label="Ad" value={form.firstName} editable={!customerId} onChangeText={(value) => setForm({ ...form, firstName: value })} /></View>
            <View style={styles.flex}><Field label="Soyad" value={form.lastName} editable={!customerId} onChangeText={(value) => setForm({ ...form, lastName: value })} /></View>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.flex}><Field label="Telefon (opsiyonel)" keyboardType="phone-pad" value={form.phone} editable={!customerId} onChangeText={(value) => setForm({ ...form, phone: value })} /></View>
            <View style={styles.flex}><Field label="E-posta (opsiyonel)" keyboardType="email-address" autoCapitalize="none" value={form.email} editable={!customerId} onChangeText={(value) => setForm({ ...form, email: value })} /></View>
          </View>
        </Card>

        <Card style={styles.cardGap}>
          <Text style={styles.sectionTitle}>3. Araç</Text>
          {customerId && (customers.find((item) => item.id === customerId)?.vehicles || []).map((vehicle) => (
            <Pressable key={vehicle.id} style={[styles.vehicleChip, vehicleId === vehicle.id && styles.vehicleChipActive]} onPress={() => selectCustomer(customers.find((item) => item.id === customerId), vehicle.id)}>
              <Text style={styles.vehicleText}>{vehicle.plate} • {vehicle.brand} {vehicle.model}</Text>
            </Pressable>
          ))}
          <View style={styles.twoCol}>
            <View style={styles.flex}><Field label="Plaka" autoCapitalize="characters" value={form.plate} editable={!vehicleId} onChangeText={(value) => setForm({ ...form, plate: value.toLocaleUpperCase('tr-TR') })} /></View>
            <View style={styles.flex}><Field label="Kabul KM" keyboardType="number-pad" value={form.mileage} onChangeText={(value) => setForm({ ...form, mileage: value.replace(/\D/g, '') })} /></View>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.flex}><Field label="Marka" value={form.brand} editable={!vehicleId} onChangeText={(value) => setForm({ ...form, brand: value })} /></View>
            <View style={styles.flex}><Field label="Model" value={form.model} editable={!vehicleId} onChangeText={(value) => setForm({ ...form, model: value })} /></View>
          </View>
          <View style={styles.twoCol}>
            <View style={styles.flex}><Field label="Model Yılı" keyboardType="number-pad" value={form.modelYear} editable={!vehicleId} onChangeText={(value) => setForm({ ...form, modelYear: value.replace(/\D/g, '').slice(0, 4) })} /></View>
            <View style={styles.flex}><Field label="Şasi / VIN" autoCapitalize="characters" value={form.vin} editable={!vehicleId} onChangeText={(value) => setForm({ ...form, vin: value.toUpperCase() })} /></View>
          </View>
        </Card>

        <Card style={styles.cardGap}>
          <Text style={styles.sectionTitle}>4. Talep ve yapılacak işlemler</Text>
          <Field label="Müşterinin talebi / şikayeti" multiline style={styles.multiline} placeholder="Örn. Yağ bakımı ve ön takımdan gelen ses kontrol edilecek." value={form.complaint} onChangeText={(value) => setForm({ ...form, complaint: value })} />
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Pressable style={styles.typeButton} onPress={() => updateItem(index, 'type', item.type === 'LABOR' ? 'PART' : item.type === 'PART' ? 'OTHER' : 'LABOR')}>
                <Text style={styles.typeText}>{item.type === 'LABOR' ? 'İşçilik' : item.type === 'PART' ? 'Parça' : 'Diğer'}</Text>
              </Pressable>
              <View style={styles.itemName}><Field placeholder="Yapılacak işlem" value={item.name} onChangeText={(value) => updateItem(index, 'name', value)} /></View>
              <Pressable onPress={() => setItems((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : [EMPTY_ITEM()])}><Text style={styles.delete}>Sil</Text></Pressable>
            </View>
          ))}
          <Button title="+ İşlem Ekle" tone="ghost" onPress={() => setItems((current) => [...current, EMPTY_ITEM()])} />
          <View style={styles.noteGap}><Field label="İç servis notu (opsiyonel)" multiline style={styles.multiline} value={form.internalNote} onChangeText={(value) => setForm({ ...form, internalNote: value })} /></View>
        </Card>

        <View style={styles.submit}><Button title={busy ? 'Araç kabul ediliyor...' : 'ARACI KABUL ET'} onPress={submit} disabled={busy || !!scanBusy} /></View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 120 },
  cardGap: { marginTop: 12 },
  scanCard: { borderColor: '#5d461d' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  help: { marginTop: 10, color: colors.muted, fontSize: 10, lineHeight: 15 },
  link: { color: colors.accent, fontSize: 12, fontWeight: '800' },
  result: { padding: 11, marginBottom: 7, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.panel2 },
  resultTitle: { color: colors.text, fontSize: 12, fontWeight: '800' },
  resultSub: { marginTop: 3, color: colors.muted, fontSize: 10 },
  selected: { marginBottom: 10, color: '#86d6a8', fontSize: 11, fontWeight: '800' },
  twoCol: { flexDirection: 'row', gap: 8 },
  vehicleChip: { padding: 11, marginBottom: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.panel2 },
  vehicleChipActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  vehicleText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  multiline: { minHeight: 84, paddingTop: 12, textAlignVertical: 'top' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 3 },
  typeButton: { height: 44, minWidth: 62, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, backgroundColor: colors.panel2 },
  typeText: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  itemName: { flex: 1 },
  delete: { color: '#ef8f8f', fontSize: 10, fontWeight: '800' },
  noteGap: { marginTop: 12 },
  submit: { marginTop: 16 },
});

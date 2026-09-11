import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Crypto from 'expo-crypto';
import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button, Card, Field, Message, ScreenTitle } from '../components/UI';
import { readDocument } from '../documentOcr';
import { colors, spacing } from '../theme';

const emptyForm = () => ({ firstName: '', lastName: '', phone: '', email: '', plate: '', brand: '', model: '', modelYear: '', vin: '', mileage: '', complaint: '', internalNote: '', fuelLevel: '', existingDamage: '', valuablesNote: '' });
const emptyItem = () => ({ type: 'LABOR', name: '', quantity: '1' });
const normalizedPlate = value => String(value || '').replace(/\s+/g, '').toLocaleUpperCase('tr-TR');
const apiMessage = (e, fallback) => { const m = e?.response?.data?.message; return Array.isArray(m) ? m.join(', ') : m || e?.message || fallback; };

export default function QuickIntakeScreen({ initialCustomerId = '', initialVehicleId = '', onSeedConsumed }) {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [branchId, setBranchId] = useState(user?.branchId || '');
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState([emptyItem()]);
  const [photos, setPhotos] = useState([]);
  const [requestKey, setRequestKey] = useState(() => Crypto.randomUUID());
  const [submitted, setSubmitted] = useState(null);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const draftFile = `${FileSystem.documentDirectory}intake-${user?.organizationId}-${user?.id || user?.sub}.json`;
  const writes = useRef(Promise.resolve());
  const persist = value => {
    writes.current = writes.current.catch(() => {}).then(() => FileSystem.writeAsStringAsync(draftFile, JSON.stringify(value)));
    return writes.current;
  };
  const snapshot = { customerId, vehicleId, branchId, form, items, photos, requestKey, submitted };
  const latest = useRef(snapshot);
  latest.current = snapshot;

  useEffect(() => {
    let active = true;
    async function init() {
      if (!initialCustomerId) {
        try {
          const saved = JSON.parse(await FileSystem.readAsStringAsync(draftFile));
          if (active && saved.requestKey) {
            setCustomerId(saved.customerId || ''); setVehicleId(saved.vehicleId || '');
            setBranchId(saved.branchId || user?.branchId || ''); setForm({ ...emptyForm(), ...saved.form });
            setItems(saved.items || [emptyItem()]); setPhotos(saved.photos || []);
            setRequestKey(saved.requestKey); setSubmitted(saved.submitted || null);
            setMessage('Kaydedilen kabul taslağı geri yüklendi.');
          }
        } catch { /* A first visit has no saved draft. */ }
      }
      if (active) setReady(true);
      const results = await Promise.allSettled([api.get('/customers'), api.get('/branches/options'), api.get('/inspections/mobile-intake-v3/templates')]);
      if (!active) return;
      if (results[0].status === 'fulfilled') {
        const list = results[0].value.data; setCustomers(list);
        const seeded = list.find(c => c.id === initialCustomerId);
        if (seeded) selectCustomer(seeded, initialVehicleId);
      } else setError('Müşteri listesi alınamadı. Bağlantı geldiğinde Yenile düğmesini kullanın; taslağınız korunur.');
      if (results[1].status === 'fulfilled') setBranches(results[1].value.data);
      if (results[2].status === 'fulfilled') setTemplates(results[2].value.data);
      onSeedConsumed?.();
    }
    init();
    return () => { active = false; if (ready) persist(latest.current).catch(() => {}); };
  }, []);

  useEffect(() => {
    if (ready) persist(snapshot).catch(() => setError('Taslak cihaza kaydedilemedi. Depolama alanını kontrol edin.'));
  }, [ready, customerId, vehicleId, branchId, form, items, photos, requestKey, submitted]);

  const matches = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('tr-TR');
    if (!term) return [];
    return customers.filter(c => `${c.firstName} ${c.lastName} ${c.phone || ''}`.toLocaleLowerCase('tr-TR').includes(term)
      || (c.vehicles || []).some(v => normalizedPlate(v.plate).includes(normalizedPlate(search)))).slice(0, 8);
  }, [customers, search]);

  function selectCustomer(customer, preferredId = '') {
    const vehicles = customer.vehicles || [];
    const vehicle = vehicles.find(v => v.id === preferredId)
      || vehicles.find(v => normalizedPlate(v.plate) === normalizedPlate(search))
      || (vehicles.length === 1 ? vehicles[0] : null);
    setCustomerId(customer.id); setVehicleId(vehicle?.id || ''); setSearch('');
    setForm(current => ({ ...current, firstName: customer.firstName || '', lastName: customer.lastName || '', phone: customer.phone || '', email: customer.email || '',
      plate: vehicle?.plate || '', brand: vehicle?.brand || '', model: vehicle?.model || '', modelYear: String(vehicle?.modelYear || ''), vin: vehicle?.vin || '', mileage: '' }));
  }
  function newVehicle() {
    setVehicleId(''); setForm(current => ({ ...current, plate: '', brand: '', model: '', modelYear: '', vin: '', mileage: '' }));
  }
  function reset() {
    setCustomerId(''); setVehicleId(''); setForm(emptyForm()); setItems([emptyItem()]); setPhotos([]);
    setSubmitted(null); setRequestKey(Crypto.randomUUID()); setSearch('');
  }
  async function capture(kind = 'photo', library = false) {
    setError(''); setBusy(true);
    try {
      const permission = library ? await ImagePicker.requestMediaLibraryPermissionsAsync() : await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Kamera veya fotoğraf erişim izni gerekli.');
      const result = library ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.75 }) : await ImagePicker.launchCameraAsync({ quality: 0.75 });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (kind === 'photo') {
        const key = Crypto.randomUUID();
        const extension = asset.mimeType === 'image/png' ? 'png' : asset.mimeType === 'image/heic' ? 'heic' : 'jpg';
        const uri = `${FileSystem.documentDirectory}intake-photo-${key}.${extension}`;
        await FileSystem.copyAsync({ from: asset.uri, to: uri });
        setPhotos(current => [...current, { uri, requestKey: key, name: `${key}.${extension}`, mimeType: asset.mimeType || 'image/jpeg', uploaded: false }]);
      } else {
        if ((kind === 'identity' && customerId) || (kind === 'registration' && vehicleId)) throw new Error('Kayıtlı bilgiyi değiştirmek için önce Yeni müşteri / Yeni araç seçin.');
        const values = await readDocument(asset.uri, kind);
        setForm(current => ({ ...current, ...(kind === 'identity' ? { firstName: values.firstName || '', lastName: values.lastName || '' }
          : { plate: values.plate || '', brand: values.brand || '', model: values.model || '', modelYear: values.modelYear || '', vin: values.vin || '' }) }));
        setMessage('Belge okundu. Kaydetmeden önce bilgileri kontrol edin.');
      }
    } catch (e) { setError(apiMessage(e, 'Fotoğraf veya belge okunamadı.')); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (sending.current || busy) return;
    if (!branchId) return setError('Şube seçin.');
    if (!submitted && ((!customerId && form.firstName.trim().length < 2) || (!vehicleId && (!form.plate.trim() || !form.brand.trim() || !form.model.trim())) || !form.mileage.trim()))
      return setError('Müşteri adı, araç bilgileri ve güncel kabul kilometresini tamamlayın.');
    sending.current = true; setBusy(true); setError('');
    try {
      await persist(latest.current);
      let result = submitted;
      if (!result) {
        const response = await api.post('/inspections/mobile-intake-v3', {
          requestKey, branchId, customerId: customerId || undefined, vehicleId: vehicleId || undefined,
          customerFirstName: customerId ? undefined : form.firstName.trim(), customerLastName: customerId ? undefined : form.lastName.trim() || undefined,
          customerPhone: customerId ? undefined : form.phone.trim() || undefined, customerEmail: customerId ? undefined : form.email.trim() || undefined,
          plate: vehicleId ? undefined : normalizedPlate(form.plate), brand: vehicleId ? undefined : form.brand.trim(), model: vehicleId ? undefined : form.model.trim(),
          modelYear: !vehicleId && form.modelYear ? Number(form.modelYear) : undefined, vin: !vehicleId && form.vin ? form.vin.trim() : undefined,
          mileage: Number(form.mileage), customerComplaint: form.complaint || undefined, internalNote: form.internalNote || undefined,
          fuelLevel: form.fuelLevel || undefined, existingDamage: form.existingDamage || undefined, valuablesNote: form.valuablesNote || undefined,
          plannedItems: items.filter(i => i.name.trim()).map(i => ({ type: i.type, name: i.name.trim(), quantity: Number(i.quantity || 1), unitPrice: 0, vatRate: 20 })),
        });
        result = { orderId: response.data.serviceOrder.id, inspectionId: response.data.inspection.id };
        setSubmitted(result); await persist({ ...latest.current, submitted: result });
      }
      const remainingPhotos = [...photos];
      for (let i = 0; i < remainingPhotos.length; i++) {
        const photo = remainingPhotos[i]; if (photo.uploaded) continue;
        const body = new FormData();
        body.append('file', { uri: photo.uri, name: photo.name, type: photo.mimeType });
        body.append('type', 'ACCEPTANCE'); body.append('serviceOrderId', result.orderId); body.append('inspectionId', result.inspectionId);
        body.append('requestKey', photo.requestKey); body.append('customerVisible', 'false');
        await api.post('/media/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
        remainingPhotos[i] = { ...photo, uploaded: true }; setPhotos([...remainingPhotos]);
        await persist({ ...latest.current, submitted: result, photos: remainingPhotos });
      }
      reset();
      await persist({ ...latest.current, form: emptyForm(), customerId: '', vehicleId: '', items: [emptyItem()], photos: [], submitted: null, requestKey: Crypto.randomUUID() });
      for (const photo of photos) FileSystem.deleteAsync(photo.uri, { idempotent: true }).catch(() => {});
      setMessage('Kabul ve fotoğraflar kaydedildi. Ofis aynı iş emrini görebilir.');
      Alert.alert('Kabul tamamlandı', 'İş emri ve fotoğraflar kaydedildi.');
    } catch (e) { setError(apiMessage(e, 'Kayıt tamamlanamadı. Taslak korunuyor; tekrar deneyebilirsiniz.')); }
    finally { sending.current = false; setBusy(false); }
  }
  const field = (key, label, extra = {}) => <Field label={label} value={form[key]} editable={!busy && !submitted && !(customerId && ['firstName','lastName','phone','email'].includes(key)) && !(vehicleId && ['plate','brand','model','modelYear','vin'].includes(key))} onChangeText={value => setForm(current => ({ ...current, [key]: value }))} {...extra} />;
  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenTitle title="Araç Kabul" subtitle="Bir kez kaydet; ofis ve teknik ekip aynı iş emrinde devam etsin." />
      <Message text={error} /><Message text={message} tone="success" />
      {submitted && <Text style={styles.info}>İş emri kaydedildi. Kalan fotoğrafları göndermek için tekrar deneyin.</Text>}
      <View pointerEvents={busy || submitted ? 'none' : 'auto'}>
        <Card><Text style={styles.heading}>Şube</Text>{branches.map(b => <Button key={b.id} title={`${b.id === branchId ? '✓ ' : ''}${b.name}`} tone="ghost" onPress={() => setBranchId(b.id)} />)}</Card>
        <Card><Text style={styles.heading}>Müşteri ve araç</Text>
          <Field label="Müşteri / plaka ara" value={search} onChangeText={setSearch} />
          <Button title="Listeyi yenile" tone="ghost" onPress={() => api.get('/customers').then(r => setCustomers(r.data)).catch(e => setError(apiMessage(e, 'Liste alınamadı.')))} />
          {matches.map(c => <Pressable key={c.id} onPress={() => selectCustomer(c)}><Text style={styles.info}>{c.firstName} {c.lastName} • {(c.vehicles || []).map(v => v.plate).join(', ')}</Text></Pressable>)}
          <Button title="Yeni müşteri" tone="ghost" onPress={() => { setCustomerId(''); newVehicle(); setForm(emptyForm()); }} />
          <Button title="Kimlikten ad/soyad oku" tone="ghost" disabled={!!customerId} onPress={() => capture('identity')} />
          {field('firstName','Ad')}{field('lastName','Soyad')}{field('phone','Telefon (isteğe bağlı)',{ keyboardType: 'phone-pad' })}{field('email','E-posta (isteğe bağlı)',{ autoCapitalize: 'none' })}
          {customerId && <Text style={styles.info}>Kayıtlı müşterinin iletişim bilgisi ofisteki müşteri ekranından tamamlanabilir.</Text>}
          {(customers.find(c => c.id === customerId)?.vehicles || []).map(v => <Button key={v.id} title={`${v.id === vehicleId ? '✓ ' : ''}${v.plate}`} tone="ghost" onPress={() => selectCustomer(customers.find(c => c.id === customerId), v.id)} />)}
          <Button title="Bu müşteriye yeni araç" tone="ghost" onPress={newVehicle} />
          <Button title="Ruhsat oku" tone="ghost" disabled={!!vehicleId} onPress={() => capture('registration')} />
          {field('plate','Plaka')}{field('brand','Marka')}{field('model','Model')}{field('modelYear','Model yılı',{ keyboardType: 'number-pad' })}{field('vin','Şasi / VIN')}{field('mileage','Güncel kabul KM',{ keyboardType: 'number-pad' })}
        </Card>
        <Card><Text style={styles.heading}>Kabul kontrolü</Text>
          {field('complaint','Müşteri talebi',{ multiline: true })}{field('fuelLevel','Yakıt seviyesi')}{field('existingDamage','Mevcut hasarlar',{ multiline: true })}{field('valuablesNote','Araçta bırakılan eşyalar')}{field('internalNote','İç servis notu',{ multiline: true })}
          <Button title="Kabul fotoğrafı çek" onPress={() => capture()} /><Button title="Galeriden fotoğraf ekle" tone="ghost" onPress={() => capture('photo', true)} />
          {photos.map(photo => <View key={photo.requestKey}><Image source={{ uri: photo.uri }} style={styles.photo} /><Button title="Fotoğrafı kaldır" tone="ghost" onPress={() => setPhotos(current => current.filter(p => p.requestKey !== photo.requestKey))} /></View>)}
        </Card>
        <Card><Text style={styles.heading}>Yapılacak işlemler</Text>
          {templates.map(t => <Button key={t.code} title={`+ ${t.name}`} tone="ghost" onPress={() => setItems(current => [...current.filter(i => i.name.trim()), ...t.items.map(i => ({ type: i.type, name: i.name, quantity: String(i.quantity) }))])} />)}
          {items.map((item,index) => <View key={index}>
            <Field label="İşlem" value={item.name} onChangeText={value => setItems(current => current.map((i,n) => n === index ? { ...i, name: value } : i))} />
            <Field label="Miktar" value={item.quantity} keyboardType="decimal-pad" onChangeText={value => setItems(current => current.map((i,n) => n === index ? { ...i, quantity: value.replace(',', '.') } : i))} />
            <Button title={`${item.type === 'PART' ? 'Parça' : 'İşçilik'} • türü değiştir`} tone="ghost" onPress={() => setItems(current => current.map((i,n) => n === index ? { ...i, type: i.type === 'PART' ? 'LABOR' : 'PART' } : i))} />
            <Button title="Kalemi kaldır" tone="ghost" onPress={() => setItems(current => current.filter((_,n) => n !== index))} />
          </View>)}<Button title="+ İşlem ekle" tone="ghost" onPress={() => setItems(current => [...current, emptyItem()])} />
        </Card>
      </View>
      <Button title={busy ? 'Kaydediliyor...' : submitted ? 'Kalan fotoğrafları gönder' : 'Aracı kabul et'} onPress={submit} disabled={busy || !ready} />
    </ScrollView>
  </KeyboardAvoidingView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: colors.bg }, content: { padding: spacing.md, paddingBottom: 120, gap: 14 }, heading: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 10 }, info: { color: colors.muted, paddingVertical: 10 }, photo: { height: 160, borderRadius: 10, marginTop: 12 } });

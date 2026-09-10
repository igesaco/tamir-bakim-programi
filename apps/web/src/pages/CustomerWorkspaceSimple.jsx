import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { statusLabel } from '../utils/status';
import './CustomerWorkspaceSimple.css';

const EMPTY_WORK_ITEM = () => ({
  type: 'LABOR',
  name: '',
  description: '',
  quantity: 1,
});

const EMPTY_QUOTE_ITEM = () => ({
  type: 'LABOR',
  name: '',
  description: '',
  quantity: 1,
  unitPrice: '',
  discountAmount: 0,
  vatRate: 20,
});

function apiMessage(error, fallback) {
  const message = error?.response?.data?.message;
  return Array.isArray(message)
    ? message.join(', ')
    : message || fallback;
}

function money(value) {
  return Number(value || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CustomerWorkspaceSimple() {
  const { id } = useParams();
  const { user } = useAuth();

  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingVehicleId, setEditingVehicleId] = useState('');
  const [pricingOrderId, setPricingOrderId] = useState('');

  const [customerForm, setCustomerForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });

  const [vehicleForm, setVehicleForm] = useState({
    plate: '',
    brand: '',
    model: '',
    modelYear: '',
    mileage: '',
    fuelType: '',
    transmission: '',
    color: '',
    vin: '',
    notes: '',
  });

  const [orderForm, setOrderForm] = useState({
    vehicleId: '',
    mileage: '',
    complaint: '',
    internalNote: '',
  });
  const [workItems, setWorkItems] = useState([EMPTY_WORK_ITEM()]);
  const [quoteItems, setQuoteItems] = useState([EMPTY_QUOTE_ITEM()]);

  const canEdit = ['OWNER', 'MANAGER', 'SERVICE_ADVISOR'].includes(user?.role);
  const canCreateOrder = canEdit;
  const canPrice = ['OWNER', 'MANAGER', 'SERVICE_ADVISOR', 'ACCOUNTING'].includes(user?.role);

  async function load() {
    setError('');
    const [customerResponse, ordersResponse, quotesResponse] = await Promise.all([
      api.get(`/customers/${id}`),
      api.get('/service-orders'),
      api.get('/quotes').catch(() => ({ data: [] })),
    ]);

    const nextCustomer = customerResponse.data;
    setCustomer(nextCustomer);
    setOrders(ordersResponse.data.filter((item) => item.customerId === id));
    setQuotes(quotesResponse.data.filter((item) => item.customerId === id));
    setCustomerForm({
      firstName: nextCustomer.firstName || '',
      lastName: nextCustomer.lastName || '',
      phone: nextCustomer.phone || '',
      email: nextCustomer.email || '',
      address: nextCustomer.address || '',
      notes: nextCustomer.notes || '',
    });

    if (!orderForm.vehicleId && nextCustomer.vehicles?.length) {
      const vehicle = nextCustomer.vehicles[0];
      setOrderForm((current) => ({
        ...current,
        vehicleId: vehicle.id,
        mileage: String(vehicle.mileage || 0),
      }));
    }
  }

  useEffect(() => {
    load().catch((err) => setError(apiMessage(err, 'Müşteri paneli yüklenemedi.')));
  }, [id]);

  const quoteTotals = useMemo(() => quoteItems.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    const discount = Number(item.discountAmount) || 0;
    const net = Math.max(0, quantity * unitPrice - discount);
    const tax = net * ((Number(item.vatRate) || 0) / 100);
    return {
      subtotal: sum.subtotal + quantity * unitPrice,
      discount: sum.discount + discount,
      tax: sum.tax + tax,
      total: sum.total + net + tax,
    };
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 }), [quoteItems]);

  function beginAction() {
    setBusy(true);
    setError('');
    setMessage('');
  }

  async function saveCustomer(event) {
    event.preventDefault();
    beginAction();
    try {
      await api.patch(`/customers/${id}`, {
        firstName: customerForm.firstName,
        lastName: customerForm.lastName || undefined,
        phone: customerForm.phone || undefined,
        email: customerForm.email || undefined,
        address: customerForm.address || undefined,
        notes: customerForm.notes || undefined,
      });
      setMessage('Müşteri bilgileri güncellendi.');
      await load();
    } catch (err) {
      setError(apiMessage(err, 'Müşteri güncellenemedi.'));
    } finally {
      setBusy(false);
    }
  }

  function editVehicle(vehicle) {
    setEditingVehicleId(vehicle.id);
    setVehicleForm({
      plate: vehicle.plate || '',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      modelYear: vehicle.modelYear ? String(vehicle.modelYear) : '',
      mileage: String(vehicle.mileage || 0),
      fuelType: vehicle.fuelType || '',
      transmission: vehicle.transmission || '',
      color: vehicle.color || '',
      vin: vehicle.vin || '',
      notes: vehicle.notes || '',
    });
  }

  async function saveVehicle(event) {
    event.preventDefault();
    beginAction();
    try {
      await api.patch(`/vehicles/${editingVehicleId}`, {
        plate: vehicleForm.plate,
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        modelYear: vehicleForm.modelYear ? Number(vehicleForm.modelYear) : undefined,
        mileage: Number(vehicleForm.mileage || 0),
        fuelType: vehicleForm.fuelType || undefined,
        transmission: vehicleForm.transmission || undefined,
        color: vehicleForm.color || undefined,
        vin: vehicleForm.vin || undefined,
        notes: vehicleForm.notes || undefined,
      });
      setEditingVehicleId('');
      setMessage('Araç bilgileri güncellendi.');
      await load();
    } catch (err) {
      setError(apiMessage(err, 'Araç bilgileri güncellenemedi.'));
    } finally {
      setBusy(false);
    }
  }

  function updateWorkItem(index, field, value) {
    setWorkItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  }

  async function createOrder(event) {
    event.preventDefault();
    const validItems = workItems.filter((item) => item.name.trim());
    beginAction();
    try {
      const response = await api.post('/service-orders', {
        customerId: id,
        vehicleId: orderForm.vehicleId,
        mileage: Number(orderForm.mileage || 0),
        complaint: orderForm.complaint || undefined,
        internalNote: orderForm.internalNote || undefined,
      });

      for (const item of validItems) {
        await api.post(`/service-orders/${response.data.id}/items`, {
          type: item.type,
          name: item.name.trim(),
          description: item.description.trim() || undefined,
          quantity: Number(item.quantity || 1),
          unitPrice: 0,
          discountAmount: 0,
          vatRate: 20,
        });
      }

      setWorkItems([EMPTY_WORK_ITEM()]);
      setOrderForm((current) => ({ ...current, complaint: '', internalNote: '' }));
      setMessage('İş emri müşteri panelinden oluşturuldu. Muhasebe artık aynı ekrandan fiyatlandırabilir.');
      await load();
    } catch (err) {
      setError(apiMessage(err, 'İş emri oluşturulamadı.'));
    } finally {
      setBusy(false);
    }
  }

  function beginPricing(order) {
    setPricingOrderId(order.id);
    setQuoteItems(order.items?.length
      ? order.items.map((item) => ({
          type: item.type,
          name: item.name,
          description: item.description || '',
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || '',
          discountAmount: Number(item.discountAmount) || 0,
          vatRate: Number(item.vatRate) || 20,
        }))
      : [EMPTY_QUOTE_ITEM()]);
  }

  function updateQuoteItem(index, field, value) {
    setQuoteItems((current) => current.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  }

  async function createQuote(order, sendToCustomer = false) {
    beginAction();
    try {
      const response = await api.post('/quotes', {
        customerId: id,
        vehicleId: order.vehicleId,
        serviceOrderId: order.id,
        notes: order.complaint ? `Müşteri talebi: ${order.complaint}` : undefined,
        items: quoteItems.filter((item) => item.name.trim()).map((item) => ({
          type: item.type,
          name: item.name.trim(),
          description: item.description.trim() || undefined,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
          discountAmount: Number(item.discountAmount || 0),
          vatRate: Number(item.vatRate || 0),
        })),
      });

      if (sendToCustomer) {
        await api.patch(`/quotes/${response.data.id}/status`, { status: 'SENT' });
      }
      setPricingOrderId('');
      setMessage(sendToCustomer ? 'Teklif oluşturuldu ve müşteriye gönderildi.' : 'Teklif taslağı oluşturuldu.');
      await load();
    } catch (err) {
      setError(apiMessage(err, 'Teklif oluşturulamadı.'));
    } finally {
      setBusy(false);
    }
  }

  if (!customer) {
    return <div className="page-message">{error || 'Müşteri paneli yükleniyor...'}</div>;
  }

  const vehicles = customer.vehicles || [];

  return (
    <div className="simple-workspace">
      <div className="page-heading simple-heading">
        <div>
          <span className="simple-eyebrow">HIZLI SERVİS ÇALIŞMA ALANI</span>
          <h1>{customer.firstName} {customer.lastName}</h1>
          <p>Müşteri → araç → iş emri → fiyatlandırma. Günlük servis akışı tek ekranda.</p>
        </div>
        <Link className="small-button" to="/customers">← Müşteriler</Link>
      </div>

      {message && <div className="page-message success-message">{message}</div>}
      {error && <div className="page-message error-message">{error}</div>}

      <div className="simple-stepbar">
        <span>1 Müşteri</span><b>→</b><span>2 Araç</span><b>→</b><span>3 İş Emri</span><b>→</b><span>4 Teklif</span>
      </div>

      <section className="panel-card simple-section">
        <div className="simple-section-title">
          <div><small>1</small><h3>Müşteri Bilgileri</h3></div>
          <span>{customer.phone || 'Telefon girilmemiş'}</span>
        </div>
        <form className="form-grid" onSubmit={saveCustomer}>
          <input placeholder="Ad" value={customerForm.firstName} disabled={!canEdit} onChange={(e) => setCustomerForm({ ...customerForm, firstName: e.target.value })} required />
          <input placeholder="Soyad" value={customerForm.lastName} disabled={!canEdit} onChange={(e) => setCustomerForm({ ...customerForm, lastName: e.target.value })} />
          <input placeholder="Telefon" value={customerForm.phone} disabled={!canEdit} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} />
          <input type="email" placeholder="E-posta" value={customerForm.email} disabled={!canEdit} onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })} />
          <input className="full" placeholder="Adres" value={customerForm.address} disabled={!canEdit} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} />
          <textarea className="full" placeholder="Müşteri notu" value={customerForm.notes} disabled={!canEdit} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} />
          {canEdit && <button className="primary-button full" disabled={busy}>Müşteri Bilgilerini Kaydet</button>}
        </form>
      </section>

      <section className="panel-card simple-section">
        <div className="simple-section-title"><div><small>2</small><h3>Araçlar</h3></div><span>{vehicles.length} araç</span></div>
        <div className="simple-vehicle-grid">
          {vehicles.map((vehicle) => (
            <article className="simple-vehicle" key={vehicle.id}>
              <strong>{vehicle.plate}</strong>
              <span>{vehicle.brand} {vehicle.model} {vehicle.modelYear || ''}</span>
              <span>{Number(vehicle.mileage || 0).toLocaleString('tr-TR')} km • {vehicle.fuelType || 'Yakıt -'}</span>
              <div className="action-row">
                {canEdit && <button className="small-button" type="button" onClick={() => editVehicle(vehicle)}>Düzenle</button>}
                <Link className="table-link" to={`/vehicles/${vehicle.id}`}>Detay</Link>
              </div>
            </article>
          ))}
        </div>
        {editingVehicleId && canEdit && (
          <form className="form-grid simple-edit-box" onSubmit={saveVehicle}>
            <input placeholder="Plaka" value={vehicleForm.plate} onChange={(e) => setVehicleForm({ ...vehicleForm, plate: e.target.value })} required />
            <input placeholder="Marka" value={vehicleForm.brand} onChange={(e) => setVehicleForm({ ...vehicleForm, brand: e.target.value })} required />
            <input placeholder="Model" value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} required />
            <input type="number" placeholder="Model yılı" value={vehicleForm.modelYear} onChange={(e) => setVehicleForm({ ...vehicleForm, modelYear: e.target.value })} />
            <input type="number" placeholder="KM" value={vehicleForm.mileage} onChange={(e) => setVehicleForm({ ...vehicleForm, mileage: e.target.value })} />
            <input placeholder="Yakıt" value={vehicleForm.fuelType} onChange={(e) => setVehicleForm({ ...vehicleForm, fuelType: e.target.value })} />
            <input placeholder="Şanzıman" value={vehicleForm.transmission} onChange={(e) => setVehicleForm({ ...vehicleForm, transmission: e.target.value })} />
            <input placeholder="Renk" value={vehicleForm.color} onChange={(e) => setVehicleForm({ ...vehicleForm, color: e.target.value })} />
            <input className="full" placeholder="Şasi / VIN" value={vehicleForm.vin} onChange={(e) => setVehicleForm({ ...vehicleForm, vin: e.target.value })} />
            <textarea className="full" placeholder="Araç notu" value={vehicleForm.notes} onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })} />
            <button className="primary-button" disabled={busy}>Aracı Kaydet</button>
            <button className="small-button" type="button" onClick={() => setEditingVehicleId('')}>Vazgeç</button>
          </form>
        )}
      </section>

      {canCreateOrder && (
        <section className="panel-card simple-section simple-primary-section">
          <div className="simple-section-title"><div><small>3</small><h3>Yeni İş Emri</h3></div><span>Müşteri talebini burada kaydedin</span></div>
          <form onSubmit={createOrder}>
            <div className="form-grid">
              <select value={orderForm.vehicleId} onChange={(e) => {
                const vehicle = vehicles.find((item) => item.id === e.target.value);
                setOrderForm({ ...orderForm, vehicleId: e.target.value, mileage: String(vehicle?.mileage || 0) });
              }} required>
                <option value="">Araç seç</option>
                {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plate} - {vehicle.brand} {vehicle.model}</option>)}
              </select>
              <input type="number" min="0" placeholder="Kabul KM" value={orderForm.mileage} onChange={(e) => setOrderForm({ ...orderForm, mileage: e.target.value })} required />
              <textarea className="full" placeholder="Müşterinin talebi / şikayeti" value={orderForm.complaint} onChange={(e) => setOrderForm({ ...orderForm, complaint: e.target.value })} />
              <textarea className="full" placeholder="İç servis notu (müşteriye gösterilmez)" value={orderForm.internalNote} onChange={(e) => setOrderForm({ ...orderForm, internalNote: e.target.value })} />
            </div>
            <div className="simple-items-title"><strong>Yapılacak İşlemler</strong><button className="small-button" type="button" onClick={() => setWorkItems((current) => [...current, EMPTY_WORK_ITEM()])}>+ İşlem Ekle</button></div>
            {workItems.map((item, index) => (
              <div className="simple-item-row" key={index}>
                <select value={item.type} onChange={(e) => updateWorkItem(index, 'type', e.target.value)}><option value="LABOR">İşçilik</option><option value="PART">Parça</option><option value="OTHER">Diğer</option></select>
                <input placeholder="İşlem adı (örn. Motor yağı değişimi)" value={item.name} onChange={(e) => updateWorkItem(index, 'name', e.target.value)} />
                <input type="number" min="0.01" step="0.01" placeholder="Miktar" value={item.quantity} onChange={(e) => updateWorkItem(index, 'quantity', e.target.value)} />
                <button className="table-action danger-text" type="button" onClick={() => setWorkItems((current) => current.length > 1 ? current.filter((_, itemIndex) => itemIndex !== index) : [EMPTY_WORK_ITEM()])}>Sil</button>
              </div>
            ))}
            <button className="primary-button simple-main-action" disabled={busy || !vehicles.length}>İş Emrini Oluştur</button>
          </form>
        </section>
      )}

      <section className="panel-card simple-section">
        <div className="simple-section-title"><div><small>4</small><h3>İş Emirleri ve Fiyatlandırma</h3></div><span>{orders.length} kayıt</span></div>
        <div className="simple-order-list">
          {orders.map((order) => {
            const orderQuotes = quotes.filter((quote) => quote.serviceOrderId === order.id);
            return (
              <article className="simple-order" key={order.id}>
                <div className="simple-order-head">
                  <div><strong>{order.orderNumber}</strong><span>{order.vehicle?.plate} • {order.complaint || 'Talep notu yok'}</span></div>
                  <span className="status-badge">{statusLabel(order.status)}</span>
                </div>
                {!!order.items?.length && <div className="simple-tags">{order.items.map((item) => <span key={item.id}>{item.name}</span>)}</div>}
                <div className="action-row">
                  <Link className="table-link" to={`/service-orders/${order.id}`}>İş Emri Detayı</Link>
                  {canPrice && <button className="small-button" type="button" onClick={() => beginPricing(order)}>Fiyatlandır / Teklif</button>}
                  {orderQuotes.map((quote) => <Link key={quote.id} className="table-link" to={`/quotes/${quote.id}/proforma`}>Proforma • {statusLabel(quote.status)}</Link>)}
                </div>

                {pricingOrderId === order.id && canPrice && (
                  <div className="simple-pricing-box">
                    <h4>Teklif Kalemleri</h4>
                    {quoteItems.map((item, index) => (
                      <div className="simple-quote-row" key={index}>
                        <select value={item.type} onChange={(e) => updateQuoteItem(index, 'type', e.target.value)}><option value="LABOR">İşçilik</option><option value="PART">Parça</option><option value="OTHER">Diğer</option></select>
                        <input placeholder="Kalem" value={item.name} onChange={(e) => updateQuoteItem(index, 'name', e.target.value)} />
                        <input type="number" min="0.01" step="0.01" placeholder="Adet" value={item.quantity} onChange={(e) => updateQuoteItem(index, 'quantity', e.target.value)} />
                        <input type="number" min="0" step="0.01" placeholder="Birim ₺" value={item.unitPrice} onChange={(e) => updateQuoteItem(index, 'unitPrice', e.target.value)} />
                        <input type="number" min="0" step="0.01" placeholder="İndirim ₺" value={item.discountAmount} onChange={(e) => updateQuoteItem(index, 'discountAmount', e.target.value)} />
                        <input type="number" min="0" max="100" step="0.01" placeholder="KDV %" value={item.vatRate} onChange={(e) => updateQuoteItem(index, 'vatRate', e.target.value)} />
                      </div>
                    ))}
                    <button className="small-button" type="button" onClick={() => setQuoteItems((current) => [...current, EMPTY_QUOTE_ITEM()])}>+ Kalem Ekle</button>
                    <div className="simple-total"><span>Ara Toplam {money(quoteTotals.subtotal)} ₺</span><span>KDV {money(quoteTotals.tax)} ₺</span><strong>{money(quoteTotals.total)} ₺</strong></div>
                    <div className="action-row">
                      <button className="small-button" type="button" disabled={busy} onClick={() => createQuote(order, false)}>Taslak Kaydet</button>
                      <button className="primary-button" type="button" disabled={busy} onClick={() => createQuote(order, true)}>Oluştur ve Müşteriye Gönder</button>
                      <button className="table-action" type="button" onClick={() => setPricingOrderId('')}>Vazgeç</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
          {!orders.length && <div className="empty-state">Bu müşteri için henüz iş emri yok.</div>}
        </div>
      </section>
    </div>
  );
}

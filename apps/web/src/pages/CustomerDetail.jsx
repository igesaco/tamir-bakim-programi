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
import { useAuth } from '../auth/AuthContext';
import { statusLabel } from '../utils/status';

const tabs = [
  ['vehicles', 'Araçlar'],
  ['maintenance', 'Bakım Planlaması'],
  ['quotes', 'Teklifler'],
  ['appointments', 'Randevular'],
  ['account', 'Cari'],
  ['contact', 'İletişim'],
];

const emptyQuoteItem = () => ({
  type: 'LABOR',
  name: '',
  description: '',
  quantity: 1,
  unitPrice: '',
  discountAmount: 0,
  vatRate: 20,
});

function money(value) {
  return Number(value || 0).toLocaleString(
    'tr-TR',
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  );
}

function apiMessage(error, fallback) {
  const message =
    error?.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message || fallback;
}

export default function CustomerDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [activeTab, setActiveTab] =
    useState('vehicles');
  const [customer, setCustomer] =
    useState(null);
  const [orders, setOrders] =
    useState([]);
  const [quotes, setQuotes] =
    useState([]);
  const [appointments, setAppointments] =
    useState([]);
  const [maintenancePlans, setMaintenancePlans] =
    useState([]);
  const [maintenanceRecords, setMaintenanceRecords] =
    useState([]);
  const [packages, setPackages] =
    useState([]);
  const [payments, setPayments] =
    useState([]);
  const [makes, setMakes] =
    useState([]);
  const [vehicleModels, setVehicleModels] =
    useState([]);
  const [catalogWarning, setCatalogWarning] =
    useState('');

  const [busy, setBusy] =
    useState(false);
  const [message, setMessage] =
    useState('');
  const [error, setError] =
    useState('');

  const canViewFinance = [
    'OWNER',
    'MANAGER',
  ].includes(user?.role);

  const [vehicleForm, setVehicleForm] =
    useState({
      plate: '',
      brand: '',
      model: '',
      modelYear: '',
      mileage: '',
      fuelType: '',
      transmission: '',
      color: '',
      vin: '',
    });

  const [maintenanceForm, setMaintenanceForm] =
    useState({
      vehicleId: '',
      title: '',
      category: '',
      intervalKm: '',
      intervalMonths: '',
      nextDueKm: '',
      nextDueDate: '',
      estimatedPriceMin: '',
      estimatedPriceMax: '',
    });

  const [quoteForm, setQuoteForm] =
    useState({
      vehicleId: '',
      serviceOrderId: '',
      notes: '',
    });

  const [quoteItems, setQuoteItems] =
    useState([
      emptyQuoteItem(),
    ]);

  const [
    selectedPackageId,
    setSelectedPackageId,
  ] = useState('');

  const [appointmentForm, setAppointmentForm] =
    useState({
      vehicleId: '',
      startAt: '',
      serviceType: '',
      customerNote: '',
    });

  const [paymentForm, setPaymentForm] =
    useState({
      serviceOrderId: '',
      quoteId: '',
      amount: '',
      method: 'CASH',
      reference: '',
    });

  const [contactForm, setContactForm] =
    useState({
      phone: '',
      email: '',
      taxNumber: '',
      address: '',
      notes: '',
    });

  async function loadVehicleModels(
    make,
    year,
  ) {
    const cleanMake =
      String(make || '').trim();

    if (!cleanMake) {
      setVehicleModels([]);
      return;
    }

    try {
      const response =
        await api.get(
          '/vehicle-catalog/models',
          {
            params: {
              make: cleanMake,
              year:
                year || undefined,
            },
          },
        );

      setVehicleModels(
        response.data,
      );
      setCatalogWarning('');
    } catch {
      setVehicleModels([]);
      setCatalogWarning(
        'Model kataloğu yüklenemedi. Modeli manuel yazabilirsiniz.',
      );
    }
  }

  async function load() {
    setError('');

    const requests = [
      api.get(`/customers/${id}`),
      api.get('/service-orders'),
      api.get('/quotes'),
      api.get('/appointments'),
      api.get('/maintenance/plans'),
      api.get('/maintenance/records'),
      api.get('/maintenance/packages'),
    ];

    if (canViewFinance) {
      requests.push(
        api.get('/billing/payments'),
      );
    }

    const responses =
      await Promise.all(requests);

    const [
      customerResponse,
      ordersResponse,
      quotesResponse,
      appointmentsResponse,
      plansResponse,
      recordsResponse,
      packagesResponse,
      paymentsResponse,
    ] = responses;

    const nextCustomer =
      customerResponse.data;

    const vehicleIds =
      new Set(
        (
          nextCustomer.vehicles ||
          []
        ).map(
          (vehicle) =>
            vehicle.id,
        ),
      );

    setCustomer(nextCustomer);

    setContactForm({
      phone:
        nextCustomer.phone || '',
      email:
        nextCustomer.email || '',
      taxNumber:
        nextCustomer.taxNumber || '',
      address:
        nextCustomer.address || '',
      notes:
        nextCustomer.notes || '',
    });

    setOrders(
      ordersResponse.data.filter(
        (item) =>
          item.customerId === id,
      ),
    );

    setQuotes(
      quotesResponse.data.filter(
        (item) =>
          item.customerId === id,
      ),
    );

    setAppointments(
      appointmentsResponse.data.filter(
        (item) =>
          item.customerId === id,
      ),
    );

    setMaintenancePlans(
      plansResponse.data.filter(
        (item) =>
          vehicleIds.has(
            item.vehicleId,
          ),
      ),
    );

    setMaintenanceRecords(
      recordsResponse.data.filter(
        (item) =>
          vehicleIds.has(
            item.vehicleId,
          ),
      ),
    );

    setPackages(
      packagesResponse.data,
    );

    setPayments(
      paymentsResponse
        ? paymentsResponse.data.filter(
            (item) =>
              item.customerId === id,
          )
        : [],
    );
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        apiMessage(
          err,
          'Müşteri paneli yüklenemedi.',
        ),
      );
    });

    api.get('/vehicle-catalog/makes')
      .then((response) => {
        setMakes(response.data);
        setCatalogWarning('');
      })
      .catch(() => {
        setMakes([]);
        setCatalogWarning(
          'Araç marka kataloğu yüklenemedi. Marka ve modeli manuel yazabilirsiniz.',
        );
      });
  }, [id, canViewFinance]);

  const quoteTotals =
    useMemo(() => {
      return quoteItems.reduce(
        (result, item) => {
          const quantity =
            Number(
              item.quantity,
            ) || 0;
          const unitPrice =
            Number(
              item.unitPrice,
            ) || 0;
          const discount =
            Number(
              item.discountAmount,
            ) || 0;
          const vatRate =
            Number(
              item.vatRate,
            ) || 0;

          const subtotal =
            quantity * unitPrice;
          const net =
            Math.max(
              0,
              subtotal -
                discount,
            );
          const tax =
            net *
            (vatRate / 100);

          result.subtotal +=
            subtotal;
          result.discount +=
            discount;
          result.tax += tax;
          result.total +=
            net + tax;

          return result;
        },
        {
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
        },
      );
    }, [quoteItems]);

  const totalPaid =
    payments
      .filter(
        (item) =>
          item.status === 'PAID',
      )
      .reduce(
        (sum, item) =>
          sum +
          Number(
            item.amount || 0,
          ),
        0,
      );

  const totalBilled =
    orders.reduce(
      (orderSum, order) =>
        orderSum +
        (
          order.items?.reduce(
            (sum, item) => {
              const gross =
                Number(
                  item.grossTotal ||
                    0,
                );

              return (
                sum +
                (gross > 0
                  ? gross
                  : Number(
                      item.totalPrice ||
                        0,
                    ) +
                    Number(
                      item.vatAmount ||
                        0,
                    ))
              );
            },
            0,
          ) || 0
        ),
      0,
    );

  const openBalance =
    Math.max(
      0,
      totalBilled -
        totalPaid,
    );

  function beginAction() {
    setBusy(true);
    setMessage('');
    setError('');
  }

  async function addVehicle(e) {
    e.preventDefault();
    beginAction();

    try {
      await api.post(
        '/vehicles',
        {
          customerId: id,
          plate:
            vehicleForm.plate,
          brand:
            vehicleForm.brand,
          model:
            vehicleForm.model,
          modelYear:
            vehicleForm.modelYear
              ? Number(
                  vehicleForm.modelYear,
                )
              : undefined,
          mileage:
            vehicleForm.mileage
              ? Number(
                  vehicleForm.mileage,
                )
              : 0,
          fuelType:
            vehicleForm.fuelType ||
            undefined,
          transmission:
            vehicleForm.transmission ||
            undefined,
          color:
            vehicleForm.color ||
            undefined,
          vin:
            vehicleForm.vin.trim() ||
            undefined,
        },
      );

      setVehicleForm({
        plate: '',
        brand: '',
        model: '',
        modelYear: '',
        mileage: '',
        fuelType: '',
        transmission: '',
        color: '',
        vin: '',
      });

      setMessage(
        'Araç müşteriye eklendi.',
      );

      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Araç eklenemedi.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function addMaintenancePlan(e) {
    e.preventDefault();
    beginAction();

    try {
      await api.post(
        '/maintenance/plans',
        {
          vehicleId:
            maintenanceForm.vehicleId,
          title:
            maintenanceForm.title,
          category:
            maintenanceForm.category ||
            undefined,
          intervalKm:
            maintenanceForm.intervalKm
              ? Number(
                  maintenanceForm.intervalKm,
                )
              : undefined,
          intervalMonths:
            maintenanceForm.intervalMonths
              ? Number(
                  maintenanceForm.intervalMonths,
                )
              : undefined,
          nextDueKm:
            maintenanceForm.nextDueKm
              ? Number(
                  maintenanceForm.nextDueKm,
                )
              : undefined,
          nextDueDate:
            maintenanceForm.nextDueDate
              ? new Date(
                  maintenanceForm.nextDueDate,
                ).toISOString()
              : undefined,
          estimatedPriceMin:
            maintenanceForm.estimatedPriceMin
              ? Number(
                  maintenanceForm.estimatedPriceMin,
                )
              : undefined,
          estimatedPriceMax:
            maintenanceForm.estimatedPriceMax
              ? Number(
                  maintenanceForm.estimatedPriceMax,
                )
              : undefined,
        },
      );

      setMaintenanceForm({
        vehicleId: '',
        title: '',
        category: '',
        intervalKm: '',
        intervalMonths: '',
        nextDueKm: '',
        nextDueDate: '',
        estimatedPriceMin: '',
        estimatedPriceMax: '',
      });

      setMessage(
        'Bakım planı oluşturuldu.',
      );

      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Bakım planı oluşturulamadı.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  function updateQuoteItem(
    index,
    field,
    value,
  ) {
    setQuoteItems(
      (current) =>
        current.map(
          (item, itemIndex) =>
            itemIndex === index
              ? {
                  ...item,
                  [field]: value,
                }
              : item,
        ),
    );
  }

  function addQuoteItem() {
    setQuoteItems(
      (current) => [
        ...current,
        emptyQuoteItem(),
      ],
    );
  }

  function removeQuoteItem(index) {
    setQuoteItems(
      (current) =>
        current.length === 1
          ? [emptyQuoteItem()]
          : current.filter(
              (_, itemIndex) =>
                itemIndex !==
                index,
            ),
    );
  }

  function applyPackage(packageId) {
    setSelectedPackageId(
      packageId,
    );

    const selected =
      packages.find(
        (item) =>
          item.id === packageId,
      );

    if (!selected) {
      return;
    }

    setQuoteItems(
      selected.items.map(
        (item) => ({
          type: item.type,
          name: item.name,
          description:
            item.description ||
            '',
          quantity:
            Number(
              item.quantity,
            ) || 1,
          unitPrice:
            Number(
              item.unitPrice,
            ) || '',
          discountAmount: 0,
          vatRate:
            Number(
              item.vatRate,
            ) || 20,
        }),
      ),
    );
  }

  async function addQuote(e) {
    e.preventDefault();
    beginAction();

    try {
      await api.post(
        '/quotes',
        {
          customerId: id,
          vehicleId:
            quoteForm.vehicleId,
          serviceOrderId:
            quoteForm.serviceOrderId ||
            undefined,
          notes:
            quoteForm.notes ||
            undefined,
          items:
            quoteItems.map(
              (item) => ({
                type:
                  item.type,
                name:
                  item.name.trim(),
                description:
                  item.description.trim() ||
                  undefined,
                quantity:
                  Number(
                    item.quantity,
                  ),
                unitPrice:
                  Number(
                    item.unitPrice,
                  ),
                discountAmount:
                  Number(
                    item.discountAmount ||
                      0,
                  ),
                vatRate:
                  Number(
                    item.vatRate ||
                      0,
                  ),
              }),
            ),
        },
      );

      setQuoteForm({
        vehicleId: '',
        serviceOrderId: '',
        notes: '',
      });
      setQuoteItems([
        emptyQuoteItem(),
      ]);
      setSelectedPackageId('');

      setMessage(
        'Teklif oluşturuldu.',
      );

      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Teklif oluşturulamadı.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function addAppointment(e) {
    e.preventDefault();
    beginAction();

    try {
      await api.post(
        '/appointments',
        {
          customerId: id,
          vehicleId:
            appointmentForm.vehicleId,
          startAt:
            new Date(
              appointmentForm.startAt,
            ).toISOString(),
          serviceType:
            appointmentForm.serviceType ||
            undefined,
          customerNote:
            appointmentForm.customerNote ||
            undefined,
        },
      );

      setAppointmentForm({
        vehicleId: '',
        startAt: '',
        serviceType: '',
        customerNote: '',
      });

      setMessage(
        'Randevu oluşturuldu.',
      );

      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Randevu oluşturulamadı.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function addPayment(e) {
    e.preventDefault();
    beginAction();

    try {
      await api.post(
        '/billing/payments',
        {
          customerId: id,
          branchId:
            customer.branchId ||
            undefined,
          serviceOrderId:
            paymentForm.serviceOrderId ||
            undefined,
          quoteId:
            paymentForm.quoteId ||
            undefined,
          amount:
            Number(
              paymentForm.amount,
            ),
          method:
            paymentForm.method,
          status: 'PAID',
          reference:
            paymentForm.reference ||
            undefined,
        },
      );

      setPaymentForm({
        serviceOrderId: '',
        quoteId: '',
        amount: '',
        method: 'CASH',
        reference: '',
      });

      setMessage(
        'Tahsilat cari hesaba işlendi.',
      );

      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Tahsilat kaydedilemedi.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function saveContact(e) {
    e.preventDefault();
    beginAction();

    try {
      await api.patch(
        `/customers/${id}`,
        {
          phone:
            contactForm.phone ||
            undefined,
          email:
            contactForm.email ||
            undefined,
          taxNumber:
            contactForm.taxNumber ||
            undefined,
          address:
            contactForm.address ||
            undefined,
          notes:
            contactForm.notes ||
            undefined,
        },
      );

      setMessage(
        'İletişim bilgileri güncellendi.',
      );

      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'İletişim bilgileri güncellenemedi.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  if (error && !customer) {
    return (
      <div className="page-message error-message">
        {error}
      </div>
    );
  }

  if (!customer) {
    return (
      <div>
        Müşteri paneli yükleniyor...
      </div>
    );
  }

  const vehicles =
    customer.vehicles || [];

  const selectedQuoteOrders =
    orders.filter(
      (order) =>
        !quoteForm.vehicleId ||
        order.vehicleId ===
          quoteForm.vehicleId,
    );

  return (
    <>
      <div className="page-heading customer-workspace-heading">
        <div>
          <span className="customer-workspace-eyebrow">
            Müşteri Paneli
          </span>

          <h1>
            {customer.firstName}{' '}
            {customer.lastName}
          </h1>

          <p>
            Araç, bakım, teklif,
            randevu, cari ve iletişim
            işlemlerini tek ekrandan yönetin.
          </p>
        </div>

        <Link
          className="small-button"
          to="/customers"
        >
          ← Müşterilere Dön
        </Link>
      </div>

      <div className="customer-workspace-summary">
        <div>
          <span>Araç</span>
          <strong>
            {vehicles.length}
          </strong>
        </div>

        <div>
          <span>Bakım Planı</span>
          <strong>
            {
              maintenancePlans.length
            }
          </strong>
        </div>

        <div>
          <span>Teklif</span>
          <strong>
            {quotes.length}
          </strong>
        </div>

        <div>
          <span>Randevu</span>
          <strong>
            {appointments.length}
          </strong>
        </div>

        {canViewFinance && (
          <div>
            <span>Açık Bakiye</span>
            <strong>
              {money(
                openBalance,
              )}{' '}
              ₺
            </strong>
          </div>
        )}
      </div>

      {message && (
        <div className="page-message success-message spaced-card">
          {message}
        </div>
      )}

      {error && (
        <div className="page-message error-message spaced-card">
          {error}
        </div>
      )}

      <div className="customer-workspace-tabs spaced-card">
        {tabs
          .filter(
            ([key]) =>
              key !== 'account' ||
              canViewFinance,
          )
          .map(
            ([key, label]) => (
              <button
                key={key}
                className={
                  activeTab === key
                    ? 'customer-workspace-tab active'
                    : 'customer-workspace-tab'
                }
                onClick={() =>
                  setActiveTab(key)
                }
              >
                {label}
              </button>
            ),
          )}
      </div>

      {activeTab === 'vehicles' && (
        <div className="customer-workspace-grid">
          <div className="panel-card">
            <h3>Yeni Araç Ekle</h3>

            <form
              className="form-grid"
              onSubmit={addVehicle}
            >
              <input
                placeholder="Plaka"
                value={
                  vehicleForm.plate
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    plate:
                      e.target.value,
                  })
                }
                required
              />

              <div>
                <input
                  list="customer-vehicle-makes"
                  placeholder="Marka"
                  value={
                    vehicleForm.brand
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      brand:
                        e.target.value,
                      model: '',
                    })
                  }
                  onBlur={() =>
                    loadVehicleModels(
                      vehicleForm.brand,
                      vehicleForm.modelYear,
                    )
                  }
                  required
                />

                <datalist id="customer-vehicle-makes">
                  {makes.map(
                    (make) => (
                      <option
                        key={
                          make.id
                        }
                        value={
                          make.name
                        }
                      />
                    ),
                  )}
                </datalist>

                <div className="sub-text">
                  {makes.length
                    ? `${makes.length} marka yüklendi.`
                    : 'Markayı manuel yazabilirsiniz.'}
                </div>
              </div>

              <div>
                <input
                  list="customer-vehicle-models"
                  placeholder="Model"
                  value={
                    vehicleForm.model
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      model:
                        e.target.value,
                    })
                  }
                  required
                />

                <datalist id="customer-vehicle-models">
                  {vehicleModels.map(
                    (item) => (
                      <option
                        key={
                          `${item.makeId}-${item.id}-${item.model}`
                        }
                        value={
                          item.model
                        }
                      />
                    ),
                  )}
                </datalist>

                <div className="sub-text">
                  {vehicleModels.length
                    ? `${vehicleModels.length} model yüklendi.`
                    : 'Önce marka seçin veya modeli manuel yazın.'}
                </div>
              </div>

              <input
                type="number"
                placeholder="Model yılı"
                value={
                  vehicleForm.modelYear
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    modelYear:
                      e.target.value,
                  })
                }
                onBlur={() =>
                  loadVehicleModels(
                    vehicleForm.brand,
                    vehicleForm.modelYear,
                  )
                }
              />

              <input
                type="number"
                min="0"
                placeholder="Kilometre"
                value={
                  vehicleForm.mileage
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    mileage:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Yakıt tipi"
                value={
                  vehicleForm.fuelType
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    fuelType:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Şanzıman"
                value={
                  vehicleForm.transmission
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    transmission:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Renk"
                value={
                  vehicleForm.color
                }
                onChange={(e) =>
                  setVehicleForm({
                    ...vehicleForm,
                    color:
                      e.target.value,
                  })
                }
              />

              <div className="full">
                <input
                  className="full"
                  placeholder="Şasi / VIN (opsiyonel)"
                  maxLength="50"
                  autoCapitalize="characters"
                  spellCheck="false"
                  value={
                    vehicleForm.vin
                  }
                  onChange={(e) =>
                    setVehicleForm({
                      ...vehicleForm,
                      vin:
                        e.target.value
                          .replace(/\s+/g, '')
                          .toUpperCase(),
                    })
                  }
                />

                <div className="sub-text">
                  VIN/şasi numarasını boşluksuz girin. Sistem otomatik olarak büyük harfe çevirir.
                </div>
              </div>

              {catalogWarning && (
                <div className="page-message error-message full">
                  {catalogWarning}
                </div>
              )}

              <button
                className="primary-button full"
                disabled={busy}
              >
                Araç Ekle
              </button>
            </form>
          </div>

          <div className="panel-card">
            <h3>Müşterinin Araçları</h3>

            <div className="customer-card-list">
              {vehicles.map(
                (vehicle) => (
                  <div
                    className="customer-vehicle-card"
                    key={vehicle.id}
                  >
                    <Link
                      className="customer-vehicle-main"
                      to={`/vehicles/${vehicle.id}`}
                    >
                      <div>
                        <strong>
                          {vehicle.plate}
                        </strong>
                        <span>
                          {vehicle.brand}{' '}
                          {vehicle.model}
                        </span>
                      </div>

                      <div>
                        <span>KM</span>
                        <strong>
                          {Number(
                            vehicle.mileage ||
                              0,
                          ).toLocaleString(
                            'tr-TR',
                          )}
                        </strong>
                      </div>
                    </Link>

                    <a
                      className="small-button customer-qr-button"
                      href={`/vehicles/${vehicle.id}/qr-print`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      QR / Yazdır
                    </a>
                  </div>
                ),
              )}

              {!vehicles.length && (
                <div className="empty-state">
                  Bu müşteriye ait araç
                  bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'maintenance' && (
        <>
          <div className="customer-workspace-grid">
            <div className="panel-card">
              <h3>Bakım Planla</h3>

              <form
                className="form-grid"
                onSubmit={
                  addMaintenancePlan
                }
              >
                <select
                  className="full"
                  value={
                    maintenanceForm.vehicleId
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      vehicleId:
                        e.target.value,
                    })
                  }
                  required
                >
                  <option value="">
                    Araç seç
                  </option>

                  {vehicles.map(
                    (vehicle) => (
                      <option
                        key={
                          vehicle.id
                        }
                        value={
                          vehicle.id
                        }
                      >
                        {vehicle.plate} -{' '}
                        {vehicle.brand}{' '}
                        {vehicle.model}
                      </option>
                    ),
                  )}
                </select>

                <input
                  className="full"
                  placeholder="Bakım adı"
                  value={
                    maintenanceForm.title
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      title:
                        e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="Kategori"
                  value={
                    maintenanceForm.category
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      category:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Periyot KM"
                  value={
                    maintenanceForm.intervalKm
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      intervalKm:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Periyot Ay"
                  value={
                    maintenanceForm.intervalMonths
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      intervalMonths:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Sonraki KM"
                  value={
                    maintenanceForm.nextDueKm
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      nextDueKm:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="datetime-local"
                  value={
                    maintenanceForm.nextDueDate
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      nextDueDate:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Tahmini min. fiyat"
                  value={
                    maintenanceForm.estimatedPriceMin
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      estimatedPriceMin:
                        e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  placeholder="Tahmini maks. fiyat"
                  value={
                    maintenanceForm.estimatedPriceMax
                  }
                  onChange={(e) =>
                    setMaintenanceForm({
                      ...maintenanceForm,
                      estimatedPriceMax:
                        e.target.value,
                    })
                  }
                />

                <button
                  className="primary-button full"
                  disabled={busy}
                >
                  Bakım Planı Oluştur
                </button>
              </form>
            </div>

            <div className="panel-card">
              <h3>Aktif Bakım Planları</h3>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Araç</th>
                      <th>Bakım</th>
                      <th>Sonraki KM</th>
                      <th>Tarih</th>
                      <th>Durum</th>
                    </tr>
                  </thead>

                  <tbody>
                    {maintenancePlans.map(
                      (plan) => (
                        <tr
                          key={
                            plan.id
                          }
                        >
                          <td>
                            {
                              plan.vehicle
                                ?.plate
                            }
                          </td>
                          <td>
                            {
                              plan.title
                            }
                          </td>
                          <td>
                            {plan.nextDueKm
                              ? Number(
                                  plan.nextDueKm,
                                ).toLocaleString(
                                  'tr-TR',
                                )
                              : '-'}
                          </td>
                          <td>
                            {plan.nextDueDate
                              ? new Date(
                                  plan.nextDueDate,
                                ).toLocaleDateString(
                                  'tr-TR',
                                )
                              : '-'}
                          </td>
                          <td>
                            {statusLabel(
                              plan.status,
                            )}
                          </td>
                        </tr>
                      ),
                    )}

                    {!maintenancePlans.length && (
                      <tr>
                        <td colSpan="5">
                          Bakım planı yok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="panel-card spaced-card">
            <h3>Bakım Geçmişi</h3>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Araç</th>
                    <th>KM</th>
                    <th>Tarih</th>
                    <th>İşlemler</th>
                    <th>Tutar</th>
                  </tr>
                </thead>

                <tbody>
                  {maintenanceRecords.map(
                    (record) => (
                      <tr
                        key={
                          record.id
                        }
                      >
                        <td>
                          {
                            record.vehicle
                              ?.plate
                          }
                        </td>

                        <td>
                          {Number(
                            record.mileage ||
                              0,
                          ).toLocaleString(
                            'tr-TR',
                          )}
                        </td>

                        <td>
                          {new Date(
                            record.performedAt,
                          ).toLocaleDateString(
                            'tr-TR',
                          )}
                        </td>

                        <td>
                          {record.items
                            ?.map(
                              (item) =>
                                item.name,
                            )
                            .join(', ') ||
                            '-'}
                        </td>

                        <td>
                          {money(
                            record.totalAmount,
                          )}{' '}
                          ₺
                        </td>
                      </tr>
                    ),
                  )}

                  {!maintenanceRecords.length && (
                    <tr>
                      <td colSpan="5">
                        Bakım geçmişi yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'quotes' && (
        <>
          <div className="panel-card">
            <div className="card-title-row">
              <div>
                <h3>Yeni Teklif / Proforma</h3>
                <p className="sub-text">
                  Müşteri sabit. Sadece araç
                  ve teklif kalemlerini seçin.
                </p>
              </div>
            </div>

            <form
              className="quote-form"
              onSubmit={addQuote}
            >
              <div className="form-grid">
                <select
                  value={
                    quoteForm.vehicleId
                  }
                  onChange={(e) =>
                    setQuoteForm({
                      ...quoteForm,
                      vehicleId:
                        e.target.value,
                      serviceOrderId:
                        '',
                    })
                  }
                  required
                >
                  <option value="">
                    Araç seç
                  </option>

                  {vehicles.map(
                    (vehicle) => (
                      <option
                        key={
                          vehicle.id
                        }
                        value={
                          vehicle.id
                        }
                      >
                        {vehicle.plate} -{' '}
                        {vehicle.brand}{' '}
                        {vehicle.model}
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    quoteForm.serviceOrderId
                  }
                  onChange={(e) =>
                    setQuoteForm({
                      ...quoteForm,
                      serviceOrderId:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    İş emri (opsiyonel)
                  </option>

                  {selectedQuoteOrders.map(
                    (order) => (
                      <option
                        key={
                          order.id
                        }
                        value={
                          order.id
                        }
                      >
                        {
                          order.orderNumber
                        }
                      </option>
                    ),
                  )}
                </select>

                <select
                  value={
                    selectedPackageId
                  }
                  onChange={(e) =>
                    applyPackage(
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Hazır bakım paketi
                  </option>

                  {packages
                    .filter(
                      (item) =>
                        item.active,
                    )
                    .map(
                      (item) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.id
                          }
                        >
                          {item.name}
                        </option>
                      ),
                    )}
                </select>
              </div>

              <div className="quote-items">
                <div className="quote-items-header">
                  <div>
                    <strong>
                      Teklif Kalemleri
                    </strong>
                    <span>
                      Parça, işçilik,
                      indirim ve KDV.
                    </span>
                  </div>

                  <button
                    type="button"
                    className="small-button"
                    onClick={
                      addQuoteItem
                    }
                  >
                    + Kalem Ekle
                  </button>
                </div>

                {quoteItems.map(
                  (
                    item,
                    index,
                  ) => (
                    <div
                      className="quote-item-row"
                      key={
                        index
                      }
                    >
                      <select
                        value={
                          item.type
                        }
                        onChange={(e) =>
                          updateQuoteItem(
                            index,
                            'type',
                            e.target.value,
                          )
                        }
                      >
                        <option value="LABOR">
                          İşçilik
                        </option>
                        <option value="PART">
                          Parça
                        </option>
                        <option value="OTHER">
                          Diğer
                        </option>
                      </select>

                      <input
                        className="quote-item-name"
                        placeholder="Kalem adı"
                        value={
                          item.name
                        }
                        onChange={(e) =>
                          updateQuoteItem(
                            index,
                            'name',
                            e.target.value,
                          )
                        }
                        required
                      />

                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Miktar"
                        value={
                          item.quantity
                        }
                        onChange={(e) =>
                          updateQuoteItem(
                            index,
                            'quantity',
                            e.target.value,
                          )
                        }
                        required
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Birim ₺"
                        value={
                          item.unitPrice
                        }
                        onChange={(e) =>
                          updateQuoteItem(
                            index,
                            'unitPrice',
                            e.target.value,
                          )
                        }
                        required
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="İndirim ₺"
                        value={
                          item.discountAmount
                        }
                        onChange={(e) =>
                          updateQuoteItem(
                            index,
                            'discountAmount',
                            e.target.value,
                          )
                        }
                      />

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="KDV %"
                        value={
                          item.vatRate
                        }
                        onChange={(e) =>
                          updateQuoteItem(
                            index,
                            'vatRate',
                            e.target.value,
                          )
                        }
                      />

                      <button
                        type="button"
                        className="table-action danger-text"
                        onClick={() =>
                          removeQuoteItem(
                            index,
                          )
                        }
                      >
                        Sil
                      </button>
                    </div>
                  ),
                )}
              </div>

              <textarea
                className="quote-notes"
                placeholder="Teklif / proforma notu"
                value={
                  quoteForm.notes
                }
                onChange={(e) =>
                  setQuoteForm({
                    ...quoteForm,
                    notes:
                      e.target.value,
                  })
                }
              />

              <div className="quote-summary">
                <div>
                  <span>Ara Toplam</span>
                  <strong>
                    {money(
                      quoteTotals.subtotal,
                    )}{' '}
                    ₺
                  </strong>
                </div>

                <div>
                  <span>İndirim</span>
                  <strong>
                    -
                    {money(
                      quoteTotals.discount,
                    )}{' '}
                    ₺
                  </strong>
                </div>

                <div>
                  <span>KDV</span>
                  <strong>
                    {money(
                      quoteTotals.tax,
                    )}{' '}
                    ₺
                  </strong>
                </div>

                <div className="quote-grand-total">
                  <span>Genel Toplam</span>
                  <strong>
                    {money(
                      quoteTotals.total,
                    )}{' '}
                    ₺
                  </strong>
                </div>
              </div>

              <button
                className="primary-button"
                disabled={busy}
              >
                Teklif Oluştur
              </button>
            </form>
          </div>

          <div className="panel-card spaced-card">
            <h3>Müşterinin Teklifleri</h3>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Araç</th>
                    <th>Durum</th>
                    <th>KDV</th>
                    <th>Toplam</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {quotes.map(
                    (quote) => (
                      <tr
                        key={
                          quote.id
                        }
                      >
                        <td>
                          {
                            quote.quoteNumber
                          }
                        </td>
                        <td>
                          {
                            quote.vehicle
                              ?.plate
                          }
                        </td>
                        <td>
                          {statusLabel(
                            quote.status,
                          )}
                        </td>
                        <td>
                          {money(
                            quote.taxTotal,
                          )}{' '}
                          ₺
                        </td>
                        <td>
                          <strong>
                            {money(
                              quote.total,
                            )}{' '}
                            ₺
                          </strong>
                        </td>
                        <td>
                          <Link
                            className="table-link"
                            to={`/quotes/${quote.id}/proforma`}
                            target="_blank"
                          >
                            Proforma
                          </Link>
                        </td>
                      </tr>
                    ),
                  )}

                  {!quotes.length && (
                    <tr>
                      <td colSpan="6">
                        Teklif yok.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'appointments' && (
        <div className="customer-workspace-grid">
          <div className="panel-card">
            <h3>Yeni Randevu</h3>

            <form
              className="form-grid"
              onSubmit={addAppointment}
            >
              <select
                className="full"
                value={
                  appointmentForm.vehicleId
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    vehicleId:
                      e.target.value,
                  })
                }
                required
              >
                <option value="">
                  Araç seç
                </option>

                {vehicles.map(
                  (vehicle) => (
                    <option
                      key={
                        vehicle.id
                      }
                      value={
                        vehicle.id
                      }
                    >
                      {vehicle.plate} -{' '}
                      {vehicle.brand}{' '}
                      {vehicle.model}
                    </option>
                  ),
                )}
              </select>

              <input
                className="full"
                type="datetime-local"
                value={
                  appointmentForm.startAt
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    startAt:
                      e.target.value,
                  })
                }
                required
              />

              <input
                className="full"
                placeholder="Hizmet türü"
                value={
                  appointmentForm.serviceType
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    serviceType:
                      e.target.value,
                  })
                }
              />

              <textarea
                className="full"
                placeholder="Müşteri notu"
                value={
                  appointmentForm.customerNote
                }
                onChange={(e) =>
                  setAppointmentForm({
                    ...appointmentForm,
                    customerNote:
                      e.target.value,
                  })
                }
              />

              <button
                className="primary-button full"
                disabled={busy}
              >
                Randevu Oluştur
              </button>
            </form>
          </div>

          <div className="panel-card">
            <h3>Müşterinin Randevuları</h3>

            <div className="customer-card-list">
              {appointments.map(
                (appointment) => (
                  <div
                    className="customer-appointment-card"
                    key={
                      appointment.id
                    }
                  >
                    <div>
                      <strong>
                        {new Date(
                          appointment.startAt,
                        ).toLocaleString(
                          'tr-TR',
                        )}
                      </strong>

                      <span>
                        {
                          appointment.vehicle
                            ?.plate
                        }
                        {' · '}
                        {appointment.serviceType ||
                          'Servis randevusu'}
                      </span>
                    </div>

                    <span className="status-badge">
                      {statusLabel(
                        appointment.status,
                      )}
                    </span>
                  </div>
                ),
              )}

              {!appointments.length && (
                <div className="empty-state">
                  Randevu bulunmuyor.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'account' &&
        canViewFinance && (
          <>
            <div className="customer-account-stats">
              <div className="stat-card">
                <span>Servis Toplamı</span>
                <strong>
                  {money(
                    totalBilled,
                  )}{' '}
                  ₺
                </strong>
              </div>

              <div className="stat-card">
                <span>Tahsil Edilen</span>
                <strong>
                  {money(
                    totalPaid,
                  )}{' '}
                  ₺
                </strong>
              </div>

              <div className="stat-card">
                <span>Açık Bakiye</span>
                <strong>
                  {money(
                    openBalance,
                  )}{' '}
                  ₺
                </strong>
              </div>
            </div>

            <div className="customer-workspace-grid spaced-card">
              <div className="panel-card">
                <h3>Tahsilat Gir</h3>

                <form
                  className="form-grid"
                  onSubmit={addPayment}
                >
                  <select
                    className="full"
                    value={
                      paymentForm.serviceOrderId
                    }
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        serviceOrderId:
                          e.target.value,
                        quoteId: '',
                      })
                    }
                  >
                    <option value="">
                      İş emri (opsiyonel)
                    </option>

                    {orders.map(
                      (order) => (
                        <option
                          key={
                            order.id
                          }
                          value={
                            order.id
                          }
                        >
                          {
                            order.orderNumber
                          }
                          {' · '}
                          {
                            order.vehicle
                              ?.plate
                          }
                        </option>
                      ),
                    )}
                  </select>

                  <select
                    className="full"
                    value={
                      paymentForm.quoteId
                    }
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        quoteId:
                          e.target.value,
                        serviceOrderId:
                          '',
                      })
                    }
                  >
                    <option value="">
                      Teklif / Proforma
                      (opsiyonel)
                    </option>

                    {quotes.map(
                      (quote) => (
                        <option
                          key={
                            quote.id
                          }
                          value={
                            quote.id
                          }
                        >
                          {
                            quote.quoteNumber
                          }
                          {' · '}
                          {money(
                            quote.total,
                          )}{' '}
                          ₺
                        </option>
                      ),
                    )}
                  </select>

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Tahsilat tutarı ₺"
                    value={
                      paymentForm.amount
                    }
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amount:
                          e.target.value,
                      })
                    }
                    required
                  />

                  <select
                    value={
                      paymentForm.method
                    }
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        method:
                          e.target.value,
                      })
                    }
                  >
                    <option value="CASH">
                      Nakit
                    </option>
                    <option value="CARD">
                      Kart
                    </option>
                    <option value="TRANSFER">
                      Havale / EFT
                    </option>
                    <option value="OTHER">
                      Diğer
                    </option>
                  </select>

                  <input
                    className="full"
                    placeholder="Referans / açıklama"
                    value={
                      paymentForm.reference
                    }
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        reference:
                          e.target.value,
                      })
                    }
                  />

                  <button
                    className="primary-button full"
                    disabled={busy}
                  >
                    Tahsilatı Kaydet
                  </button>
                </form>
              </div>

              <div className="panel-card">
                <h3>Cari Hareketler</h3>

                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tarih</th>
                        <th>Tür</th>
                        <th>Referans</th>
                        <th>Tutar</th>
                        <th>Durum</th>
                      </tr>
                    </thead>

                    <tbody>
                      {payments.map(
                        (payment) => (
                          <tr
                            key={
                              payment.id
                            }
                          >
                            <td>
                              {new Date(
                                payment.paidAt ||
                                  payment.createdAt,
                              ).toLocaleDateString(
                                'tr-TR',
                              )}
                            </td>
                            <td>
                              Tahsilat
                            </td>
                            <td>
                              {payment.reference ||
                                payment.serviceOrder
                                  ?.orderNumber ||
                                payment.quote
                                  ?.quoteNumber ||
                                '-'}
                            </td>
                            <td>
                              {money(
                                payment.amount,
                              )}{' '}
                              ₺
                            </td>
                            <td>
                              {statusLabel(
                                payment.status,
                              )}
                            </td>
                          </tr>
                        ),
                      )}

                      {!payments.length && (
                        <tr>
                          <td colSpan="5">
                            Cari hareket
                            bulunmuyor.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

      {activeTab === 'contact' && (
        <div className="customer-workspace-grid">
          <div className="panel-card">
            <h3>İletişim Bilgileri</h3>

            <form
              className="form-grid"
              onSubmit={saveContact}
            >
              <input
                placeholder="Telefon"
                value={
                  contactForm.phone
                }
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    phone:
                      e.target.value,
                  })
                }
              />

              <input
                type="email"
                placeholder="E-posta"
                value={
                  contactForm.email
                }
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    email:
                      e.target.value,
                  })
                }
              />

              <input
                className="full"
                placeholder="Vergi numarası"
                value={
                  contactForm.taxNumber
                }
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    taxNumber:
                      e.target.value,
                  })
                }
              />

              <textarea
                className="full"
                placeholder="Adres"
                value={
                  contactForm.address
                }
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    address:
                      e.target.value,
                  })
                }
              />

              <textarea
                className="full"
                placeholder="Müşteri notları"
                value={
                  contactForm.notes
                }
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    notes:
                      e.target.value,
                  })
                }
              />

              <button
                className="primary-button full"
                disabled={busy}
              >
                Bilgileri Güncelle
              </button>
            </form>
          </div>

          <div className="panel-card">
            <h3>Hızlı İletişim</h3>

            <div className="customer-contact-actions">
              <a
                className="customer-contact-action"
                href={
                  customer.phone
                    ? `tel:${customer.phone}`
                    : undefined
                }
              >
                <span>Telefon</span>
                <strong>
                  {customer.phone ||
                    'Telefon yok'}
                </strong>
              </a>

              <a
                className="customer-contact-action"
                href={
                  customer.email
                    ? `mailto:${customer.email}`
                    : undefined
                }
              >
                <span>E-posta</span>
                <strong>
                  {customer.email ||
                    'E-posta yok'}
                </strong>
              </a>

              <div className="customer-contact-action">
                <span>Şube</span>
                <strong>
                  {customer.branch
                    ?.name ||
                    '-'}
                </strong>
              </div>

              <div className="customer-contact-action">
                <span>Adres</span>
                <strong>
                  {customer.address ||
                    '-'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

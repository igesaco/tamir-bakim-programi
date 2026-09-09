import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as ImagePicker from 'expo-image-picker';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import {
  canUse,
  hasPermission,
} from '../permissions';
import {
  Button,
  Card,
  Empty,
  Field,
  Message,
  ScreenTitle,
} from '../components/UI';
import {
  colors,
  radius,
  spacing,
} from '../theme';

const photoTypes = [
  ['ACCEPTANCE', 'Kabul'],
  ['VEHICLE', 'Araç'],
  ['DAMAGE', 'Hasar'],
  ['ODOMETER', 'Kilometre'],
  ['ENGINE', 'Motor'],
  ['BEFORE', 'İşlem Öncesi'],
];

const workCategories = [
  ['BAKIM', 'Bakım'],
  ['TAMIR', 'Tamir'],
  ['PARCA', 'Parça / Malzeme'],
  ['DIGER', 'Diğer'],
];

function emptyWorkItem() {
  return {
    id:
      `work-${Date.now()}-${Math.random()}`,
    category: 'BAKIM',
    name: '',
    description: '',
    quantity: '1',
    unitPrice: '0',
  };
}

function apiMessage(
  err,
  fallback,
) {
  const detail =
    err?.response?.data?.message;

  return Array.isArray(
    detail,
  )
    ? detail.join(', ')
    : detail || fallback;
}

export default function InspectionsScreen({
  initialCustomerId = '',
  initialVehicleId = '',
  onSeedConsumed,
}) {
  const { user } = useAuth();

  const [items, setItems] =
    useState([]);
  const [customers, setCustomers] =
    useState([]);
  const [vehicles, setVehicles] =
    useState([]);
  const [branches, setBranches] =
    useState([]);

  const [showForm, setShowForm] =
    useState(
      Boolean(
        initialCustomerId ||
        initialVehicleId,
      ),
    );
  const [search, setSearch] =
    useState('');
  const [
    customerSearch,
    setCustomerSearch,
  ] = useState('');
  const [busy, setBusy] =
    useState(false);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState('');
  const [message, setMessage] =
    useState('');

  const [
    newCustomerMode,
    setNewCustomerMode,
  ] = useState(false);
  const [
    newVehicleMode,
    setNewVehicleMode,
  ] = useState(false);

  const [form, setForm] =
    useState({
      branchId:
        user?.branchId || '',
      customerId:
        initialCustomerId || '',
      customerFirstName: '',
      customerLastName: '',
      customerPhone: '',
      customerEmail: '',
      vehicleId:
        initialVehicleId || '',
      plate: '',
      brand: '',
      model: '',
      modelYear: '',
      fuelType: '',
      transmission: '',
      color: '',
      vin: '',
      mileage: '',
      fuelLevel: '',
      customerComplaint: '',
      existingDamage: '',
      valuablesNote: '',
      internalNote: '',
    });

  const [
    workItems,
    setWorkItems,
  ] = useState([
    emptyWorkItem(),
  ]);

  const [
    operationTemplates,
    setOperationTemplates,
  ] = useState([]);

  const [
    photoType,
    setPhotoType,
  ] = useState(
    'ACCEPTANCE',
  );

  const [
    queuedPhotos,
    setQueuedPhotos,
  ] = useState([]);

  const canManage =
    hasPermission(
      user,
      'INSPECTION_MANAGE',
    );

  const canCreateCustomer =
    canUse(user, {
      feature: 'CUSTOMERS',
      permission:
        'CUSTOMER_CREATE',
    });

  const canCreateVehicle =
    canUse(user, {
      feature: 'VEHICLES_QR',
      permission:
        'VEHICLE_CREATE',
    });

  const canCreateOrder =
    canUse(user, {
      feature:
        'SERVICE_ORDERS',
      permission:
        'SERVICE_ORDER_CREATE',
    });

  const canManageOrderItems =
    canUse(user, {
      feature:
        'SERVICE_ORDERS',
      permission:
        'SERVICE_ORDER_ITEM_MANAGE',
    });

  const canUploadMedia =
    canUse(user, {
      feature: 'MEDIA',
      permission:
        'MEDIA_UPLOAD',
    });

  const canChooseBranch =
    [
      'OWNER',
      'MANAGER',
    ].includes(
      user?.role,
    );

  async function load() {
    const inspectionResponse =
      await api.get(
        '/inspections',
      );

    setItems(
      inspectionResponse.data,
    );

    if (!canManage) {
      return;
    }

    const requests = [
      api.get('/customers'),
      api.get('/vehicles'),
      api.get(
        '/inspections/mobile-intake-v3/templates',
      ),
    ];

    if (canChooseBranch) {
      requests.push(
        api.get('/branches'),
      );
    }

    const responses =
      await Promise.all(
        requests,
      );

    setCustomers(
      responses[0].data,
    );

    setVehicles(
      responses[1].data,
    );

    setOperationTemplates(
      responses[2]?.data ||
        [],
    );

    if (canChooseBranch) {
      setBranches(
        responses[3]?.data ||
          [],
      );
    }
  }

  useEffect(() => {
    load().catch((err) => {
      setError(
        apiMessage(
          err,
          'Araç kabul kayıtları yüklenemedi.',
        ),
      );
    });
  }, []);

  useEffect(() => {
    if (
      initialCustomerId
    ) {
      setForm(
        (current) => ({
          ...current,
          customerId:
            initialCustomerId,
          vehicleId:
            initialVehicleId ||
            current.vehicleId,
        }),
      );

      setNewCustomerMode(
        false,
      );
      setShowForm(true);
    }

    if (
      initialVehicleId
    ) {
      setNewVehicleMode(
        false,
      );
      setShowForm(true);
    }

    if (
      initialCustomerId ||
      initialVehicleId
    ) {
      onSeedConsumed?.();
    }
  }, [
    initialCustomerId,
    initialVehicleId,
  ]);

  useEffect(() => {
    if (
      !form.vehicleId ||
      !vehicles.length
    ) {
      return;
    }

    const selected =
      vehicles.find(
        (vehicle) =>
          vehicle.id ===
          form.vehicleId,
      );

    if (
      selected &&
      !form.mileage
    ) {
      setForm(
        (current) => ({
          ...current,
          mileage:
            String(
              selected.mileage ||
                '',
            ),
        }),
      );
    }
  }, [
    form.vehicleId,
    vehicles,
  ]);

  const filtered =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLocaleLowerCase(
            'tr-TR',
          );

      if (!term) {
        return items;
      }

      return items.filter(
        (item) =>
          [
            item.vehicle?.plate,
            item.vehicle?.brand,
            item.vehicle?.model,
            item.vehicle?.customer?.firstName,
            item.vehicle?.customer?.lastName,
            item.customerComplaint,
            item.serviceOrder?.orderNumber,
          ]
            .filter(Boolean)
            .join(' ')
            .toLocaleLowerCase(
              'tr-TR',
            )
            .includes(term),
      );
    }, [
      items,
      search,
    ]);

  const visibleCustomers =
    useMemo(() => {
      const term =
        customerSearch
          .trim()
          .toLocaleLowerCase(
            'tr-TR',
          );

      const result =
        term
          ? customers.filter(
              (customer) =>
                [
                  customer.firstName,
                  customer.lastName,
                  customer.phone,
                  customer.email,
                  ...(customer.vehicles ||
                    []).map(
                    (vehicle) =>
                      vehicle.plate,
                  ),
                ]
                  .filter(Boolean)
                  .join(' ')
                  .toLocaleLowerCase(
                    'tr-TR',
                  )
                  .includes(term),
            )
          : customers;

      return result.slice(
        0,
        24,
      );
    }, [
      customers,
      customerSearch,
    ]);

  const selectedCustomer =
    customers.find(
      (customer) =>
        customer.id ===
        form.customerId,
    );

  const customerVehicles =
    vehicles.filter(
      (vehicle) =>
        vehicle.customerId ===
        form.customerId,
    );

  function selectCustomer(
    customer,
  ) {
    const firstVehicle =
      vehicles.find(
        (vehicle) =>
          vehicle.customerId ===
          customer.id,
      );

    setNewCustomerMode(
      false,
    );

    setNewVehicleMode(
      !firstVehicle,
    );

    setForm(
      (current) => ({
        ...current,
        customerId:
          customer.id,
        vehicleId:
          firstVehicle?.id ||
          '',
        mileage:
          firstVehicle
            ? String(
                firstVehicle.mileage ||
                  '',
              )
            : '',
      }),
    );
  }

  function startNewCustomer() {
    setNewCustomerMode(true);
    setNewVehicleMode(true);

    setForm(
      (current) => ({
        ...current,
        customerId: '',
        vehicleId: '',
        customerFirstName:
          '',
        customerLastName:
          '',
        customerPhone: '',
        customerEmail: '',
        plate: '',
        brand: '',
        model: '',
        modelYear: '',
        fuelType: '',
        transmission: '',
        color: '',
        vin: '',
        mileage: '',
      }),
    );
  }

  function selectVehicle(
    vehicle,
  ) {
    setNewVehicleMode(
      false,
    );

    setForm(
      (current) => ({
        ...current,
        vehicleId:
          vehicle.id,
        mileage:
          String(
            vehicle.mileage ||
              '',
          ),
      }),
    );
  }

  function startNewVehicle() {
    setNewVehicleMode(true);

    setForm(
      (current) => ({
        ...current,
        vehicleId: '',
        plate: '',
        brand: '',
        model: '',
        modelYear: '',
        fuelType: '',
        transmission: '',
        color: '',
        vin: '',
        mileage:
          current.mileage ||
          '',
      }),
    );
  }

  function updateWorkItem(
    id,
    field,
    value,
  ) {
    setWorkItems(
      (current) =>
        current.map(
          (item) =>
            item.id === id
              ? {
                  ...item,
                  [field]:
                    value,
                }
              : item,
        ),
    );
  }

  function removeWorkItem(
    id,
  ) {
    setWorkItems(
      (current) => {
        const next =
          current.filter(
            (item) =>
              item.id !== id,
          );

        return next.length
          ? next
          : [
              emptyWorkItem(),
            ];
      },
    );
  }

  function applyOperationTemplate(
    template,
  ) {
    const templateItems =
      (template?.items || []).map(
        (item) => ({
          id:
            `work-${Date.now()}-${Math.random()}`,
          category:
            item.type === 'PART'
              ? 'PARCA'
              : item.category ===
                  'TAMIR'
                ? 'TAMIR'
                : 'BAKIM',
          name:
            item.name || '',
          description:
            item.description || '',
          quantity:
            String(
              item.quantity || 1,
            ),
          unitPrice:
            String(
              item.unitPrice || 0,
            ),
        }),
      );

    if (!templateItems.length) {
      return;
    }

    setWorkItems(
      (current) => {
        const existing =
          current.filter(
            (item) =>
              item.name.trim(),
          );

        return [
          ...existing,
          ...templateItems,
        ];
      },
    );

    setMessage(
      `${template.name} paketi iş emrine eklendi. Kalemleri kayıttan önce düzenleyebilirsiniz.`,
    );
  }

  async function queueFromCamera() {
    setError('');
    setMessage('');

    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError(
        'Fotoğraf çekmek için kamera izni gerekli.',
      );
      return;
    }

    const result =
      await ImagePicker.launchCameraAsync({
        quality: .72,
        allowsEditing: false,
      });

    if (
      result.canceled
    ) {
      return;
    }

    addPickedAsset(
      result.assets?.[0],
    );
  }

  async function queueFromGallery() {
    setError('');
    setMessage('');

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError(
        'Galeriden fotoğraf seçmek için izin gerekli.',
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        quality: .72,
        allowsEditing: false,
        allowsMultipleSelection:
          false,
      });

    if (
      result.canceled
    ) {
      return;
    }

    addPickedAsset(
      result.assets?.[0],
    );
  }

  function addPickedAsset(
    asset,
  ) {
    if (!asset?.uri) {
      setError(
        'Fotoğraf alınamadı.',
      );
      return;
    }

    setQueuedPhotos(
      (current) => [
        ...current,
        {
          id:
            `photo-${Date.now()}-${Math.random()}`,
          uri:
            asset.uri,
          fileName:
            asset.fileName ||
            `arac-kabul-${Date.now()}.jpg`,
          mimeType:
            asset.mimeType ||
            'image/jpeg',
          type:
            photoType,
        },
      ],
    );
  }

  function resetForm() {
    setNewCustomerMode(
      false,
    );
    setNewVehicleMode(
      false,
    );

    setForm({
      branchId:
        user?.branchId ||
        '',
      customerId: '',
      customerFirstName: '',
      customerLastName: '',
      customerPhone: '',
      customerEmail: '',
      vehicleId: '',
      plate: '',
      brand: '',
      model: '',
      modelYear: '',
      fuelType: '',
      transmission: '',
      color: '',
      vin: '',
      mileage: '',
      fuelLevel: '',
      customerComplaint: '',
      existingDamage: '',
      valuablesNote: '',
      internalNote: '',
    });

    setWorkItems([
      emptyWorkItem(),
    ]);

    setQueuedPhotos([]);
    setCustomerSearch('');
  }

  async function uploadPhoto(
    photo,
    intake,
  ) {
    const formData =
      new FormData();

    formData.append(
      'file',
      {
        uri: photo.uri,
        name:
          photo.fileName,
        type:
          photo.mimeType,
      },
    );

    formData.append(
      'type',
      photo.type,
    );

    formData.append(
      'vehicleId',
      intake.vehicle.id,
    );

    formData.append(
      'serviceOrderId',
      intake.serviceOrder.id,
    );

    formData.append(
      'inspectionId',
      intake.inspection.id,
    );

    formData.append(
      'description',
      'Mobil araç kabul fotoğrafı',
    );

    formData.append(
      'customerVisible',
      'true',
    );

    return api.post(
      '/media/upload',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      },
    );
  }

  async function createIntegratedIntake() {
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const plannedItems =
        canManageOrderItems
          ? workItems
              .filter(
                (item) =>
                  item.name
                    .trim(),
              )
              .map(
                (item) => ({
                  category:
                    item.category,
                  type:
                    item.category ===
                    'PARCA'
                      ? 'PART'
                      : item.category ===
                          'DIGER'
                        ? 'OTHER'
                        : 'LABOR',
                  name:
                    item.name
                      .trim(),
                  description:
                    item.description
                      .trim() ||
                    undefined,
                  quantity:
                    Math.max(
                      .01,
                      Number(
                        item.quantity ||
                          1,
                      ),
                    ),
                  unitPrice:
                    Math.max(
                      0,
                      Number(
                        item.unitPrice ||
                          0,
                      ),
                    ),
                  vatRate: 20,
                }),
              )
          : [];

      const payload = {
        branchId:
          form.branchId ||
          undefined,
        customerId:
          newCustomerMode
            ? undefined
            : form.customerId,
        customerFirstName:
          newCustomerMode
            ? form.customerFirstName
                .trim()
            : undefined,
        customerLastName:
          newCustomerMode
            ? form.customerLastName
                .trim() ||
              undefined
            : undefined,
        customerPhone:
          newCustomerMode
            ? form.customerPhone
                .trim()
            : undefined,
        customerEmail:
          newCustomerMode
            ? form.customerEmail
                .trim() ||
              undefined
            : undefined,
        vehicleId:
          newVehicleMode
            ? undefined
            : form.vehicleId,
        plate:
          newVehicleMode
            ? form.plate
                .trim()
            : undefined,
        brand:
          newVehicleMode
            ? form.brand
                .trim()
            : undefined,
        model:
          newVehicleMode
            ? form.model
                .trim()
            : undefined,
        modelYear:
          newVehicleMode &&
          form.modelYear
            ? Number(
                form.modelYear,
              )
            : undefined,
        vin:
          newVehicleMode
            ? form.vin
                .trim() ||
              undefined
            : undefined,
        fuelType:
          newVehicleMode
            ? form.fuelType
                .trim() ||
              undefined
            : undefined,
        transmission:
          newVehicleMode
            ? form.transmission
                .trim() ||
              undefined
            : undefined,
        color:
          newVehicleMode
            ? form.color
                .trim() ||
              undefined
            : undefined,
        mileage:
          Number(
            form.mileage,
          ),
        fuelLevel:
          form.fuelLevel
            .trim() ||
          undefined,
        customerComplaint:
          form.customerComplaint
            .trim() ||
          undefined,
        existingDamage:
          form.existingDamage
            .trim() ||
          undefined,
        valuablesNote:
          form.valuablesNote
            .trim() ||
          undefined,
        internalNote:
          form.internalNote
            .trim() ||
          undefined,
        plannedItems,
      };

      const response =
        await api.post(
          '/inspections/mobile-intake-v3',
          payload,
        );

      const intake =
        response.data;

      let uploaded = 0;
      let uploadFailed = 0;

      if (
        canUploadMedia &&
        queuedPhotos.length
      ) {
        for (
          const photo of
            queuedPhotos
        ) {
          try {
            await uploadPhoto(
              photo,
              intake,
            );

            uploaded += 1;
          } catch {
            uploadFailed += 1;
          }
        }
      }

      const orderNumber =
        intake.serviceOrder
          ?.orderNumber ||
        'iş emri';

      setMessage(
        uploadFailed
          ? `${orderNumber} oluşturuldu. ${uploaded} fotoğraf yüklendi, ${uploadFailed} fotoğraf yüklenemedi.`
          : `${orderNumber} oluşturuldu. Araç kabulü tamamlandı ve muhasebeye fiyatlandırma için gönderildi${uploaded ? ` · ${uploaded} fotoğraf` : ''}.`,
      );

      resetForm();
      setShowForm(
        false,
      );

      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Mobil araç kabul kaydı oluşturulamadı.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function complete(
    id,
  ) {
    setBusy(true);
    setError('');

    try {
      await api.patch(
        `/inspections/${id}/complete`,
      );

      setMessage(
        'Araç kabul kaydı tamamlandı.',
      );

      await load();
    } catch (err) {
      setError(
        apiMessage(
          err,
          'Kayıt tamamlanamadı.',
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setRefreshing(true);

    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const branchReady =
    !canChooseBranch ||
    Boolean(
      form.branchId ||
      user?.branchId,
    );

  const customerReady =
    newCustomerMode
      ? (
          form.customerFirstName
            .trim()
            .length >= 2 &&
          form.customerPhone
            .replace(
              /\D/g,
              '',
            )
            .length >= 10
        )
      : Boolean(
          form.customerId,
        );

  const vehicleReady =
    newVehicleMode
      ? Boolean(
          form.plate.trim() &&
          form.brand.trim() &&
          form.model.trim(),
        )
      : Boolean(
          form.vehicleId,
        );

  const canSubmit =
    canManage &&
    canCreateOrder &&
    branchReady &&
    customerReady &&
    vehicleReady &&
    Number(
      form.mileage,
    ) >= 0 &&
    form.mileage !== '';

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          tintColor={colors.accent}
        />
      }
      contentContainerStyle={
        styles.content
      }
    >
      <ScreenTitle
        title="Araç Kabul"
        subtitle="Yeni veya kayıtlı müşteriyi ve aracı seçin; ön kabul, işlem paketi ve fotoğrafları ekleyin. Kayıt muhasebeye fiyatlandırma için otomatik düşer."
      />

      <Field
        placeholder="Plaka, müşteri veya iş emri ara"
        value={search}
        onChangeText={setSearch}
      />

      {canManage ? (
        <Button
          title={
            showForm
              ? 'Kabul Formunu Kapat'
              : '+ Entegre Araç Kabul'
          }
          tone="ghost"
          onPress={() =>
            setShowForm(
              (value) =>
                !value,
            )
          }
        />
      ) : null}

      {!canCreateOrder &&
      canManage ? (
        <Message
          text="Entegre araç kabul için İş Emri Oluşturma yetkisi gerekli."
        />
      ) : null}

      <Message text={error} />
      <Message
        text={message}
        tone="success"
      />

      {showForm &&
      canManage ? (
        <View style={styles.formStack}>
          {canChooseBranch ? (
            <Card>
              <Text style={styles.sectionTitle}>
                1. Şube
              </Text>

              <View style={styles.choiceGrid}>
                {branches
                  .filter(
                    (branch) =>
                      branch.active,
                  )
                  .map(
                    (branch) => (
                      <Pressable
                        key={branch.id}
                        onPress={() =>
                          setForm({
                            ...form,
                            branchId:
                              branch.id,
                          })
                        }
                        style={[
                          styles.choice,
                          form.branchId ===
                            branch.id &&
                            styles.choiceActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.choiceText,
                            form.branchId ===
                              branch.id &&
                              styles.choiceTextActive,
                          ]}
                        >
                          {branch.name}
                        </Text>
                      </Pressable>
                    ),
                  )}
              </View>
            </Card>
          ) : null}

          <Card>
            <View style={styles.cardHead}>
              <View style={styles.flex}>
                <Text style={styles.sectionTitle}>
                  {canChooseBranch
                    ? '2. Müşteri'
                    : '1. Müşteri'}
                </Text>

                <Text style={styles.sectionHint}>
                  Kayıtlı müşteriyi seçin veya yeni müşteri oluşturun.
                </Text>
              </View>

              {canCreateCustomer ? (
                <Pressable
                  onPress={
                    newCustomerMode
                      ? () =>
                          setNewCustomerMode(
                            false,
                          )
                      : startNewCustomer
                  }
                >
                  <Text style={styles.actionText}>
                    {newCustomerMode
                      ? 'Kayıtlı Seç'
                      : '+ Yeni'}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {newCustomerMode ? (
              <>
                <Field
                  label="Ad *"
                  value={
                    form.customerFirstName
                  }
                  onChangeText={(value) =>
                    setForm({
                      ...form,
                      customerFirstName:
                        value,
                    })
                  }
                />

                <Field
                  label="Soyad"
                  value={
                    form.customerLastName
                  }
                  onChangeText={(value) =>
                    setForm({
                      ...form,
                      customerLastName:
                        value,
                    })
                  }
                />

                <Field
                  label="Telefon *"
                  keyboardType="phone-pad"
                  placeholder="05xx xxx xx xx"
                  value={
                    form.customerPhone
                  }
                  onChangeText={(value) =>
                    setForm({
                      ...form,
                      customerPhone:
                        value,
                    })
                  }
                />

                <Field
                  label="E-posta"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={
                    form.customerEmail
                  }
                  onChangeText={(value) =>
                    setForm({
                      ...form,
                      customerEmail:
                        value,
                    })
                  }
                />
              </>
            ) : (
              <>
                <Field
                  placeholder="Ad, telefon veya plaka ile müşteri ara"
                  value={
                    customerSearch
                  }
                  onChangeText={
                    setCustomerSearch
                  }
                />

                <View style={styles.selectorList}>
                  {visibleCustomers.map(
                    (customer) => (
                      <Pressable
                        key={
                          customer.id
                        }
                        onPress={() =>
                          selectCustomer(
                            customer,
                          )
                        }
                        style={[
                          styles.selectorCard,
                          form.customerId ===
                            customer.id &&
                            styles.selectorCardActive,
                        ]}
                      >
                        <View style={styles.flex}>
                          <Text style={styles.selectorTitle}>
                            {customer.firstName}{' '}
                            {customer.lastName}
                          </Text>

                          <Text style={styles.selectorMeta}>
                            {customer.phone ||
                              customer.email ||
                              'İletişim bilgisi yok'}
                          </Text>
                        </View>

                        <Text style={styles.selectorCount}>
                          {customer.vehicles
                            ?.length ||
                            0}{' '}
                          araç
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>
              </>
            )}
          </Card>

          {customerReady ? (
            <Card>
              <View style={styles.cardHead}>
                <View style={styles.flex}>
                  <Text style={styles.sectionTitle}>
                    {canChooseBranch
                      ? '3. Araç'
                      : '2. Araç'}
                  </Text>

                  <Text style={styles.sectionHint}>
                    Araç bilgileri mobilde kaydedilir ve PC müşteri paneline düşer.
                  </Text>
                </View>

                {canCreateVehicle ? (
                  <Pressable
                    onPress={
                      newVehicleMode
                        ? () =>
                            setNewVehicleMode(
                              false,
                            )
                        : startNewVehicle
                    }
                  >
                    <Text style={styles.actionText}>
                      {newVehicleMode
                        ? 'Kayıtlı Seç'
                        : '+ Yeni'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>

              {!newCustomerMode &&
              !newVehicleMode ? (
                <View style={styles.selectorList}>
                  {customerVehicles.map(
                    (vehicle) => (
                      <Pressable
                        key={
                          vehicle.id
                        }
                        onPress={() =>
                          selectVehicle(
                            vehicle,
                          )
                        }
                        style={[
                          styles.selectorCard,
                          form.vehicleId ===
                            vehicle.id &&
                            styles.selectorCardActive,
                        ]}
                      >
                        <View style={styles.flex}>
                          <Text style={styles.plate}>
                            {vehicle.plate}
                          </Text>

                          <Text style={styles.selectorMeta}>
                            {vehicle.brand}{' '}
                            {vehicle.model}
                          </Text>
                        </View>

                        <Text style={styles.selectorCount}>
                          {Number(
                            vehicle.mileage ||
                              0,
                          ).toLocaleString(
                            'tr-TR',
                          )}{' '}
                          KM
                        </Text>
                      </Pressable>
                    ),
                  )}

                  {!customerVehicles.length ? (
                    <Empty text="Bu müşterinin kayıtlı aracı yok. Yeni araç ekleyin." />
                  ) : null}
                </View>
              ) : (
                <>
                  <Field
                    label="Plaka *"
                    autoCapitalize="characters"
                    value={
                      form.plate
                    }
                    onChangeText={(value) =>
                      setForm({
                        ...form,
                        plate:
                          value
                            .toLocaleUpperCase(
                              'tr-TR',
                            ),
                      })
                    }
                  />

                  <View style={styles.twoCol}>
                    <View style={styles.half}>
                      <Field
                        label="Marka *"
                        value={
                          form.brand
                        }
                        onChangeText={(value) =>
                          setForm({
                            ...form,
                            brand:
                              value,
                          })
                        }
                      />
                    </View>

                    <View style={styles.half}>
                      <Field
                        label="Model *"
                        value={
                          form.model
                        }
                        onChangeText={(value) =>
                          setForm({
                            ...form,
                            model:
                              value,
                          })
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.half}>
                      <Field
                        label="Model Yılı"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={
                          form.modelYear
                        }
                        onChangeText={(value) =>
                          setForm({
                            ...form,
                            modelYear:
                              value.replace(
                                /\D/g,
                                '',
                              ),
                          })
                        }
                      />
                    </View>

                    <View style={styles.half}>
                      <Field
                        label="Renk"
                        value={
                          form.color
                        }
                        onChangeText={(value) =>
                          setForm({
                            ...form,
                            color:
                              value,
                          })
                        }
                      />
                    </View>
                  </View>

                  <View style={styles.twoCol}>
                    <View style={styles.half}>
                      <Field
                        label="Yakıt"
                        placeholder="Dizel, Benzin..."
                        value={
                          form.fuelType
                        }
                        onChangeText={(value) =>
                          setForm({
                            ...form,
                            fuelType:
                              value,
                          })
                        }
                      />
                    </View>

                    <View style={styles.half}>
                      <Field
                        label="Şanzıman"
                        placeholder="Manuel, Otomatik"
                        value={
                          form.transmission
                        }
                        onChangeText={(value) =>
                          setForm({
                            ...form,
                            transmission:
                              value,
                          })
                        }
                      />
                    </View>
                  </View>

                  <Field
                    label="VIN / Şasi No"
                    autoCapitalize="characters"
                    value={
                      form.vin
                    }
                    onChangeText={(value) =>
                      setForm({
                        ...form,
                        vin:
                          value,
                      })
                    }
                  />
                </>
              )}

              {selectedCustomer &&
              !newCustomerMode &&
              form.vehicleId ? (
                <Text style={styles.selectedNote}>
                  {selectedCustomer.firstName} müşterisine bağlı araç seçildi.
                </Text>
              ) : null}
            </Card>
          ) : null}

          {vehicleReady ? (
            <Card>
              <Text style={styles.sectionTitle}>
                {canChooseBranch
                  ? '4. Ön Kabul Bilgileri'
                  : '3. Ön Kabul Bilgileri'}
              </Text>

              <Field
                label="Son Kayıtlı KM *"
                keyboardType="number-pad"
                value={
                  form.mileage
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    mileage:
                      value.replace(
                        /\D/g,
                        '',
                      ),
                  })
                }
              />

              <Field
                label="Yakıt Seviyesi"
                placeholder="Örn. %50 / Yarım depo"
                value={
                  form.fuelLevel
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    fuelLevel:
                      value,
                  })
                }
              />

              <Field
                label="Müşteri Şikayeti / Talebi"
                multiline
                placeholder="Araç neden geldi?"
                value={
                  form.customerComplaint
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    customerComplaint:
                      value,
                  })
                }
              />

              <Field
                label="Mevcut Hasar"
                multiline
                placeholder="Çizik, göçük, kırık vb."
                value={
                  form.existingDamage
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    existingDamage:
                      value,
                  })
                }
              />

              <Field
                label="Araçtaki Değerli Eşyalar"
                multiline
                value={
                  form.valuablesNote
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    valuablesNote:
                      value,
                  })
                }
              />

              <Field
                label="Servis İç Notu"
                multiline
                value={
                  form.internalNote
                }
                onChangeText={(value) =>
                  setForm({
                    ...form,
                    internalNote:
                      value,
                  })
                }
              />
            </Card>
          ) : null}

          {vehicleReady &&
          canManageOrderItems ? (
            <Card>
              <View style={styles.cardHead}>
                <View style={styles.flex}>
                  <Text style={styles.sectionTitle}>
                    {canChooseBranch
                      ? '5. Yapılacak İşler'
                      : '4. Yapılacak İşler'}
                  </Text>

                  <Text style={styles.sectionHint}>
                    Bakım, tamir ve kullanılacak parçaları telefondan iş emrine ekleyin.
                  </Text>
                </View>

                <Pressable
                  onPress={() =>
                    setWorkItems(
                      (current) => [
                        ...current,
                        emptyWorkItem(),
                      ],
                    )
                  }
                >
                  <Text style={styles.actionText}>
                    + İşlem
                  </Text>
                </Pressable>
              </View>

              {operationTemplates.length ? (
                <>
                  <Text style={styles.sectionHint}>
                    Hazır işlem paketleri
                  </Text>

                  <View style={styles.selectorList}>
                    {operationTemplates.map(
                      (template) => (
                        <Pressable
                          key={template.code}
                          onPress={() =>
                            applyOperationTemplate(
                              template,
                            )
                          }
                          style={styles.selectorCard}
                        >
                          <View style={styles.flex}>
                            <Text style={styles.selectorTitle}>
                              {template.name}
                            </Text>

                            <Text style={styles.selectorMeta}>
                              {template.description}
                            </Text>
                          </View>

                          <Text style={styles.selectorCount}>
                            + {template.items?.length || 0} işlem
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>
                </>
              ) : null}

              <View style={styles.workList}>
                {workItems.map(
                  (
                    item,
                    index,
                  ) => (
                    <View
                      key={item.id}
                      style={styles.workCard}
                    >
                      <View style={styles.workHead}>
                        <Text style={styles.workIndex}>
                          İşlem {index + 1}
                        </Text>

                        <Pressable
                          onPress={() =>
                            removeWorkItem(
                              item.id,
                            )
                          }
                        >
                          <Text style={styles.removeText}>
                            Sil
                          </Text>
                        </Pressable>
                      </View>

                      <View style={styles.choiceGrid}>
                        {workCategories.map(
                          ([
                            value,
                            label,
                          ]) => (
                            <Pressable
                              key={value}
                              onPress={() =>
                                updateWorkItem(
                                  item.id,
                                  'category',
                                  value,
                                )
                              }
                              style={[
                                styles.choiceSmall,
                                item.category ===
                                  value &&
                                  styles.choiceActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.choiceSmallText,
                                  item.category ===
                                    value &&
                                    styles.choiceTextActive,
                                ]}
                              >
                                {label}
                              </Text>
                            </Pressable>
                          ),
                        )}
                      </View>

                      <Field
                        label="İşlem / Parça Adı"
                        placeholder="Örn. Motor yağı değişimi"
                        value={
                          item.name
                        }
                        onChangeText={(value) =>
                          updateWorkItem(
                            item.id,
                            'name',
                            value,
                          )
                        }
                      />

                      <Field
                        label="Açıklama"
                        multiline
                        value={
                          item.description
                        }
                        onChangeText={(value) =>
                          updateWorkItem(
                            item.id,
                            'description',
                            value,
                          )
                        }
                      />

                      <View style={styles.twoCol}>
                        <View style={styles.half}>
                          <Field
                            label="Miktar"
                            keyboardType="decimal-pad"
                            value={
                              item.quantity
                            }
                            onChangeText={(value) =>
                              updateWorkItem(
                                item.id,
                                'quantity',
                                value,
                              )
                            }
                          />
                        </View>

                        <View style={styles.half}>
                          <Field
                            label="Tahmini Birim Fiyat ₺"
                            keyboardType="decimal-pad"
                            value={
                              item.unitPrice
                            }
                            onChangeText={(value) =>
                              updateWorkItem(
                                item.id,
                                'unitPrice',
                                value,
                              )
                            }
                          />
                        </View>
                      </View>
                    </View>
                  ),
                )}
              </View>
            </Card>
          ) : null}

          {vehicleReady &&
          canUploadMedia ? (
            <Card>
              <Text style={styles.sectionTitle}>
                {canChooseBranch
                  ? '6. Araç Fotoğrafları'
                  : '5. Araç Fotoğrafları'}
              </Text>

              <Text style={styles.sectionHint}>
                Fotoğraflar araca, araç kabul kaydına ve iş emrine birlikte bağlanır.
              </Text>

              <View style={styles.choiceGrid}>
                {photoTypes.map(
                  ([
                    value,
                    label,
                  ]) => (
                    <Pressable
                      key={value}
                      onPress={() =>
                        setPhotoType(
                          value,
                        )
                      }
                      style={[
                        styles.choiceSmall,
                        photoType ===
                          value &&
                          styles.choiceActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.choiceSmallText,
                          photoType ===
                            value &&
                            styles.choiceTextActive,
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  ),
                )}
              </View>

              <View style={styles.photoActions}>
                <View style={styles.half}>
                  <Button
                    title="Kamera"
                    tone="ghost"
                    onPress={
                      queueFromCamera
                    }
                  />
                </View>

                <View style={styles.half}>
                  <Button
                    title="Galeriden Ekle"
                    tone="ghost"
                    onPress={
                      queueFromGallery
                    }
                  />
                </View>
              </View>

              {queuedPhotos.length ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={
                    styles.photoQueue
                  }
                >
                  {queuedPhotos.map(
                    (photo) => (
                      <View
                        key={photo.id}
                        style={styles.photoItem}
                      >
                        <Image
                          source={{
                            uri:
                              photo.uri,
                          }}
                          style={styles.photo}
                        />

                        <Text style={styles.photoType}>
                          {photoTypes.find(
                            ([value]) =>
                              value ===
                              photo.type,
                          )?.[1] ||
                            photo.type}
                        </Text>

                        <Pressable
                          onPress={() =>
                            setQueuedPhotos(
                              (current) =>
                                current.filter(
                                  (item) =>
                                    item.id !==
                                    photo.id,
                                ),
                            )
                          }
                        >
                          <Text style={styles.removeText}>
                            Kaldır
                          </Text>
                        </Pressable>
                      </View>
                    ),
                  )}
                </ScrollView>
              ) : (
                <Text style={styles.noPhoto}>
                  Henüz fotoğraf eklenmedi.
                </Text>
              )}
            </Card>
          ) : null}

          {vehicleReady ? (
            <Card style={styles.finalCard}>
              <Text style={styles.finalTitle}>
                PC Paneline Gönder
              </Text>

              <Text style={styles.finalText}>
                Kaydettiğiniz anda müşteri, araç, ön kabul, iş emri, yapılacak işler ve fotoğraflar aynı kayda bağlanır.
              </Text>

              <Button
                title={
                  busy
                    ? 'Gönderiliyor...'
                    : 'Araç Kabulünü Kaydet ve İş Emrini Aç'
                }
                disabled={
                  busy ||
                  !canSubmit
                }
                onPress={
                  createIntegratedIntake
                }
              />
            </Card>
          ) : null}
        </View>
      ) : null}

      <Text style={styles.listTitle}>
        Son Araç Kabulleri
      </Text>

      <View style={styles.list}>
        {filtered.map(
          (item) => (
            <Card key={item.id}>
              <View style={styles.row}>
                <View style={styles.flex}>
                  <Text style={styles.plate}>
                    {item.vehicle?.plate}
                  </Text>

                  <Text style={styles.vehicleText}>
                    {item.vehicle?.brand}{' '}
                    {item.vehicle?.model}
                  </Text>

                  <Text style={styles.customerText}>
                    {item.vehicle?.customer
                      ? `${item.vehicle.customer.firstName} ${item.vehicle.customer.lastName || ''}`
                      : 'Müşteri'}
                  </Text>
                </View>

                <Text
                  style={
                    item.status ===
                    'COMPLETED'
                      ? styles.completed
                      : styles.draft
                  }
                >
                  {item.status ===
                  'COMPLETED'
                    ? 'Tamamlandı'
                    : 'Ön Kabul'}
                </Text>
              </View>

              <Text style={styles.meta}>
                KM:{' '}
                {Number(
                  item.mileage ||
                    0,
                ).toLocaleString(
                  'tr-TR',
                )}
                {' · '}
                Yakıt:{' '}
                {item.fuelLevel ||
                  '-'}
              </Text>

              {item.serviceOrder
                ?.orderNumber ? (
                <Text style={styles.orderMeta}>
                  İş Emri:{' '}
                  {
                    item.serviceOrder
                      .orderNumber
                  }
                  {' · '}
                  {item.serviceOrder
                    .items?.length ||
                    0}{' '}
                  işlem
                </Text>
              ) : null}

              {item.media?.length ? (
                <Text style={styles.photoMeta}>
                  {item.media.length}{' '}
                  fotoğraf
                </Text>
              ) : null}

              {item.customerComplaint ? (
                <Text style={styles.note}>
                  {item.customerComplaint}
                </Text>
              ) : null}

              {canManage &&
              item.status !==
                'COMPLETED' ? (
                <Text
                  onPress={() =>
                    complete(
                      item.id,
                    )
                  }
                  style={styles.complete}
                >
                  Kabulü Tamamla
                </Text>
              ) : null}
            </Card>
          ),
        )}

        {!filtered.length ? (
          <Empty text="Araç kabul kaydı bulunamadı." />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    content: {
      padding:
        spacing.md,
      paddingBottom: 110,
    },
    formStack: {
      marginTop: 12,
      gap: 10,
    },
    cardHead: {
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    flex: {
      flex: 1,
    },
    sectionTitle: {
      color:
        colors.text,
      fontSize: 13,
      fontWeight: '900',
    },
    sectionHint: {
      marginTop: 4,
      color:
        colors.muted,
      fontSize: 9,
      lineHeight: 14,
    },
    actionText: {
      color:
        colors.accent,
      fontSize: 10,
      fontWeight: '900',
    },
    choiceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    choice: {
      minWidth: 100,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      backgroundColor:
        '#0e1419',
    },
    choiceSmall: {
      paddingVertical: 7,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 9,
      backgroundColor:
        '#0e1419',
    },
    choiceActive: {
      borderColor:
        '#7b571c',
      backgroundColor:
        colors.accentSoft,
    },
    choiceText: {
      color:
        colors.muted,
      fontSize: 9,
      fontWeight: '800',
    },
    choiceSmallText: {
      color:
        colors.muted,
      fontSize: 8,
      fontWeight: '800',
    },
    choiceTextActive: {
      color:
        colors.accent,
    },
    selectorList: {
      gap: 7,
    },
    selectorCard: {
      padding: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius: 10,
      backgroundColor:
        '#0e1419',
    },
    selectorCardActive: {
      borderColor:
        '#7b571c',
      backgroundColor:
        colors.accentSoft,
    },
    selectorTitle: {
      color:
        colors.text,
      fontSize: 11,
      fontWeight: '900',
    },
    selectorMeta: {
      marginTop: 3,
      color:
        colors.muted,
      fontSize: 8,
    },
    selectorCount: {
      color:
        colors.accent,
      fontSize: 8,
      fontWeight: '800',
    },
    plate: {
      color:
        colors.text,
      fontSize: 16,
      fontWeight: '950',
    },
    selectedNote: {
      marginTop: 7,
      color:
        colors.success,
      fontSize: 9,
    },
    twoCol: {
      flexDirection: 'row',
      gap: 8,
    },
    half: {
      flex: 1,
    },
    workList: {
      gap: 9,
    },
    workCard: {
      padding: 11,
      borderWidth: 1,
      borderColor:
        colors.border,
      borderRadius:
        radius.sm,
      backgroundColor:
        '#0e1419',
    },
    workHead: {
      marginBottom: 8,
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },
    workIndex: {
      color:
        colors.text,
      fontSize: 10,
      fontWeight: '900',
    },
    removeText: {
      color:
        colors.danger,
      fontSize: 8,
      fontWeight: '800',
    },
    photoActions: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 8,
    },
    photoQueue: {
      marginTop: 12,
      gap: 8,
    },
    photoItem: {
      width: 116,
    },
    photo: {
      width: 116,
      height: 86,
      borderRadius: 10,
      backgroundColor:
        colors.panel2,
    },
    photoType: {
      marginTop: 4,
      color:
        colors.text,
      fontSize: 8,
      fontWeight: '800',
    },
    noPhoto: {
      marginTop: 10,
      color:
        colors.muted,
      fontSize: 9,
    },
    finalCard: {
      borderColor:
        '#6f4f16',
      backgroundColor:
        colors.accentSoft,
    },
    finalTitle: {
      color:
        colors.accent,
      fontSize: 14,
      fontWeight: '950',
    },
    finalText: {
      marginTop: 6,
      marginBottom: 12,
      color:
        colors.muted,
      fontSize: 9,
      lineHeight: 15,
    },
    listTitle: {
      marginTop: 20,
      marginBottom: 8,
      color:
        colors.text,
      fontSize: 13,
      fontWeight: '900',
    },
    list: {
      gap: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
    },
    vehicleText: {
      marginTop: 3,
      color:
        colors.muted,
      fontSize: 9,
    },
    customerText: {
      marginTop: 4,
      color:
        colors.text,
      fontSize: 9,
      fontWeight: '700',
    },
    draft: {
      color:
        colors.warning,
      fontSize: 9,
      fontWeight: '800',
    },
    completed: {
      color:
        colors.success,
      fontSize: 9,
      fontWeight: '800',
    },
    meta: {
      marginTop: 9,
      color: '#77828c',
      fontSize: 9,
    },
    orderMeta: {
      marginTop: 5,
      color:
        colors.accent,
      fontSize: 9,
      fontWeight: '800',
    },
    photoMeta: {
      marginTop: 5,
      color:
        colors.success,
      fontSize: 8,
      fontWeight: '800',
    },
    note: {
      marginTop: 7,
      color:
        colors.muted,
      fontSize: 10,
      lineHeight: 15,
    },
    complete: {
      marginTop: 10,
      color:
        colors.accent,
      fontSize: 10,
      fontWeight: '900',
    },
  });

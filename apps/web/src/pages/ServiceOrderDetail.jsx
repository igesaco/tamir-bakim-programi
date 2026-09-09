import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { statusLabel } from '../utils/status';

const allStatuses = [
  'ARRIVED',
  'ACCEPTED',
  'INSPECTION',
  'QUOTE_WAITING',
  'APPROVED',
  'IN_PROGRESS',
  'PART_WAITING',
  'QUALITY_CONTROL',
  'READY',
  'PAYMENT_WAITING',
  'DELIVERED',
  'CANCELLED',
];

const technicianStatuses = [
  'ACCEPTED',
  'IN_PROGRESS',
  'PART_WAITING',
  'QUALITY_CONTROL',
  'READY',
];

export default function ServiceOrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [availableParts, setAvailableParts] = useState([]);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [itemBusy, setItemBusy] = useState(false);
  const [itemError, setItemError] = useState('');
  const [inspectionBusy, setInspectionBusy] = useState(false);
  const [inspectionError, setInspectionError] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);

  const [inspectionForm, setInspectionForm] = useState({
    mileage: '',
    fuelLevel: '',
    customerComplaint: '',
    existingDamage: '',
    valuablesNote: '',
  });

  const [checklistForm, setChecklistForm] = useState({
    category: 'GENEL',
    name: '',
    condition: '',
    note: '',
    recommendedAction: '',
  });

  const [uploadForm, setUploadForm] = useState({
    type: 'ACCEPTANCE',
    description: '',
    file: null,
  });

  const [itemForm, setItemForm] = useState({
    type: 'LABOR',
    partId: '',
    name: '',
    description: '',
    quantity: 1,
    unitPrice: '',
    discountAmount: 0,
    vatRate: 20,
  });

  const canAssign = [
    'OWNER',
    'MANAGER',
    'SERVICE_ADVISOR',
    'ACCOUNTING',
  ].includes(user?.role);

  const statuses =
    user?.role === 'TECHNICIAN'
      ? technicianStatuses
      : allStatuses;

  async function load() {
    const response = await api.get(
      `/service-orders/${id}`,
    );

    setOrder(response.data);

    setInspectionForm((current) => ({
      ...current,
      mileage:
        current.mileage ||
        response.data.mileage ||
        '',
      customerComplaint:
        current.customerComplaint ||
        response.data.complaint ||
        '',
    }));

    if (user?.role !== 'TECHNICIAN') {
      const partsResponse =
        await api.get(
          `/service-orders/${id}/available-parts`,
        );

      setAvailableParts(
        partsResponse.data,
      );
    }
  }

  useEffect(() => {
    load();

    if (canAssign) {
      api.get('/users/technicians')
        .then((response) => {
          setTechnicians(response.data);
        });
    }
  }, [id, canAssign]);

  async function changeStatus(status) {
    await api.patch(
      `/service-orders/${id}/status`,
      { status },
    );

    await load();
  }

  async function assignTechnician(technicianId) {
    setAssignmentBusy(true);

    try {
      await api.patch(
        `/service-orders/${id}/assign-technician`,
        {
          technicianId:
            technicianId || null,
        },
      );

      await load();
    } finally {
      setAssignmentBusy(false);
    }
  }

  function selectPart(partId) {
    const part = availableParts.find(
      (item) =>
        item.partId === partId,
    );

    setItemForm({
      ...itemForm,
      partId,
      name: part?.name || '',
      unitPrice:
        part?.salePrice ?? '',
    });
  }

  async function addItem(e) {
    e.preventDefault();

    setItemBusy(true);
    setItemError('');

    try {
      await api.post(
        `/service-orders/${id}/items`,
        {
          type: itemForm.type,
          partId:
            itemForm.partId ||
            undefined,
          name:
            itemForm.name.trim(),
          description:
            itemForm.description.trim() ||
            undefined,
          quantity:
            Number(
              itemForm.quantity,
            ),
          unitPrice:
            itemForm.unitPrice === ''
              ? undefined
              : Number(
                  itemForm.unitPrice,
                ),
          discountAmount:
            Number(
              itemForm.discountAmount ||
                0,
            ),
          vatRate:
            Number(
              itemForm.vatRate ||
                0,
            ),
        },
      );

      setItemForm({
        type: 'LABOR',
        partId: '',
        name: '',
        description: '',
        quantity: 1,
        unitPrice: '',
        discountAmount: 0,
        vatRate: 20,
      });

      await load();
    } catch (err) {
      const message =
        err?.response?.data?.message;

      setItemError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'İşlem eklenemedi.',
      );
    } finally {
      setItemBusy(false);
    }
  }

  async function toggleItem(item) {
    await api.patch(
      `/service-orders/${id}/items/${item.id}/complete`,
      {
        completed:
          !item.completed,
      },
    );

    await load();
  }

  async function removeItem(item) {
    const approved =
      window.confirm(
        `${item.name} kalemini silmek istediğinize emin misiniz?`,
      );

    if (!approved) {
      return;
    }

    await api.delete(
      `/service-orders/${id}/items/${item.id}`,
    );

    await load();
  }

  async function createInspection(e) {
    e.preventDefault();

    setInspectionBusy(true);
    setInspectionError('');

    try {
      await api.post('/inspections', {
        vehicleId: order.vehicle?.id || order.vehicleId,
        serviceOrderId: order.id,
        mileage: Number(
          inspectionForm.mileage || 0,
        ),
        fuelLevel:
          inspectionForm.fuelLevel ||
          undefined,
        customerComplaint:
          inspectionForm.customerComplaint ||
          undefined,
        existingDamage:
          inspectionForm.existingDamage ||
          undefined,
        valuablesNote:
          inspectionForm.valuablesNote ||
          undefined,
      });

      setInspectionForm({
        mileage:
          order.mileage || '',
        fuelLevel: '',
        customerComplaint:
          order.complaint || '',
        existingDamage: '',
        valuablesNote: '',
      });

      await load();
    } catch (err) {
      const message =
        err?.response?.data?.message;

      setInspectionError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'Araç kabul kaydı oluşturulamadı.',
      );
    } finally {
      setInspectionBusy(false);
    }
  }

  async function addChecklistItem(
    inspectionId,
  ) {
    if (!checklistForm.name.trim()) {
      return;
    }

    setInspectionBusy(true);
    setInspectionError('');

    try {
      await api.post(
        `/inspections/${inspectionId}/items`,
        {
          category:
            checklistForm.category ||
            'GENEL',
          name:
            checklistForm.name.trim(),
          condition:
            checklistForm.condition ||
            undefined,
          note:
            checklistForm.note ||
            undefined,
          recommendedAction:
            checklistForm.recommendedAction ||
            undefined,
        },
      );

      setChecklistForm({
        category: 'GENEL',
        name: '',
        condition: '',
        note: '',
        recommendedAction: '',
      });

      await load();
    } catch (err) {
      const message =
        err?.response?.data?.message;

      setInspectionError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'Kontrol maddesi eklenemedi.',
      );
    } finally {
      setInspectionBusy(false);
    }
  }

  async function completeInspection(
    inspectionId,
  ) {
    await api.patch(
      `/inspections/${inspectionId}/complete`,
    );

    await load();
  }

  async function uploadInspectionMedia(
    inspectionId,
  ) {
    if (!uploadForm.file) {
      setInspectionError(
        'Yüklenecek dosyayı seçin.',
      );
      return;
    }

    setUploadBusy(true);
    setInspectionError('');

    try {
      const data = new FormData();

      data.append(
        'file',
        uploadForm.file,
      );
      data.append(
        'type',
        uploadForm.type,
      );
      data.append(
        'vehicleId',
        order.vehicle?.id ||
          order.vehicleId,
      );
      data.append(
        'serviceOrderId',
        order.id,
      );
      data.append(
        'inspectionId',
        inspectionId,
      );

      if (
        uploadForm.description.trim()
      ) {
        data.append(
          'description',
          uploadForm.description.trim(),
        );
      }

      await api.post(
        '/media/upload',
        data,
      );

      setUploadForm({
        type: 'ACCEPTANCE',
        description: '',
        file: null,
      });

      const input =
        document.getElementById(
          `inspection-file-${inspectionId}`,
        );

      if (input) {
        input.value = '';
      }

      await load();
    } catch (err) {
      const message =
        err?.response?.data?.message;

      setInspectionError(
        Array.isArray(message)
          ? message.join(', ')
          : message ||
              'Dosya yüklenemedi.',
      );
    } finally {
      setUploadBusy(false);
    }
  }

  function mediaUrl(media) {
    const key = String(
      media.storageKey || '',
    ).replace(/^\/+/, '');

    return `${api.defaults.baseURL}/${key}`;
  }

  if (!order) {
    return <div>İş emri yükleniyor...</div>;
  }

  const itemTotal =
    order.items?.reduce(
      (sum, item) => {
        const gross =
          Number(
            item.grossTotal || 0,
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
    ) || 0;

  const paymentTotal =
    order.payments?.reduce(
      (sum, item) =>
        item.status === 'PAID'
          ? sum +
            Number(
              item.amount || 0,
            )
          : sum,
      0,
    ) || 0;

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>{order.orderNumber}</h1>
          <p>
            {order.vehicle?.plate} ·{' '}
            {order.customer?.firstName}{' '}
            {order.customer?.lastName}
          </p>
        </div>

        <div className="action-row">
          {user?.role !== 'TECHNICIAN' && (
            <a
              className="small-button"
              href={`/service-orders/${id}/delivery`}
              target="_blank"
              rel="noreferrer"
            >
              Teslim Tutanağı
            </a>
          )}

          <a
            className="small-button"
            href="/service-orders"
          >
            ← İş Emirlerine Dön
          </a>
        </div>
      </div>

      <div className="detail-stats">
        <div className="stat-card">
          <span>Durum</span>
          <strong className="smaller-stat">
            {statusLabel(order.status)}
          </strong>
        </div>

        <div className="stat-card">
          <span>Kilometre</span>
          <strong>
            {Number(
              order.mileage || 0,
            ).toLocaleString('tr-TR')}
          </strong>
        </div>

        {user?.role !== 'TECHNICIAN' && (
          <>
            <div className="stat-card">
              <span>İşlem Tutarı</span>
              <strong>
                {itemTotal.toLocaleString('tr-TR')} ₺
              </strong>
            </div>

            <div className="stat-card">
              <span>Ödenen</span>
              <strong>
                {paymentTotal.toLocaleString('tr-TR')} ₺
              </strong>
            </div>
          </>
        )}
      </div>

      <div className="panel-card spaced-card">
        <h3>Servis Durumu</h3>

        <div className="status-flow">
          {statuses.map((status) => (
            <button
              key={status}
              className={
                order.status === status
                  ? 'flow-button active'
                  : 'flow-button'
              }
              onClick={() =>
                changeStatus(status)
              }
            >
              {statusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {canAssign && (
        <div className="panel-card spaced-card">
          <h3>Personel Atama</h3>

          <select
            value={
              order.assignedTechnicianId || ''
            }
            disabled={assignmentBusy}
            onChange={(e) =>
              assignTechnician(
                e.target.value,
              )
            }
          >
            <option value="">
              Teknisyen atanmamış
            </option>

            {technicians
              .filter(
                (technician) =>
                  !order.branchId ||
                  technician.branchId ===
                    order.branchId,
              )
              .map((technician) => (
                <option
                  key={technician.id}
                  value={technician.id}
                >
                  {technician.firstName}{' '}
                  {technician.lastName}
                  {technician.branch?.name
                    ? ` - ${technician.branch.name}`
                    : ''}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="dashboard-grid spaced-card">
        <div className="panel-card">
          <h3>Araç / Müşteri</h3>

          <div className="detail-info">
            <div>
              <span>Plaka</span>
              <strong>
                {order.vehicle?.plate}
              </strong>
            </div>

            <div>
              <span>Araç</span>
              <strong>
                {order.vehicle?.brand}{' '}
                {order.vehicle?.model}
              </strong>
            </div>

            <div>
              <span>Müşteri</span>
              <strong>
                {order.customer?.firstName}{' '}
                {order.customer?.lastName}
              </strong>
            </div>

            <div>
              <span>Telefon</span>
              <strong>
                {order.customer?.phone || '-'}
              </strong>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <h3>Servis Notları</h3>

          <div className="detail-info">
            <div>
              <span>Müşteri Şikayeti</span>
              <strong>
                {order.complaint || '-'}
              </strong>
            </div>

            <div>
              <span>İç Not</span>
              <strong>
                {order.internalNote || '-'}
              </strong>
            </div>

            <div>
              <span>Teknisyen</span>
              <strong>
                {order.assignedTechnician
                  ? `${order.assignedTechnician.firstName} ${order.assignedTechnician.lastName}`
                  : 'Atanmadı'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {user?.role !== 'TECHNICIAN' && (
        <>
          <div className="panel-card spaced-card">
            <div className="card-title-row">
              <div>
                <h3>Araç Kabul / Kontrol</h3>
                <p className="sub-text">
                  Kilometre, yakıt, mevcut hasar, araç içi değerli eşya ve kabul fotoğraflarını iş emrine bağlayın.
                </p>
              </div>
            </div>

            <form
              className="inspection-form"
              onSubmit={createInspection}
            >
              <input
                type="number"
                min="0"
                placeholder="Kilometre"
                value={inspectionForm.mileage}
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    mileage: e.target.value,
                  })
                }
                required
              />

              <select
                value={inspectionForm.fuelLevel}
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    fuelLevel: e.target.value,
                  })
                }
              >
                <option value="">
                  Yakıt seviyesi
                </option>
                <option value="EMPTY">Boş</option>
                <option value="1/4">1/4</option>
                <option value="1/2">1/2</option>
                <option value="3/4">3/4</option>
                <option value="FULL">Dolu</option>
              </select>

              <input
                placeholder="Müşteri şikayeti"
                value={
                  inspectionForm.customerComplaint
                }
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    customerComplaint:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Mevcut hasar / çizik"
                value={
                  inspectionForm.existingDamage
                }
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    existingDamage:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Araç içi değerli eşya notu"
                value={
                  inspectionForm.valuablesNote
                }
                onChange={(e) =>
                  setInspectionForm({
                    ...inspectionForm,
                    valuablesNote:
                      e.target.value,
                  })
                }
              />

              <button
                className="primary-button"
                disabled={inspectionBusy}
              >
                {inspectionBusy
                  ? 'Kaydediliyor...'
                  : 'Araç Kabul Kaydı Oluştur'}
              </button>
            </form>

            {inspectionError && (
              <div className="page-message error-message spaced-card">
                {inspectionError}
              </div>
            )}

            <div className="inspection-records spaced-card">
              {order.inspections?.map(
                (inspection) => (
                  <div
                    className="inspection-card"
                    key={inspection.id}
                  >
                    <div className="inspection-card-head">
                      <div>
                        <strong>
                          {statusLabel(
                            inspection.status,
                          )}
                        </strong>

                        <span>
                          KM:{' '}
                          {Number(
                            inspection.mileage ||
                              0,
                          ).toLocaleString(
                            'tr-TR',
                          )}
                          {' · '}Yakıt:{' '}
                          {inspection.fuelLevel ||
                            '-'}
                        </span>
                      </div>

                      {inspection.status !==
                        'COMPLETED' && (
                        <button
                          className="small-button"
                          onClick={() =>
                            completeInspection(
                              inspection.id,
                            )
                          }
                        >
                          Kontrolü Tamamla
                        </button>
                      )}
                    </div>

                    <div className="detail-info compact-detail-info">
                      <div>
                        <span>Şikayet</span>
                        <strong>
                          {inspection.customerComplaint ||
                            '-'}
                        </strong>
                      </div>

                      <div>
                        <span>Mevcut Hasar</span>
                        <strong>
                          {inspection.existingDamage ||
                            '-'}
                        </strong>
                      </div>

                      <div>
                        <span>Değerli Eşya</span>
                        <strong>
                          {inspection.valuablesNote ||
                            '-'}
                        </strong>
                      </div>
                    </div>

                    {inspection.status !==
                      'COMPLETED' && (
                      <div className="inspection-tools">
                        <select
                          value={
                            checklistForm.category
                          }
                          onChange={(e) =>
                            setChecklistForm({
                              ...checklistForm,
                              category:
                                e.target.value,
                            })
                          }
                        >
                          <option value="GENEL">
                            Genel
                          </option>
                          <option value="KAPORTA">
                            Kaporta
                          </option>
                          <option value="LASTIK">
                            Lastik
                          </option>
                          <option value="FREN">
                            Fren
                          </option>
                          <option value="MOTOR">
                            Motor
                          </option>
                          <option value="ELEKTRIK">
                            Elektrik
                          </option>
                          <option value="IC_MEKAN">
                            İç Mekan
                          </option>
                        </select>

                        <input
                          placeholder="Kontrol maddesi"
                          value={
                            checklistForm.name
                          }
                          onChange={(e) =>
                            setChecklistForm({
                              ...checklistForm,
                              name:
                                e.target.value,
                            })
                          }
                        />

                        <select
                          value={
                            checklistForm.condition
                          }
                          onChange={(e) =>
                            setChecklistForm({
                              ...checklistForm,
                              condition:
                                e.target.value,
                            })
                          }
                        >
                          <option value="">
                            Durum
                          </option>
                          <option value="GOOD">
                            İyi
                          </option>
                          <option value="ATTENTION">
                            Kontrol Gerekli
                          </option>
                          <option value="BAD">
                            Değişim Gerekli
                          </option>
                        </select>

                        <input
                          placeholder="Kontrol notu"
                          value={
                            checklistForm.note
                          }
                          onChange={(e) =>
                            setChecklistForm({
                              ...checklistForm,
                              note:
                                e.target.value,
                            })
                          }
                        />

                        <button
                          className="small-button"
                          onClick={() =>
                            addChecklistItem(
                              inspection.id,
                            )
                          }
                          disabled={
                            inspectionBusy
                          }
                        >
                          Madde Ekle
                        </button>
                      </div>
                    )}

                    {inspection.items?.length >
                      0 && (
                      <div className="inspection-checklist">
                        {inspection.items.map(
                          (item) => (
                            <div
                              key={item.id}
                            >
                              <span>
                                {item.category}
                              </span>

                              <strong>
                                {item.name}
                              </strong>

                              <small>
                                {item.condition ||
                                  '-'}
                                {item.note
                                  ? ` · ${item.note}`
                                  : ''}
                              </small>
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    <div className="inspection-upload">
                      <select
                        value={
                          uploadForm.type
                        }
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            type:
                              e.target.value,
                          })
                        }
                      >
                        <option value="ACCEPTANCE">
                          Araç Kabul
                        </option>
                        <option value="DAMAGE">
                          Hasar
                        </option>
                        <option value="ODOMETER">
                          Kilometre
                        </option>
                        <option value="ENGINE">
                          Motor
                        </option>
                        <option value="BEFORE">
                          İşlem Öncesi
                        </option>
                        <option value="AFTER">
                          İşlem Sonrası
                        </option>
                        <option value="DOCUMENT">
                          Belge
                        </option>
                        <option value="OTHER">
                          Diğer
                        </option>
                      </select>

                      <input
                        id={`inspection-file-${inspection.id}`}
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            file:
                              e.target
                                .files?.[0] ||
                              null,
                          })
                        }
                      />

                      <input
                        placeholder="Fotoğraf / belge açıklaması"
                        value={
                          uploadForm.description
                        }
                        onChange={(e) =>
                          setUploadForm({
                            ...uploadForm,
                            description:
                              e.target.value,
                          })
                        }
                      />

                      <button
                        className="small-button"
                        disabled={uploadBusy}
                        onClick={() =>
                          uploadInspectionMedia(
                            inspection.id,
                          )
                        }
                      >
                        {uploadBusy
                          ? 'Yükleniyor...'
                          : 'Dosya Yükle'}
                      </button>
                    </div>

                    {inspection.media?.length >
                      0 && (
                      <div className="inspection-media-grid">
                        {inspection.media.map(
                          (media) => (
                            <a
                              key={media.id}
                              className="inspection-media-card"
                              href={mediaUrl(
                                media,
                              )}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {media.mimeType?.startsWith(
                                'image/',
                              ) ? (
                                <img
                                  src={mediaUrl(
                                    media,
                                  )}
                                  alt={
                                    media.description ||
                                    media.fileName
                                  }
                                />
                              ) : (
                                <div className="inspection-document-preview">
                                  PDF / Belge
                                </div>
                              )}

                              <span>
                                {statusLabel(
                                  media.type,
                                )}
                              </span>
                            </a>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ),
              )}

              {!order.inspections?.length && (
                <div className="empty-state">
                  Henüz araç kabul / kontrol kaydı yok.
                </div>
              )}
            </div>
          </div>

          <div className="panel-card spaced-card">
            <div className="card-title-row">
              <div>
                <h3>Yapılan İşlemler / Parçalar</h3>
                <p className="sub-text">
                  Stoktan seçilen parçalar eklendiği anda ilgili şube stokundan otomatik düşer.
                </p>
              </div>
            </div>

            <form
              className="service-item-form"
              onSubmit={addItem}
            >
              <select
                value={itemForm.type}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    type: e.target.value,
                    partId: '',
                    name: '',
                    unitPrice: '',
                  })
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

              {itemForm.type ===
                'PART' && (
                <select
                  value={itemForm.partId}
                  onChange={(e) =>
                    selectPart(
                      e.target.value,
                    )
                  }
                >
                  <option value="">
                    Stoktan parça seç veya manuel yaz
                  </option>

                  {availableParts.map(
                    (part) => (
                      <option
                        key={part.partId}
                        value={part.partId}
                      >
                        {part.name}
                        {part.sku
                          ? ` · ${part.sku}`
                          : ''}
                        {' · Stok: '}
                        {Number(
                          part.quantity,
                        )}
                      </option>
                    ),
                  )}
                </select>
              )}

              <input
                placeholder="İşlem / parça adı"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    name: e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Miktar"
                value={itemForm.quantity}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    quantity:
                      e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Birim fiyat ₺"
                value={itemForm.unitPrice}
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    unitPrice:
                      e.target.value,
                  })
                }
                required={
                  !itemForm.partId
                }
              />

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="İndirim ₺"
                value={
                  itemForm.discountAmount
                }
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    discountAmount:
                      e.target.value,
                  })
                }
              />

              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="KDV %"
                value={
                  itemForm.vatRate
                }
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    vatRate:
                      e.target.value,
                  })
                }
                required
              />

              <input
                className="service-item-description"
                placeholder="Açıklama / not"
                value={
                  itemForm.description
                }
                onChange={(e) =>
                  setItemForm({
                    ...itemForm,
                    description:
                      e.target.value,
                  })
                }
              />

              <button
                className="primary-button"
                disabled={itemBusy}
              >
                {itemBusy
                  ? 'Ekleniyor...'
                  : 'İşlem Ekle'}
              </button>
            </form>

            {itemError && (
              <div className="page-message error-message spaced-card">
                {itemError}
              </div>
            )}

            <div className="table-wrap spaced-card">
              <table>
                <thead>
                  <tr>
                    <th>Tür</th>
                    <th>İşlem</th>
                    <th>Miktar</th>
                    <th>Birim</th>
                    <th>İndirim</th>
                    <th>KDV</th>
                    <th>Genel Toplam</th>
                    <th>Durum</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {statusLabel(item.type)}
                      </td>

                      <td>
                        <strong>
                          {item.name}
                        </strong>

                        {item.description && (
                          <div className="sub-text">
                            {item.description}
                          </div>
                        )}
                      </td>

                      <td>{item.quantity}</td>

                      <td>
                        {Number(
                          item.unitPrice || 0,
                        ).toLocaleString(
                          'tr-TR',
                        )}{' '}
                        ₺
                      </td>

                      <td>
                        {Number(
                          item.discountAmount ||
                            0,
                        ).toLocaleString(
                          'tr-TR',
                        )}{' '}
                        ₺
                      </td>

                      <td>
                        %{Number(
                          item.vatRate ??
                            20,
                        )}{' '}
                        /{' '}
                        {Number(
                          item.vatAmount ||
                            0,
                        ).toLocaleString(
                          'tr-TR',
                        )}{' '}
                        ₺
                      </td>

                      <td>
                        {Number(
                          Number(
                            item.grossTotal ||
                              0,
                          ) > 0
                            ? item.grossTotal
                            : Number(
                                item.totalPrice ||
                                  0,
                              ) +
                              Number(
                                item.vatAmount ||
                                  0,
                              ),
                        ).toLocaleString(
                          'tr-TR',
                        )}{' '}
                        ₺
                      </td>

                      <td>
                        <button
                          className={
                            item.completed
                              ? 'status-badge success'
                              : 'status-badge'
                          }
                          onClick={() =>
                            toggleItem(item)
                          }
                        >
                          {item.completed
                            ? 'Tamamlandı'
                            : 'Bekliyor'}
                        </button>
                      </td>

                      <td>
                        <button
                          className="table-action danger-text"
                          onClick={() =>
                            removeItem(item)
                          }
                        >
                          Sil
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!order.items?.length && (
                    <tr>
                      <td colSpan="9">
                        Henüz işlem eklenmemiş.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-grid spaced-card">
            <div className="panel-card">
              <h3>Kontroller</h3>

              {order.inspections?.map(
                (inspection) => (
                  <div
                    className="detail-record"
                    key={inspection.id}
                  >
                    <strong>
                      {statusLabel(inspection.status)}
                    </strong>

                    <span>
                      KM: {inspection.mileage}
                    </span>

                    <span>
                      Yakıt:{' '}
                      {inspection.fuelLevel || '-'}
                    </span>

                    <span>
                      Hasar:{' '}
                      {inspection.existingDamage || '-'}
                    </span>
                  </div>
                ),
              )}

              {!order.inspections?.length && (
                <div className="empty-state">
                  Kontrol kaydı yok.
                </div>
              )}
            </div>

            <div className="panel-card">
              <h3>Teklifler</h3>

              {order.quotes?.map((quote) => (
                <div
                  className="detail-record"
                  key={quote.id}
                >
                  <strong>
                    {quote.quoteNumber}
                  </strong>

                  <span>
                    {statusLabel(quote.status)}
                  </span>

                  <span>
                    {Number(
                      quote.total || 0,
                    ).toLocaleString('tr-TR')} ₺
                  </span>
                </div>
              ))}

              {!order.quotes?.length && (
                <div className="empty-state">
                  Teklif yok.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

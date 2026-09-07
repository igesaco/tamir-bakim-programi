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
  const [assignmentBusy, setAssignmentBusy] = useState(false);

  const canAssign = [
    'OWNER',
    'MANAGER',
    'SERVICE_ADVISOR',
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

  if (!order) {
    return <div>İş emri yükleniyor...</div>;
  }

  const itemTotal =
    order.items?.reduce(
      (sum, item) =>
        sum + Number(item.totalPrice || 0),
      0,
    ) || 0;

  const paymentTotal =
    order.payments?.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
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

        <a
          className="small-button"
          href="/service-orders"
        >
          ← İş Emirlerine Dön
        </a>
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
            <h3>Yapılan İşlemler / Parçalar</h3>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Tür</th>
                    <th>İşlem</th>
                    <th>Miktar</th>
                    <th>Birim</th>
                    <th>Toplam</th>
                  </tr>
                </thead>

                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td>{statusLabel(item.type)}</td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {Number(
                          item.unitPrice || 0,
                        ).toLocaleString('tr-TR')} ₺
                      </td>
                      <td>
                        {Number(
                          item.totalPrice || 0,
                        ).toLocaleString('tr-TR')} ₺
                      </td>
                    </tr>
                  ))}

                  {!order.items?.length && (
                    <tr>
                      <td colSpan="5">
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

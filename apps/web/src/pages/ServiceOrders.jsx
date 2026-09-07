import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link } from 'react-router-dom';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { statusLabel } from '../utils/status';

export default function ServiceOrders() {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [branches, setBranches] = useState([]);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const canCreate = [
    'OWNER',
    'MANAGER',
    'SERVICE_ADVISOR',
  ].includes(user?.role);

  const canChooseBranch = [
    'OWNER',
    'MANAGER',
  ].includes(user?.role);

  const [form, setForm] = useState({
    customerId: '',
    vehicleId: '',
    mileage: '',
    complaint: '',
    internalNote: '',
    assignedTechnicianId: '',
    branchId: user?.branchId || '',
  });

  async function load() {
    if (user?.role === 'TECHNICIAN') {
      const orderRes =
        await api.get('/service-orders');

      setOrders(orderRes.data);
      return;
    }

    const requests = [
      api.get('/service-orders'),
      api.get('/customers'),
      api.get('/vehicles'),
      api.get('/users/technicians'),
    ];

    if (canChooseBranch) {
      requests.push(
        api.get('/branches'),
      );
    }

    const responses =
      await Promise.all(requests);

    const [
      orderRes,
      customerRes,
      vehicleRes,
      technicianRes,
      branchRes,
    ] = responses;

    setOrders(orderRes.data);
    setCustomers(customerRes.data);
    setVehicles(vehicleRes.data);
    setTechnicians(technicianRes.data);
    setBranches(branchRes?.data || []);
  }

  useEffect(() => {
    load();
  }, [user?.role, canChooseBranch]);

  const customerVehicles = vehicles.filter(
    (vehicle) =>
      !form.customerId ||
      vehicle.customerId === form.customerId,
  );

  const filteredOrders = useMemo(() => {
    const term = search
      .trim()
      .toLocaleLowerCase('tr-TR');

    return orders.filter((order) => {
      if (
        status &&
        order.status !== status
      ) {
        return false;
      }

      if (!term) {
        return true;
      }

      const text = [
        order.orderNumber,
        order.vehicle?.plate,
        order.vehicle?.brand,
        order.vehicle?.model,
        order.customer?.firstName,
        order.customer?.lastName,
        order.customer?.phone,
        order.complaint,
        order.assignedTechnician?.firstName,
        order.assignedTechnician?.lastName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR');

      return text.includes(term);
    });
  }, [orders, search, status]);

  async function submit(e) {
    e.preventDefault();

    await api.post('/service-orders', {
      ...form,
      mileage: Number(form.mileage || 0),
      assignedTechnicianId:
        form.assignedTechnicianId ||
        undefined,
      branchId:
        form.branchId || undefined,
    });

    setForm({
      customerId: '',
      vehicleId: '',
      mileage: '',
      complaint: '',
      internalNote: '',
      assignedTechnicianId: '',
      branchId: user?.branchId || '',
    });

    await load();
  }

  const statusOptions = [
    'ACCEPTED',
    'IN_PROGRESS',
    'PART_WAITING',
    'QUALITY_CONTROL',
    'READY',
    'PAYMENT_WAITING',
    'DELIVERED',
    'CANCELLED',
  ];

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>
            {user?.role === 'TECHNICIAN'
              ? 'Atanan İşlerim'
              : 'İş Emirleri'}
          </h1>
          <p>
            {user?.role === 'TECHNICIAN'
              ? 'Size atanmış bakım işlerini görüntüleyin.'
              : 'Servisteki aktif işleri yönetin.'}
          </p>
        </div>
      </div>

      <div
        className={
          canCreate
            ? 'content-grid'
            : ''
        }
      >
        {canCreate && (
          <div className="panel-card">
            <h3>Yeni İş Emri</h3>

            <form
              className="form-grid"
              onSubmit={submit}
            >
              {canChooseBranch && (
                <select
                  className="full"
                  value={form.branchId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branchId:
                        e.target.value,
                      assignedTechnicianId:
                        '',
                    })
                  }
                  required
                >
                  <option value="">
                    İş emri şubesi seç
                  </option>

                  {branches
                    .filter(
                      (branch) =>
                        branch.active,
                    )
                    .map((branch) => (
                      <option
                        key={branch.id}
                        value={branch.id}
                      >
                        {branch.name}
                      </option>
                    ))}
                </select>
              )}

              <select
                value={form.customerId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerId:
                      e.target.value,
                    vehicleId: '',
                    mileage: '',
                  })
                }
                required
              >
                <option value="">
                  Müşteri seç
                </option>

                {customers.map((customer) => (
                  <option
                    key={customer.id}
                    value={customer.id}
                  >
                    {customer.firstName}{' '}
                    {customer.lastName}
                  </option>
                ))}
              </select>

              <select
                value={form.vehicleId}
                onChange={(e) => {
                  const selected =
                    vehicles.find(
                      (vehicle) =>
                        vehicle.id ===
                        e.target.value,
                    );

                  setForm({
                    ...form,
                    vehicleId:
                      e.target.value,
                    mileage:
                      selected?.mileage ??
                      '',
                  });
                }}
                required
              >
                <option value="">
                  Araç seç
                </option>

                {customerVehicles.map(
                  (vehicle) => (
                    <option
                      key={vehicle.id}
                      value={vehicle.id}
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
                  form.assignedTechnicianId
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    assignedTechnicianId:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Teknisyen atama (opsiyonel)
                </option>

                {technicians
                  .filter(
                    (technician) =>
                      !(
                        form.branchId ||
                        user?.branchId
                      ) ||
                      technician.branchId ===
                        (
                          form.branchId ||
                          user?.branchId
                        ),
                  )
                  .map(
                  (technician) => (
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
                  ),
                )}
              </select>

              <input
                type="number"
                placeholder="Kilometre"
                value={form.mileage}
                onChange={(e) =>
                  setForm({
                    ...form,
                    mileage:
                      e.target.value,
                  })
                }
                required
              />

              <textarea
                className="full"
                placeholder="Müşteri şikayeti / yapılacak işlem"
                value={form.complaint}
                onChange={(e) =>
                  setForm({
                    ...form,
                    complaint:
                      e.target.value,
                  })
                }
              />

              <textarea
                className="full"
                placeholder="Servis iç notu"
                value={form.internalNote}
                onChange={(e) =>
                  setForm({
                    ...form,
                    internalNote:
                      e.target.value,
                  })
                }
              />

              <button className="primary-button full">
                İş Emri Aç
              </button>
            </form>
          </div>
        )}

        <div className="panel-card">
          <div className="card-title-row">
            <h3>
              {user?.role === 'TECHNICIAN'
                ? 'Atanan İşler'
                : 'İş Emirleri'}
            </h3>

            <div className="filter-row">
              <input
                className="search-input"
                placeholder="Plaka, müşteri, iş emri..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              <select
                className="filter-select"
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >
                <option value="">
                  Tüm durumlar
                </option>

                {statusOptions.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {statusLabel(item)}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Plaka</th>
                  <th>Müşteri</th>
                  <th>Teknisyen</th>
                  <th>Durum</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map(
                  (order) => (
                    <tr key={order.id}>
                      <td>
                        {order.orderNumber}
                      </td>

                      <td>
                        <strong>
                          {order.vehicle?.plate}
                        </strong>
                      </td>

                      <td>
                        {order.customer?.firstName}{' '}
                        {order.customer?.lastName}
                      </td>

                      <td>
                        {order.assignedTechnician
                          ? `${order.assignedTechnician.firstName} ${order.assignedTechnician.lastName}`
                          : 'Atanmadı'}
                      </td>

                      <td>
                        <span className="status-badge">
                          {statusLabel(
                            order.status,
                          )}
                        </span>
                      </td>

                      <td>
                        <Link
                          className="table-link"
                          to={`/service-orders/${order.id}`}
                        >
                          Detay
                        </Link>
                      </td>
                    </tr>
                  ),
                )}

                {!filteredOrders.length && (
                  <tr>
                    <td colSpan="6">
                      İş emri bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

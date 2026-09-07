import {
  useEffect,
  useState,
} from 'react';

import api from '../api/client';
import { useAuth } from '../auth/AuthContext';

const movementLabels = {
  IN: 'Giriş',
  OUT: 'Çıkış',
  ADJUSTMENT: 'Düzeltme',
  RETURN: 'İade',
};

export default function Inventory() {
  const { user } = useAuth();

  const [parts, setParts] =
    useState([]);
  const [stock, setStock] =
    useState([]);
  const [lowStock, setLowStock] =
    useState([]);
  const [suppliers, setSuppliers] =
    useState([]);
  const [movements, setMovements] =
    useState([]);
  const [branches, setBranches] =
    useState([]);
  const [selectedBranchId, setSelectedBranchId] =
    useState(user?.branchId || '');
  const [error, setError] =
    useState('');
  const [message, setMessage] =
    useState('');

  const [partForm, setPartForm] =
    useState({
      name: '',
      supplierId: '',
      sku: '',
      brand: '',
      unit: 'ADET',
      purchasePrice: '',
      salePrice: '',
      minimumStock: '',
    });

  const [movement, setMovement] =
    useState({
      partId: '',
      quantity: '',
      unitCost: '',
      note: '',
    });

  async function loadBase() {
    const [
      p,
      sp,
      branchResponse,
    ] = await Promise.all([
      api.get('/inventory/parts'),
      api.get('/suppliers'),
      api.get('/branches'),
    ]);

    setParts(p.data);
    setSuppliers(sp.data);
    setBranches(
      branchResponse.data,
    );

    if (
      !selectedBranchId &&
      branchResponse.data.length
    ) {
      setSelectedBranchId(
        user?.branchId ||
          branchResponse.data[0].id,
      );
    }
  }

  async function loadBranchData(
    branchId = selectedBranchId,
  ) {
    if (!branchId) {
      setStock([]);
      setLowStock([]);
      setMovements([]);
      return;
    }

    const params = {
      branchId,
    };

    const [s, l, m] =
      await Promise.all([
        api.get('/inventory/stock', {
          params,
        }),
        api.get('/inventory/low-stock', {
          params,
        }),
        api.get('/inventory/movements', {
          params,
        }),
      ]);

    setStock(s.data);
    setLowStock(l.data);
    setMovements(m.data);
  }

  useEffect(() => {
    loadBase().catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Stok verileri yüklenemedi.',
      );
    });
  }, []);

  useEffect(() => {
    if (!selectedBranchId) {
      return;
    }

    loadBranchData(
      selectedBranchId,
    ).catch((err) => {
      setError(
        err?.response?.data?.message ||
          'Şube stok verileri yüklenemedi.',
      );
    });
  }, [selectedBranchId]);

  async function reload() {
    await Promise.all([
      loadBase(),
      loadBranchData(
        selectedBranchId,
      ),
    ]);
  }

  async function createPart(e) {
    e.preventDefault();

    setError('');
    setMessage('');

    try {
      await api.post(
        '/inventory/parts',
        {
          ...partForm,
          supplierId:
            partForm.supplierId ||
            undefined,
          purchasePrice:
            Number(
              partForm.purchasePrice,
            ),
          salePrice:
            Number(
              partForm.salePrice,
            ),
          minimumStock:
            Number(
              partForm.minimumStock ||
                0,
            ),
        },
      );

      setPartForm({
        name: '',
        supplierId: '',
        sku: '',
        brand: '',
        unit: 'ADET',
        purchasePrice: '',
        salePrice: '',
        minimumStock: '',
      });

      setMessage(
        'Parça kartı oluşturuldu.',
      );

      await reload();
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Parça oluşturulamadı.',
      );
    }
  }

  async function move(type) {
    if (
      !selectedBranchId ||
      !movement.partId ||
      !movement.quantity
    ) {
      setError(
        'Şube, parça ve miktar bilgisi zorunludur.',
      );
      return;
    }

    setError('');
    setMessage('');

    try {
      await api.post(
        `/inventory/${type}`,
        {
          partId:
            movement.partId,
          branchId:
            selectedBranchId,
          quantity:
            Number(
              movement.quantity,
            ),
          unitCost:
            movement.unitCost
              ? Number(
                  movement.unitCost,
                )
              : undefined,
          note:
            movement.note ||
            undefined,
        },
      );

      setMovement({
        partId: '',
        quantity: '',
        unitCost: '',
        note: '',
      });

      setMessage(
        type === 'in'
          ? 'Stok girişi kaydedildi.'
          : 'Stok çıkışı kaydedildi.',
      );

      await loadBranchData(
        selectedBranchId,
      );
    } catch (err) {
      const detail =
        err?.response?.data?.message;

      setError(
        Array.isArray(detail)
          ? detail.join(', ')
          : detail ||
              'Stok hareketi kaydedilemedi.',
      );
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Stok Yönetimi</h1>
          <p>
            Parça, stok giriş-çıkış ve
            kritik stok takibi.
          </p>
        </div>

        <select
          className="filter-select"
          value={selectedBranchId}
          onChange={(e) =>
            setSelectedBranchId(
              e.target.value,
            )
          }
        >
          <option value="">
            Şube seç
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
      </div>

      {message && (
        <div className="page-message success-message">
          {message}
        </div>
      )}

      {error && (
        <div className="page-message error-message">
          {error}
        </div>
      )}

      <div className="inventory-summary">
        <div className="stat-card">
          <span>Parça Çeşidi</span>
          <strong>
            {parts.length}
          </strong>
        </div>

        <div className="stat-card">
          <span>Stok Kalemi</span>
          <strong>
            {stock.length}
          </strong>
        </div>

        <div className="stat-card danger-card">
          <span>Kritik Stok</span>
          <strong>
            {lowStock.length}
          </strong>
        </div>
      </div>

      <div className="content-grid spaced-card">
        <div className="panel-card">
          <h3>Yeni Parça</h3>

          <form
            className="form-grid"
            onSubmit={createPart}
          >
            <input
              className="full"
              placeholder="Parça adı"
              value={partForm.name}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  name:
                    e.target.value,
                })
              }
              required
            />

            <select
              value={
                partForm.supplierId
              }
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  supplierId:
                    e.target.value,
                })
              }
            >
              <option value="">
                Tedarikçi seç
              </option>

              {suppliers.map(
                (supplier) => (
                  <option
                    key={supplier.id}
                    value={supplier.id}
                  >
                    {supplier.name}
                  </option>
                ),
              )}
            </select>

            <input
              placeholder="SKU"
              value={partForm.sku}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  sku:
                    e.target.value,
                })
              }
            />

            <input
              placeholder="Marka"
              value={
                partForm.brand
              }
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  brand:
                    e.target.value,
                })
              }
            />

            <input
              placeholder="Birim"
              value={
                partForm.unit
              }
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  unit:
                    e.target.value,
                })
              }
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Alış fiyatı"
              value={
                partForm.purchasePrice
              }
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  purchasePrice:
                    e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Satış fiyatı"
              value={
                partForm.salePrice
              }
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  salePrice:
                    e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Minimum stok"
              value={
                partForm.minimumStock
              }
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  minimumStock:
                    e.target.value,
                })
              }
            />

            <button className="primary-button full">
              Parça Oluştur
            </button>
          </form>
        </div>

        <div className="panel-card">
          <h3>Stok Hareketi</h3>

          <div className="form-grid">
            <div className="full sub-text">
              Seçili şube:{' '}
              <strong>
                {branches.find(
                  (branch) =>
                    branch.id ===
                    selectedBranchId,
                )?.name || '-'}
              </strong>
            </div>

            <select
              className="full"
              value={
                movement.partId
              }
              onChange={(e) =>
                setMovement({
                  ...movement,
                  partId:
                    e.target.value,
                })
              }
            >
              <option value="">
                Parça seç
              </option>

              {parts.map(
                (part) => (
                  <option
                    key={part.id}
                    value={part.id}
                  >
                    {part.name}
                  </option>
                ),
              )}
            </select>

            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Miktar"
              value={
                movement.quantity
              }
              onChange={(e) =>
                setMovement({
                  ...movement,
                  quantity:
                    e.target.value,
                })
              }
            />

            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Birim maliyet"
              value={
                movement.unitCost
              }
              onChange={(e) =>
                setMovement({
                  ...movement,
                  unitCost:
                    e.target.value,
                })
              }
            />

            <input
              className="full"
              placeholder="Açıklama"
              value={
                movement.note
              }
              onChange={(e) =>
                setMovement({
                  ...movement,
                  note:
                    e.target.value,
                })
              }
            />

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                move('in')
              }
            >
              Stok Girişi
            </button>

            <button
              type="button"
              className="danger-button"
              onClick={() =>
                move('out')
              }
            >
              Stok Çıkışı
            </button>
          </div>
        </div>
      </div>

      <div className="panel-card spaced-card">
        <h3>Mevcut Stok</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Parça</th>
                <th>Marka</th>
                <th>Miktar</th>
                <th>Min.</th>
                <th>Satış</th>
              </tr>
            </thead>

            <tbody>
              {stock.map(
                (item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {
                          item.part
                            ?.name
                        }
                      </strong>
                    </td>

                    <td>
                      {item.part
                        ?.brand || '-'}
                    </td>

                    <td>
                      {Number(
                        item.quantity,
                      )}
                    </td>

                    <td>
                      {Number(
                        item.minQuantity,
                      )}
                    </td>

                    <td>
                      {Number(
                        item.part
                          ?.salePrice ||
                          0,
                      ).toLocaleString(
                        'tr-TR',
                      )}{' '}
                      ₺
                    </td>
                  </tr>
                ),
              )}

              {!stock.length && (
                <tr>
                  <td colSpan="5">
                    Seçili şubede stok kaydı yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel-card spaced-card">
        <h3>Son Stok Hareketleri</h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Parça</th>
                <th>İşlem</th>
                <th>Miktar</th>
                <th>Personel</th>
                <th>Açıklama</th>
              </tr>
            </thead>

            <tbody>
              {movements
                .slice(0, 30)
                .map((movement) => (
                  <tr
                    key={
                      movement.id
                    }
                  >
                    <td>
                      {new Date(
                        movement.createdAt,
                      ).toLocaleString(
                        'tr-TR',
                      )}
                    </td>

                    <td>
                      {
                        movement.part
                          ?.name
                      }
                    </td>

                    <td>
                      {movementLabels[
                        movement.type
                      ] ||
                        movement.type}
                    </td>

                    <td>
                      {Number(
                        movement.quantity,
                      )}
                    </td>

                    <td>
                      {movement.createdBy
                        ? `${movement.createdBy.firstName} ${movement.createdBy.lastName}`
                        : '-'}
                    </td>

                    <td>
                      {movement.note ||
                        '-'}
                    </td>
                  </tr>
                ))}

              {!movements.length && (
                <tr>
                  <td colSpan="6">
                    Stok hareketi yok.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

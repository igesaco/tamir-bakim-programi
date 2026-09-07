import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Inventory() {
  const [parts, setParts] = useState([]);
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [movements, setMovements] = useState([]);

  const [partForm, setPartForm] = useState({
    name: '',
    supplierId: '',
    sku: '',
    brand: '',
    unit: 'ADET',
    purchasePrice: '',
    salePrice: '',
    minimumStock: '',
  });

  const [movement, setMovement] = useState({
    partId: '',
    quantity: '',
    unitCost: '',
    note: '',
  });

  async function load() {
    const [p, s, l, sp, m] = await Promise.all([
      api.get('/inventory/parts'),
      api.get('/inventory/stock'),
      api.get('/inventory/low-stock'),
      api.get('/suppliers'),
      api.get('/inventory/movements'),
    ]);

    setParts(p.data);
    setStock(s.data);
    setLowStock(l.data);
    setSuppliers(sp.data);
    setMovements(m.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function createPart(e) {
    e.preventDefault();

    await api.post('/inventory/parts', {
      ...partForm,
      supplierId: partForm.supplierId || undefined,
      purchasePrice: Number(partForm.purchasePrice),
      salePrice: Number(partForm.salePrice),
      minimumStock: Number(partForm.minimumStock || 0),
    });

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

    await load();
  }

  async function move(type) {
    await api.post(`/inventory/${type}`, {
      partId: movement.partId,
      quantity: Number(movement.quantity),
      unitCost: movement.unitCost
        ? Number(movement.unitCost)
        : undefined,
      note: movement.note || undefined,
    });

    setMovement({
      partId: '',
      quantity: '',
      unitCost: '',
      note: '',
    });

    await load();
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Stok Yönetimi</h1>
          <p>Parça, stok giriş-çıkış ve kritik stok takibi.</p>
        </div>
      </div>

      <div className="inventory-summary">
        <div className="stat-card">
          <span>Parça Çeşidi</span>
          <strong>{parts.length}</strong>
        </div>

        <div className="stat-card">
          <span>Stok Kalemi</span>
          <strong>{stock.length}</strong>
        </div>

        <div className="stat-card danger-card">
          <span>Kritik Stok</span>
          <strong>{lowStock.length}</strong>
        </div>
      </div>

      <div className="content-grid spaced-card">
        <div className="panel-card">
          <h3>Yeni Parça</h3>

          <form className="form-grid" onSubmit={createPart}>
            <input
              className="full"
              placeholder="Parça adı"
              value={partForm.name}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  name: e.target.value,
                })
              }
              required
            />

            <select
              value={partForm.supplierId}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  supplierId: e.target.value,
                })
              }
            >
              <option value="">Tedarikçi seç</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <input
              placeholder="SKU"
              value={partForm.sku}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  sku: e.target.value,
                })
              }
            />

            <input
              placeholder="Marka"
              value={partForm.brand}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  brand: e.target.value,
                })
              }
            />

            <input
              placeholder="Birim"
              value={partForm.unit}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  unit: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Alış fiyatı"
              value={partForm.purchasePrice}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  purchasePrice: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              placeholder="Satış fiyatı"
              value={partForm.salePrice}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  salePrice: e.target.value,
                })
              }
              required
            />

            <input
              type="number"
              placeholder="Minimum stok"
              value={partForm.minimumStock}
              onChange={(e) =>
                setPartForm({
                  ...partForm,
                  minimumStock: e.target.value,
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
            <select
              className="full"
              value={movement.partId}
              onChange={(e) =>
                setMovement({
                  ...movement,
                  partId: e.target.value,
                })
              }
            >
              <option value="">Parça seç</option>

              {parts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Miktar"
              value={movement.quantity}
              onChange={(e) =>
                setMovement({
                  ...movement,
                  quantity: e.target.value,
                })
              }
            />

            <input
              type="number"
              placeholder="Birim maliyet"
              value={movement.unitCost}
              onChange={(e) =>
                setMovement({
                  ...movement,
                  unitCost: e.target.value,
                })
              }
            />

            <input
              className="full"
              placeholder="Açıklama"
              value={movement.note}
              onChange={(e) =>
                setMovement({
                  ...movement,
                  note: e.target.value,
                })
              }
            />

            <button
              type="button"
              className="primary-button"
              onClick={() => move('in')}
            >
              Stok Girişi
            </button>

            <button
              type="button"
              className="danger-button"
              onClick={() => move('out')}
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
              {stock.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.part?.name}</strong>
                  </td>
                  <td>{item.part?.brand || '-'}</td>
                  <td>{item.quantity}</td>
                  <td>{item.minQuantity}</td>
                  <td>
                    {Number(
                      item.part?.salePrice || 0,
                    ).toLocaleString('tr-TR')} ₺
                  </td>
                </tr>
              ))}
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
                <th>Açıklama</th>
              </tr>
            </thead>

            <tbody>
              {movements.slice(0, 20).map((m) => (
                <tr key={m.id}>
                  <td>
                    {new Date(m.createdAt).toLocaleString('tr-TR')}
                  </td>
                  <td>{m.part?.name}</td>
                  <td>{m.type}</td>
                  <td>{m.quantity}</td>
                  <td>{m.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

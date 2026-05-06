import { Check, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

export default function ShopProducts() {
  const { data, setData, loading, error } = useApi(api.getProducts, []);
  const [open, setOpen] = useState(false);

  const updateStatus = (id, status) => setData((rows) => rows.map((row) => row.id === id ? { ...row, status } : row));
  const remove = async (id) => {
    await api.deleteProduct(id);
    setData((rows) => rows.filter((row) => row.id !== id));
  };
  const addProduct = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const product = {
      id: Date.now(),
      name: form.get('name'),
      price: Number(form.get('price')),
      season: form.get('season'),
      status: 'Pending',
      image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=300&q=80',
    };
    await api.createProduct(product);
    setData((rows) => [product, ...rows]);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-950">Shop & Products</h1>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-[linear-gradient(180deg,#aa73c4_0%,#8d56af_100%)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"><Plus size={16} /> Add Product</button>
      </div>
      <DataTable
        columns={[
          { key: 'image', header: 'Image', render: (row) => <img src={row.image} alt={row.name} className="h-12 w-12 rounded-lg object-cover" /> },
          { key: 'name', header: 'Name' },
          { key: 'price', header: 'Price', render: (row) => `LKR ${row.price.toLocaleString()}` },
          { key: 'season', header: 'Season' },
          { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
          { key: 'actions', header: 'Actions', render: (row) => <div className="flex gap-2"><button onClick={() => updateStatus(row.id, 'Approved')} className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><Check size={16} /></button><button onClick={() => updateStatus(row.id, 'Rejected')} className="rounded-lg bg-amber-50 p-2 text-amber-700"><X size={16} /></button><button onClick={() => remove(row.id)} className="rounded-lg bg-red-50 p-2 text-red-700"><Trash2 size={16} /></button></div> },
        ]}
        data={data}
        loading={loading}
        error={error}
      />
      <Modal open={open} title="Add Product" onClose={() => setOpen(false)}>
        <form onSubmit={addProduct} className="space-y-3">
          <input name="name" required placeholder="Product name" className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-forest-500" />
          <input name="price" required type="number" placeholder="Price" className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-forest-500" />
          <input name="season" required placeholder="Season" className="w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-forest-500" />
          <button className="w-full rounded-lg bg-[linear-gradient(180deg,#aa73c4_0%,#8d56af_100%)] px-4 py-2 font-semibold text-white">Create Product</button>
        </form>
      </Modal>
    </div>
  );
}

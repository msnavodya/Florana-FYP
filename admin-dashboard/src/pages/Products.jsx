import { useMemo, useState } from 'react';
import { ImagePlus, Package2, ShieldCheck, Sparkles, Trash2, UploadCloud } from 'lucide-react';
import { Card } from '../components/Card';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';

export default function Products() {
  const { data, setData, loading, error } = useApi(api.getProducts, []);
  const [imagePreview, setImagePreview] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'Indoor Plants',
    price: '',
    stock: '',
    season: 'All Season',
    sku: '',
    description: '',
  });

  const metrics = useMemo(() => {
    const totalItems = data.length;
    const liveItems = data.filter((item) => item.status?.toLowerCase() === 'approved').length;
    const pendingItems = data.filter((item) => item.status?.toLowerCase() === 'pending').length;
    const catalogValue = data.reduce((sum, item) => sum + Number(item.price || 0), 0);

    return { totalItems, liveItems, pendingItems, catalogValue };
  }, [data]);

  const remove = async (id) => {
    await api.deleteProduct(id);
    setData((rows) => rows.filter((row) => row.id !== id));
  };

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const onUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
  };

  const addItem = (event) => {
    event.preventDefault();
    const nextItem = {
      id: crypto.randomUUID(),
      name: form.name,
      category: form.category,
      price: Number(form.price || 0),
      stock: Number(form.stock || 0),
      season: form.season,
      sku: form.sku || `FLR-${Math.floor(1000 + Math.random() * 9000)}`,
      description: form.description,
      status: 'Pending',
      image: imagePreview || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=800&q=80',
    };

    setData((rows) => [nextItem, ...rows]);
    setForm({
      name: '',
      category: 'Indoor Plants',
      price: '',
      stock: '',
      season: 'All Season',
      sku: '',
      description: '',
    });
    setImagePreview('');
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,#17301f_0%,#244f31_42%,#f6efe6_100%)] p-6 text-white shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
              <Sparkles size={14} /> Florana Seller Catalog
            </p>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Build a storefront catalog that feels ready for customers.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/78">
              Organize product details, present clearer descriptions, and upload product visuals in one polished admin workspace designed for day-to-day catalog operations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Items</p>
              <p className="mt-2 text-2xl font-semibold">{metrics.totalItems}</p>
            </div>
            <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Live</p>
              <p className="mt-2 text-2xl font-semibold">{metrics.liveItems}</p>
            </div>
            <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Pending</p>
              <p className="mt-2 text-2xl font-semibold">{metrics.pendingItems}</p>
            </div>
            <div className="rounded-2xl bg-white/12 px-4 py-3 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Value</p>
              <p className="mt-2 text-2xl font-semibold">LKR {metrics.catalogValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[28px] bg-white p-6 shadow-soft ring-1 ring-[#ead8f1]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8d56af]">Catalog editor</p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-950">Add a new selling item</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Create complete product records with structured details, customer-friendly descriptions, and a clean image presentation that matches a real commerce dashboard.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
              <ShieldCheck size={16} /> Seller-ready format
            </div>
          </div>

          <form className="mt-6 grid gap-6" onSubmit={addItem}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Item name
                <input name="name" value={form.name} onChange={updateField} required placeholder="Ex: Premium Snake Plant" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#8d56af] focus:bg-white focus:ring-4 focus:ring-[#f1e5f7]" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Category
                <select name="category" value={form.category} onChange={updateField} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#8d56af] focus:bg-white focus:ring-4 focus:ring-[#f1e5f7]">
                  <option>Indoor Plants</option>
                  <option>Outdoor Plants</option>
                  <option>Pots & Planters</option>
                  <option>Fertilizers</option>
                  <option>Plant Care</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Price (LKR)
                <input name="price" value={form.price} onChange={updateField} required type="number" min="0" placeholder="2500" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#8d56af] focus:bg-white focus:ring-4 focus:ring-[#f1e5f7]" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Stock quantity
                <input name="stock" value={form.stock} onChange={updateField} required type="number" min="0" placeholder="24" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#8d56af] focus:bg-white focus:ring-4 focus:ring-[#f1e5f7]" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                Selling season
                <select name="season" value={form.season} onChange={updateField} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#8d56af] focus:bg-white focus:ring-4 focus:ring-[#f1e5f7]">
                  <option>All Season</option>
                  <option>Dry Season</option>
                  <option>Wet Season</option>
                  <option>Festive Season</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-slate-700">
                SKU code
                <input name="sku" value={form.sku} onChange={updateField} placeholder="FLR-2048" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#8d56af] focus:bg-white focus:ring-4 focus:ring-[#f1e5f7]" />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Product description
              <textarea name="description" value={form.description} onChange={updateField} rows="4" placeholder="Write a clear, professional description that explains the plant size, care level, pot type, or what makes the item valuable." className="resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#8d56af] focus:bg-white focus:ring-4 focus:ring-[#f1e5f7]" />
            </label>

            <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
              <label className="flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d6c2e1] bg-[linear-gradient(180deg,#fcf8fe_0%,#f6eef9_100%)] px-6 py-8 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#8d56af] shadow-sm">
                  <UploadCloud size={24} />
                </span>
                <span className="mt-4 text-base font-semibold text-slate-900">Upload product photo</span>
                <span className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Add a square product image for cleaner cards and a more real-world storefront presentation.
                </span>
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#8d56af] shadow-sm">
                  <ImagePlus size={16} /> Choose image
                </span>
                <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
              </label>

              <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                <div className="flex h-full flex-col">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <p className="text-sm font-semibold text-slate-900">Preview</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-500">Customer view</span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <div className="h-40 overflow-hidden rounded-2xl bg-white">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Product preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-400">
                          <Package2 size={32} />
                        </div>
                      )}
                    </div>
                    <p className="mt-4 text-base font-semibold text-slate-950">{form.name || 'Your item name'}</p>
                    <p className="mt-1 text-sm text-slate-500">{form.category}</p>
                    <p className="mt-3 text-lg font-semibold text-slate-950">LKR {Number(form.price || 0).toLocaleString()}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{form.description || 'A clean preview card helps sellers review how the item will appear before publishing.'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
              <p className="text-sm leading-6 text-slate-500">Uploaded items are added to the admin catalog instantly and marked as pending for review.</p>
              <button type="submit" className="inline-flex items-center gap-2 rounded-2xl bg-[#17301f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244f31]">
                <Package2 size={16} /> Save catalog item
              </button>
            </div>
          </form>
        </section>

        <div className="grid gap-6">
          <Card title="Catalog Quality" value="Professional" icon={ShieldCheck} accent="bg-emerald-50 text-emerald-700">
            <p className="text-sm leading-6 text-slate-500">
              Keep product names concise, align prices consistently, and use descriptions that are easy for buyers to scan on mobile.
            </p>
          </Card>
          <Card title="Visual Standard" value="1:1 Ratio" icon={ImagePlus} accent="bg-amber-50 text-amber-700">
            <p className="text-sm leading-6 text-slate-500">
              Square photos with natural light, simple backgrounds, and centered products usually look best across listing grids.
            </p>
          </Card>
          <Card title="Publishing Flow" value="Pending Review" icon={Sparkles} accent="bg-violet-50 text-violet-700">
            <p className="text-sm leading-6 text-slate-500">
              New items stay easy to review before they move into the live shop, helping the catalog remain consistent and trustworthy.
            </p>
          </Card>
        </div>
      </div>

      <section className="rounded-[28px] bg-white p-6 shadow-soft ring-1 ring-[#ead8f1]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8d56af]">Catalog inventory</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-950">Current selling items</h3>
          </div>
          <p className="max-w-lg text-sm leading-6 text-slate-500">
            A card-based layout gives the product list a more modern marketplace feel while keeping item details easy to review.
          </p>
        </div>

        {loading && <p className="mt-6 text-sm text-slate-500">Loading catalog items...</p>}
        {error && !loading && <p className="mt-6 text-sm text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {data.map((row) => (
              <article key={row.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfafc_100%)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="relative h-52 overflow-hidden bg-slate-100">
                  <img src={row.image} alt={row.name} className="h-full w-full object-cover" />
                  <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
                    {row.category || row.season}
                  </span>
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-slate-950">{row.name}</h4>
                      <p className="mt-1 text-sm text-slate-500">{row.sku || 'Catalog item'}</p>
                    </div>
                    <span className="rounded-full bg-[#f6eef9] px-3 py-1 text-xs font-semibold text-[#8d56af]">{row.status || 'Pending'}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-500">
                    {row.description || 'Professionally listed plant or garden item ready for review, merchandising, and publishing in the storefront catalog.'}
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Price</p>
                      <p className="mt-2 font-semibold text-slate-900">LKR {Number(row.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Stock</p>
                      <p className="mt-2 font-semibold text-slate-900">{row.stock ?? '--'}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Season</p>
                      <p className="mt-2 font-semibold text-slate-900">{row.season}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <span className="text-sm text-slate-500">Ready for catalog review</span>
                    <button onClick={() => remove(row.id)} className="rounded-2xl bg-red-50 p-2 text-red-700 transition hover:bg-red-100" aria-label={`Delete ${row.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

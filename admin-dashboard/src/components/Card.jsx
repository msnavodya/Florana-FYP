// Render a reusable admin dashboard component for Card.
export function Card({ title, value, icon: Icon, children, accent = 'bg-forest-50 text-forest-700' }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft ring-1 ring-[#ead8f1]">
      {(title || value !== undefined || Icon) && (
        <div className="flex items-start justify-between gap-4">
          <div>
            {title && <p className="text-sm font-medium text-slate-500">{title}</p>}
            {value !== undefined && <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>}
          </div>
          {Icon && (
            <div className={`rounded-lg p-3 ${accent}`}>
              <Icon size={22} />
            </div>
          )}
        </div>
      )}
      {children && <div className={title || value !== undefined ? 'mt-5' : ''}>{children}</div>}
    </section>
  );
}

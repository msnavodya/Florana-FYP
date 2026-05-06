import { LayoutDashboard, Leaf, LogOut, Package, Users } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../services/api';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/plants', label: 'Plants', icon: Leaf },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/users', label: 'Users', icon: Users },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageTitle = links.find((link) => link.to === location.pathname)?.label || 'Dashboard';

  const logout = () => {
    auth.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#fbf7fd] lg:flex">
      <aside className="bg-[linear-gradient(180deg,#aa73c4_0%,#8d56af_100%)] text-white lg:fixed lg:inset-y-0 lg:w-64">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 px-6 py-5">
            <p className="text-xl font-bold">Florana Admin</p>
            <p className="mt-1 text-sm text-forest-100">Management dashboard</p>
          </div>
          <nav className="flex gap-2 overflow-x-auto p-4 lg:flex-1 lg:flex-col lg:overflow-visible">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex min-w-fit items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                    isActive ? 'bg-white text-forest-900' : 'text-forest-100 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden border-t border-white/10 p-4 lg:block">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-forest-100 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </aside>
      <div className="lg:ml-64 lg:flex-1">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ead8f1] bg-white px-5 py-4 lg:px-8">
          <h1 className="text-xl font-semibold text-slate-950">{pageTitle}</h1>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg border border-[#ead8f1] px-3 py-2 text-sm font-medium text-[#8d56af] hover:bg-forest-50 lg:hidden"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>
        <main className="p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

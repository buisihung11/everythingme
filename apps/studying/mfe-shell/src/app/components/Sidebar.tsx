import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Overview', concept: 'Host Shell' },
  { to: '/event-bus', label: 'Event Bus', concept: 'Shared State' },
  { to: '/dashboard', label: 'Dashboard', concept: 'React Remote' },
  { to: '/users', label: 'Users', concept: 'Angular Remote' },
  { to: '/products', label: 'Products', concept: 'Vue Remote' },
  { to: '/analytics', label: 'Analytics', concept: 'React Remote' },
];

export function Sidebar() {
  return (
    <aside className="flex w-64 flex-col border-r border-admin-border bg-admin-surface">
      <div className="border-b border-admin-border px-6 py-5">
        <p className="text-xs uppercase tracking-widest text-admin-muted">MFE Study</p>
        <h1 className="text-xl font-bold text-white">Admin Shell</h1>
        <p className="mt-1 text-xs text-sky-300">React Host · Module Federation</p>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-sky-500/20 text-sky-200'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`
            }
          >
            <span className="font-medium">{item.label}</span>
            <span className="mt-0.5 block text-xs text-admin-muted">{item.concept}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-admin-border p-4">
        <p className="text-xs text-admin-muted">
          Each module is an independently deployable micro frontend loaded at runtime.
        </p>
      </div>
    </aside>
  );
}

import { getAuthStore } from '@studying/mfe-shared/auth-store';
import { getEventBus } from '@studying/mfe-shared/event-bus';

export function Topbar() {
  const auth = getAuthStore().getState();

  const handleLogout = () => {
    getAuthStore().getState().logout();
    getEventBus().publish('auth:changed', { action: 'logout' }, 'mfe-shell');
    window.location.reload();
  };

  return (
    <header className="flex items-center justify-between border-b border-admin-border bg-admin-surface/80 px-6 py-4 backdrop-blur">
      <div>
        <p className="text-sm text-admin-muted">Micro Frontend Admin</p>
        <p className="text-lg font-semibold">Cross-framework composition demo</p>
      </div>
      <div className="flex items-center gap-4">
        <span className="mfe-concept-tag">Shared Singleton State</span>
        <div className="text-right">
          <p className="text-sm font-medium">{auth.user?.name}</p>
          <p className="text-xs text-admin-muted">{auth.user?.role}</p>
        </div>
        <button className="mfe-btn border border-admin-border text-slate-300 hover:bg-slate-700" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { Sidebar, Topbar } from '@/components/Sidebar';
import { AdminDashboard } from '@/components/AdminDashboard';
import { DriverPortal } from '@/components/DriverPortal';
import type { AppView } from '@/data/logistics';

function App() {
  const [view, setView] = useState<AppView>('admin');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavigate = (v: AppView) => {
    setView(v);
    setMobileOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar
        view={view}
        onNavigate={handleNavigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar view={view} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div key={view} className="animate-fade-in">
            {view === 'admin' ? <AdminDashboard /> : <DriverPortal />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

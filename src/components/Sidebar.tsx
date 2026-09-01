import {
  LayoutDashboard,
  Package,
  Truck,
  ChevronLeft,
  X,
  ShieldCheck,
  CircleDot,
} from 'lucide-react';
import type { AppView } from '@/data/logistics';
import { viewMeta } from '@/data/logistics';

const navItems: {
  view: AppView;
  label: string;
  icon: typeof LayoutDashboard;
}[] = [
  { view: 'admin', label: 'Admin Dashboard', icon: LayoutDashboard },
  { view: 'driver', label: 'Driver Portal', icon: Package },
];

export function Sidebar({
  view,
  onNavigate,
  mobileOpen,
  onCloseMobile,
}: {
  view: AppView;
  onNavigate: (v: AppView) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink-950 text-ink-100 transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 shadow-lg shadow-brand-500/30">
            <Truck className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold tracking-tight text-white">Poly Pods Logistics</p>
            <p className="text-[11px] font-medium text-ink-400">Logistics OS</p>
          </div>
          <button
            onClick={onCloseMobile}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-3 py-2">
          <p className="px-3 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Master Views
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = view === item.view;
              const Icon = item.icon;
              return (
                <button
                  key={item.view}
                  onClick={() => onNavigate(item.view)}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                      : 'text-ink-300 hover:bg-ink-800 hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-[18px] w-[18px] ${active ? 'text-white' : 'text-ink-400 group-hover:text-white'}`}
                    strokeWidth={2.25}
                  />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto space-y-3 px-4 pb-5 pt-4">
          <div className="rounded-xl bg-ink-900 p-4 ring-1 ring-ink-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-mint-400" />
              <p className="text-xs font-semibold text-white">System Healthy</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">
              All trackers online. Last sync 38s ago.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-mint-400">
              <CircleDot className="h-3 w-3 animate-pulse" />
              <span className="font-medium">Live</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl px-1 py-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{
                background: 'linear-gradient(135deg, hsl(35 70% 48%), hsl(35 70% 38%))',
              }}
            >
              DV
            </div>
            <div className="flex-1 leading-tight">
              <p className="text-xs font-semibold text-white">Dispatch Ops</p>
              <p className="text-[11px] text-ink-400">UAQ</p>
            </div>
            <button
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-800 hover:text-white"
              aria-label="Go back"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export function Topbar({
  view,
  onOpenMobile,
}: {
  view: AppView;
  onOpenMobile: () => void;
}) {
  const meta = viewMeta[view];
  const Icon = meta.icon;
  return (
    <header className="sticky top-0 z-20 border-b border-ink-100 bg-white/80 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-100 lg:hidden"
          aria-label="Open menu"
        >
          <LayoutDashboard className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2.5">
          <span className="hidden h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 sm:flex">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-base font-bold tracking-tight text-ink-900 sm:text-lg">
              {meta.label}
            </h1>
            <p className="hidden text-xs text-ink-500 sm:block">{meta.description}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-lg bg-ink-50 px-3 py-2 text-xs font-medium text-ink-500 md:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-500" />
            Tue, Aug 3 · 09:42 PDT
          </div>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, hsl(35 70% 48%), hsl(35 70% 38%))',
            }}
          >
            DV
          </div>
        </div>
      </div>
    </header>
  );
}

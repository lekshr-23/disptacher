import {
  MapPin,
  Truck as TruckIcon,
  Layers,
  Maximize2,
  Navigation,
  Plus,
  Minus,
  Compass,
  CircleDot,
} from 'lucide-react';
import {
  jobStatusMeta,
  type Vehicle,
  type DeliveryJob,
  type Driver,
} from '@/data/logistics';
import { Card, StatusDot } from '@/components/ui';

const mapPins: {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'depot' | 'vehicle' | 'destination';
  refId?: string;
}[] = [
  { id: 'depot', label: 'Bayshore Depot', x: 22, y: 48, type: 'depot' },
  { id: 'veh-01', label: 'TRK-104', x: 45, y: 32, type: 'vehicle', refId: 'veh-01' },
  { id: 'veh-02', label: 'TRK-108', x: 30, y: 55, type: 'vehicle', refId: 'veh-02' },
  { id: 'veh-04', label: 'VAN-207', x: 52, y: 62, type: 'vehicle', refId: 'veh-04' },
  { id: 'veh-05', label: 'VAN-209', x: 25, y: 50, type: 'vehicle', refId: 'veh-05' },
  { id: 'dest-01', label: 'Sacramento', x: 72, y: 18, type: 'destination' },
  { id: 'dest-02', label: 'Berkeley', x: 35, y: 42, type: 'destination' },
  { id: 'dest-03', label: 'Fremont', x: 58, y: 68, type: 'destination' },
  { id: 'dest-04', label: 'Stockton', x: 68, y: 38, type: 'destination' },
  { id: 'dest-05', label: 'Palo Alto', x: 48, y: 72, type: 'destination' },
];

function PinIcon({ type }: { type: 'depot' | 'vehicle' | 'destination' }) {
  if (type === 'depot')
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-white shadow-lg ring-2 ring-white">
        <Layers className="h-4.5 w-4.5" />
      </div>
    );
  if (type === 'vehicle')
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg ring-2 ring-white">
        <TruckIcon className="h-4 w-4" />
      </div>
    );
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-md ring-2 ring-white">
      <MapPin className="h-3.5 w-3.5" />
    </div>
  );
}

interface MapPanelProps {
  vehicles: Vehicle[];
  jobs: DeliveryJob[];
  drivers: Driver[];
}

export function MapPanel({ vehicles, jobs, drivers }: MapPanelProps) {
  const activeVehicles = vehicles.filter((v) => v.status === 'active');
  const inTransit = jobs.filter((j) => j.status === 'in-transit');

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
        <div>
          <h3 className="text-sm font-bold text-ink-900">Live Fleet Map</h3>
          <p className="text-xs text-ink-500">{activeVehicles.length} vehicles tracked in real time</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700" aria-label="Layers">
            <Layers className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-2 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700" aria-label="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative aspect-[4/3] flex-1 overflow-hidden bg-ink-100 sm:aspect-[16/10]">
        <MapBackground />

        {mapPins.map((pin) => (
          <div
            key={pin.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:z-10 hover:scale-110"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <div className="group relative">
              <PinIcon type={pin.type} />
              {pin.type === 'vehicle' && (
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-mint-500 ring-2 ring-white animate-pulse-ring" />
              )}
              <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                {pin.label}
              </div>
            </div>
          </div>
        ))}

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {[
            { tone: 'ink', label: 'Depot' },
            { tone: 'brand', label: 'Vehicle' },
            { tone: 'amber', label: 'Destination' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-ink-600 shadow-soft backdrop-blur-sm">
              <StatusDot tone={item.tone} />
              {item.label}
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1 rounded-xl bg-white/90 p-1 shadow-soft backdrop-blur-sm">
          <button className="rounded-lg p-1.5 text-ink-600 transition-colors hover:bg-ink-100" aria-label="Zoom in">
            <Plus className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-1.5 text-ink-600 transition-colors hover:bg-ink-100" aria-label="Zoom out">
            <Minus className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-1.5 text-ink-600 transition-colors hover:bg-ink-100" aria-label="Recenter">
            <Compass className="h-4 w-4" />
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-medium text-ink-600 shadow-soft backdrop-blur-sm">
          <CircleDot className="h-3 w-3 animate-pulse text-mint-500" />
          Live · updated 12s ago
        </div>
      </div>

      <div className="border-t border-ink-100 px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold text-ink-900">Active Routes</p>
          <span className="text-[11px] text-ink-400">{inTransit.length} in transit</span>
        </div>
        <div className="space-y-2.5">
          {inTransit.slice(0, 4).map((job) => {
            const driver = drivers.find((d) => d.id === job.driver_id);
            const status = jobStatusMeta[job.status];
            return (
              <div key={job.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <Navigation className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink-900">
                    {job.destination}
                  </p>
                  <p className="truncate text-[11px] text-ink-400">
                    {driver?.name ?? 'Unassigned'} · {job.reference}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden w-20 h-1.5 overflow-hidden rounded-full bg-ink-100 sm:block">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${job.progress_pct}%` }}
                    />
                  </div>
                  <span className={`text-[11px] font-semibold ${status.tone === 'rose' ? 'text-rose-600' : 'text-brand-600'}`}>
                    {job.progress_pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function MapBackground() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-ink-50 to-ink-100" />
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cdd6e4" strokeWidth="0.5" />
          </pattern>
          <pattern id="grid-major" width="160" height="160" patternUnits="userSpaceOnUse">
            <path d="M 160 0 L 0 0 0 160" fill="none" stroke="#a3b1c6" strokeWidth="0.75" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <rect width="100%" height="100%" fill="url(#grid-major)" />
      </svg>
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 75">
        <path d="M 22 48 Q 35 30, 45 32 T 72 18" fill="none" stroke="#59b0ff" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
        <path d="M 22 48 Q 28 52, 30 55 T 35 42" fill="none" stroke="#59b0ff" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
        <path d="M 22 48 Q 40 60, 52 62 T 58 68" fill="none" stroke="#59b0ff" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.6" />
        <path d="M 30 55 Q 45 50, 58 38 T 68 38" fill="none" stroke="#fb7185" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
        <path d="M 25 50 Q 38 65, 48 72" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 2" opacity="0.5" />
        <rect x="10" y="12" width="14" height="8" rx="2" fill="#e8edf4" opacity="0.7" />
        <rect x="80" y="8" width="12" height="10" rx="2" fill="#e8edf4" opacity="0.7" />
        <rect x="62" y="55" width="16" height="12" rx="2" fill="#e8edf4" opacity="0.7" />
        <rect x="5" y="60" width="12" height="9" rx="2" fill="#e8edf4" opacity="0.7" />
      </svg>
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  MapPin,
  Weight,
  Clock,
  Phone,
  Route,
  Star,
  Truck,
  Fuel,
  Navigation,
  Play,
  CheckCircle2,
  ChevronRight,
  X,
  MapPinHouse,
  ArrowRight,
  Building2,
  PartyPopper,
  Package,
  Loader2,
} from 'lucide-react';
import {
  jobStatusMeta,
  jobPriorityMeta,
  type DeliveryJob,
  type Driver,
  type Vehicle,
  type JobStatus,
} from '@/data/logistics';
import { useDrivers, useVehicles, useDeliveryJobs, updateJobStatus } from '@/data/hooks';
import { Card, StatusBadge, Avatar } from '@/components/ui';

type RouteState = 'idle' | 'started' | 'arrived' | 'completed';
type FilterKey = 'active' | 'upcoming' | 'done';

const routeStateMeta: Record<
  RouteState,
  { label: string; nextLabel: string; icon: typeof Play; tone: string }
> = {
  idle: { label: 'Start Route', nextLabel: 'Start Route', icon: Play, tone: 'brand' },
  started: { label: 'In Transit', nextLabel: 'Mark Arrived', icon: Navigation, tone: 'brand' },
  arrived: { label: 'At Destination', nextLabel: 'Complete Delivery', icon: CheckCircle2, tone: 'amber' },
  completed: { label: 'Delivered', nextLabel: 'Delivered', icon: CheckCircle2, tone: 'mint' },
};

const filters: { key: FilterKey; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'done', label: 'Completed' },
];

function jobToRouteState(job: DeliveryJob): RouteState {
  if (job.status === 'delivered') return 'completed';
  if (job.status === 'in-transit') return 'started';
  if (job.status === 'delayed') return 'started';
  return 'idle';
}

function routeStateToJobStatus(state: RouteState): { status: JobStatus; progress: number } {
  switch (state) {
    case 'idle':
      return { status: 'pending', progress: 0 };
    case 'started':
      return { status: 'in-transit', progress: 25 };
    case 'arrived':
      return { status: 'in-transit', progress: 90 };
    case 'completed':
      return { status: 'delivered', progress: 100 };
  }
}

export function DriverPortal() {
  const { drivers, loading: dLoading } = useDrivers();
  const { vehicles, loading: vLoading } = useVehicles();
  const { jobs, loading: jLoading } = useDeliveryJobs();

  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('active');
  const [openJob, setOpenJob] = useState<DeliveryJob | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);

  const loading = dLoading || vLoading || jLoading;

  const effectiveDriverId = selectedDriverId ?? drivers[0]?.id ?? null;
  const driver = drivers.find((d) => d.id === effectiveDriverId) ?? null;
  const vehicle = driver ? vehicles.find((v) => v.id === driver.assigned_vehicle_id) ?? null : null;

  const myJobs = useMemo(
    () => jobs.filter((j) => j.driver_id === effectiveDriverId),
    [jobs, effectiveDriverId],
  );

  const filteredJobs = useMemo(() => {
    switch (filter) {
      case 'active':
        return myJobs.filter((j) => j.status === 'in-transit' || j.status === 'delayed' || j.status === 'pending');
      case 'upcoming':
        return myJobs.filter((j) => j.status === 'pending');
      case 'done':
        return myJobs.filter((j) => j.status === 'delivered' || j.status === 'cancelled');
      default:
        return myJobs;
    }
  }, [myJobs, filter]);

  const completedCount = myJobs.filter((j) => j.status === 'delivered').length;
  const totalKm = myJobs.reduce((sum, j) => sum + j.distance_km, 0);

  const advanceRoute = async (jobId: string, currentState: RouteState) => {
    const nextState: RouteState =
      currentState === 'idle' ? 'started' : currentState === 'started' ? 'arrived' : currentState === 'arrived' ? 'completed' : 'completed';
    const { status, progress } = routeStateToJobStatus(nextState);

    setAdvancing(jobId);
    await updateJobStatus(jobId, status, progress);
    setAdvancing(null);

    if (openJob?.id === jobId) {
      setOpenJob((prev) =>
        prev ? { ...prev, status, progress_pct: progress } : prev,
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
          <p className="text-sm font-medium text-ink-400">Loading driver data…</p>
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex items-center justify-center p-20">
        <p className="text-sm font-medium text-ink-400">No drivers found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6 lg:max-w-3xl lg:p-8">
      <DriverSwitcher
        drivers={drivers}
        selectedId={effectiveDriverId}
        onSelect={setSelectedDriverId}
      />
      <DriverHero driver={driver} vehicle={vehicle} completedCount={completedCount} totalKm={totalKm} />

      <div>
        <div className="flex items-center justify-between px-1 pb-3">
          <h2 className="text-sm font-bold text-ink-900">Assigned Deliveries</h2>
          <span className="text-xs text-ink-400">{filteredJobs.length} jobs</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                filter === f.key
                  ? 'bg-ink-900 text-white shadow-sm'
                  : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <Package className="h-8 w-8 text-ink-300" />
              <p className="text-sm font-medium text-ink-500">No jobs in this view</p>
            </Card>
          ) : (
            filteredJobs.map((job) => {
              const rState = jobToRouteState(job);
              return (
                <JobCard
                  key={job.id}
                  job={job}
                  routeState={rState}
                  advancing={advancing === job.id}
                  onOpen={() => setOpenJob(job)}
                  onAdvance={() => advanceRoute(job.id, rState)}
                />
              );
            })
          )}
        </div>
      </div>

      {openJob && (
        <JobDetailSheet
          job={openJob}
          routeState={jobToRouteState(openJob)}
          advancing={advancing === openJob.id}
          driver={driver}
          vehicle={vehicle}
          onClose={() => setOpenJob(null)}
          onAdvance={() => advanceRoute(openJob.id, jobToRouteState(openJob))}
        />
      )}
    </div>
  );
}

function DriverSwitcher({
  drivers,
  selectedId,
  onSelect,
}: {
  drivers: Driver[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {drivers.map((d) => {
        const active = d.id === selectedId;
        return (
          <button
            key={d.id}
            onClick={() => onSelect(d.id)}
            className={`flex shrink-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 transition-all ${
              active ? 'bg-ink-900 text-white shadow-sm' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'
            }`}
          >
            <Avatar name={d.name} hue={d.avatar_hue} size="sm" />
            <span className="text-xs font-semibold">{d.name.split(' ')[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

function DriverHero({
  driver,
  vehicle,
  completedCount,
  totalKm,
}: {
  driver: Driver;
  vehicle: Vehicle | null;
  completedCount: number;
  totalKm: number;
}) {
  const statusMeta = {
    'on-duty': { label: 'On Duty', tone: 'mint' as const },
    'on-break': { label: 'On Break', tone: 'amber' as const },
    'off-duty': { label: 'Off Duty', tone: 'ink' as const },
  }[driver.status];

  return (
    <Card className="overflow-hidden">
      <div className="relative bg-gradient-to-br from-ink-900 via-ink-800 to-brand-950 p-5 text-white">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-brand-500/20 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <Avatar name={driver.name} hue={driver.avatar_hue} size="lg" />
          <div className="flex-1">
            <p className="text-lg font-bold leading-tight">{driver.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge tone={statusMeta.tone} className="ring-white/20">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {statusMeta.label}
              </StatusBadge>
              <span className="flex items-center gap-1 text-xs text-white/70">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {driver.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-3 gap-3">
          <HeroStat label="Completed" value={String(completedCount)} />
          <HeroStat label="Total Km" value={String(totalKm)} />
          <HeroStat label="On Duty" value={`${driver.hours_on_duty}h`} />
        </div>
      </div>
      {vehicle && (
        <div className="flex items-center gap-4 px-5 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
            <Truck className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-900">{vehicle.unit}</p>
            <p className="text-[11px] text-ink-400">{vehicle.location}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-600">
              <Fuel className="h-3.5 w-3.5 text-ink-400" />
              {vehicle.fuel_pct}%
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-center backdrop-blur-sm ring-1 ring-white/10">
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/60">{label}</p>
    </div>
  );
}

function JobCard({
  job,
  routeState,
  advancing,
  onOpen,
  onAdvance,
}: {
  job: DeliveryJob;
  routeState: RouteState;
  advancing: boolean;
  onOpen: () => void;
  onAdvance: () => void;
}) {
  const status = jobStatusMeta[job.status];
  const priority = jobPriorityMeta[job.priority];
  const isCompleted = routeState === 'completed';
  const meta = routeStateMeta[routeState];

  const buttonTone =
    routeState === 'idle'
      ? 'bg-brand-500 hover:bg-brand-600'
      : routeState === 'started'
        ? 'bg-amber-500 hover:bg-amber-600'
        : routeState === 'arrived'
          ? 'bg-mint-500 hover:bg-mint-600'
          : 'bg-ink-200 text-ink-500 cursor-default';

  const ButtonIcon = meta.icon;

  return (
    <Card className={`overflow-hidden transition-all ${isCompleted ? 'ring-mint-200' : ''}`}>
      <button onClick={onOpen} className="block w-full p-4 text-left sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-xs font-semibold text-ink-400">{job.reference}</p>
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              {job.priority !== 'standard' && (
                <StatusBadge tone={priority.tone} className="!px-2 !py-0.5 !text-[10px]">
                  {priority.label}
                </StatusBadge>
              )}
            </div>
            <h3 className="mt-2 text-base font-bold leading-tight text-ink-900 sm:text-lg">
              {job.customer}
            </h3>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-ink-300" />
        </div>

        <div className="mt-4 space-y-2.5 rounded-xl bg-ink-50 p-3.5">
          <div className="flex items-start gap-3">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Pickup</p>
              <p className="truncate text-sm font-medium text-ink-700">{job.origin}</p>
              <p className="text-xs text-ink-400">{job.pickup_at}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPinHouse className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">Drop-off</p>
              <p className="truncate text-sm font-medium text-ink-700">{job.destination}</p>
              <p className="text-xs text-ink-400">by {job.deliver_by}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-xs text-ink-500">
          <span className="flex items-center gap-1.5">
            <Weight className="h-3.5 w-3.5 text-ink-400" />
            {job.weight_kg.toLocaleString()} kg
          </span>
          <span className="flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5 text-ink-400" />
            {job.distance_km} km
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-ink-400" />
            {job.pickup_at}–{job.deliver_by}
          </span>
        </div>
      </button>

      <div className="px-4 pb-4 sm:px-5 sm:pb-5">
        <MultiStateButton
          state={routeState}
          toneClass={buttonTone}
          icon={ButtonIcon}
          advancing={advancing}
          onClick={onAdvance}
        />
      </div>
    </Card>
  );
}

function MultiStateButton({
  state,
  toneClass,
  icon: Icon,
  advancing,
  onClick,
}: {
  state: RouteState;
  toneClass: string;
  icon: typeof Play;
  advancing: boolean;
  onClick: () => void;
}) {
  const meta = routeStateMeta[state];
  const isDone = state === 'completed';

  const steps: { key: RouteState; label: string }[] = [
    { key: 'idle', label: 'Start' },
    { key: 'started', label: 'Transit' },
    { key: 'arrived', label: 'Arrived' },
    { key: 'completed', label: 'Done' },
  ];
  const currentIdx = steps.findIndex((s) => s.key === state);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {steps.map((step, i) => (
          <div key={step.key} className="flex flex-1 items-center gap-1.5">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= currentIdx
                  ? isDone
                    ? 'bg-mint-500'
                    : i === currentIdx
                      ? 'bg-brand-500'
                      : 'bg-mint-400'
                  : 'bg-ink-100'
              }`}
            />
          </div>
        ))}
      </div>
      <button
        onClick={onClick}
        disabled={isDone || advancing}
        className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 text-base font-bold tracking-tight text-white shadow-lg transition-all active:scale-[0.98] disabled:shadow-none ${toneClass}`}
      >
        {advancing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Updating…
          </>
        ) : (
          <>
            <Icon className="h-5 w-5" />
            {isDone ? 'Delivered' : meta.nextLabel}
            {!isDone && <ArrowRight className="h-5 w-5 opacity-70" />}
          </>
        )}
      </button>
    </div>
  );
}

function JobDetailSheet({
  job,
  routeState,
  advancing,
  driver,
  vehicle,
  onClose,
  onAdvance,
}: {
  job: DeliveryJob;
  routeState: RouteState;
  advancing: boolean;
  driver: Driver;
  vehicle: Vehicle | null;
  onClose: () => void;
  onAdvance: () => void;
}) {
  const status = jobStatusMeta[job.status];
  const priority = jobPriorityMeta[job.priority];
  const isCompleted = routeState === 'completed';
  const meta = routeStateMeta[routeState];
  const ButtonIcon = meta.icon;

  const buttonTone =
    routeState === 'idle'
      ? 'bg-brand-500 hover:bg-brand-600'
      : routeState === 'started'
        ? 'bg-amber-500 hover:bg-amber-600'
        : routeState === 'arrived'
          ? 'bg-mint-500 hover:bg-mint-600'
          : 'bg-ink-200 text-ink-500 cursor-default';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in overflow-hidden rounded-t-3xl bg-white shadow-pop sm:rounded-3xl">
        <div className="mx-auto mb-3 mt-3 h-1 w-10 rounded-full bg-ink-200 sm:hidden" />
        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs font-semibold text-ink-400">{job.reference}</p>
              <h3 className="mt-1 text-lg font-bold text-ink-900">{job.customer}</h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <StatusBadge tone={priority.tone}>{priority.label}</StatusBadge>
          </div>

          {isCompleted && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-mint-50 p-4 ring-1 ring-mint-200">
              <PartyPopper className="h-5 w-5 text-mint-600" />
              <div>
                <p className="text-sm font-bold text-mint-800">Delivery Complete</p>
                <p className="text-xs text-mint-700">Marked as delivered. Customer has been notified.</p>
              </div>
            </div>
          )}

          <div className="mt-5 space-y-1 rounded-2xl bg-ink-50 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-ink-300 ring-4 ring-ink-100" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Pickup</p>
                <p className="text-sm font-semibold text-ink-900">{job.origin}</p>
                <p className="text-xs text-ink-500">{job.pickup_at}</p>
              </div>
            </div>
            <div className="ml-[5px] h-6 border-l-2 border-dashed border-ink-200" />
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500 ring-4 ring-brand-100" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Drop-off</p>
                <p className="text-sm font-semibold text-ink-900">{job.destination}</p>
                <p className="text-xs text-ink-500">by {job.deliver_by}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            <DetailStat icon={Weight} label="Weight" value={`${job.weight_kg} kg`} />
            <DetailStat icon={Route} label="Distance" value={`${job.distance_km} km`} />
            <DetailStat icon={Clock} label="Window" value={`${job.pickup_at}`} />
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ink-100 p-3.5">
            <Avatar name={driver.name} hue={driver.avatar_hue} size="md" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink-900">{driver.name}</p>
              <p className="text-xs text-ink-500">{vehicle?.unit ?? 'No vehicle'}</p>
            </div>
            <a
              href={`tel:${driver.phone.replace(/[^0-9+]/g, '')}`}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-mint-50 text-mint-600 transition-colors hover:bg-mint-100"
              aria-label={`Call ${driver.name}`}
            >
              <Phone className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-5">
            <MultiStateButton
              state={routeState}
              toneClass={buttonTone}
              icon={ButtonIcon}
              advancing={advancing}
              onClick={onAdvance}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Truck;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-ink-400" />
      <p className="mt-1.5 text-sm font-bold text-ink-900">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}

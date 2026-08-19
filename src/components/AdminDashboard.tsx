import {
  Truck,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useVehicles, useDrivers, useDeliveryJobs } from '@/data/hooks';
import { Card } from '@/components/ui';
import { SortableDataTable } from '@/components/admin/SortableDataTable';
import { CreateJobForm } from '@/components/admin/CreateJobForm';
import { MapPanel } from '@/components/admin/MapPanel';

function StatCard({
  label,
  value,
  delta,
  deltaTone,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  delta: string;
  deltaTone: 'up' | 'down' | 'flat';
  icon: typeof Truck;
  accent: string;
}) {
  const deltaColor =
    deltaTone === 'up'
      ? 'text-mint-600'
      : deltaTone === 'down'
        ? 'text-rose-600'
        : 'text-ink-500';
  const DeltaIcon = deltaTone === 'up' ? TrendingUp : deltaTone === 'down' ? TrendingDown : null;
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-ink-900">{value}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 flex items-center gap-1.5 text-xs">
        {DeltaIcon && <DeltaIcon className={`h-3.5 w-3.5 ${deltaColor}`} />}
        <span className={`font-semibold ${deltaColor}`}>{delta}</span>
        <span className="text-ink-400">vs last week</span>
      </div>
    </Card>
  );
}

export function AdminDashboard() {
  const { vehicles, loading: vLoading } = useVehicles();
  const { drivers, loading: dLoading } = useDrivers();
  const { jobs, loading: jLoading } = useDeliveryJobs();

  const loading = vLoading || dLoading || jLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-500" />
          <p className="text-sm font-medium text-ink-400">Loading fleet data…</p>
        </div>
      </div>
    );
  }

  const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
  const onDutyDrivers = drivers.filter((d) => d.status === 'on-duty').length;
  const inTransit = jobs.filter((j) => j.status === 'in-transit').length;
  const delayed = jobs.filter((j) => j.status === 'delayed').length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Fleet"
          value={`${activeVehicles}/${vehicles.length}`}
          delta="+1"
          deltaTone="up"
          icon={Truck}
          accent="bg-brand-50 text-brand-600"
        />
        <StatCard
          label="Drivers On Duty"
          value={`${onDutyDrivers}/${drivers.length}`}
          delta="+2"
          deltaTone="up"
          icon={Users}
          accent="bg-mint-50 text-mint-600"
        />
        <StatCard
          label="In Transit"
          value={String(inTransit)}
          delta="+3"
          deltaTone="up"
          icon={Package}
          accent="bg-amber-50 text-amber-600"
        />
        <StatCard
          label="Delayed"
          value={String(delayed)}
          delta="-1"
          deltaTone="down"
          icon={AlertTriangle}
          accent="bg-rose-50 text-rose-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SortableDataTable vehicles={vehicles} drivers={drivers} />
        <div className="space-y-6">
          <CreateJobForm jobs={jobs} drivers={drivers} vehicles={vehicles} />
        </div>
      </div>

      <MapPanel vehicles={vehicles} jobs={jobs} drivers={drivers} />
    </div>
  );
}

import { useState, useMemo } from 'react';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Truck,
  MapPin,
  Users,
  type LucideIcon,
} from 'lucide-react';
import {
  vehicleTypeMeta,
  vehicleStatusMeta,
  driverStatusMeta,
  type Vehicle,
  type Driver,
} from '@/data/logistics';
import { Card, StatusBadge, Avatar } from '@/components/ui';

type TabKey = 'vehicles' | 'drivers';
type SortDir = 'asc' | 'desc';

interface SortState {
  key: string;
  dir: SortDir;
}

const vehicleColumns: {
  key: keyof Vehicle | 'driverName';
  label: string;
  sortable: boolean;
  align?: 'right';
}[] = [
  { key: 'unit', label: 'Unit', sortable: true },
  { key: 'type', label: 'Type', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'driverName', label: 'Driver', sortable: true },
  { key: 'location', label: 'Location', sortable: false },
  { key: 'fuel_pct', label: 'Fuel', sortable: true, align: 'right' },
  { key: 'odometer_km', label: 'Odometer', sortable: true, align: 'right' },
];

const driverColumns: {
  key: keyof Driver | 'vehicleUnit';
  label: string;
  sortable: boolean;
  align?: 'right';
}[] = [
  { key: 'name', label: 'Driver', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'vehicleUnit', label: 'Vehicle', sortable: false },
  { key: 'rating', label: 'Rating', sortable: true, align: 'right' },
  { key: 'deliveries_this_week', label: 'Deliveries', sortable: true, align: 'right' },
  { key: 'hours_on_duty', label: 'Hours', sortable: true, align: 'right' },
];

interface SortableDataTableProps {
  vehicles: Vehicle[];
  drivers: Driver[];
}

function sortValue(
  item: Vehicle | Driver,
  key: string,
  vehicles: Vehicle[],
  drivers: Driver[],
): string | number {
  if (key === 'driverName') {
    const v = item as Vehicle;
    const d = drivers.find((d) => d.id === v.driver_id);
    return d ? d.name : 'ZZZ';
  }
  if (key === 'vehicleUnit') {
    const d = item as Driver;
    const v = vehicles.find((veh) => veh.id === d.assigned_vehicle_id);
    return v ? v.unit : 'ZZZ';
  }
  const val = (item as unknown as Record<string, unknown>)[key];
  return val as string | number;
}

function SortHeader({
  label,
  sortable,
  active,
  dir,
  onClick,
  align,
}: {
  label: string;
  sortable: boolean;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: 'right';
}) {
  return (
    <th className={`px-4 py-3 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {sortable ? (
        <button
          onClick={onClick}
          className={`inline-flex items-center gap-1 transition-colors hover:text-ink-900 ${
            active ? 'text-ink-900' : ''
          } ${align === 'right' ? 'flex-row-reverse' : ''}`}
        >
          {label}
          {active ? (
            dir === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-3 w-3 text-ink-300" />
          )}
        </button>
      ) : (
        <span>{label}</span>
      )}
    </th>
  );
}

function VehicleRow({ vehicle, drivers }: { vehicle: Vehicle; drivers: Driver[] }) {
  const meta = vehicleTypeMeta[vehicle.type];
  const status = vehicleStatusMeta[vehicle.status];
  const TypeIcon = meta.icon;
  const driver = drivers.find((d) => d.id === vehicle.driver_id);
  return (
    <tr className="transition-colors hover:bg-ink-50/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-600">
            <TypeIcon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">{vehicle.unit}</p>
            <p className="text-[11px] text-ink-400">{(vehicle.capacity_kg / 1000).toFixed(1)}t cap</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-xs font-medium text-ink-600">{meta.label}</td>
      <td className="px-4 py-3">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </td>
      <td className="px-4 py-3">
        {driver ? (
          <div className="flex items-center gap-2">
            <Avatar name={driver.name} hue={driver.avatar_hue} size="sm" />
            <span className="text-xs font-medium text-ink-700">{driver.name}</span>
          </div>
        ) : (
          <span className="text-xs italic text-ink-400">Unassigned</span>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="flex items-center gap-1 text-xs text-ink-600">
          <MapPin className="h-3 w-3 shrink-0 text-ink-400" />
          <span className="max-w-[140px] truncate">{vehicle.location}</span>
        </p>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs font-semibold text-ink-700">{vehicle.fuel_pct}%</span>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full ${
                vehicle.fuel_pct > 50 ? 'bg-mint-500' : vehicle.fuel_pct > 25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${vehicle.fuel_pct}%` }}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono text-xs font-medium text-ink-600">
        {vehicle.odometer_km.toLocaleString()} km
      </td>
    </tr>
  );
}

function DriverRow({ driver, vehicles }: { driver: Driver; vehicles: Vehicle[] }) {
  const status = driverStatusMeta[driver.status];
  const vehicle = vehicles.find((v) => v.id === driver.assigned_vehicle_id);
  return (
    <tr className="transition-colors hover:bg-ink-50/60">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={driver.name} hue={driver.avatar_hue} size="sm" />
          <div>
            <p className="text-sm font-semibold text-ink-900">{driver.name}</p>
            <p className="text-[11px] text-ink-400">{driver.phone}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </td>
      <td className="px-4 py-3 text-xs font-medium text-ink-600">
        {vehicle ? vehicle.unit : <span className="italic text-ink-400">None</span>}
      </td>
      <td className="px-4 py-3 text-right">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700">
          <span className="text-amber-500">★</span>
          {driver.rating.toFixed(1)}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold text-ink-900">
        {driver.deliveries_this_week}
      </td>
      <td className="px-4 py-3 text-right text-sm font-medium text-ink-600">
        {driver.hours_on_duty}h
      </td>
    </tr>
  );
}

export function SortableDataTable({ vehicles, drivers }: SortableDataTableProps) {
  const [tab, setTab] = useState<TabKey>('vehicles');
  const [sort, setSort] = useState<SortState>({ key: 'unit', dir: 'asc' });

  const columns = tab === 'vehicles' ? vehicleColumns : driverColumns;
  const data = tab === 'vehicles' ? vehicles : drivers;

  const sorted = useMemo(() => {
    const rows = [...data];
    rows.sort((a, b) => {
      const av = sortValue(a, sort.key, vehicles, drivers);
      const bv = sortValue(b, sort.key, vehicles, drivers);
      if (typeof av === 'number' && typeof bv === 'number') {
        return sort.dir === 'asc' ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [data, sort, vehicles, drivers]);

  const handleSort = (key: string) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    );
  };

  const tabMeta: { key: TabKey; label: string; icon: LucideIcon; count: number }[] = [
    { key: 'vehicles', label: 'Vehicles', icon: Truck, count: vehicles.length },
    { key: 'drivers', label: 'Drivers', icon: Users, count: drivers.length },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-ink-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-ink-900">Fleet & Roster</h3>
          <p className="text-xs text-ink-500">Click any column header to sort</p>
        </div>
        <div className="flex gap-1 rounded-xl bg-ink-50 p-1">
          {tabMeta.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setSort({ key: t.key === 'vehicles' ? 'unit' : 'name', dir: 'asc' });
                }}
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <span className={`rounded-full px-1.5 text-[10px] ${active ? 'bg-brand-100 text-brand-700' : 'bg-ink-200 text-ink-500'}`}>
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left">
          <thead>
            <tr className="border-b border-ink-100 text-[11px] uppercase tracking-wider text-ink-400">
              {columns.map((col) => (
                <SortHeader
                  key={col.key as string}
                  label={col.label}
                  sortable={col.sortable}
                  active={sort.key === col.key}
                  dir={sort.dir}
                  align={col.align}
                  onClick={() => handleSort(col.key as string)}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-50">
            {tab === 'vehicles'
              ? sorted.map((v) => <VehicleRow key={v.id} vehicle={v as Vehicle} drivers={drivers} />)
              : sorted.map((d) => <DriverRow key={d.id} driver={d as Driver} vehicles={vehicles} />)}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

import {
  Truck,
  UserCircle2,
  Package,
  type LucideIcon,
} from 'lucide-react';

// ============ Domain Types (matching DB columns) ============

export type VehicleType = 'box' | 'refrigerated' | 'flatbed' | 'sprinter';
export type VehicleStatus = 'active' | 'maintenance' | 'idle';
export type DriverStatus = 'on-duty' | 'off-duty' | 'on-break';
export type JobStatus = 'pending' | 'in-transit' | 'delivered' | 'delayed' | 'cancelled';
export type JobPriority = 'standard' | 'high' | 'urgent';

export interface Vehicle {
  id: string;
  unit: string;
  type: VehicleType;
  status: VehicleStatus;
  capacity_kg: number;
  driver_id: string | null;
  location: string;
  odometer_km: number;
  fuel_pct: number;
  last_service: string | null;
}

export interface Driver {
  id: string;
  name: string;
  status: DriverStatus;
  phone: string;
  license_expiry: string | null;
  rating: number;
  deliveries_this_week: number;
  hours_on_duty: number;
  avatar_hue: number;
  assigned_vehicle_id: string | null;
}

export interface DeliveryJob {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  driver_id: string | null;
  vehicle_id: string | null;
  status: JobStatus;
  priority: JobPriority;
  pickup_at: string;
  deliver_by: string;
  weight_kg: number;
  distance_km: number;
  customer: string;
  progress_pct: number;
}

// ============ Metadata maps for display ============

export const vehicleTypeMeta: Record<VehicleType, { label: string; icon: LucideIcon }> = {
  box: { label: 'Box Truck', icon: Truck },
  refrigerated: { label: 'Refrigerated', icon: Truck },
  flatbed: { label: 'Flatbed', icon: Truck },
  sprinter: { label: 'Sprinter Van', icon: Truck },
};

export const vehicleStatusMeta: Record<VehicleStatus, { label: string; tone: string }> = {
  active: { label: 'Active', tone: 'mint' },
  maintenance: { label: 'In Service', tone: 'amber' },
  idle: { label: 'Idle', tone: 'ink' },
};

export const driverStatusMeta: Record<DriverStatus, { label: string; tone: string }> = {
  'on-duty': { label: 'On Duty', tone: 'mint' },
  'on-break': { label: 'On Break', tone: 'amber' },
  'off-duty': { label: 'Off Duty', tone: 'ink' },
};

export const jobStatusMeta: Record<JobStatus, { label: string; tone: string }> = {
  pending: { label: 'Pending', tone: 'ink' },
  'in-transit': { label: 'In Transit', tone: 'brand' },
  delivered: { label: 'Delivered', tone: 'mint' },
  delayed: { label: 'Delayed', tone: 'rose' },
  cancelled: { label: 'Cancelled', tone: 'ink' },
};

export const jobPriorityMeta: Record<JobPriority, { label: string; tone: string }> = {
  standard: { label: 'Standard', tone: 'ink' },
  high: { label: 'High', tone: 'amber' },
  urgent: { label: 'Urgent', tone: 'rose' },
};

export const viewMeta: Record<AppView, { label: string; icon: LucideIcon; description: string }> = {
  admin: {
    label: 'Admin Dashboard',
    icon: UserCircle2,
    description: 'Fleet-wide operations and live status',
  },
  driver: {
    label: 'Driver Portal',
    icon: Package,
    description: 'Active routes and delivery tasks',
  },
};

export type AppView = 'admin' | 'driver';

// ============ Helper functions (work on fetched data) ============

export function driverById(id: string | null, driverList: Driver[]): Driver | undefined {
  if (!id) return undefined;
  return driverList.find((d) => d.id === id);
}

export function vehicleById(id: string | null, vehicleList: Vehicle[]): Vehicle | undefined {
  if (!id) return undefined;
  return vehicleList.find((v) => v.id === id);
}

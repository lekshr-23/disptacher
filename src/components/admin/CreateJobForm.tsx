import { useState } from 'react';
import {
  Sparkles,
  Plus,
  X,
  MapPin,
  Clock,
  Weight,
  Package,
  Loader2,
  Cpu,
  Zap,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  vehicleTypeMeta,
  type Driver,
  type Vehicle,
  type DeliveryJob,
  type JobPriority,
} from '@/data/logistics';
import { insertDeliveryJob, nextJobReference } from '@/data/hooks';
import { Card, StatusBadge, Avatar } from '@/components/ui';

interface FormState {
  customer: string;
  origin: string;
  destination: string;
  weightKg: string;
  pickupAt: string;
  deliverBy: string;
  priority: JobPriority;
  driverId: string;
  vehicleId: string;
}

interface CreateJobFormProps {
  jobs: DeliveryJob[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

const initialForm: FormState = {
  customer: '',
  origin: 'Bayshore Depot, CA',
  destination: '',
  weightKg: '',
  pickupAt: '10:00',
  deliverBy: '14:00',
  priority: 'standard',
  driverId: '',
  vehicleId: '',
};

const priorityOptions: { value: JobPriority; label: string; tone: string }[] = [
  { value: 'standard', label: 'Standard', tone: 'ink' },
  { value: 'high', label: 'High', tone: 'amber' },
  { value: 'urgent', label: 'Urgent', tone: 'rose' },
];

type OptimizePhase = 'idle' | 'loading' | 'done';

interface Recommendation {
  driverId: string;
  vehicleId: string;
  reason: string;
  efficiencyGain: number;
  conflicts: string[];
}

function generateRecommendation(
  form: FormState,
  drivers: Driver[],
  vehicles: Vehicle[],
): Recommendation {
  const weight = parseInt(form.weightKg || '0', 10) || 0;

  const eligible = drivers
    .filter((d) => d.status !== 'off-duty')
    .filter((d) => {
      const v = d.assigned_vehicle_id ? vehicles.find((veh) => veh.id === d.assigned_vehicle_id) : null;
      if (!v) return false;
      return v.capacity_kg >= weight && v.status === 'active';
    })
    .sort((a, b) => {
      const scoreA = a.deliveries_this_week * -1 + a.hours_on_duty * 0.5;
      const scoreB = b.deliveries_this_week * -1 + b.hours_on_duty * 0.5;
      return scoreA - scoreB;
    });

  const best = eligible[0] ?? drivers[0];
  const vehicle = best.assigned_vehicle_id
    ? vehicles.find((v) => v.id === best.assigned_vehicle_id)!
    : vehicles[0];

  const reasonParts: string[] = [];
  if (best.status === 'on-duty') {
    reasonParts.push(`${best.name.split(' ')[0]} is currently on-duty near the pickup zone`);
  }
  if (vehicle.fuel_pct > 70) {
    reasonParts.push(`${vehicle.unit} has ${vehicle.fuel_pct}% fuel — no refuel stop needed`);
  }
  if (best.rating >= 4.8) {
    reasonParts.push(`top reliability rating of ${best.rating.toFixed(1)}★`);
  }
  reasonParts.push(`only ${best.hours_on_duty}h of duty used — within HOS limit`);

  const conflicts: string[] = [];
  if (form.priority === 'urgent' && best.hours_on_duty > 7) {
    conflicts.push('Driver approaching hours-of-service limit for urgent priority');
  }
  if (vehicle.status === 'maintenance') {
    conflicts.push('Recommended vehicle currently flagged for maintenance');
  }

  return {
    driverId: best.id,
    vehicleId: vehicle.id,
    reason: reasonParts.join(' · '),
    efficiencyGain: 12 + Math.round(Math.random() * 18),
    conflicts,
  };
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof MapPin;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-600">
        <Icon className="h-3.5 w-3.5 text-ink-400" />
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder-ink-300 transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

export function CreateJobForm({ jobs, drivers, vehicles }: CreateJobFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [phase, setPhase] = useState<OptimizePhase>('idle');
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [created, setCreated] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setCreated(false);
    setSubmitError(null);
  };

  const handleOptimize = () => {
    setShowModal(true);
    setPhase('loading');
    setRec(null);
    setTimeout(() => {
      const recommendation = generateRecommendation(form, drivers, vehicles);
      setRec(recommendation);
      setPhase('done');
    }, 1600);
  };

  const handleApply = () => {
    if (!rec) return;
    update({ driverId: rec.driverId, vehicleId: rec.vehicleId });
    setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer || !form.destination || !form.weightKg) return;

    setSubmitting(true);
    setSubmitError(null);

    const newJob = {
      id: `job-${Date.now()}`,
      reference: nextJobReference(jobs),
      origin: form.origin,
      destination: form.destination,
      driver_id: form.driverId || null,
      vehicle_id: form.vehicleId || null,
      status: 'pending' as const,
      priority: form.priority,
      pickup_at: form.pickupAt,
      deliver_by: form.deliverBy,
      weight_kg: parseInt(form.weightKg, 10),
      distance_km: Math.round(20 + Math.random() * 120),
      customer: form.customer,
      progress_pct: 0,
    };

    const { error } = await insertDeliveryJob(newJob);
    setSubmitting(false);

    if (error) {
      setSubmitError(error);
      return;
    }

    setCreated(true);
    setForm(initialForm);
    setTimeout(() => setCreated(false), 3000);
  };

  const isFormValid = form.customer && form.destination && form.weightKg;

  const selectedDriver = drivers.find((d) => d.id === form.driverId);
  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-bold text-ink-900">Create New Job</h3>
            <p className="text-xs text-ink-500">Schedule a delivery and let AI optimize assignment</p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Plus className="h-4.5 w-4.5" />
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <Field label="Customer" icon={Package}>
            <input
              className={inputClass}
              placeholder="e.g. Northwind Retail"
              value={form.customer}
              onChange={(e) => update({ customer: e.target.value })}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Origin" icon={MapPin}>
              <input
                className={inputClass}
                placeholder="Pickup location"
                value={form.origin}
                onChange={(e) => update({ origin: e.target.value })}
              />
            </Field>
            <Field label="Destination" icon={MapPin}>
              <input
                className={inputClass}
                placeholder="Drop-off location"
                value={form.destination}
                onChange={(e) => update({ destination: e.target.value })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Weight (kg)" icon={Weight}>
              <input
                type="number"
                className={inputClass}
                placeholder="2500"
                value={form.weightKg}
                onChange={(e) => update({ weightKg: e.target.value })}
              />
            </Field>
            <Field label="Pickup" icon={Clock}>
              <input
                type="time"
                className={inputClass}
                value={form.pickupAt}
                onChange={(e) => update({ pickupAt: e.target.value })}
              />
            </Field>
            <Field label="Deliver By" icon={Clock}>
              <input
                type="time"
                className={inputClass}
                value={form.deliverBy}
                onChange={(e) => update({ deliverBy: e.target.value })}
              />
            </Field>
            <Field label="Priority" icon={Zap}>
              <select
                className={inputClass}
                value={form.priority}
                onChange={(e) => update({ priority: e.target.value as JobPriority })}
              >
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Assign Driver" icon={Package}>
              <select
                className={inputClass}
                value={form.driverId}
                onChange={(e) => update({ driverId: e.target.value })}
              >
                <option value="">Select driver…</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Assign Vehicle" icon={MapPin}>
              <select
                className={inputClass}
                value={form.vehicleId}
                onChange={(e) => update({ vehicleId: e.target.value })}
              >
                <option value="">Select vehicle…</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.unit} · {vehicleTypeMeta[v.type].label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {submitError && (
            <div className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
              {submitError}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={handleOptimize}
              disabled={phase === 'loading'}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:shadow-brand-500/40 disabled:opacity-70"
            >
              <Sparkles className="h-4 w-4 transition-transform group-hover:scale-110" />
              AI Optimize
            </button>
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : created ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-mint-400" />
                  Job Created
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Create Job
                </>
              )}
            </button>
          </div>

          {selectedDriver && selectedVehicle && (
            <div className="flex items-center gap-2 rounded-xl bg-mint-50 px-3.5 py-2.5 text-xs font-medium text-mint-700 ring-1 ring-mint-200">
              <CheckCircle2 className="h-4 w-4" />
              {selectedDriver.name} → {selectedVehicle.unit}
            </div>
          )}
        </form>
      </Card>

      {showModal && (
        <RagModal
          phase={phase}
          rec={rec}
          form={form}
          drivers={drivers}
          vehicles={vehicles}
          onClose={() => setShowModal(false)}
          onApply={handleApply}
        />
      )}
    </>
  );
}

function RagModal({
  phase,
  rec,
  form,
  drivers,
  vehicles,
  onClose,
  onApply,
}: {
  phase: OptimizePhase;
  rec: Recommendation | null;
  form: FormState;
  drivers: Driver[];
  vehicles: Vehicle[];
  onClose: () => void;
  onApply: () => void;
}) {
  const recDriver = rec ? drivers.find((d) => d.id === rec.driverId) : undefined;
  const recVehicle = rec ? vehicles.find((v) => v.id === rec.vehicleId) : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-scale-in overflow-hidden rounded-3xl bg-white shadow-pop">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
              <Cpu className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink-900">AI Schedule Optimizer</h3>
              <p className="text-[11px] text-ink-400">RAG-powered route & driver matching</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {phase === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
                </div>
                <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">Analyzing fleet data…</p>
                <p className="mt-1 text-xs text-ink-400">
                  Querying {drivers.length} drivers · {vehicles.length} vehicles · live routes
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2">
                {[
                  'Matching capacity & weight requirements',
                  'Checking hours-of-service compliance',
                  'Calculating proximity to pickup zone',
                  'Scoring fuel efficiency & route overlap',
                ].map((step, i) => (
                  <div
                    key={step}
                    className="flex items-center gap-2 text-left text-xs text-ink-500 animate-fade-in"
                    style={{ animationDelay: `${i * 350}ms` }}
                  >
                    <Loader2 className="h-3 w-3 shrink-0 animate-spin text-brand-400" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}

          {phase === 'done' && rec && recDriver && recVehicle && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-mint-50 p-4 ring-1 ring-brand-100">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-mint-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-mint-700">
                    Recommended Assignment
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Avatar name={recDriver.name} hue={recDriver.avatar_hue} size="md" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-ink-900">{recDriver.name}</p>
                    <p className="text-xs text-ink-500">{recVehicle.unit} · {recVehicle.type}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink-300" />
                  <div className="text-right">
                    <p className="text-lg font-bold text-mint-700">+{rec.efficiencyGain}%</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400">Efficiency</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-ink-50 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  RAG Reasoning
                </p>
                <p className="text-sm leading-relaxed text-ink-700">{rec.reason}</p>
              </div>

              {rec.conflicts.length > 0 && (
                <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                    <Zap className="h-3 w-3" />
                    Flagged Conflicts
                  </p>
                  <ul className="space-y-1.5">
                    {rec.conflicts.map((c) => (
                      <li key={c} className="flex items-start gap-2 text-xs text-amber-800">
                        <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <MiniMetric label="Weight Fit" value={`${recVehicle.capacity_kg >= (parseInt(form.weightKg) || 0) ? 'OK' : 'Tight'}`} tone="mint" />
                <MiniMetric label="Fuel" value={`${recVehicle.fuel_pct}%`} tone="brand" />
                <MiniMetric label="Duty Hrs" value={`${recDriver.hours_on_duty}h`} tone="ink" />
              </div>
            </div>
          )}
        </div>

        {phase === 'done' && rec && (
          <div className="flex gap-3 border-t border-ink-100 px-5 py-4">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-600 transition-colors hover:bg-ink-100"
            >
              Dismiss
            </button>
            <button
              onClick={onApply}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Apply Recommendation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone: string }) {
  const toneClass =
    {
      mint: 'text-mint-700',
      brand: 'text-brand-700',
      ink: 'text-ink-700',
    }[tone] ?? 'text-ink-700';
  return (
    <div className="rounded-xl bg-white p-3 text-center ring-1 ring-ink-100">
      <p className={`text-sm font-bold ${toneClass}`}>{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}

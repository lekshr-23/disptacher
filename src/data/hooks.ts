import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Vehicle, Driver, DeliveryJob } from '@/data/logistics';

// ============ useDrivers ============
export function useDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrivers = useCallback(async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name');
    if (error) {
      setError(error.message);
    } else {
      setDrivers((data ?? []) as Driver[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDrivers();

    const channel = supabase
      .channel('drivers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers' },
        () => fetchDrivers(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDrivers]);

  return { drivers, loading, error, refetch: fetchDrivers };
}

// ============ useVehicles ============
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .order('unit');
    if (error) {
      setError(error.message);
    } else {
      setVehicles((data ?? []) as Vehicle[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchVehicles();

    const channel = supabase
      .channel('vehicles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        () => fetchVehicles(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchVehicles]);

  return { vehicles, loading, error, refetch: fetchVehicles };
}

// ============ useDeliveryJobs ============
export function useDeliveryJobs() {
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('delivery_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setJobs((data ?? []) as DeliveryJob[]);
      setError(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();

    const channel = supabase
      .channel('delivery-jobs-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_jobs' },
        () => fetchJobs(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchJobs]);

  return { jobs, loading, error, refetch: fetchJobs };
}

// ============ Mutations ============

export async function insertDeliveryJob(
  job: Omit<DeliveryJob, 'id' | 'created_at' | 'progress_pct'> & { progress_pct?: number },
): Promise<{ data: DeliveryJob | null; error: string | null }> {
  const { data, error } = await supabase
    .from('delivery_jobs')
    .insert({
      ...job,
      progress_pct: job.progress_pct ?? 0,
    })
    .select()
    .single();
  if (error) return { data: null, error: error.message };
  return { data: data as DeliveryJob, error: null };
}

export async function updateJobStatus(
  jobId: string,
  status: DeliveryJob['status'],
  progressPct: number,
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('delivery_jobs')
    .update({ status, progress_pct: progressPct })
    .eq('id', jobId);
  return { error: error?.message ?? null };
}

export function nextJobReference(existing: DeliveryJob[]): string {
  const maxNum = existing.reduce((max, job) => {
    const match = job.reference.match(/DLV-(\d+)/);
    if (match) return Math.max(max, parseInt(match[1], 10));
    return max;
  }, 4828);
  return `DLV-${maxNum + 1}`;
}

/*
# Create logistics schema (single-tenant, no auth)

1. New Tables
- `drivers` — driver roster (inserted first because vehicles references it)
- `vehicles` — fleet vehicles with optional driver_id FK to drivers
- `delivery_jobs` — delivery assignments with FKs to drivers and vehicles
- `drivers.assigned_vehicle_id` → vehicles (added after both tables exist)

2. Security
- RLS enabled on all three tables.
- All policies use `TO anon, authenticated` — single-tenant internal tool, no sign-in.
- Full CRUD on every table.

3. Seed Data
- 6 drivers, 6 vehicles, 8 delivery jobs (matching original dummy data).
*/

-- ======================== DRIVERS (no FK yet) ========================
CREATE TABLE IF NOT EXISTS drivers (
  id text PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'off-duty',
  phone text NOT NULL DEFAULT '',
  license_expiry date,
  rating numeric(2,1) NOT NULL DEFAULT 5.0,
  deliveries_this_week integer NOT NULL DEFAULT 0,
  hours_on_duty numeric(4,2) NOT NULL DEFAULT 0,
  avatar_hue integer NOT NULL DEFAULT 210,
  assigned_vehicle_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_drivers" ON drivers;
CREATE POLICY "anon_select_drivers" ON drivers FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_drivers" ON drivers;
CREATE POLICY "anon_insert_drivers" ON drivers FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_drivers" ON drivers;
CREATE POLICY "anon_update_drivers" ON drivers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_drivers" ON drivers;
CREATE POLICY "anon_delete_drivers" ON drivers FOR DELETE
  TO anon, authenticated USING (true);

-- ======================== VEHICLES (FK to drivers) ========================
CREATE TABLE IF NOT EXISTS vehicles (
  id text PRIMARY KEY,
  unit text NOT NULL,
  type text NOT NULL DEFAULT 'box',
  status text NOT NULL DEFAULT 'idle',
  capacity_kg integer NOT NULL DEFAULT 0,
  driver_id text REFERENCES drivers(id) ON DELETE SET NULL,
  location text NOT NULL DEFAULT '',
  odometer_km integer NOT NULL DEFAULT 0,
  fuel_pct integer NOT NULL DEFAULT 100,
  last_service date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vehicles" ON vehicles;
CREATE POLICY "anon_select_vehicles" ON vehicles FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_vehicles" ON vehicles;
CREATE POLICY "anon_insert_vehicles" ON vehicles FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_vehicles" ON vehicles;
CREATE POLICY "anon_update_vehicles" ON vehicles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_vehicles" ON vehicles;
CREATE POLICY "anon_delete_vehicles" ON vehicles FOR DELETE
  TO anon, authenticated USING (true);

-- ======================== DRIVERS.assigned_vehicle_id FK (added after vehicles exists) ========================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'drivers_assigned_vehicle_id_fkey' AND table_name = 'drivers'
  ) THEN
    ALTER TABLE drivers
      ADD CONSTRAINT drivers_assigned_vehicle_id_fkey
      FOREIGN KEY (assigned_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ======================== DELIVERY_JOBS ========================
CREATE TABLE IF NOT EXISTS delivery_jobs (
  id text PRIMARY KEY,
  reference text NOT NULL,
  origin text NOT NULL DEFAULT '',
  destination text NOT NULL DEFAULT '',
  driver_id text REFERENCES drivers(id) ON DELETE SET NULL,
  vehicle_id text REFERENCES vehicles(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'standard',
  pickup_at text NOT NULL DEFAULT '',
  deliver_by text NOT NULL DEFAULT '',
  weight_kg integer NOT NULL DEFAULT 0,
  distance_km integer NOT NULL DEFAULT 0,
  customer text NOT NULL DEFAULT '',
  progress_pct integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE delivery_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_delivery_jobs" ON delivery_jobs;
CREATE POLICY "anon_select_delivery_jobs" ON delivery_jobs FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_delivery_jobs" ON delivery_jobs;
CREATE POLICY "anon_insert_delivery_jobs" ON delivery_jobs FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_delivery_jobs" ON delivery_jobs;
CREATE POLICY "anon_update_delivery_jobs" ON delivery_jobs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_delivery_jobs" ON delivery_jobs;
CREATE POLICY "anon_delete_delivery_jobs" ON delivery_jobs FOR DELETE
  TO anon, authenticated USING (true);

-- ======================== INDEXES ========================
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_driver_id ON delivery_jobs(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_jobs_status ON delivery_jobs(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);

-- ======================== SEED: DRIVERS (assigned_vehicle_id set to NULL first, updated after vehicles) ========================
INSERT INTO drivers (id, name, status, phone, license_expiry, rating, deliveries_this_week, hours_on_duty, avatar_hue, assigned_vehicle_id) VALUES
  ('drv-01', 'Marcus Reyes', 'on-duty', '+1 (415) 555-0142', '2027-03-11', 4.9, 18, 6.50, 210, NULL),
  ('drv-02', 'Priya Nair', 'on-duty', '+1 (415) 555-0188', '2026-11-02', 4.8, 21, 8.00, 340, NULL),
  ('drv-03', 'Tomás Vidal', 'on-break', '+1 (415) 555-0203', '2028-01-20', 4.7, 14, 4.25, 150, NULL),
  ('drv-04', 'Hannah Brooks', 'off-duty', '+1 (415) 555-0099', '2026-08-30', 4.9, 9, 0.00, 280, NULL),
  ('drv-05', 'Daniel Okafor', 'on-duty', '+1 (415) 555-0317', '2027-09-14', 4.6, 16, 7.50, 30, NULL),
  ('drv-06', 'Yuki Tanaka', 'on-break', '+1 (415) 555-0271', '2026-12-08', 5.0, 12, 3.50, 190, NULL)
ON CONFLICT (id) DO NOTHING;

-- ======================== SEED: VEHICLES ========================
INSERT INTO vehicles (id, unit, type, status, capacity_kg, driver_id, location, odometer_km, fuel_pct, last_service) VALUES
  ('veh-01', 'TRK-104', 'box', 'active', 7200, 'drv-01', 'I-580 E, Hayward CA', 142003, 78, '2026-07-12'),
  ('veh-02', 'TRK-108', 'refrigerated', 'active', 9500, 'drv-02', 'Downtown Oakland, CA', 89421, 62, '2026-06-28'),
  ('veh-03', 'TRK-112', 'flatbed', 'maintenance', 12000, 'drv-03', 'Bayshore Depot, CA', 211540, 40, '2026-08-01'),
  ('veh-04', 'VAN-207', 'sprinter', 'active', 1500, 'drv-05', 'US-101 N, South SF', 56780, 88, '2026-07-22'),
  ('veh-05', 'VAN-209', 'sprinter', 'idle', 1500, 'drv-06', 'Bayshore Depot, CA', 61200, 55, '2026-06-15'),
  ('veh-06', 'TRK-115', 'box', 'idle', 7200, NULL, 'Bayshore Depot, CA', 178900, 100, '2026-07-30')
ON CONFLICT (id) DO NOTHING;

-- ======================== UPDATE DRIVERS assigned_vehicle_id ========================
UPDATE drivers SET assigned_vehicle_id = 'veh-01' WHERE id = 'drv-01' AND assigned_vehicle_id IS NULL;
UPDATE drivers SET assigned_vehicle_id = 'veh-02' WHERE id = 'drv-02' AND assigned_vehicle_id IS NULL;
UPDATE drivers SET assigned_vehicle_id = 'veh-03' WHERE id = 'drv-03' AND assigned_vehicle_id IS NULL;
UPDATE drivers SET assigned_vehicle_id = 'veh-04' WHERE id = 'drv-05' AND assigned_vehicle_id IS NULL;
UPDATE drivers SET assigned_vehicle_id = 'veh-05' WHERE id = 'drv-06' AND assigned_vehicle_id IS NULL;

-- ======================== SEED: DELIVERY_JOBS ========================
INSERT INTO delivery_jobs (id, reference, origin, destination, driver_id, vehicle_id, status, priority, pickup_at, deliver_by, weight_kg, distance_km, customer, progress_pct) VALUES
  ('job-01', 'DLV-4821', 'Oakland Fulfillment Center', 'Sacramento Distribution Hub', 'drv-01', 'veh-01', 'in-transit', 'high', '08:15', '12:30', 4200, 138, 'Northwind Retail', 64),
  ('job-02', 'DLV-4822', 'Oakland Cold Storage', 'Trader''s Market, Berkeley', 'drv-02', 'veh-02', 'in-transit', 'urgent', '07:45', '10:00', 1800, 14, 'Trader''s Market', 82),
  ('job-03', 'DLV-4823', 'Bayshore Depot', 'Fremont Industrial Park', 'drv-05', 'veh-04', 'in-transit', 'standard', '09:30', '11:45', 850, 42, 'Apex Electronics', 38),
  ('job-04', 'DLV-4824', 'Richmond Rail Yard', 'Stockton Warehouse Co.', 'drv-03', 'veh-03', 'delayed', 'high', '06:00', '14:00', 9800, 112, 'Stockton Warehouse Co.', 22),
  ('job-05', 'DLV-4825', 'Oakland Fulfillment Center', 'Palo Alto Tech Park', 'drv-06', 'veh-05', 'pending', 'standard', '13:00', '15:30', 620, 58, 'Lumen Software', 0),
  ('job-06', 'DLV-4826', 'Hayward Medical Supply', 'UCSF Medical Center', 'drv-01', 'veh-01', 'delivered', 'urgent', '06:30', '09:00', 340, 27, 'UCSF Medical Center', 100),
  ('job-07', 'DLV-4827', 'Bayshore Depot', 'San Jose Logistics Plaza', NULL, 'veh-06', 'pending', 'standard', '14:30', '17:00', 3100, 78, 'Vertex Distribution', 0),
  ('job-08', 'DLV-4828', 'Oakland Fulfillment Center', 'Concord Retail Group', 'drv-02', 'veh-02', 'delivered', 'standard', '05:45', '08:15', 2400, 36, 'Concord Retail Group', 100)
ON CONFLICT (id) DO NOTHING;

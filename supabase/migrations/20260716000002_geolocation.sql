-- Add geolocation to timesheets
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS lat DECIMAL(10, 8);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS lng DECIMAL(11, 8);
ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;

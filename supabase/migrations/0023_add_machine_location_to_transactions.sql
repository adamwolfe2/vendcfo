-- Add machine and location FK to transactions (optional -- old data stays unlinked)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS machine_id UUID REFERENCES machines(id);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES locations(id);

-- Indexes for machine/location queries
CREATE INDEX IF NOT EXISTS idx_transactions_machine_id ON transactions(machine_id) WHERE machine_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transactions_location_id ON transactions(location_id) WHERE location_id IS NOT NULL;

ALTER TABLE appointments ALTER COLUMN appointment_date DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN appointment_time DROP NOT NULL;

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE;

UPDATE appointments SET privacy_consent = TRUE WHERE privacy_consent IS NULL;

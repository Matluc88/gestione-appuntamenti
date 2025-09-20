
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS cancelled_by VARCHAR(20);

UPDATE appointments 
SET cancelled_by = 'admin' 
WHERE status = 'cancelled' AND cancelled_by IS NULL;

ALTER TABLE bookings ADD COLUMN equipment_status ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none';
ALTER TABLE bookings ADD COLUMN equipment_reject_reason TEXT NULL;
ALTER TABLE bookings ADD COLUMN equipment_approved_by INT NULL;

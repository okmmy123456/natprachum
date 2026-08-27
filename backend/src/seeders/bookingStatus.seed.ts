import { BookingStatus } from '../models';

const statuses = [
  { status_name: 'Pending', status_code: 'pending', color: '#F59E0B', sort_order: 1 },
  { status_name: 'Approved', status_code: 'approved', color: '#10B981', sort_order: 2 },
  { status_name: 'Rejected', status_code: 'rejected', color: '#EF4444', sort_order: 3 },
  { status_name: 'Cancelled', status_code: 'cancelled', color: '#6B7280', sort_order: 4 },
  { status_name: 'Completed', status_code: 'completed', color: '#3B82F6', sort_order: 5 },
];

export const seedBookingStatuses = async () => {
  for (const status of statuses) {
    await BookingStatus.findOrCreate({
      where: { status_code: status.status_code },
      defaults: status,
    });
  }
  console.log('  📊 Booking statuses seeded');
};

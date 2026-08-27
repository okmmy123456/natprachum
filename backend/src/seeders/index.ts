import { seedRoles } from './roles.seed';
import { seedPermissions } from './permissions.seed';
import { seedBookingStatuses } from './bookingStatus.seed';
import { seedEquipments } from './equipments.seed';
import { seedSuperAdmin } from './superadmin.seed';

export const runSeeders = async () => {
  try {
    await seedRoles();
    await seedPermissions();
    await seedBookingStatuses();
    await seedEquipments();
    await seedSuperAdmin();
  } catch (error) {
    console.error('Seeder error:', error);
  }
};

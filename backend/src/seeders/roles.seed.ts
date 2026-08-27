import { Role } from '../models';

const roles = [
  { role_name: 'Super Admin', role_code: 'SuperAdmin', description: 'Full system access' },
  { role_name: 'Admin', role_code: 'Admin', description: 'Administrative access' },
  { role_name: 'Manager', role_code: 'Manager', description: 'Department manager - approve food orders' },
  { role_name: 'Room Owner', role_code: 'RoomOwner', description: 'Manage owned rooms and approve bookings' },
  { role_name: 'Normal User', role_code: 'NormalUser', description: 'Standard user access' },
  { role_name: 'Guest', role_code: 'Guest', description: 'Guest booking access only' },
];

export const seedRoles = async () => {
  for (const role of roles) {
    await Role.findOrCreate({
      where: { role_code: role.role_code },
      defaults: role,
    });
  }
  console.log('  📋 Roles seeded');
};

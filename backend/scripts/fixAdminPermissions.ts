import dotenv from 'dotenv';
dotenv.config();

import { Role, Permission, RolePermission } from '../src/models';

async function fixPermissions() {
  try {
    const adminRole = await Role.findOne({ where: { role_code: 'Admin' } });
    if (!adminRole) {
      console.log('Admin role not found');
      process.exit(0);
    }

    const permsToRemove = await Permission.findAll({
      where: { permission_code: ['rooms.create', 'rooms.delete'] }
    });

    if (permsToRemove.length > 0) {
      await RolePermission.destroy({
        where: {
          role_id: adminRole.id,
          permission_id: permsToRemove.map(p => p.id)
        }
      });
      console.log('Successfully removed rooms.create and rooms.delete from Admin role.');
    } else {
      console.log('Permissions not found, maybe already removed.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error fixing permissions:', error);
    process.exit(1);
  }
}

fixPermissions();

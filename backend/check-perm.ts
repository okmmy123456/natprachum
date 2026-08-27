import sequelize from './src/config/database';
import { Permission, RolePermission, Role } from './src/models';

async function check() {
  try {
    await sequelize.authenticate();
    const perm = await Permission.findOne({ where: { permission_code: 'rooms.create' } });
    console.log('Permission rooms.create:', perm?.toJSON());
    
    if (perm) {
      const role = await Role.findOne({ where: { role_code: 'Admin' } });
      console.log('Role Admin:', role?.toJSON());
      
      if (role) {
        const rp = await RolePermission.findOne({ where: { role_id: role.id, permission_id: perm.id } });
        console.log('RolePermission:', rp?.toJSON());
        
        if (!rp) {
          console.log('Creating RolePermission...');
          await RolePermission.create({ role_id: role.id, permission_id: perm.id } as any);
          console.log('Created!');
        }
      }
    } else {
      console.log('Permission rooms.create does not exist in the database!');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();

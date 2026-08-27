import sequelize from './src/config/database';
import { User, Role, RolePermission, Permission } from './src/models';

async function test() {
  try {
    await sequelize.authenticate();
    
    // Get user hr01
    const user = await User.findOne({ 
      where: { username: 'hr01' },
      include: [{ model: Role, as: 'Role' }]
    });
    
    if (!user) {
      console.log('User hr01 not found');
      return;
    }
    
    console.log(`User: ${user.username}, Role: ${(user as any).Role?.role_name}`);
    
    // Get permissions for this role
    const rolePerms = await RolePermission.findAll({
      where: { role_id: user.role_id },
      include: [{ model: Permission, as: 'Permission' }]
    });
    
    const perms = rolePerms.map((rp: any) => rp.Permission?.permission_code);
    console.log('Permissions:');
    console.log(perms);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();

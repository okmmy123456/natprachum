import sequelize from './src/config/database';
import { RolePermission } from './src/models';

async function fix() {
  try {
    await sequelize.authenticate();
    
    // Find all soft-deleted role permissions
    const softDeleted = await RolePermission.findAll({
      where: {},
      paranoid: false,
    });
    
    for (const rp of softDeleted) {
      if ((rp as any).deleted_at !== null) {
        console.log(`Restoring role_permission id ${rp.id}`);
        await rp.restore();
      }
    }
    console.log('Done restoring!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();

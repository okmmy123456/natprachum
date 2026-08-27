import sequelize from './src/config/database';
import { seedPermissions } from './src/seeders/permissions.seed';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Seeding permissions...');
    await seedPermissions();
    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

import dotenv from 'dotenv';
dotenv.config();

import { sequelize, FoodOrder, FoodOrderDiner } from './models';
import { runSeeders } from './seeders';

const syncDb = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection OK');

    // Only sync new models (creates tables if not exist)
    await FoodOrder.sync({ force: false });
    console.log('✅ food_orders table synced');

    await FoodOrderDiner.sync({ force: false });
    console.log('✅ food_order_diners table synced');

    // Run seeders for new roles/permissions
    await runSeeders();
    console.log('✅ Seeders completed');

    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
};

syncDb();

import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { sequelize } from './models';
import { runSeeders } from './seeders';
import { setupCronJobs } from './cron/logCleanup';

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models (creates tables if they don't exist)
    await sequelize.sync({ alter: false });
    console.log('✅ All models synchronized.');

    // Run seeders
    await runSeeders();
    console.log('✅ Seeders completed.');

    // Start cron jobs
    setupCronJobs();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 NatPrachum TCI API Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5012'}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

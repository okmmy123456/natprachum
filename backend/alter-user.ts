import sequelize from './src/config/database';

async function run() {
  try {
    await sequelize.query('ALTER TABLE users ADD COLUMN site VARCHAR(255) NULL');
    console.log('Added site to users');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();

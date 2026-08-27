import sequelize from './src/config/database';

async function migrate() {
  try {
    await sequelize.query('ALTER TABLE bookings ADD COLUMN guest_company_id INT;');
    console.log('Added guest_company_id');
  } catch(e) { console.log('guest_company_id likely already exists or error:', e.message); }
  
  try {
    await sequelize.query('ALTER TABLE bookings ADD COLUMN guest_department_code VARCHAR(255);');
    console.log('Added guest_department_code');
  } catch(e) { console.log('guest_department_code likely already exists or error:', e.message); }

  try {
    await sequelize.query('ALTER TABLE bookings ADD COLUMN guest_department_name VARCHAR(255);');
    console.log('Added guest_department_name');
  } catch(e) { console.log('guest_department_name likely already exists or error:', e.message); }

  process.exit(0);
}

migrate();

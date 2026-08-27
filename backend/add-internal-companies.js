const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'backend/.env' });

async function addColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'non',
    password: process.env.DB_PASSWORD || 'a0859210577',
    database: process.env.DB_NAME || 'NatPrachum'
  });

  try {
    await connection.query('ALTER TABLE food_orders ADD COLUMN internal_companies TEXT NULL AFTER company_name;');
    console.log('Successfully added internal_companies to food_orders table.');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column internal_companies already exists.');
    } else {
      console.error('Error adding column:', error);
    }
  } finally {
    await connection.end();
  }
}

addColumn();

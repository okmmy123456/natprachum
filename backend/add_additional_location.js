const fs = require('fs');
require('ts-node/register');
const { sequelize } = require('./src/models');

async function run() {
  try {
    await sequelize.authenticate();
    await sequelize.query('ALTER TABLE meeting_rooms ADD COLUMN additional_location TEXT;');
    console.log('Column added successfully.');
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists.');
    } else {
      console.error('Error adding column:', error);
    }
  } finally {
    await sequelize.close();
  }
}

run();

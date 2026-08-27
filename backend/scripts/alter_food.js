const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', { host: 'localhost', dialect: 'mysql' });

async function run() {
  try {
    await sequelize.query(`
      ALTER TABLE food_orders 
      ADD COLUMN food_edit_details TEXT;
    `);
    console.log('Columns added successfully');
  } catch (error) {
    if (error.original && error.original.code === 'ER_DUP_FIELDNAME') {
      console.log('Columns already exist');
    } else {
      console.error(error);
    }
  } finally {
    process.exit(0);
  }
}

run();

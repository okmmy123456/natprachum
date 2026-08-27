require('ts-node').register();
const sequelize = require('../backend/src/config/database').default;

async function migrate() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    await queryInterface.addColumn('meeting_rooms', 'payment_creator_type', {
      type: require('sequelize').DataTypes.STRING,
      defaultValue: 'approver',
      allowNull: false
    });
    console.log('Successfully added payment_creator_type to meeting_rooms');
    process.exit(0);
  } catch (err) {
    if (err.message && err.message.includes('Duplicate column name')) {
      console.log('Column already exists, skipping.');
      process.exit(0);
    }
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

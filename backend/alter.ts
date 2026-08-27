import { sequelize } from './src/models';

const alterDb = async () => {
  try {
    await sequelize.query('ALTER TABLE bookings ADD COLUMN edit_notes TEXT;');
    console.log('Column added');
  } catch (err) {
    console.log('Error adding column:', err);
  } finally {
    process.exit();
  }
};

alterDb();

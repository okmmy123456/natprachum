const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize('nat_prachum', 'non', 'a0859210577', {
  host: '127.0.0.1',
  dialect: 'mysql',
  logging: false,
});

async function run() {
  try {
    const [results] = await sequelize.query(`
      SELECT b.id, b.booking_name, b.guest_email, f.id as food_order_id 
      FROM Bookings b 
      LEFT JOIN FoodOrders f ON b.id = f.booking_id
      WHERE b.guest_email IS NOT NULL AND b.guest_email != ''
      ORDER BY b.id DESC LIMIT 10
    `);
    console.log(results);
  } catch (err) {
    console.error(err);
  } finally {
    await sequelize.close();
  }
}

run();

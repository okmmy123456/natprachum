const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', { host: 'localhost', dialect: 'mysql', port: 3306, logging: false });

sequelize.query("SELECT b.id, b.booking_no, b.booking_date, b.deleted_at, f.breakfast_items, f.lunch_items, f.afternoon_items, f.deleted_at as food_deleted_at FROM bookings b LEFT JOIN food_orders f ON b.id = f.booking_id WHERE b.booking_no = 'BK-20260723-A852'").then(res => {
  console.log(JSON.stringify(res[0], null, 2));
  process.exit(0);
});

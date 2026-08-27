const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', { host: 'localhost', dialect: 'mysql', port: 3306, logging: false });

sequelize.query('SELECT f.id, f.customer_company, b.booking_date, b.deleted_at FROM food_orders f LEFT JOIN bookings b ON f.booking_id = b.id WHERE f.customer_company IS NOT NULL').then(res => {
  console.log(JSON.stringify(res[0], null, 2));
  process.exit(0);
});

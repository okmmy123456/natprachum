const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', { host: 'localhost', dialect: 'mysql', port: 3306, logging: false });

sequelize.query('SELECT id, customer_company, company_name FROM food_orders').then(res => {
  console.log(JSON.stringify(res[0], null, 2));
  process.exit(0);
});

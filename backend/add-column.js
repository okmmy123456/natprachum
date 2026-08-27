const { Sequelize } = require('sequelize'); 
const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', { host: 'localhost', dialect: 'mysql' }); 
sequelize.query('ALTER TABLE users ADD COLUMN position VARCHAR(100) AFTER department_name;')
  .then(() => { console.log('Column added'); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });

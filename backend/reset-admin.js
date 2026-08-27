const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', { 
  host: 'localhost', 
  dialect: 'mysql' 
});

async function resetPassword() {
  try {
    const hash = await bcrypt.hash('Admin@123456', 12);
    await sequelize.query(`UPDATE users SET password_hash = '${hash}' WHERE username = 'admin'`);
    console.log('Password reset successfully to Admin@123456');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

resetPassword();

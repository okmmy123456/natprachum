const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('NatPrachum', 'non', 'a0859210577', { host: 'localhost', port: 3306, dialect: 'mysql' });

sequelize.query("SELECT b.booking_no, u.id, u.first_name, u.mobile_phone, u.office_phone FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.booking_no = 'BK-20260810-6ED0'")
  .then(res => {
    console.log(res[0]);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

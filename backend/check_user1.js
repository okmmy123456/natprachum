const axios = require('axios');
const jwt = require('jsonwebtoken');

// Assuming JWT_SECRET is default or known. 
// Let's just create a node script that connects to DB and checks what BookingService.getAll returns for user1.
const { Sequelize, DataTypes, Op } = require('sequelize');

const sequelize = new Sequelize('natprachum', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
});

async function run() {
  try {
    const [users] = await sequelize.query("SELECT * FROM Users WHERE username IN ('user1', 'hr02')");
    console.log("Users:", users.map(u => ({ id: u.id, username: u.username, role_id: u.role_id })));
    
    const user1 = users.find(u => u.username === 'user1');
    const hr02 = users.find(u => u.username === 'hr02');

    const [bookings1] = await sequelize.query("SELECT id, booking_name, user_id FROM Bookings WHERE user_id = " + user1.id);
    const [bookings2] = await sequelize.query("SELECT id, booking_name, user_id FROM Bookings WHERE user_id = " + hr02.id);
    
    console.log("user1 bookings:", bookings1);
    console.log("hr02 bookings:", bookings2);
  } catch (err) {
    console.error(err);
  } finally {
    sequelize.close();
  }
}
run();

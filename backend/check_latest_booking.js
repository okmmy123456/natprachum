require('ts-node').register();
const { Booking, User, Department } = require('../backend/src/models');

async function test() {
  const b = await Booking.findAll({
    include: [{
      model: User, as: 'User',
      include: [{ model: Department, as: 'Department' }]
    }],
    order: [['id', 'DESC']],
    limit: 1
  });
  console.log(JSON.stringify(b, null, 2));
}
test();

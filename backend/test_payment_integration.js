require('ts-node').register();
const { FoodOrder, User, Booking } = require('../backend/src/models');
const { FoodOrderService } = require('../backend/src/services/foodorder.service');

async function test() {
  const pendingOrder = await FoodOrder.findOne({
    where: { food_status: 'pending' },
    include: [{ model: Booking, as: 'Booking' }]
  });

  if (!pendingOrder) {
    console.log('No pending food order found to test.');
    process.exit(0);
  }

  console.log('Found pending order ID:', pendingOrder.id);
  
  // Find an admin user (e.g. user ID 4 which is hr01/admin)
  const adminId = 4;
  
  console.log('Approving food order using Admin ID 4...');
  await FoodOrderService.approve(pendingOrder.id, adminId);
  console.log('Approval successful!');
  process.exit(0);
}

test().catch(console.error);

require('ts-node').register();
const { DashboardService } = require('./src/services/dashboard.service');

async function run() {
  try {
    const res = await DashboardService.getAnalytics({});
    console.log('SUCCESS');
    console.log('Popular:', res.popularMenus);
    console.log('Customer Visits:', res.customerCompanyVisits);
  } catch(e) {
    console.error('ERROR', e);
  }
  process.exit(0);
}
run();

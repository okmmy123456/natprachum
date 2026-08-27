require('ts-node').register();
const { DashboardService } = require('../backend/src/services/dashboard.service');

DashboardService.getAnalytics({}).then(res => {
  console.log(JSON.stringify(res.departmentUsage, null, 2));
}).catch(console.error);

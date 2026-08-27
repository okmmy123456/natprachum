const bcrypt = require('bcryptjs'); // or bcrypt
async function run() {
  const hash = '$2b$12$1jzK36czXirT582b.6Fqdu0Nxn3B0VS6vz7tCvysPXO54XY7SgBWy';
  const match = await bcrypt.compare('Aa123456', hash);
  console.log('Match?', match);
}
run();

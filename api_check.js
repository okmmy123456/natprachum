const jwt = require('jsonwebtoken');
const { jwtConfig } = require('./backend/dist/config/jwt');
const axios = require('axios');

async function run() {
  const email = 'jakraphan.t@thongchaiindustries.co.th';
  const token = jwt.sign(
    { email, role_name: 'HistoryViewer' },
    jwtConfig.secret,
    { expiresIn: '2h' }
  );

  try {
    const res = await axios.get('http://localhost:5013/api/history/bookings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Response data:", res.data.data.length);
  } catch(e) {
    console.error("Error:", e.response ? e.response.data : e.message);
  }
}
run();

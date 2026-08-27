const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({host:'localhost',user:'non',password:'a0859210577',database:'NatPrachum'});
  const [rows] = await c.execute('SELECT qr_code_url FROM rooms');
  console.log(rows);
  c.end();
}
run();

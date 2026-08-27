const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({host:'localhost',user:'non',password:'a0859210577',database:'NatPrachum'});
  const [rows] = await c.execute('SELECT username, password_hash, is_active, deleted_at FROM users WHERE username = ?', ['hr01']);
  console.log(rows);
  c.end();
}
run();

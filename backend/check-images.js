const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({host:'localhost',user:'non',password:'a0859210577',database:'NatPrachum'});
  const [rows] = await c.execute('SELECT image_url FROM room_images LIMIT 1');
  console.log(rows);
  c.end();
}
run();

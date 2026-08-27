const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'non',
    password: 'a0859210577',
    database: 'NatPrachum'
  });

  const [rows] = await connection.execute("SELECT b.booking_no, u.id, u.first_name, u.mobile_phone, u.office_phone FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.booking_no = 'BK-20260810-6ED0'");
  console.log(rows);
  await connection.end();
}

main().catch(console.error);

const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'non',
  password: 'a0859210577',
  database: 'NatPrachum'
});

connection.query(
  'ALTER TABLE users ADD COLUMN position VARCHAR(255) NULL AFTER department_name;',
  function(err, results, fields) {
    if (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('Column position already exists');
      } else {
        console.error('Error adding column:', err);
      }
    } else {
      console.log('Successfully added position column');
    }
    connection.end();
  }
);

const mysql = require('mysql2/promise');

async function checkUser() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'pixelplanet',
      password: 'pixelplanet123',
      database: 'pixelplanet',
    });

    console.log('Database\'e bağlanıldı...');

    const [users] = await connection.query(
      'SELECT id, name, roles FROM Users WHERE id = 4'
    );
    
    if (users.length > 0) {
      console.log('Kullanıcı bilgisi:', users[0]);
      console.log('roles değeri:', users[0].roles);
      console.log('roles & 1 (mod kontrolü):', users[0].roles & 1);
    } else {
      console.log('Kullanıcı bulunamadı');
    }

    await connection.end();
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

checkUser();


const mysql = require('mysql2/promise');

async function setAdmin() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'pixelplanet',
      password: 'pixelplanet123',
      database: 'pixelplanet',
    });

    console.log('Database\'e bağlanıldı...');

    // ID 4'e admin yetkisi ver (roles = 1)
    const [result] = await connection.query(
      'UPDATE Users SET roles = 1 WHERE id = 4'
    );

    if (result.affectedRows > 0) {
      console.log('Kullanıcı ID 4\'e admin yetkisi verildi!');
      
      // Kontrol et
      const [users] = await connection.query(
        'SELECT id, name, roles FROM Users WHERE id = 4'
      );
      console.log('Kullanıcı bilgisi:', users[0]);
    } else {
      console.log('Kullanıcı ID 4 bulunamadı. Önce bir kullanıcı oluşturmanız gerekebilir.');
    }

    await connection.end();
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

setAdmin();


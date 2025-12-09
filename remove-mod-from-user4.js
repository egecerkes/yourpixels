const mysql = require('mysql2/promise');

async function removeMod() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'pixelplanet',
      password: 'pixelplanet123',
      database: 'pixelplanet',
    });

    console.log('Database\'e bağlanıldı...');

    // roles'u 0 yap (mod değil, admin ADMIN_IDS'den gelecek)
    await connection.query(
      'UPDATE Users SET roles = 0 WHERE id = 4'
    );

    console.log('User ID 4\'ün mod yetkisi kaldırıldı. Admin yetkisi ADMIN_IDS\'den gelecek.');

    // Kontrol et
    const [users] = await connection.query(
      'SELECT id, name, roles FROM Users WHERE id = 4'
    );
    
    if (users.length > 0) {
      console.log('Güncel kullanıcı bilgisi:', users[0]);
    }

    await connection.end();
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

removeMod();


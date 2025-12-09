const mysql = require('mysql2/promise');

async function setupDatabase() {
  let connection;
  try {
    // Root kullanıcısı ile bağlan
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '3131',
      multipleStatements: true,
    });
    console.log('MySQL\'e root kullanıcısı ile bağlanıldı...');

    console.log('MySQL\'e bağlanıldı...');

    // Önce mevcut kullanıcıyı sil (varsa)
    try {
      await connection.query(`DROP USER IF EXISTS 'pixelplanet'@'localhost'`);
      await connection.query(`DROP USER IF EXISTS 'pixelplanet'@'%'`);
    } catch (e) {
      // Ignore
    }

    // Database ve kullanıcı oluştur
    await connection.query(`
      CREATE DATABASE IF NOT EXISTS pixelplanet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);
    
    await connection.query(`
      CREATE USER 'pixelplanet'@'localhost' IDENTIFIED BY 'pixelplanet123';
      CREATE USER 'pixelplanet'@'%' IDENTIFIED BY 'pixelplanet123';
    `);
    
    await connection.query(`
      GRANT ALL PRIVILEGES ON pixelplanet.* TO 'pixelplanet'@'localhost';
      GRANT ALL PRIVILEGES ON pixelplanet.* TO 'pixelplanet'@'%';
    `);
    
    await connection.query(`FLUSH PRIVILEGES;`);

    console.log('Database ve kullanıcı başarıyla oluşturuldu!');

    // Kısa bir bekleme
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test bağlantısı
    await connection.end();
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'pixelplanet',
      password: 'pixelplanet123',
      database: 'pixelplanet',
    });

    console.log('Test bağlantısı başarılı!');
    await connection.end();
    console.log('Kurulum tamamlandı!');
  } catch (error) {
    console.error('Hata:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\nRoot şifresi yanlış olabilir. Docker container\'ınızda root şifresini kontrol edin.');
      console.error('Veya manuel olarak MySQL\'e bağlanıp setup-mysql.sql dosyasını çalıştırın.');
    }
    process.exit(1);
  }
}

setupDatabase();


const mysql = require('mysql2/promise');

async function addVIPColumn() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'pixelplanet',
      password: 'pixelplanet123',
      database: 'pixelplanet',
    });

    console.log('Database\'e bağlanıldı...');

    // VIP kolonunu ekle (eğer yoksa)
    try {
      await connection.query(`
        ALTER TABLE Users ADD COLUMN vip BOOLEAN DEFAULT FALSE NOT NULL
      `);
      console.log('VIP kolonu eklendi!');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('VIP kolonu zaten mevcut.');
      } else {
        throw error;
      }
    }

    await connection.end();
    console.log('İşlem tamamlandı!');
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

addVIPColumn();


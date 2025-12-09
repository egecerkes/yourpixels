const mysql = require('mysql2/promise');

async function resetDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'pixelplanet',
      password: 'pixelplanet123',
      database: 'pixelplanet',
      multipleStatements: true,
    });

    console.log('Database\'e bağlanıldı...');

    // Tüm tabloları sil
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    if (tableNames.length > 0) {
      console.log(`Bulunan tablolar: ${tableNames.join(', ')}`);
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const tableName of tableNames) {
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`Tablo silindi: ${tableName}`);
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('Tüm tablolar silindi!');
    } else {
      console.log('Silinecek tablo yok.');
    }

    await connection.end();
    console.log('Database sıfırlandı. Oyunu yeniden başlattığınızda tablolar otomatik oluşturulacak.');
  } catch (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }
}

resetDatabase();


# MySQL Kullanıcı ve Database Kurulumu

MySQL'de `pixelplanet` kullanıcısı ve database'i oluşturmak için aşağıdaki adımları izleyin:

## Docker Container Kullanıyorsanız:

1. Container'a root kullanıcısı ile bağlanın:
   ```powershell
   docker exec -it pixelplanet-mysql mysql -u root -prootpassword
   ```

2. Aşağıdaki SQL komutlarını çalıştırın:
   ```sql
   CREATE DATABASE IF NOT EXISTS pixelplanet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER IF NOT EXISTS 'pixelplanet'@'localhost' IDENTIFIED BY 'pixelplanet123';
   CREATE USER IF NOT EXISTS 'pixelplanet'@'%' IDENTIFIED BY 'pixelplanet123';
   GRANT ALL PRIVILEGES ON pixelplanet.* TO 'pixelplanet'@'localhost';
   GRANT ALL PRIVILEGES ON pixelplanet.* TO 'pixelplanet'@'%';
   FLUSH PRIVILEGES;
   ```

   Veya `setup-mysql.sql` dosyasını kullanın:
   ```powershell
   docker exec -i pixelplanet-mysql mysql -u root -prootpassword < setup-mysql.sql
   ```

## Manuel MySQL Kurulumu Kullanıyorsanız:

1. MySQL'e root kullanıcısı ile bağlanın
2. `setup-mysql.sql` dosyasındaki komutları çalıştırın

## Kontrol:

Kullanıcının oluşturulduğunu kontrol edin:
```powershell
docker exec -it pixelplanet-mysql mysql -u pixelplanet -ppixelplanet123 pixelplanet -e "SHOW TABLES;"
```


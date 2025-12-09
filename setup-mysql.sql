-- MySQL kullanıcısı ve database oluşturma scripti
-- Root kullanıcısı ile çalıştırın

CREATE DATABASE IF NOT EXISTS pixelplanet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'pixelplanet'@'localhost' IDENTIFIED BY 'pixelplanet123';
CREATE USER IF NOT EXISTS 'pixelplanet'@'%' IDENTIFIED BY 'pixelplanet123';

GRANT ALL PRIVILEGES ON pixelplanet.* TO 'pixelplanet'@'localhost';
GRANT ALL PRIVILEGES ON pixelplanet.* TO 'pixelplanet'@'%';

FLUSH PRIVILEGES;


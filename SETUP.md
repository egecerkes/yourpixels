# PixelPlanet Kurulum Rehberi

## Gereksinimler

1. **Node.js** (>=16) - Zaten kurulu ✓
2. **MySQL/MariaDB** - Docker ile kurulacak
3. **Redis** - Docker ile kurulacak
4. **PM2** - npm ile kurulacak
5. **Docker Desktop** (Windows için) - Kurulması gerekiyor

## Kurulum Adımları

### 1. Docker Desktop Kurulumu

Windows için Docker Desktop'ı şu adresten indirip kurun:
https://www.docker.com/products/docker-desktop/

Kurulumdan sonra Docker Desktop'ı başlatın.

### 2. MySQL ve Redis'i Başlatma

Docker Desktop çalıştıktan sonra, proje klasöründe şu komutu çalıştırın:

```powershell
docker-compose up -d
```

Bu komut MySQL ve Redis container'larını başlatacaktır.

### 3. Database Kontrolü

MySQL'in hazır olması için birkaç saniye bekleyin, sonra kontrol edin:

```powershell
docker exec -it pixelplanet-mysql mysql -u pixelplanet -ppixelplanet123 pixelplanet -e "SHOW TABLES;"
```

### 4. PM2 Kurulumu

```powershell
npm install -g pm2
```

### 5. Build İşlemi (Eğer henüz yapılmadıysa)

```powershell
npm run build
```

### 6. Oyunu Başlatma

```powershell
pm2 start ecosystem.yml
```

### 7. Logları Kontrol Etme

```powershell
pm2 log ppfun-server
```

### 8. Oyunu Durdurma

```powershell
pm2 stop ppfun-server
```

## Notlar

- Oyun http://localhost:3500 adresinde çalışacak
- İlk başlatmada canvas boş olacak, kullanıcılar pixel yerleştirdikçe dolacak
- Ocean tiles gibi başlangıç verileri yüklemek isterseniz `utils/ocean-tiles/README.md` dosyasına bakın

## Sorun Giderme

- MySQL bağlantı hatası alırsanız, Docker container'ının çalıştığından emin olun: `docker ps`
- Redis bağlantı hatası alırsanız, Redis container'ının çalıştığından emin olun
- Port 3500 zaten kullanılıyorsa, `ecosystem.yml` dosyasındaki PORT değerini değiştirin


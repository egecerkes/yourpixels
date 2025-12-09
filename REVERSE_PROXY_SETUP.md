# Reverse Proxy Kurulum Rehberi

Bu rehber, PixelPlanet uygulamanızı reverse proxy ile nasıl yapılandıracağınızı gösterir.

## Seçenek 1: Nginx (Önerilen - Production için)

### Windows'ta Nginx Kurulumu

1. **Nginx İndirin:**
   - https://nginx.org/en/download.html adresinden Windows sürümünü indirin
   - ZIP dosyasını açın (örn: `C:\nginx`)

2. **Konfigürasyonu Kopyalayın:**
   - Bu dizindeki `nginx.conf` dosyasını nginx klasörüne kopyalayın
   - Veya `nginx.conf` içeriğini `C:\nginx\conf\nginx.conf` dosyasına yapıştırın

3. **Nginx'i Başlatın:**
   ```powershell
   cd C:\nginx
   .\nginx.exe
   ```

4. **Nginx'i Durdurmak:**
   ```powershell
   .\nginx.exe -s stop
   ```

5. **Nginx'i Yeniden Yüklemek (konfigürasyon değişikliklerinden sonra):**
   ```powershell
   .\nginx.exe -s reload
   ```

### Linux'ta Nginx Kurulumu

1. **Nginx Kurun:**
   ```bash
   sudo apt-get update
   sudo apt-get install nginx
   ```

2. **Konfigürasyonu Kopyalayın:**
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/pixelplanet
   sudo ln -s /etc/nginx/sites-available/pixelplanet /etc/nginx/sites-enabled/
   ```

3. **Nginx'i Test Edin:**
   ```bash
   sudo nginx -t
   ```

4. **Nginx'i Başlatın/Yeniden Başlatın:**
   ```bash
   sudo systemctl restart nginx
   sudo systemctl enable nginx  # Otomatik başlatma için
   ```

## Seçenek 2: Caddy (Kolay SSL - Development için)

### Windows'ta Caddy Kurulumu

1. **Caddy İndirin:**
   - https://caddyserver.com/download adresinden Windows sürümünü indirin
   - EXE dosyasını bir klasöre koyun (örn: `C:\caddy`)

2. **Caddyfile Oluşturun:**
   - Bu dizindeki `Caddyfile` dosyasını Caddy klasörüne kopyalayın

3. **Caddy'yi Başlatın:**
   ```powershell
   cd C:\caddy
   .\caddy.exe run
   ```

### Linux'ta Caddy Kurulumu

1. **Caddy Kurun:**
   ```bash
   sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
   curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
   sudo apt update
   sudo apt install caddy
   ```

2. **Caddyfile Oluşturun:**
   ```bash
   sudo cp Caddyfile /etc/caddy/Caddyfile
   ```

3. **Caddy'yi Başlatın:**
   ```bash
   sudo systemctl start caddy
   sudo systemctl enable caddy
   ```

## Port Ayarları

Varsayılan olarak:
- **Reverse Proxy:** Port 80 (HTTP)
- **Backend (PixelPlanet):** Port 3500

Port 3500'ü değiştirmek isterseniz:
1. `dist/ecosystem.yml` dosyasında `PORT: 3500` değerini değiştirin
2. `nginx.conf` veya `Caddyfile` dosyasında `127.0.0.1:3500` değerini yeni porta güncelleyin

## Domain Ayarları

Kendi domain'inizi kullanmak için:

### Nginx:
`nginx.conf` dosyasında:
```nginx
server_name yourdomain.com www.yourdomain.com;
```

### Caddy:
`Caddyfile` dosyasında:
```
yourdomain.com {
    # ... ayarlar
}
```

Caddy otomatik olarak SSL sertifikası alır (Let's Encrypt).

## Güvenlik Duvarı Ayarları

Windows Firewall'da port 80'i açmanız gerekebilir:
1. Windows Defender Firewall'ı açın
2. Gelen Kurallar > Yeni Kural
3. Port > TCP > 80 > İzin Ver

## Test

Reverse proxy çalıştıktan sonra:
- Tarayıcıda `http://localhost` adresine gidin
- PixelPlanet uygulaması açılmalı

## Sorun Giderme

### Nginx çalışmıyor:
- Port 80 başka bir uygulama tarafından kullanılıyor olabilir
- `netstat -ano | findstr :80` ile kontrol edin
- `nginx.conf` dosyasında syntax hatası olabilir: `nginx -t` ile test edin

### WebSocket bağlantısı çalışmıyor:
- `nginx.conf` dosyasında `/ws` ve `/mcws` location'larının doğru yapılandırıldığından emin olun
- Timeout değerlerinin yeterince yüksek olduğundan emin olun

### 502 Bad Gateway:
- Backend uygulamanın (port 3500) çalıştığından emin olun
- `pm2 status` ile kontrol edin


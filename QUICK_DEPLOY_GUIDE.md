# 🚀 БЫСТРОЕ РАЗВЕРТЫВАНИЕ TRADEANALYZER НА TIMEWEB

## 📋 КРАТКИЙ ЧЕКЛИСТ

### 1. 🛒 Заказ VPS на Timeweb
- Тариф: **VPS SSD-3** (390₽/мес)
- ОС: **Ubuntu 22.04 LTS**
- Локация: **Москва**

### 2. 🔧 Настройка сервера (15 минут)
```bash
# Подключение к серверу
ssh root@YOUR_SERVER_IP

# Обновление системы
apt update && apt upgrade -y

# Создание пользователя
adduser tradeanalyzer
usermod -aG sudo tradeanalyzer
su - tradeanalyzer
```

### 3. 🗄️ Установка PostgreSQL (10 минут)
```bash
# Установка
sudo apt install -y postgresql postgresql-contrib

# Настройка
sudo -u postgres psql
CREATE USER tradeanalyzer_app WITH PASSWORD 'SECURE_PASSWORD_2024!';
CREATE DATABASE tradeanalyzer OWNER tradeanalyzer_app;
GRANT ALL PRIVILEGES ON DATABASE tradeanalyzer TO tradeanalyzer_app;
\q
```

### 4. 📊 Создание схемы БД (5 минут)
```bash
# Загрузка схемы
wget https://raw.githubusercontent.com/moscowfactory-tech/checkyourtrade/main/timeweb-migration-schema.sql

# Выполнение
sudo -u postgres psql -d tradeanalyzer -f timeweb-migration-schema.sql
```

### 5. 🐍 Установка API (10 минут)
```bash
# Установка Python
sudo apt install -y python3 python3-pip python3-venv

# Создание проекта
mkdir ~/tradeanalyzer_api
cd ~/tradeanalyzer_api

# Загрузка файлов
wget https://raw.githubusercontent.com/moscowfactory-tech/checkyourtrade/main/timeweb_api_simple.py -O app.py
wget https://raw.githubusercontent.com/moscowfactory-tech/checkyourtrade/main/requirements.txt

# Установка зависимостей
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Создание .env файла
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tradeanalyzer
DB_USER=tradeanalyzer_app
DB_PASSWORD=SECURE_PASSWORD_2024!
FLASK_ENV=production
EOF

# Тест запуска
python app.py
```

### 6. 🌐 Настройка Nginx (10 минут)
```bash
# Установка
sudo apt install -y nginx

# Конфигурация
sudo nano /etc/nginx/sites-available/tradeanalyzer
```

Содержимое конфигурации:
```nginx
server {
    listen 80;
    server_name your-domain.ru;
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Активация
sudo ln -s /etc/nginx/sites-available/tradeanalyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. 🔄 Создание systemd сервиса (5 минут)
```bash
sudo nano /etc/systemd/system/tradeanalyzer-api.service
```

Содержимое:
```ini
[Unit]
Description=TradeAnalyzer API
After=network.target postgresql.service

[Service]
Type=exec
User=tradeanalyzer
WorkingDirectory=/home/tradeanalyzer/tradeanalyzer_api
Environment=PATH=/home/tradeanalyzer/tradeanalyzer_api/venv/bin
ExecStart=/home/tradeanalyzer/tradeanalyzer_api/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Запуск
sudo systemctl daemon-reload
sudo systemctl enable tradeanalyzer-api
sudo systemctl start tradeanalyzer-api
sudo systemctl status tradeanalyzer-api
```

### 8. 🔒 SSL сертификат (5 минут)
```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата
sudo certbot --nginx -d your-domain.ru
```

### 9. 🔧 Обновление приложения (2 минуты)
В вашем проекте замените в `index.html`:
```html
<!-- Заменить -->
<script src="supabase-config.js?v=5.0.0"></script>

<!-- На -->
<script src="timeweb-client.js?v=1.0.0"></script>
```

В файле `timeweb-client.js` обновите:
```javascript
const TIMEWEB_CONFIG = {
    apiUrl: 'https://your-domain.ru/api', // Ваш домен
    // ...
};
```

### 10. ✅ Тестирование
```bash
# Проверка API
curl https://your-domain.ru/api/health

# Проверка БД
sudo -u postgres psql -d tradeanalyzer -c "SELECT COUNT(*) FROM users;"
```

---

## 🎯 ИТОГО ВРЕМЕНИ: ~60 МИНУТ

## 💰 СТОИМОСТЬ:
- **VPS:** 390₽/месяц
- **Домен .ru:** 199₽/год  
- **SSL:** бесплатно
- **Итого:** ~420₽/месяц

## 🆘 ПОДДЕРЖКА:
- Логи API: `sudo journalctl -u tradeanalyzer-api -f`
- Логи Nginx: `sudo tail -f /var/log/nginx/error.log`
- Статус сервисов: `sudo systemctl status tradeanalyzer-api nginx postgresql`

---

**🎉 После выполнения всех шагов ваше приложение будет работать на российском сервере без блокировок!**

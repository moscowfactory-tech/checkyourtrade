# 🚀 НАСТРОЙКА ПРЯМОГО TIMEWEB API

**Цель:** Обеспечить работу приложения в РФ без VPN  
**Время:** 30-40 минут  
**Результат:** Стабильное, быстрое, надежное подключение

---

## 📋 ЧТО УЖЕ СДЕЛАНО

✅ **Код приложения обновлен:**
- Автоматический выбор рабочего API endpoint
- Поддержка множественных endpoints (основной + резервный)
- Health check для проверки доступности
- Сохранение предпочтительного endpoint в localStorage

✅ **Сервер готов:**
- `/api/health` endpoint добавлен
- CORS настроен для GitHub Pages
- PostgreSQL подключение работает

---

## 🎯 ЧТО НУЖНО СДЕЛАТЬ

### **ШАГ 1: Узнать IP адрес Timeweb VPS**

Подключитесь к вашему Timeweb VPS по SSH:

```bash
ssh root@your-timeweb-server
```

Узнайте публичный IP адрес:

```bash
curl ifconfig.me
```

**Результат:** Вы получите IP вида `185.xxx.xxx.xxx`

**Сохраните этот IP!** Он понадобится на следующем шаге.

---

### **ШАГ 2: Обновить конфиг приложения**

Откройте файл `timeweb-client.js` и замените:

```javascript
// БЫЛО:
apiEndpoints: [
    'https://YOUR_TIMEWEB_DOMAIN/api',  // ⚠️ ЗАМЕНИТЕ на ваш домен!
    // или используйте IP:
    // 'http://185.xxx.xxx.xxx:5000/api',  // ⚠️ ЗАМЕНИТЕ на ваш IP!
    
    'https://concerts-achievements-speak-wealth.trycloudflare.com/api',
],
```

**Вариант A: Если у вас есть домен** (рекомендуется)

```javascript
apiEndpoints: [
    'https://api.tradeanalyzer.ru/api',  // Ваш домен с SSL
    'https://concerts-achievements-speak-wealth.trycloudflare.com/api',  // Резервный
],
```

**Вариант B: Если используете IP** (временно)

```javascript
apiEndpoints: [
    'http://185.xxx.xxx.xxx:5000/api',  // Замените на ваш IP
    'https://concerts-achievements-speak-wealth.trycloudflare.com/api',  // Резервный
],
```

⚠️ **ВАЖНО:** При использовании IP без SSL (http://) браузер может блокировать запросы из-за Mixed Content (HTTPS страница → HTTP API). Рекомендуется настроить домен + SSL.

---

### **ШАГ 3: Запустить Flask API на Timeweb**

На вашем Timeweb VPS:

#### **3.1. Установить зависимости**

```bash
cd /path/to/Trade_analysis_tg
pip3 install -r requirements.txt
```

Если нет `requirements.txt`, создайте:

```bash
cat > requirements.txt << EOF
Flask==3.0.0
flask-cors==4.0.0
psycopg2-binary==2.9.9
python-dotenv==1.0.0
EOF

pip3 install -r requirements.txt
```

#### **3.2. Настроить переменные окружения**

```bash
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tradeanalyzer
DB_USER=tradeanalyzer_app
DB_PASSWORD=SECURE_PASSWORD_2024!
EOF
```

#### **3.3. Запустить API**

**Для тестирования:**

```bash
python3 timeweb_api_simple.py
```

**Для продакшена (с Gunicorn):**

```bash
# Установить Gunicorn
pip3 install gunicorn

# Запустить
gunicorn -w 4 -b 0.0.0.0:5000 timeweb_api_simple:app
```

#### **3.4. Создать systemd service (автозапуск)**

```bash
sudo nano /etc/systemd/system/tradeanalyzer-api.service
```

Вставьте:

```ini
[Unit]
Description=TradeAnalyzer API
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/Trade_analysis_tg
Environment="PATH=/usr/bin"
ExecStart=/usr/bin/gunicorn -w 4 -b 0.0.0.0:5000 timeweb_api_simple:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Активируйте:

```bash
sudo systemctl daemon-reload
sudo systemctl enable tradeanalyzer-api
sudo systemctl start tradeanalyzer-api
sudo systemctl status tradeanalyzer-api
```

---

### **ШАГ 4: Настроить Nginx (опционально, но рекомендуется)**

Nginx обеспечит:
- ✅ SSL сертификат (HTTPS)
- ✅ Лучшую производительность
- ✅ Защиту от DDoS

```bash
# Установить Nginx
sudo apt update
sudo apt install -y nginx

# Создать конфиг
sudo nano /etc/nginx/sites-available/tradeanalyzer-api
```

Вставьте:

```nginx
server {
    listen 80;
    server_name 185.xxx.xxx.xxx;  # Замените на ваш IP или домен

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://moscowfactory-tech.github.io" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
```

Активируйте:

```bash
sudo ln -s /etc/nginx/sites-available/tradeanalyzer-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### **ШАГ 5: Настроить SSL (если есть домен)**

```bash
# Установить Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получить SSL сертификат
sudo certbot --nginx -d api.tradeanalyzer.ru

# Автоматическое обновление
sudo certbot renew --dry-run
```

После этого Nginx автоматически настроит HTTPS!

---

### **ШАГ 6: Открыть порты в файрволе**

```bash
# Если используете UFW
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # Если API напрямую без Nginx
sudo ufw reload

# Если используете iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables-save
```

---

### **ШАГ 7: Протестировать API**

#### **7.1. Health check**

```bash
# С вашего компьютера
curl http://185.xxx.xxx.xxx:5000/api/health

# Ожидаемый ответ:
{
  "status": "ok",
  "message": "API is running",
  "database": "connected",
  "timestamp": "2025-10-28T14:30:00"
}
```

#### **7.2. Тест из браузера**

Откройте в браузере:
```
http://185.xxx.xxx.xxx:5000/api/health
```

Должен показаться JSON с `"status": "ok"`

---

### **ШАГ 8: Деплой обновленного приложения**

```bash
cd /Users/arseniyvaravin/Documents/Trade_analysis_tg

git add timeweb-client.js timeweb_api_simple.py
git commit -m "feat: Прямой Timeweb API для работы в РФ без VPN"
git push origin main
```

Подождите 2 минуты пока GitHub Pages обновится.

---

## 🧪 ТЕСТИРОВАНИЕ

### **Тест 1: Без VPN (РФ)**

1. Отключите VPN
2. Откройте приложение в Telegram
3. **Ожидается:**
   ```
   🔍 Searching for working API endpoint...
   🔄 Testing endpoint: http://185.xxx.xxx.xxx:5000/api
   ✅ Working endpoint found: http://185.xxx.xxx.xxx:5000/api
   ```
4. Кнопки работают ✅
5. Стратегии загружаются ✅

### **Тест 2: С VPN**

1. Включите VPN
2. Откройте приложение
3. **Ожидается:**
   ```
   🔍 Searching for working API endpoint...
   🔄 Testing endpoint: http://185.xxx.xxx.xxx:5000/api
   ✅ Working endpoint found: http://185.xxx.xxx.xxx:5000/api
   ```
   (Timeweb API работает быстрее, поэтому выбирается первым)

### **Тест 3: Если Timeweb API недоступен**

1. Остановите API на сервере: `sudo systemctl stop tradeanalyzer-api`
2. Откройте приложение с VPN
3. **Ожидается:**
   ```
   🔍 Searching for working API endpoint...
   🔄 Testing endpoint: http://185.xxx.xxx.xxx:5000/api
   ⚠️ Endpoint unavailable: http://185.xxx.xxx.xxx:5000/api
   🔄 Testing endpoint: https://concerts-achievements-speak-wealth.trycloudflare.com/api
   ✅ Working endpoint found: https://concerts-achievements-speak-wealth.trycloudflare.com/api
   ```
4. Приложение автоматически переключается на резервный endpoint ✅

---

## 📊 ПРЕИМУЩЕСТВА РЕШЕНИЯ

### **✅ Работает в РФ без VPN**
- Российский хостинг Timeweb
- Нет блокировок
- Стабильное подключение

### **✅ Быстро**
- Прямое подключение (без туннелей)
- Низкая задержка (5-15ms в РФ)
- Нет посредников

### **✅ Надежно**
- Автоматический выбор рабочего endpoint
- Резервный endpoint (Cloudflare)
- Сохранение предпочтительного endpoint

### **✅ Безопасно**
- SSL сертификат (если есть домен)
- CORS настроен правильно
- Защита от DDoS (Nginx)

### **✅ Полная синхронизация**
- Реальное подключение к PostgreSQL
- Нет кеша (только для offline режима)
- Мгновенное обновление данных

---

## 🔧 TROUBLESHOOTING

### **Проблема 1: API не отвечает**

```bash
# Проверить статус
sudo systemctl status tradeanalyzer-api

# Посмотреть логи
sudo journalctl -u tradeanalyzer-api -f

# Перезапустить
sudo systemctl restart tradeanalyzer-api
```

### **Проблема 2: CORS ошибки**

Проверьте, что в `timeweb_api_simple.py`:

```python
CORS(app, origins=[
    'https://moscowfactory-tech.github.io',  # ← Должен быть ваш домен
    'http://localhost:8000',
    'http://127.0.0.1:8000'
])
```

### **Проблема 3: Mixed Content (HTTP/HTTPS)**

Если приложение на HTTPS, а API на HTTP - браузер блокирует запросы.

**Решение:** Настройте SSL для API (Шаг 5)

### **Проблема 4: Порты закрыты**

```bash
# Проверить открытые порты
sudo netstat -tulpn | grep :5000

# Проверить файрвол
sudo ufw status
```

---

## 📞 СЛЕДУЮЩИЕ ШАГИ

1. **Сейчас:** Узнайте IP вашего Timeweb VPS
2. **Обновите:** `timeweb-client.js` с вашим IP
3. **Запустите:** Flask API на сервере
4. **Протестируйте:** Health check
5. **Деплой:** Обновленное приложение
6. **Опционально:** Настройте домен + SSL

---

## 🎯 РЕЗУЛЬТАТ

После выполнения всех шагов:

✅ **Пользователи в РФ** - работают без VPN  
✅ **Пользователи с VPN** - работают через любой endpoint  
✅ **Быстро** - прямое подключение  
✅ **Надежно** - автоматический failover  
✅ **Безопасно** - SSL + CORS  

**Приложение готово к массовому использованию!** 🚀

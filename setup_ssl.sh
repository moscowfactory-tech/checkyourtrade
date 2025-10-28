#!/bin/bash
# Скрипт для настройки SSL на Timeweb VPS

echo "🔒 Настройка SSL для TradeAnalyzer API"
echo "========================================"

# Проверка, что скрипт запущен от root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Запустите скрипт с sudo"
    exit 1
fi

# Установка Certbot
echo "📦 Установка Certbot..."
apt update
apt install -y certbot python3-certbot-nginx

# Установка Nginx (если еще не установлен)
echo "📦 Установка Nginx..."
apt install -y nginx

# Создание конфигурации Nginx для API
echo "⚙️ Настройка Nginx..."
cat > /etc/nginx/sites-available/tradeanalyzer-api << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_HERE;  # Замените на ваш домен или IP

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers (на случай если Flask CORS не работает)
        add_header Access-Control-Allow-Origin "https://moscowfactory-tech.github.io" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
}
EOF

# Активация конфигурации
ln -sf /etc/nginx/sites-available/tradeanalyzer-api /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "✅ Nginx настроен"

# Получение SSL сертификата (если есть домен)
read -p "У вас есть домен? (y/n): " has_domain
if [ "$has_domain" = "y" ]; then
    read -p "Введите домен (например: api.tradeanalyzer.ru): " domain
    
    # Обновляем конфиг с доменом
    sed -i "s/YOUR_DOMAIN_HERE/$domain/g" /etc/nginx/sites-available/tradeanalyzer-api
    systemctl reload nginx
    
    # Получаем SSL сертификат
    echo "🔒 Получение SSL сертификата..."
    certbot --nginx -d $domain --non-interactive --agree-tos --email admin@$domain
    
    echo "✅ SSL сертификат установлен!"
    echo "🌐 Ваш API доступен по адресу: https://$domain/api"
else
    echo "⚠️ Без домена SSL сертификат получить нельзя"
    echo "🌐 Ваш API доступен по адресу: http://YOUR_IP:5000/api"
    echo "⚠️ Рекомендуем получить домен для безопасности"
fi

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "📋 Следующие шаги:"
echo "1. Убедитесь, что Flask API запущен: sudo systemctl status tradeanalyzer-api"
echo "2. Обновите timeweb-client.js с новым URL"
echo "3. Протестируйте API: curl https://YOUR_DOMAIN/api/health"

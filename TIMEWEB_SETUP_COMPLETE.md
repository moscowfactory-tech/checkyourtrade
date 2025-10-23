# 🚀 ПОЛНАЯ ИНСТРУКЦИЯ ПО НАСТРОЙКЕ TIMEWEB ДЛЯ TRADEANALYZER

## 📋 ОГЛАВЛЕНИЕ
1. [Заказ и настройка VPS](#1-заказ-и-настройка-vps)
2. [Установка PostgreSQL](#2-установка-postgresql)
3. [Создание базы данных](#3-создание-базы-данных)
4. [Настройка API сервера](#4-настройка-api-сервера)
5. [Настройка SSL и домена](#5-настройка-ssl-и-домена)
6. [Обновление приложения](#6-обновление-приложения)
7. [Тестирование](#7-тестирование)

---

## 1. ЗАКАЗ И НАСТРОЙКА VPS

### 🛒 Заказ VPS на Timeweb

1. **Перейдите на** https://timeweb.com/ru/services/vps
2. **Выберите тариф VPS SSD-3:**
   - CPU: 2 ядра
   - RAM: 4 ГБ
   - SSD: 40 ГБ
   - Цена: 390₽/месяц
3. **Выберите ОС:** Ubuntu 22.04 LTS
4. **Локация:** Москва (для минимальной задержки)
5. **Оплатите и дождитесь активации**

### 🔑 Первоначальная настройка сервера

После получения данных доступа (IP, root пароль):

```bash
# Подключение к серверу
ssh root@YOUR_SERVER_IP

# Обновление системы
apt update && apt upgrade -y

# Создание пользователя для приложения
adduser tradeanalyzer
usermod -aG sudo tradeanalyzer

# Настройка SSH ключей (рекомендуется)
mkdir -p /home/tradeanalyzer/.ssh
cp ~/.ssh/authorized_keys /home/tradeanalyzer/.ssh/
chown -R tradeanalyzer:tradeanalyzer /home/tradeanalyzer/.ssh
chmod 700 /home/tradeanalyzer/.ssh
chmod 600 /home/tradeanalyzer/.ssh/authorized_keys
```

---

## 2. УСТАНОВКА POSTGRESQL

### 📦 Установка PostgreSQL 15

```bash
# Переключение на пользователя приложения
su - tradeanalyzer

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib postgresql-client

# Проверка статуса
sudo systemctl status postgresql
sudo systemctl enable postgresql

# Проверка версии
psql --version
```

### 🔧 Настройка PostgreSQL

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

-- В psql консоли:
-- Создание пользователя для приложения
CREATE USER tradeanalyzer_app WITH PASSWORD 'SECURE_PASSWORD_2024!';

-- Создание базы данных
CREATE DATABASE tradeanalyzer OWNER tradeanalyzer_app;

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE tradeanalyzer TO tradeanalyzer_app;

-- Выход из psql
\q
```

### 🛡️ Настройка безопасности PostgreSQL

```bash
# Редактирование конфигурации PostgreSQL
sudo nano /etc/postgresql/15/main/postgresql.conf

# Найти и изменить:
listen_addresses = 'localhost'  # Только локальные подключения
port = 5432
max_connections = 100

# Настройка аутентификации
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Добавить в конец файла:
local   tradeanalyzer   tradeanalyzer_app                     md5
host    tradeanalyzer   tradeanalyzer_app   127.0.0.1/32      md5

# Перезапуск PostgreSQL
sudo systemctl restart postgresql
```

---

## 3. СОЗДАНИЕ БАЗЫ ДАННЫХ

### 📄 Создание схемы БД

Создайте файл `setup_database.sql`:

```sql
-- СХЕМА БД ДЛЯ TRADEANALYZER НА TIMEWEB
-- Упрощенная версия без RLS для лучшей производительности

-- Подключение к БД
\c tradeanalyzer;

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание таблицы пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id TEXT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы стратегий
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id TEXT, -- Для совместимости с текущим кодом
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB, -- Все поля стратегии в JSON формате
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы анализов
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id TEXT, -- Для совместимости
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    strategy_name TEXT, -- Денормализация для быстрого доступа
    coin TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answers JSONB,
    results JSONB, -- Структура: {positive: [], negative: [], neutral: []}
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание представления для совместимости с текущим кодом
CREATE VIEW analysis_results AS 
SELECT 
    id,
    user_id,
    strategy_id,
    answers,
    (results->>'positive')::jsonb as positive_factors,
    (results->>'negative')::jsonb as negative_factors,
    (results->>'neutral')::jsonb as neutral_factors,
    recommendation,
    created_at
FROM analyses;

-- Создание индексов для производительности
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_telegram_user_id ON strategies(telegram_user_id);
CREATE INDEX idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_telegram_user_id ON analyses(telegram_user_id);
CREATE INDEX idx_analyses_strategy_id ON analyses(strategy_id);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
    BEFORE UPDATE ON strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Предоставление прав пользователю приложения
GRANT CONNECT ON DATABASE tradeanalyzer TO tradeanalyzer_app;
GRANT USAGE ON SCHEMA public TO tradeanalyzer_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tradeanalyzer_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tradeanalyzer_app;

-- Права на будущие таблицы
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tradeanalyzer_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO tradeanalyzer_app;

-- Функции для работы с данными
CREATE OR REPLACE FUNCTION get_user_stats(p_telegram_id TEXT)
RETURNS JSON AS $$
DECLARE
    user_uuid UUID;
    strategies_count INTEGER;
    analyses_count INTEGER;
BEGIN
    SELECT id INTO user_uuid FROM users WHERE telegram_id = p_telegram_id;
    
    IF user_uuid IS NULL THEN
        RETURN json_build_object('strategies', 0, 'analyses', 0);
    END IF;
    
    SELECT COUNT(*) INTO strategies_count FROM strategies WHERE user_id = user_uuid;
    SELECT COUNT(*) INTO analyses_count FROM analyses WHERE user_id = user_uuid;
    
    RETURN json_build_object('strategies', strategies_count, 'analyses', analyses_count);
END;
$$ LANGUAGE plpgsql;

-- Комментарии к таблицам
COMMENT ON TABLE users IS 'Пользователи приложения TradeAnalyzer';
COMMENT ON TABLE strategies IS 'Торговые стратегии пользователей';
COMMENT ON TABLE analyses IS 'Результаты анализов сделок';

-- Вывод информации о созданных объектах
SELECT 'Database setup completed successfully!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### 🔧 Выполнение скрипта создания БД

```bash
# Сохранение скрипта на сервере
nano ~/setup_database.sql
# (Вставить содержимое выше)

# Выполнение скрипта
sudo -u postgres psql -f ~/setup_database.sql

# Проверка созданных таблиц
sudo -u postgres psql -d tradeanalyzer -c "\dt"
```

---

## 4. НАСТРОЙКА API СЕРВЕРА

### 🐍 Установка Python и зависимостей

```bash
# Установка Python и pip
sudo apt install -y python3 python3-pip python3-venv

# Создание виртуального окружения
python3 -m venv ~/tradeanalyzer_env
source ~/tradeanalyzer_env/bin/activate

# Установка зависимостей
pip install flask flask-cors psycopg2-binary python-dotenv gunicorn
```

### 📁 Создание структуры проекта

```bash
# Создание директорий
mkdir -p ~/tradeanalyzer_api
cd ~/tradeanalyzer_api

# Создание файлов
touch app.py config.py requirements.txt .env
```

### ⚙️ Конфигурация API

Создайте файл `~/tradeanalyzer_api/.env`:

```env
# Настройки базы данных
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tradeanalyzer
DB_USER=tradeanalyzer_app
DB_PASSWORD=SECURE_PASSWORD_2024!

# Настройки Flask
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here

# Настройки CORS
CORS_ORIGINS=https://your-domain.ru,https://moscowfactory-tech.github.io
```

### 🔧 Создание systemd сервиса

```bash
# Создание файла сервиса
sudo nano /etc/systemd/system/tradeanalyzer-api.service
```

Содержимое файла:

```ini
[Unit]
Description=TradeAnalyzer API
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=exec
User=tradeanalyzer
Group=tradeanalyzer
WorkingDirectory=/home/tradeanalyzer/tradeanalyzer_api
Environment=PATH=/home/tradeanalyzer/tradeanalyzer_env/bin
ExecStart=/home/tradeanalyzer/tradeanalyzer_env/bin/gunicorn --bind 127.0.0.1:5000 --workers 2 app:app
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Активация сервиса
sudo systemctl daemon-reload
sudo systemctl enable tradeanalyzer-api
sudo systemctl start tradeanalyzer-api
sudo systemctl status tradeanalyzer-api
```

---

## 5. НАСТРОЙКА SSL И ДОМЕНА

### 🌐 Настройка Nginx

```bash
# Установка Nginx
sudo apt install -y nginx

# Создание конфигурации сайта
sudo nano /etc/nginx/sites-available/tradeanalyzer
```

Содержимое конфигурации:

```nginx
server {
    listen 80;
    server_name your-domain.ru www.your-domain.ru;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.ru www.your-domain.ru;
    
    # SSL сертификаты (будут настроены позже)
    ssl_certificate /etc/letsencrypt/live/your-domain.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.ru/privkey.pem;
    
    # Настройки SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # API проксирование
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Статические файлы (если нужно)
    location / {
        root /var/www/tradeanalyzer;
        try_files $uri $uri/ =404;
    }
}
```

```bash
# Активация сайта
sudo ln -s /etc/nginx/sites-available/tradeanalyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 🔒 Установка SSL сертификата

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение SSL сертификата
sudo certbot --nginx -d your-domain.ru -d www.your-domain.ru

# Проверка автообновления
sudo certbot renew --dry-run
```

---

## 6. ОБНОВЛЕНИЕ ПРИЛОЖЕНИЯ

### 🔄 Замена конфигурации Supabase

В вашем проекте замените `supabase-config.js` на новую конфигурацию для Timeweb.

---

## 7. ТЕСТИРОВАНИЕ

### 🧪 Проверка работоспособности

```bash
# Проверка API
curl -X GET https://your-domain.ru/api/health

# Проверка подключения к БД
sudo -u postgres psql -d tradeanalyzer -c "SELECT COUNT(*) FROM users;"

# Проверка логов
sudo journalctl -u tradeanalyzer-api -f
```

---

## 🛡️ БЕЗОПАСНОСТЬ И МОНИТОРИНГ

### 🔥 Настройка файрвола

```bash
# Установка UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Разрешение необходимых портов
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Проверка статуса
sudo ufw status
```

### 📊 Настройка мониторинга

```bash
# Установка htop для мониторинга
sudo apt install -y htop

# Настройка логротации
sudo nano /etc/logrotate.d/tradeanalyzer
```

---

## 📋 ЧЕКЛИСТ ГОТОВНОСТИ

- [ ] VPS заказан и настроен
- [ ] PostgreSQL установлен и настроен
- [ ] База данных создана
- [ ] API сервер запущен
- [ ] Nginx настроен
- [ ] SSL сертификат установлен
- [ ] Домен настроен
- [ ] Файрвол настроен
- [ ] Приложение обновлено
- [ ] Тестирование пройдено

---

## 🆘 ПОДДЕРЖКА И ОТЛАДКА

### 📝 Полезные команды

```bash
# Проверка статуса сервисов
sudo systemctl status postgresql
sudo systemctl status tradeanalyzer-api
sudo systemctl status nginx

# Просмотр логов
sudo journalctl -u tradeanalyzer-api -n 50
sudo tail -f /var/log/nginx/error.log

# Подключение к БД
sudo -u postgres psql -d tradeanalyzer

# Перезапуск сервисов
sudo systemctl restart tradeanalyzer-api
sudo systemctl restart nginx
```

### 🔧 Решение проблем

1. **API не отвечает:** Проверьте логи сервиса и статус PostgreSQL
2. **Ошибки БД:** Проверьте права пользователя и подключение
3. **SSL проблемы:** Обновите сертификат через certbot
4. **Высокая нагрузка:** Увеличьте количество workers в gunicorn

---

**🎉 После выполнения всех шагов ваше приложение будет работать на российском сервере без блокировок!**

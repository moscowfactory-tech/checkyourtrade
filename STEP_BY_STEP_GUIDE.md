# 🚀 ПОШАГОВАЯ ИНСТРУКЦИЯ ДЛЯ НАСТРОЙКИ TIMEWEB

## 📍 ГДЕ ВЫПОЛНЯТЬ КОМАНДЫ

- 💻 **НА ВАШЕМ КОМПЬЮТЕРЕ** - команды для подключения к серверу
- 🖥️ **НА СЕРВЕРЕ TIMEWEB** - команды после подключения по SSH

---

## ШАГ 1: ПОЛУЧЕНИЕ ДАННЫХ ДОСТУПА

### 📧 Проверьте почту от Timeweb
Вы должны получить письмо с данными:
- **IP адрес:** например `185.xxx.xxx.xxx`
- **Логин:** `root`
- **Пароль:** например `Abc123def456`

**❗ СОХРАНИТЕ ЭТИ ДАННЫЕ!**

---

## ШАГ 2: ПОДКЛЮЧЕНИЕ К СЕРВЕРУ

### 💻 НА ВАШЕМ КОМПЬЮТЕРЕ (в терминале):

```bash
# Подключение к серверу (замените IP на ваш)
ssh root@185.xxx.xxx.xxx
```

**Что произойдет:**
1. Система спросит пароль - введите пароль из письма
2. При первом подключении спросит добавить сервер - напишите `yes`
3. Вы попадете в терминал сервера (увидите `root@server:~#`)

---

## ШАГ 3: ОБНОВЛЕНИЕ СИСТЕМЫ

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Обновление пакетов (займет 2-3 минуты)
apt update && apt upgrade -y

# Установка базовых утилит
apt install -y curl wget nano htop
```

**Что происходит:** Обновляем систему и устанавливаем нужные программы

---

## ШАГ 4: СОЗДАНИЕ ПОЛЬЗОВАТЕЛЯ

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Создание пользователя для приложения
adduser tradeanalyzer
```

**Система спросит:**
- `Enter new UNIX password:` - придумайте пароль (например: `TradeApp2024`)
- `Retype new UNIX password:` - повторите тот же пароль
- Остальные вопросы можно пропустить (просто нажимать Enter)

```bash
# Добавление прав администратора
usermod -aG sudo tradeanalyzer

# Переключение на нового пользователя
su - tradeanalyzer
```

**Теперь вы работаете под пользователем `tradeanalyzer`**

---

## ШАГ 5: НАСТРОЙКА POSTGRESQL

### 🖥️ НА СЕРВЕРЕ TIMEWEB (под пользователем tradeanalyzer):

```bash
# Проверка что PostgreSQL работает
sudo systemctl status postgresql
```

**Должно показать:** `Active: active (running)`

```bash
# Настройка PostgreSQL для экономии памяти
sudo nano /etc/postgresql/15/main/postgresql.conf
```

**В редакторе nano:**
1. Нажмите `Ctrl+W` для поиска
2. Найдите строку `#shared_buffers`
3. Замените на: `shared_buffers = 128MB`
4. Найдите `#effective_cache_size`
5. Замените на: `effective_cache_size = 512MB`
6. Найдите `#work_mem`
7. Замените на: `work_mem = 4MB`
8. Найдите `#max_connections`
9. Замените на: `max_connections = 20`
10. Нажмите `Ctrl+X`, затем `Y`, затем `Enter` для сохранения

```bash
# Перезапуск PostgreSQL
sudo systemctl restart postgresql
```

---

## ШАГ 6: СОЗДАНИЕ БАЗЫ ДАННЫХ

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Переключение на пользователя postgres
sudo -u postgres psql
```

**Теперь вы в консоли PostgreSQL (видите `postgres=#`)**

**В консоли PostgreSQL выполните:**
```sql
-- Создание пользователя для приложения
CREATE USER tradeanalyzer_app WITH PASSWORD 'TradeAnalyzer2024!';

-- Создание базы данных
CREATE DATABASE tradeanalyzer OWNER tradeanalyzer_app;

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE tradeanalyzer TO tradeanalyzer_app;

-- Выход из PostgreSQL
\q
```

**Теперь вы снова в обычном терминале**

---

## ШАГ 7: СОЗДАНИЕ СХЕМЫ БД

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Создание файла со схемой БД
nano ~/setup_database.sql
```

**В редакторе nano вставьте этот код:**
```sql
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
    telegram_user_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы анализов
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id TEXT,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    strategy_name TEXT,
    coin TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    answers JSONB,
    results JSONB,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Представление для совместимости
CREATE VIEW analysis_results AS 
SELECT 
    id, user_id, strategy_id, answers,
    (results->>'positive')::jsonb as positive_factors,
    (results->>'negative')::jsonb as negative_factors,
    (results->>'neutral')::jsonb as neutral_factors,
    recommendation, created_at
FROM analyses;

-- Индексы
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
    BEFORE UPDATE ON strategies FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Права пользователю
GRANT CONNECT ON DATABASE tradeanalyzer TO tradeanalyzer_app;
GRANT USAGE ON SCHEMA public TO tradeanalyzer_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tradeanalyzer_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tradeanalyzer_app;

-- Функция статистики
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

SELECT 'Database setup completed!' as status;
```

**Сохранение:** `Ctrl+X`, затем `Y`, затем `Enter`

```bash
# Выполнение скрипта создания БД
sudo -u postgres psql -f ~/setup_database.sql
```

**Должно показать:** `Database setup completed!`

```bash
# Проверка созданных таблиц
sudo -u postgres psql -d tradeanalyzer -c "\dt"
```

**Должно показать список таблиц:** `users`, `strategies`, `analyses`

---

## ШАГ 8: УСТАНОВКА PYTHON И API

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Установка Python
sudo apt install -y python3 python3-pip python3-venv

# Создание папки для API
mkdir ~/tradeanalyzer_api
cd ~/tradeanalyzer_api

# Создание виртуального окружения
python3 -m venv venv
source venv/bin/activate
```

**Теперь в начале строки должно быть `(venv)`**

```bash
# Создание файла зависимостей
cat > requirements.txt << EOF
Flask==2.3.3
Flask-CORS==4.0.0
psycopg2-binary==2.9.7
python-dotenv==1.0.0
gunicorn==21.2.0
EOF

# Установка зависимостей (займет 2-3 минуты)
pip install -r requirements.txt
```

```bash
# Создание файла конфигурации
cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tradeanalyzer
DB_USER=tradeanalyzer_app
DB_PASSWORD=TradeAnalyzer2024!
FLASK_ENV=production
FLASK_DEBUG=False
EOF
```

---

## ШАГ 9: СОЗДАНИЕ API СЕРВЕРА

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Создание основного файла API
nano app.py
```

**В редакторе nano вставьте этот код:**
```python
#!/usr/bin/env python3
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['*'])

# Конфигурация БД
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': os.getenv('DB_PORT', '5432'),
    'database': os.getenv('DB_NAME', 'tradeanalyzer'),
    'user': os.getenv('DB_USER', 'tradeanalyzer_app'),
    'password': os.getenv('DB_PASSWORD', 'TradeAnalyzer2024!')
}

def get_db_connection():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        return conn
    except Exception as e:
        print(f"DB error: {e}")
        return None

def execute_query(sql, params=None, fetch=True):
    conn = get_db_connection()
    if not conn:
        return {'data': None, 'error': 'DB connection failed'}
    
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute(sql, params or [])
            if fetch:
                result = [dict(row) for row in cur.fetchall()]
            else:
                result = []
            conn.commit()
            return {'data': result, 'error': None}
    except Exception as e:
        conn.rollback()
        return {'data': None, 'error': str(e)}
    finally:
        conn.close()

@app.route('/api/health')
def health():
    conn = get_db_connection()
    if conn:
        conn.close()
        return jsonify({'status': 'healthy', 'message': 'TradeAnalyzer API is running!'})
    return jsonify({'status': 'unhealthy'}), 500

@app.route('/api/strategies', methods=['GET'])
def get_strategies():
    telegram_user_id = request.args.get('telegram_user_id')
    if not telegram_user_id:
        return jsonify({'data': [], 'error': None})
    
    sql = """
    SELECT s.* FROM strategies s
    JOIN users u ON u.id = s.user_id
    WHERE u.telegram_id = %s
    ORDER BY s.created_at DESC
    """
    result = execute_query(sql, [telegram_user_id])
    return jsonify(result)

@app.route('/api/strategies', methods=['POST'])
def create_strategy():
    data = request.get_json()
    telegram_user_id = data.get('telegram_user_id')
    
    # Создаем пользователя если не существует
    user_sql = """
    INSERT INTO users (telegram_id, username, first_name, last_name)
    VALUES (%s, %s, %s, %s)
    ON CONFLICT (telegram_id) DO UPDATE SET updated_at = NOW()
    RETURNING id
    """
    user_result = execute_query(user_sql, [
        telegram_user_id,
        data.get('username'),
        data.get('first_name'),
        data.get('last_name')
    ])
    
    if user_result['error']:
        return jsonify({'data': None, 'error': user_result['error']}), 500
    
    user_id = user_result['data'][0]['id']
    
    # Создаем стратегию
    strategy_sql = """
    INSERT INTO strategies (user_id, telegram_user_id, name, description, fields)
    VALUES (%s, %s, %s, %s, %s)
    RETURNING *
    """
    result = execute_query(strategy_sql, [
        user_id, telegram_user_id,
        data.get('name'), data.get('description'),
        json.dumps(data.get('fields', []))
    ])
    
    return jsonify(result)

@app.route('/api/analysis_results', methods=['GET'])
def get_analyses():
    telegram_user_id = request.args.get('telegram_user_id')
    if not telegram_user_id:
        return jsonify({'data': [], 'error': None})
    
    sql = """
    SELECT ar.* FROM analysis_results ar
    JOIN users u ON u.id = ar.user_id
    WHERE u.telegram_id = %s
    ORDER BY ar.created_at DESC
    """
    result = execute_query(sql, [telegram_user_id])
    return jsonify(result)

@app.route('/api/analysis_results', methods=['POST'])
def create_analysis():
    data = request.get_json()
    telegram_user_id = data.get('telegram_user_id')
    
    # Находим пользователя
    user_sql = "SELECT id FROM users WHERE telegram_id = %s"
    user_result = execute_query(user_sql, [telegram_user_id])
    
    if not user_result['data']:
        return jsonify({'data': None, 'error': 'User not found'}), 404
    
    user_id = user_result['data'][0]['id']
    
    # Создаем анализ
    results = {
        'positive': data.get('positive_factors', []),
        'negative': data.get('negative_factors', []),
        'neutral': data.get('neutral_factors', [])
    }
    
    analysis_sql = """
    INSERT INTO analyses (user_id, telegram_user_id, strategy_id, strategy_name, 
                         coin, answers, results, recommendation)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    RETURNING *
    """
    result = execute_query(analysis_sql, [
        user_id, telegram_user_id, data.get('strategy_id'),
        data.get('strategy_name'), data.get('coin'),
        json.dumps(data.get('answers', [])),
        json.dumps(results), data.get('recommendation')
    ])
    
    return jsonify(result)

if __name__ == '__main__':
    print("🚀 Starting TradeAnalyzer API...")
    conn = get_db_connection()
    if conn:
        print("✅ DB connected")
        conn.close()
        app.run(host='127.0.0.1', port=5000, debug=False)
    else:
        print("❌ DB connection failed")
```

**Сохранение:** `Ctrl+X`, затем `Y`, затем `Enter`

---

## ШАГ 10: ТЕСТИРОВАНИЕ API

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Запуск API для тестирования
python app.py
```

**Должно показать:**
```
🚀 Starting TradeAnalyzer API...
✅ DB connected
* Running on http://127.0.0.1:5000
```

**Откройте НОВЫЙ терминал на вашем компьютере и подключитесь к серверу:**

### 💻 НА ВАШЕМ КОМПЬЮТЕРЕ (новый терминал):

```bash
# Подключение к серверу
ssh root@185.xxx.xxx.xxx

# Переключение на пользователя
su - tradeanalyzer

# Тестирование API
curl http://localhost:5000/api/health
```

**Должно показать:** `{"message":"TradeAnalyzer API is running!","status":"healthy"}`

**Вернитесь в первый терминал и остановите API:** `Ctrl+C`

---

## ШАГ 11: УСТАНОВКА NGINX

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Установка Nginx
sudo apt install -y nginx

# Создание конфигурации
sudo nano /etc/nginx/sites-available/tradeanalyzer
```

**В редакторе nano вставьте:**
```nginx
server {
    listen 80;
    server_name _;
    
    client_max_body_size 1m;
    client_body_timeout 10s;
    client_header_timeout 10s;
    
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
    
    location / {
        return 200 'TradeAnalyzer API is running!';
        add_header Content-Type text/plain;
    }
}
```

**Сохранение:** `Ctrl+X`, затем `Y`, затем `Enter`

```bash
# Удаление стандартной конфигурации
sudo rm /etc/nginx/sites-enabled/default

# Активация нашей конфигурации
sudo ln -s /etc/nginx/sites-available/tradeanalyzer /etc/nginx/sites-enabled/

# Проверка конфигурации
sudo nginx -t

# Перезапуск Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## ШАГ 12: СОЗДАНИЕ АВТОЗАПУСКА

### 🖥️ НА СЕРВЕРЕ TIMEWEB:

```bash
# Создание сервиса автозапуска
sudo nano /etc/systemd/system/tradeanalyzer-api.service
```

**В редакторе nano вставьте:**
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
Environment=PATH=/home/tradeanalyzer/tradeanalyzer_api/venv/bin
ExecStart=/home/tradeanalyzer/tradeanalyzer_api/venv/bin/gunicorn --bind 127.0.0.1:5000 --workers 1 --timeout 30 --max-requests 1000 app:app
Restart=always
RestartSec=10
MemoryLimit=256M
CPUQuota=50%

[Install]
WantedBy=multi-user.target
```

**Сохранение:** `Ctrl+X`, затем `Y`, затем `Enter`

```bash
# Активация сервиса
sudo systemctl daemon-reload
sudo systemctl enable tradeanalyzer-api
sudo systemctl start tradeanalyzer-api

# Проверка статуса
sudo systemctl status tradeanalyzer-api
```

**Должно показать:** `Active: active (running)`

---

## ШАГ 13: ФИНАЛЬНОЕ ТЕСТИРОВАНИЕ

### 💻 НА ВАШЕМ КОМПЬЮТЕРЕ:

```bash
# Тестирование API через внешний IP (замените на ваш IP)
curl http://185.xxx.xxx.xxx/api/health
```

**Должно показать:** `{"message":"TradeAnalyzer API is running!","status":"healthy"}`

---

## 🎉 ГОТОВО! СЕРВЕР НАСТРОЕН!

### 📋 ЧТО У ВАС ЕСТЬ:

✅ **Сервер настроен и работает**  
✅ **PostgreSQL база данных создана**  
✅ **API сервер запущен и доступен**  
✅ **Nginx настроен как прокси**  
✅ **Автозапуск настроен**  

### 🔗 **Ваш API доступен по адресу:**
`http://ВАШ_IP_АДРЕС/api/`

### 📝 **Следующий шаг:**
Обновить конфигурацию в вашем приложении для подключения к новому серверу.

**Сообщите мне ваш IP адрес сервера, и я помогу обновить конфигурацию приложения!** 🚀

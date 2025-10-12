# 📊 СИСТЕМА МОНИТОРИНГА И АНАЛИТИКИ

## 🎯 **АРХИТЕКТУРА МОНИТОРИНГА**

### **📈 Что будем отслеживать:**
1. **Здоровье системы** - работает ли бот, доступен ли сайт
2. **Ошибки** - сбои в коде, проблемы с БД
3. **Пользовательская активность** - регистрации, создание стратегий
4. **Производительность** - время отклика, нагрузка на БД

---

## 🔧 **1. МОНИТОРИНГ ЗДОРОВЬЯ СИСТЕМЫ**

### **🤖 Мониторинг Telegram Bot**

**Где:** На VPS сервере (Timeweb)  
**Как выглядит:** Простой Python скрипт + внешний сервис

```python
# health_monitor.py - добавить на сервер
import requests
import time
import logging
from datetime import datetime

class HealthMonitor:
    def __init__(self):
        # Бесплатный сервис для мониторинга
        self.healthcheck_url = "https://hc-ping.com/your-uuid"  # Получить на healthchecks.io
        self.telegram_chat_id = "YOUR_CHAT_ID"  # Ваш Telegram ID
        self.telegram_bot_token = "YOUR_NOTIFICATION_BOT_TOKEN"
        
    def send_heartbeat(self):
        """Отправляем сигнал что бот жив"""
        try:
            requests.get(self.healthcheck_url, timeout=10)
            print(f"✅ Heartbeat sent at {datetime.now()}")
        except Exception as e:
            print(f"❌ Heartbeat failed: {e}")
            self.send_alert(f"Heartbeat failed: {e}")
    
    def send_alert(self, message):
        """Отправляем уведомление в Telegram"""
        try:
            url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
            data = {
                "chat_id": self.telegram_chat_id,
                "text": f"🚨 TradeAnalyzer Alert:\n{message}",
                "parse_mode": "HTML"
            }
            requests.post(url, data=data)
        except:
            pass  # Не ломаем основной процесс
    
    def check_website(self):
        """Проверяем доступность сайта"""
        try:
            response = requests.get("https://moscowfactory-tech.github.io/checkyourtrade/", timeout=10)
            if response.status_code == 200:
                print("✅ Website is accessible")
                return True
            else:
                self.send_alert(f"Website returned status {response.status_code}")
                return False
        except Exception as e:
            self.send_alert(f"Website is down: {e}")
            return False
    
    def check_database(self):
        """Проверяем подключение к Supabase"""
        try:
            # Простой запрос к БД
            import os
            supabase_url = "YOUR_SUPABASE_URL"
            supabase_key = "YOUR_SUPABASE_ANON_KEY"
            
            response = requests.get(
                f"{supabase_url}/rest/v1/users?select=count",
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}"
                },
                timeout=10
            )
            
            if response.status_code == 200:
                print("✅ Database is accessible")
                return True
            else:
                self.send_alert(f"Database returned status {response.status_code}")
                return False
        except Exception as e:
            self.send_alert(f"Database connection failed: {e}")
            return False

# Запускать каждые 5 минут
if __name__ == "__main__":
    monitor = HealthMonitor()
    
    while True:
        monitor.send_heartbeat()
        monitor.check_website()
        monitor.check_database()
        time.sleep(300)  # 5 минут
```

**Где это будет:**
- **Файл:** `/root/checkyourtrade/health_monitor.py` на VPS
- **Автозапуск:** Systemd сервис
- **Уведомления:** В ваш личный Telegram
- **Дашборд:** https://healthchecks.io (бесплатно)

---

## 🐛 **2. ЛОГИРОВАНИЕ ОШИБОК**

### **🤖 Логи Telegram Bot**

```python
# Добавить в bot.py
import logging
import traceback
from datetime import datetime
import os

# Настройка логирования
log_dir = "/var/log/tradebot"
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # Логи в файл (ротация каждый день)
        logging.handlers.TimedRotatingFileHandler(
            f"{log_dir}/bot.log",
            when="midnight",
            interval=1,
            backupCount=30
        ),
        # Логи в консоль
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Улучшенный обработчик ошибок
async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Детальное логирование ошибок"""
    
    # Получаем информацию об ошибке
    error_info = {
        'timestamp': datetime.now().isoformat(),
        'error': str(context.error),
        'traceback': traceback.format_exc(),
        'update': str(update) if update else 'No update',
        'user_id': update.effective_user.id if update and update.effective_user else None
    }
    
    # Логируем в файл
    logger.error(f"Bot error occurred: {error_info}")
    
    # Отправляем критические ошибки в Telegram
    if "critical" in str(context.error).lower():
        await send_error_notification(error_info)

async def send_error_notification(error_info):
    """Отправка критических ошибок в Telegram"""
    try:
        message = f"""
🚨 <b>Critical Bot Error</b>

<b>Time:</b> {error_info['timestamp']}
<b>Error:</b> <code>{error_info['error']}</code>
<b>User ID:</b> {error_info['user_id']}

<b>Traceback:</b>
<pre>{error_info['traceback'][:1000]}...</pre>
        """
        
        # Отправляем себе в Telegram
        await context.bot.send_message(
            chat_id="YOUR_ADMIN_CHAT_ID",
            text=message,
            parse_mode="HTML"
        )
    except:
        pass  # Не ломаем основной процесс
```

### **🌐 Логи Frontend (JavaScript)**

```javascript
// Добавить в app.js
class ErrorLogger {
    constructor() {
        this.endpoint = '/api/log-error';  // Можно использовать Supabase
        this.setupGlobalErrorHandling();
    }
    
    setupGlobalErrorHandling() {
        // Перехватываем все JavaScript ошибки
        window.addEventListener('error', (event) => {
            this.logError({
                type: 'javascript_error',
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                user_agent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            });
        });
        
        // Перехватываем необработанные Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                type: 'unhandled_promise_rejection',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                user_agent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            });
        });
    }
    
    async logError(errorData) {
        try {
            // Добавляем информацию о пользователе
            errorData.user_id = window.userManager?.getUserId();
            errorData.session_id = this.getSessionId();
            
            // Отправляем в Supabase
            await window.supabase
                .from('error_logs')
                .insert(errorData);
                
            console.error('Error logged:', errorData);
        } catch (e) {
            console.error('Failed to log error:', e);
        }
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('session_id', sessionId);
        }
        return sessionId;
    }
    
    // Ручное логирование ошибок
    logCustomError(message, context = {}) {
        this.logError({
            type: 'custom_error',
            message,
            context: JSON.stringify(context),
            user_agent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
        });
    }
}

// Инициализация
window.errorLogger = new ErrorLogger();
```

**Где хранятся логи:**
- **Bot логи:** `/var/log/tradebot/bot.log` на VPS
- **Frontend ошибки:** Таблица `error_logs` в Supabase
- **Системные логи:** `/var/log/syslog` на VPS

---

## 📈 **3. ПОЛЬЗОВАТЕЛЬСКАЯ АНАЛИТИКА**

### **📊 Что отслеживаем:**

```javascript
// analytics.js - система аналитики
class UserAnalytics {
    constructor() {
        this.events = [];
        this.sessionStart = Date.now();
        this.setupEventTracking();
    }
    
    setupEventTracking() {
        // Автоматические события
        this.trackEvent('session_start', {
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        // Отслеживание времени на странице
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session_end', {
                duration: Date.now() - this.sessionStart
            });
        });
    }
    
    trackEvent(eventName, properties = {}) {
        const event = {
            event_name: eventName,
            user_id: window.userManager?.getUserId(),
            session_id: this.getSessionId(),
            timestamp: new Date().toISOString(),
            properties: {
                ...properties,
                url: window.location.href,
                referrer: document.referrer
            }
        };
        
        // Отправляем в Supabase
        this.sendToDatabase(event);
        
        // Сохраняем локально для офлайн режима
        this.events.push(event);
        
        console.log('📊 Event tracked:', eventName, properties);
    }
    
    async sendToDatabase(event) {
        try {
            await window.supabase
                .from('user_events')
                .insert(event);
        } catch (error) {
            console.error('Failed to send analytics event:', error);
        }
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('analytics_session_id', sessionId);
        }
        return sessionId;
    }
}

// Инициализация аналитики
window.analytics = new UserAnalytics();

// Интеграция с существующими функциями
const originalOpenModal = window.openModal;
window.openModal = function() {
    window.analytics.trackEvent('strategy_creation_started');
    return originalOpenModal.apply(this, arguments);
};

const originalSaveStrategy = window.saveStrategy;
window.saveStrategy = function() {
    window.analytics.trackEvent('strategy_created', {
        strategy_name: document.getElementById('strategyName')?.value
    });
    return originalSaveStrategy.apply(this, arguments);
};

// Отслеживание анализов
const originalStartAnalysis = window.startNewAnalysis;
if (originalStartAnalysis) {
    window.startNewAnalysis = function() {
        window.analytics.trackEvent('analysis_started');
        return originalStartAnalysis.apply(this, arguments);
    };
}
```

### **📊 Дашборд аналитики**

**SQL запросы для дашборда:**
```sql
-- Создание таблиц для аналитики
CREATE TABLE user_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    user_id UUID,
    session_id VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE error_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    message TEXT,
    stack TEXT,
    user_id UUID,
    session_id VARCHAR(100),
    user_agent TEXT,
    url TEXT,
    timestamp TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX idx_user_events_user_id ON user_events(user_id);
CREATE INDEX idx_user_events_event_name ON user_events(event_name);
CREATE INDEX idx_user_events_timestamp ON user_events(timestamp);
CREATE INDEX idx_error_logs_type ON error_logs(type);
CREATE INDEX idx_error_logs_timestamp ON error_logs(timestamp);

-- Полезные запросы для аналитики
-- Активные пользователи за день
SELECT COUNT(DISTINCT user_id) as daily_active_users
FROM user_events 
WHERE timestamp >= NOW() - INTERVAL '1 day';

-- Топ событий
SELECT event_name, COUNT(*) as count
FROM user_events 
WHERE timestamp >= NOW() - INTERVAL '7 days'
GROUP BY event_name 
ORDER BY count DESC;

-- Конверсия: регистрация -> создание стратегии
WITH registrations AS (
    SELECT user_id FROM user_events 
    WHERE event_name = 'user_registered' 
    AND timestamp >= NOW() - INTERVAL '7 days'
),
strategy_creators AS (
    SELECT DISTINCT user_id FROM user_events 
    WHERE event_name = 'strategy_created' 
    AND timestamp >= NOW() - INTERVAL '7 days'
)
SELECT 
    COUNT(r.user_id) as registered_users,
    COUNT(s.user_id) as strategy_creators,
    ROUND(COUNT(s.user_id)::numeric / COUNT(r.user_id) * 100, 2) as conversion_rate
FROM registrations r
LEFT JOIN strategy_creators s ON r.user_id = s.user_id;
```

---

## 🎯 **4. ДАШБОРД МОНИТОРИНГА**

### **📊 Где все это будет отображаться:**

#### **1. Healthchecks.io (Бесплатно)**
- **URL:** https://healthchecks.io
- **Что показывает:** Статус бота (онлайн/офлайн)
- **Уведомления:** Email, Telegram, Slack
- **Графики:** Время отклика, аптайм

#### **2. Supabase Dashboard**
- **URL:** https://app.supabase.com/project/your-project
- **Что показывает:** 
  - Количество пользователей
  - Активность в БД
  - Ошибки подключений
  - Использование ресурсов

#### **3. Простой веб-дашборд**
```html
<!-- admin-dashboard.html - простой дашборд -->
<!DOCTYPE html>
<html>
<head>
    <title>TradeAnalyzer Analytics</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>📊 TradeAnalyzer Analytics</h1>
    
    <div class="metrics">
        <div class="metric-card">
            <h3>👥 Active Users (24h)</h3>
            <div id="activeUsers">Loading...</div>
        </div>
        
        <div class="metric-card">
            <h3>📝 Strategies Created</h3>
            <div id="strategiesCount">Loading...</div>
        </div>
        
        <div class="metric-card">
            <h3>📊 Analyses Completed</h3>
            <div id="analysesCount">Loading...</div>
        </div>
        
        <div class="metric-card">
            <h3>🐛 Errors (24h)</h3>
            <div id="errorsCount">Loading...</div>
        </div>
    </div>
    
    <canvas id="userActivityChart"></canvas>
    
    <script>
        // Загрузка данных из Supabase и отображение графиков
        async function loadAnalytics() {
            // Подключение к Supabase
            // Загрузка метрик
            // Построение графиков
        }
        
        loadAnalytics();
        setInterval(loadAnalytics, 60000); // Обновление каждую минуту
    </script>
</body>
</html>
```

---

## 💰 **СТОИМОСТЬ СИСТЕМЫ МОНИТОРИНГА**

### **Бесплатные компоненты:**
- ✅ **Healthchecks.io** - до 20 проверок бесплатно
- ✅ **Supabase аналитика** - входит в бесплатный план
- ✅ **Telegram уведомления** - бесплатно
- ✅ **Логи на VPS** - место на диске

### **Платные опции (при росте):**
- **Sentry** - $26/месяц за продвинутое отслеживание ошибок
- **Google Analytics** - бесплатно, но сложнее настройка
- **Grafana Cloud** - $49/месяц за красивые дашборды

---

## 🚀 **ПЛАН ВНЕДРЕНИЯ**

### **Неделя 1: Базовый мониторинг**
1. Настроить healthchecks.io
2. Добавить логирование в bot.py
3. Создать таблицы аналитики в Supabase

### **Неделя 2: Аналитика**
1. Внедрить отслеживание событий в app.js
2. Создать простой дашборд
3. Настроить уведомления в Telegram

### **Неделя 3: Оптимизация**
1. Добавить детальные метрики
2. Настроить алерты
3. Создать отчеты

**Результат:** Полная видимость работы системы и поведения пользователей! 📊

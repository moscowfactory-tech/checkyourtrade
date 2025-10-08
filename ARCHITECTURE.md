# TradeAnalyzer v5.0 - Архитектурная документация

## 🏗️ Обзор архитектуры

TradeAnalyzer v5.0 построен на модульной архитектуре с четким разделением ответственности и автоматической системой проверок.

## 📁 Структура проекта

```
Trade_analysis_tg/
├── database/                    # База данных
│   ├── master-schema.sql       # Мастер-схема БД (источник истины)
│   └── database-validator.js   # Валидатор схемы БД
├── modules/                    # Модули приложения
│   └── strategy-manager.js     # Менеджер стратегий
├── core/                       # Ядро системы
│   └── app-initializer.js      # Центральная инициализация
├── legacy/                     # Устаревшие файлы (для совместимости)
└── [основные файлы]           # HTML, CSS, JS
```

## 🔧 Компоненты системы

### 1. Database Layer (Слой БД)
- **master-schema.sql** - единственный источник истины для схемы БД
- **database-validator.js** - автоматическая проверка целостности БД
- Версионирование схемы с таблицей `schema_version`

### 2. Business Logic (Бизнес-логика)
- **StrategyManager** - централизованное управление стратегиями
- **UserManager** - управление пользователями (планируется)
- **AnalysisManager** - управление анализами (планируется)

### 3. Application Core (Ядро приложения)
- **AppInitializer** - централизованная инициализация всех компонентов
- Автоматическая проверка зависимостей
- Graceful handling ошибок инициализации

## 🚀 Процесс инициализации

```mermaid
graph TD
    A[DOM Ready] --> B[AppInitializer.initialize()]
    B --> C[Supabase Connection]
    C --> D[Database Validation]
    D --> E[Telegram Integration]
    E --> F[User Manager]
    F --> G[Strategy Manager]
    G --> H[UI Components]
    H --> I[Application Ready]
```

### Шаги инициализации:
1. **Supabase Connection** - проверка подключения к БД
2. **Database Validation** - валидация схемы БД
3. **Telegram Integration** - инициализация Telegram WebApp
4. **User Manager** - управление пользователями
5. **Strategy Manager** - управление стратегиями
6. **UI Components** - инициализация интерфейса

## 📊 База данных

### Схема БД v1.0

```sql
-- Пользователи
users (
    id UUID PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    created_at TIMESTAMP
)

-- Стратегии
strategies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL,
    user_id UUID REFERENCES users(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP
)

-- Результаты анализа
analysis_results (
    id BIGSERIAL PRIMARY KEY,
    strategy_id BIGINT REFERENCES strategies(id),
    user_id UUID REFERENCES users(id),
    results JSONB NOT NULL,
    total_score INTEGER,
    created_at TIMESTAMP
)
```

### Принципы работы с БД:
- Все операции проходят через менеджеры
- Автоматическая валидация перед операциями
- Graceful fallback при ошибках
- Кэширование данных в памяти

## 🔒 Безопасность

### Row Level Security (RLS)
- Включен для всех таблиц
- Пользователи видят только свои данные
- Публичные стратегии доступны всем

### Валидация данных
- Проверка на клиенте и сервере
- Санитизация входных данных
- Проверка прав доступа

## 🎯 API менеджеров

### StrategyManager
```javascript
// Инициализация
const strategyManager = new StrategyManager(supabase, userManager);
await strategyManager.initialize();

// CRUD операции
const strategy = await strategyManager.createStrategy(data);
await strategyManager.updateStrategy(id, data);
await strategyManager.deleteStrategy(id);
const strategies = strategyManager.getStrategies();
```

### DatabaseValidator
```javascript
// Быстрая проверка
const isValid = await quickDatabaseCheck(supabase);

// Детальная валидация
const validator = new DatabaseValidator(supabase);
const result = await validator.validateDatabase();
```

## 🔄 Система событий

### События приложения:
- `appInitialized` - приложение инициализировано
- `strategyChanged` - изменение стратегии
- `userChanged` - изменение пользователя

### Подписка на события:
```javascript
window.addEventListener('strategyChanged', (event) => {
    const { action, strategy } = event.detail;
    // Обработка изменения стратегии
});
```

## 🚨 Обработка ошибок

### Уровни ошибок:
1. **Critical** - блокируют инициализацию
2. **Warning** - логируются, но не блокируют
3. **Info** - информационные сообщения

### Стратегии восстановления:
- Автоматический retry для сетевых ошибок
- Fallback к локальным данным
- Graceful degradation функциональности

## 📈 Мониторинг и отладка

### Логирование:
- Структурированные логи с префиксами
- Разные уровни детализации
- Автоматическое логирование ошибок

### Отладка:
```javascript
// Статус инициализации
console.log(window.appInitializer.getInitializationStatus());

// Проверка БД
await window.quickDatabaseCheck(window.supabase);

// Статус менеджеров
console.log(window.appInitializer.getManager('strategyManager'));
```

## 🔧 Разработка и деплой

### Процесс изменения схемы БД:
1. Обновить `master-schema.sql`
2. Создать миграцию (если нужно)
3. Обновить версию в `schema_version`
4. Протестировать с `DatabaseValidator`

### Добавление нового менеджера:
1. Создать класс в `modules/`
2. Добавить в `AppInitializer`
3. Обновить документацию

### Правила коммитов:
- Один коммит = одна логическая единица изменений
- Обязательное тестирование перед коммитом
- Обновление версии при breaking changes

## 🎯 Планы развития

### v5.1:
- UserManager для централизованного управления пользователями
- AnalysisManager для управления анализами
- Система миграций БД

### v5.2:
- Offline режим с синхронизацией
- Расширенная система событий
- Метрики и аналитика

### v6.0:
- Микросервисная архитектура
- GraphQL API
- Real-time обновления

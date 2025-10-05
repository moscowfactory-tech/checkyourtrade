# 🚀 Инструкция по настройке Supabase для TradeAnalyzer

## Шаг 1: Создание проекта
1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Войдите через GitHub или создайте аккаунт
4. Создайте новый проект:
   - Name: `TradeAnalyzer`
   - Database Password: (создайте надежный пароль)
   - Region: `Central EU (Frankfurt)`

## Шаг 2: Получение API ключей
1. Откройте ваш проект в Dashboard
2. Перейдите в **Settings → API**
3. Скопируйте:
   - **Project URL** (например: `https://abcdefgh.supabase.co`)
   - **anon public** ключ (длинная строка)

## Шаг 3: Настройка конфигурации
1. Откройте файл `supabase-config.js`
2. Замените `YOUR_SUPABASE_URL` на ваш Project URL
3. Замените `YOUR_SUPABASE_ANON_KEY` на ваш anon public ключ

## Шаг 4: Создание таблиц
1. В Dashboard перейдите в **SQL Editor**
2. Создайте новый запрос
3. Скопируйте и выполните следующий SQL:

```sql
-- Таблица для стратегий
CREATE TABLE strategies (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для анализов
CREATE TABLE analyses (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    strategy_id BIGINT REFERENCES strategies(id) ON DELETE CASCADE,
    strategy_name VARCHAR(255) NOT NULL,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);

-- Row Level Security
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Политики безопасности для стратегий
CREATE POLICY "Users can manage own strategies" ON strategies
    FOR ALL USING (auth.uid() = user_id);

-- Политики безопасности для анализов  
CREATE POLICY "Users can manage own analyses" ON analyses
    FOR ALL USING (auth.uid() = user_id);
```

## Шаг 5: Проверка подключения
1. Откройте приложение в браузере
2. Откройте Developer Tools (F12)
3. В консоли должно появиться: "Supabase initialized successfully"
4. Если есть ошибки - проверьте правильность API ключей

## Шаг 6: Тестирование
1. Создайте новую стратегию
2. Проведите анализ
3. Проверьте, что данные сохраняются в Supabase Dashboard в разделе **Table Editor**

## 🔧 Troubleshooting

### Ошибка "Failed to initialize Supabase client"
- Проверьте правильность URL и API ключа
- Убедитесь, что проект активен в Dashboard

### Ошибка "Row Level Security"
- Убедитесь, что выполнили все SQL команды
- Проверьте политики в разделе **Authentication → Policies**

### Данные не сохраняются
- Откройте Network tab в Developer Tools
- Проверьте, есть ли ошибки в запросах к Supabase
- Временно приложение будет использовать localStorage как fallback

## 📞 Поддержка
Если возникли проблемы:
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что все файлы загружены корректно
3. Проверьте статус проекта в Supabase Dashboard

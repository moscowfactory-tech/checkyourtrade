-- ИСПРАВЛЕНИЕ СХЕМЫ БД TradeAnalyzer
-- Выполните этот SQL в Supabase SQL Editor

-- 1. Удаляем все существующие таблицы (если есть)
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS field_inputs CASCADE;
DROP TABLE IF EXISTS strategy_fields CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS telegram_users CASCADE;

-- 2. Создаем таблицу пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создаем таблицу стратегий (упрощенная структура)
CREATE TABLE strategies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Создаем таблицу результатов анализа
CREATE TABLE analysis_results (
    id BIGSERIAL PRIMARY KEY,
    strategy_id BIGINT REFERENCES strategies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Создаем индексы для производительности
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_is_public ON strategies(is_public);
CREATE INDEX idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX idx_analysis_results_strategy_id ON analysis_results(strategy_id);
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);

-- 6. Включаем Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- 7. Создаем политики безопасности (разрешаем все для тестирования)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on strategies" ON strategies FOR ALL USING (true);
CREATE POLICY "Allow all operations on analysis_results" ON analysis_results FOR ALL USING (true);

-- 8. Добавляем тестовые данные
INSERT INTO users (telegram_id, username, first_name) VALUES 
(545716922, 'test_user', 'Test User');

INSERT INTO strategies (name, description, fields, user_id) 
SELECT 
    'Скальпинг на M1',
    'Быстрые сделки на минутном таймфрейме',
    '[
        {
            "name": "Технический анализ",
            "description": "Анализ графика и индикаторов",
            "inputs": [
                {
                    "type": "select",
                    "label": "Направление тренда",
                    "required": true,
                    "options": ["Восходящий", "Нисходящий", "Боковой"]
                },
                {
                    "type": "select",
                    "label": "Сигнал RSI",
                    "required": true,
                    "options": ["Перекупленность", "Перепроданность", "Нейтральная зона"]
                }
            ]
        },
        {
            "name": "Управление рисками",
            "description": "Контроль рисков и позиции",
            "inputs": [
                {
                    "type": "select",
                    "label": "Размер позиции корректен?",
                    "required": true,
                    "options": ["Да", "Нет"]
                },
                {
                    "type": "select",
                    "label": "Stop Loss установлен?",
                    "required": true,
                    "options": ["Да", "Нет"]
                }
            ]
        }
    ]'::jsonb,
    u.id
FROM users u WHERE u.telegram_id = 545716922;

-- 9. Проверяем результат
SELECT 'USERS' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'STRATEGIES' as table_name, COUNT(*) as count FROM strategies
UNION ALL
SELECT 'ANALYSIS_RESULTS' as table_name, COUNT(*) as count FROM analysis_results;

-- 10. Показываем структуру таблиц
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('users', 'strategies', 'analysis_results')
ORDER BY table_name, ordinal_position;

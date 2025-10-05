-- Полное пересоздание структуры базы данных TradeAnalyzer
-- Выполните этот скрипт в Supabase SQL Editor

-- 1. Удаляем все существующие таблицы (в правильном порядке)
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS field_inputs CASCADE;
DROP TABLE IF EXISTS strategy_fields CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Создаем таблицу пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Создаем основную таблицу стратегий (упрощенная структура)
CREATE TABLE strategies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Создаем таблицу результатов анализа
CREATE TABLE analysis_results (
    id BIGSERIAL PRIMARY KEY,
    strategy_id BIGINT REFERENCES strategies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Создаем индексы для производительности
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_is_public ON strategies(is_public);
CREATE INDEX idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX idx_analysis_results_strategy_id ON analysis_results(strategy_id);
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);

-- 6. Включаем Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- 7. Создаем политики безопасности (временно разрешаем все)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on strategies" ON strategies FOR ALL USING (true);
CREATE POLICY "Allow all operations on analysis_results" ON analysis_results FOR ALL USING (true);

-- 8. Добавляем примеры стратегий
INSERT INTO strategies (name, description, fields) VALUES 
(
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
    ]'::jsonb
),
(
    'Свинг трейдинг',
    'Среднесрочные позиции на дневном таймфрейме',
    '[
        {
            "name": "Фундментальный анализ",
            "description": "Анализ новостей и экономических данных",
            "inputs": [
                {
                    "type": "select",
                    "label": "Экономический календарь проверен?",
                    "required": true,
                    "options": ["Да", "Нет"]
                },
                {
                    "type": "select",
                    "label": "Настроения рынка",
                    "required": true,
                    "options": ["Бычьи", "Медвежьи", "Нейтральные"]
                }
            ]
        },
        {
            "name": "Технические уровни",
            "description": "Анализ поддержки и сопротивления",
            "inputs": [
                {
                    "type": "select",
                    "label": "Уровень поддержки/сопротивления найден?",
                    "required": true,
                    "options": ["Да", "Нет"]
                },
                {
                    "type": "select",
                    "label": "Объем торгов",
                    "required": true,
                    "options": ["Высокий", "Средний", "Низкий"]
                }
            ]
        }
    ]'::jsonb
);

-- 9. Проверяем результат
SELECT 
    'strategies' as table_name, 
    COUNT(*) as record_count,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM strategies
UNION ALL
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM users
UNION ALL
SELECT 
    'analysis_results' as table_name, 
    COUNT(*) as record_count,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM analysis_results;

-- 10. Показываем структуру таблицы strategies
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'strategies'
ORDER BY ordinal_position;

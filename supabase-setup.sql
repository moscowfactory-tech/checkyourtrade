-- ========================================
-- SUPABASE SETUP SCRIPT
-- Полная настройка БД для TradeAnalyzer
-- ========================================

-- 1. УДАЛЯЕМ ВСЕ СУЩЕСТВУЮЩИЕ ТАБЛИЦЫ (если есть)
DROP TABLE IF EXISTS analysis_results CASCADE;
DROP TABLE IF EXISTS analyses CASCADE;
DROP TABLE IF EXISTS strategies CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS schema_version CASCADE;

-- 2. СОЗДАЕМ ТАБЛИЦУ ВЕРСИЙ СХЕМЫ
CREATE TABLE schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Вставляем текущую версию
INSERT INTO schema_version (version, description) 
VALUES ('1.0', 'Initial TradeAnalyzer schema');

-- 3. СОЗДАЕМ ТАБЛИЦУ ПОЛЬЗОВАТЕЛЕЙ
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. СОЗДАЕМ ТАБЛИЦУ СТРАТЕГИЙ
CREATE TABLE strategies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. СОЗДАЕМ ТАБЛИЦУ РЕЗУЛЬТАТОВ АНАЛИЗА
CREATE TABLE analysis_results (
    id BIGSERIAL PRIMARY KEY,
    strategy_id BIGINT NOT NULL REFERENCES strategies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. СОЗДАЕМ ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_is_public ON strategies(is_public);
CREATE INDEX idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX idx_strategies_name ON strategies(name);

CREATE INDEX idx_analysis_results_strategy_id ON analysis_results(strategy_id);
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_created_at ON analysis_results(created_at DESC);

-- 7. СОЗДАЕМ ФУНКЦИИ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ TIMESTAMPS
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. СОЗДАЕМ ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at 
    BEFORE UPDATE ON strategies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. ВКЛЮЧАЕМ ROW LEVEL SECURITY (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- 10. СОЗДАЕМ ПОЛИТИКИ БЕЗОПАСНОСТИ

-- Политики для таблицы users
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (true); -- Временно разрешаем всем

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (true); -- Временно разрешаем всем

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (true); -- Временно разрешаем всем

-- Политики для таблицы strategies
CREATE POLICY "Users can view public strategies and their own" ON strategies
    FOR SELECT USING (is_public = true OR auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own strategies" ON strategies
    FOR INSERT WITH CHECK (true); -- Временно разрешаем всем

CREATE POLICY "Users can update their own strategies" ON strategies
    FOR UPDATE USING (true); -- Временно разрешаем всем

CREATE POLICY "Users can delete their own strategies" ON strategies
    FOR DELETE USING (true); -- Временно разрешаем всем

-- Политики для таблицы analysis_results
CREATE POLICY "Users can view their own analysis results" ON analysis_results
    FOR SELECT USING (true); -- Временно разрешаем всем

CREATE POLICY "Users can insert their own analysis results" ON analysis_results
    FOR INSERT WITH CHECK (true); -- Временно разрешаем всем

-- 11. ДОБАВЛЯЕМ ТЕСТОВЫЕ ДАННЫЕ
INSERT INTO users (telegram_id, username, first_name) VALUES 
(545716922, 'test_user', 'Test User');

-- Получаем ID тестового пользователя
DO $$
DECLARE
    test_user_id UUID;
BEGIN
    SELECT id INTO test_user_id FROM users WHERE telegram_id = 545716922;
    
    -- Добавляем тестовую стратегию
    INSERT INTO strategies (name, description, fields, user_id) VALUES 
    (
        'Тестовая стратегия скальпинга',
        'Быстрые сделки на минутном таймфрейме с четкими правилами входа и выхода',
        '[
            {
                "name": "Технический анализ",
                "description": "Анализ графика и индикаторов перед входом в позицию",
                "inputs": [
                    {
                        "type": "select",
                        "label": "Направление тренда на старшем ТФ",
                        "required": true,
                        "options": ["Восходящий", "Нисходящий", "Боковой"]
                    },
                    {
                        "type": "select",
                        "label": "Сигнал RSI (14)",
                        "required": true,
                        "options": ["Перекупленность (>70)", "Перепроданность (<30)", "Нейтральная зона"]
                    },
                    {
                        "type": "select",
                        "label": "Пробой уровня поддержки/сопротивления",
                        "required": true,
                        "options": ["Да, четкий пробой", "Нет пробоя", "Ложный пробой"]
                    }
                ]
            },
            {
                "name": "Управление рисками",
                "description": "Контроль рисков и размера позиции",
                "inputs": [
                    {
                        "type": "select",
                        "label": "Размер позиции не превышает 2% депозита?",
                        "required": true,
                        "options": ["Да", "Нет"]
                    },
                    {
                        "type": "select",
                        "label": "Stop Loss установлен?",
                        "required": true,
                        "options": ["Да, установлен", "Нет"]
                    },
                    {
                        "type": "select",
                        "label": "Take Profit определен?",
                        "required": true,
                        "options": ["Да, определен", "Частично", "Нет"]
                    }
                ]
            }
        ]'::jsonb,
        test_user_id
    );
END $$;

-- 12. ПРОВЕРЯЕМ РЕЗУЛЬТАТ
SELECT 'SETUP COMPLETED SUCCESSFULLY!' as status;

SELECT 'Tables created:' as info;
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'strategies', 'analysis_results', 'schema_version')
ORDER BY tablename;

SELECT 'Records count:' as info;
SELECT 
    'users' as table_name, 
    COUNT(*) as records 
FROM users
UNION ALL
SELECT 
    'strategies' as table_name, 
    COUNT(*) as records 
FROM strategies
UNION ALL
SELECT 
    'analysis_results' as table_name, 
    COUNT(*) as records 
FROM analysis_results;

SELECT 'Test user data:' as info;
SELECT 
    u.telegram_id,
    u.username,
    u.first_name,
    COUNT(s.id) as strategies_count
FROM users u
LEFT JOIN strategies s ON u.id = s.user_id
WHERE u.telegram_id = 545716922
GROUP BY u.id, u.telegram_id, u.username, u.first_name;

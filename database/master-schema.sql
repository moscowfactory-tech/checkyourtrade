-- ========================================
-- MASTER DATABASE SCHEMA v1.0
-- TradeAnalyzer - Единый источник истины
-- ========================================

-- ВЕРСИЯ СХЕМЫ
CREATE TABLE IF NOT EXISTS schema_version (
    version VARCHAR(10) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    description TEXT
);

-- Вставляем текущую версию
INSERT INTO schema_version (version, description) 
VALUES ('1.0', 'Initial master schema') 
ON CONFLICT (version) DO NOTHING;

-- ========================================
-- ОСНОВНЫЕ ТАБЛИЦЫ
-- ========================================

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_id BIGINT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица стратегий
CREATE TABLE IF NOT EXISTS strategies (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица результатов анализа
CREATE TABLE IF NOT EXISTS analysis_results (
    id BIGSERIAL PRIMARY KEY,
    strategy_id BIGINT REFERENCES strategies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ========================================

CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_is_public ON strategies(is_public);
CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_results_strategy_id ON analysis_results(strategy_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at DESC);

-- ========================================
-- ФУНКЦИИ И ТРИГГЕРЫ
-- ========================================

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strategies_updated_at ON strategies;
CREATE TRIGGER update_strategies_updated_at 
    BEFORE UPDATE ON strategies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Политики безопасности (временно разрешаем все)
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on strategies" ON strategies;
CREATE POLICY "Allow all operations on strategies" ON strategies FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on analysis_results" ON analysis_results;
CREATE POLICY "Allow all operations on analysis_results" ON analysis_results FOR ALL USING (true);

-- ========================================
-- ВАЛИДАЦИЯ СХЕМЫ
-- ========================================

-- Функция проверки целостности схемы
CREATE OR REPLACE FUNCTION validate_schema()
RETURNS TABLE(
    table_name TEXT,
    status TEXT,
    details TEXT
) AS $$
BEGIN
    -- Проверяем существование таблиц
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        CASE 
            WHEN t.table_name IS NOT NULL THEN 'OK'
            ELSE 'MISSING'
        END::TEXT as status,
        CASE 
            WHEN t.table_name IS NOT NULL THEN 'Table exists'
            ELSE 'Table missing'
        END::TEXT as details
    FROM (VALUES 
        ('users'),
        ('strategies'), 
        ('analysis_results'),
        ('schema_version')
    ) AS expected(table_name)
    LEFT JOIN information_schema.tables t 
        ON t.table_name = expected.table_name 
        AND t.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- ТЕСТОВЫЕ ДАННЫЕ (опционально)
-- ========================================

-- Добавляем тестового пользователя если его нет
INSERT INTO users (telegram_id, username, first_name) 
VALUES (545716922, 'test_user', 'Test User')
ON CONFLICT (telegram_id) DO NOTHING;

-- Проверяем результат
SELECT 'Schema validation:' as info;
SELECT * FROM validate_schema();

SELECT 'Tables count:' as info;
SELECT 
    'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 
    'strategies' as table_name, COUNT(*) as records FROM strategies
UNION ALL
SELECT 
    'analysis_results' as table_name, COUNT(*) as records FROM analysis_results;

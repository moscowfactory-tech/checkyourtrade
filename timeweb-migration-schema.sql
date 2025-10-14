-- СХЕМА БД ДЛЯ TIMEWEB (без RLS, с упрощенной аутентификацией)
-- Миграция с Supabase на Timeweb PostgreSQL

-- Создание расширений
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Создание таблицы пользователей (упрощенная версия)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id TEXT UNIQUE NOT NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы стратегий (без RLS)
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id TEXT, -- Добавляем для совместимости
    name TEXT NOT NULL,
    description TEXT,
    fields JSONB, -- Упрощаем структуру - все поля в JSONB
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы анализов (упрощенная версия)
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id TEXT, -- Добавляем для совместимости
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    strategy_name TEXT, -- Денормализация для быстрого доступа
    coin TEXT,
    answers JSONB,
    positive_factors JSONB,
    negative_factors JSONB,
    neutral_factors JSONB,
    recommendation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Создание пользователя для приложения
CREATE USER tradeanalyzer_app WITH PASSWORD 'SECURE_PASSWORD_HERE';
GRANT CONNECT ON DATABASE tradeanalyzer TO tradeanalyzer_app;
GRANT USAGE ON SCHEMA public TO tradeanalyzer_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tradeanalyzer_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tradeanalyzer_app;

-- Предоставляем права на будущие таблицы
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tradeanalyzer_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO tradeanalyzer_app;

-- Создание представлений для совместимости с текущим кодом
CREATE VIEW analysis_results AS 
SELECT 
    id,
    user_id,
    strategy_id,
    answers,
    positive_factors,
    negative_factors,
    neutral_factors,
    recommendation,
    created_at
FROM analyses;

-- Функции для миграции данных
CREATE OR REPLACE FUNCTION migrate_user_data(
    p_telegram_id TEXT,
    p_username TEXT DEFAULT NULL,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Проверяем, существует ли пользователь
    SELECT id INTO user_uuid FROM users WHERE telegram_id = p_telegram_id;
    
    IF user_uuid IS NULL THEN
        -- Создаем нового пользователя
        INSERT INTO users (telegram_id, username, first_name, last_name)
        VALUES (p_telegram_id, p_username, p_first_name, p_last_name)
        RETURNING id INTO user_uuid;
    END IF;
    
    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Функция для получения статистики пользователя
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

COMMENT ON COLUMN strategies.fields IS 'JSONB структура полей стратегии';
COMMENT ON COLUMN analyses.positive_factors IS 'Положительные факторы анализа';
COMMENT ON COLUMN analyses.negative_factors IS 'Отрицательные факторы анализа';
COMMENT ON COLUMN analyses.neutral_factors IS 'Нейтральные факторы анализа';

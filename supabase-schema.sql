-- TradeAnalyzer Database Schema
-- Создание таблиц для Supabase

-- Включаем Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Таблица для стратегий
CREATE TABLE IF NOT EXISTS strategies (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для анализов
CREATE TABLE IF NOT EXISTS analyses (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    strategy_id BIGINT REFERENCES strategies(id) ON DELETE CASCADE,
    strategy_name VARCHAR(255) NOT NULL,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_strategy_id ON analyses(strategy_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- Row Level Security политики
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Политики для стратегий
CREATE POLICY "Users can view own strategies" ON strategies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategies" ON strategies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategies" ON strategies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategies" ON strategies
    FOR DELETE USING (auth.uid() = user_id);

-- Политики для анализов
CREATE POLICY "Users can view own analyses" ON analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses" ON analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses" ON analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses" ON analyses
    FOR DELETE USING (auth.uid() = user_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at в таблице strategies
CREATE TRIGGER update_strategies_updated_at 
    BEFORE UPDATE ON strategies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Вставка примеров данных (опционально)
-- INSERT INTO strategies (user_id, name, description, fields) VALUES
-- (auth.uid(), 'Пример стратегии', 'Описание примера', '[{"name": "Анализ тренда", "description": "Определение направления тренда", "inputs": []}]'::jsonb);

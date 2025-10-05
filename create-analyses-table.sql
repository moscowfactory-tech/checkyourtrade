-- Удаляем старую таблицу если есть
DROP TABLE IF EXISTS analyses;

-- Создание правильной таблицы анализов
CREATE TABLE analyses (
    id BIGSERIAL PRIMARY KEY,
    strategy_id TEXT,
    strategy_name TEXT NOT NULL,
    coin TEXT,
    positive_factors JSONB DEFAULT '[]'::jsonb,
    negative_factors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Отключаем RLS для публичного доступа
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;

-- Создаем индексы для оптимизации
CREATE INDEX idx_analyses_created_at ON analyses(created_at);
CREATE INDEX idx_analyses_strategy_id ON analyses(strategy_id);

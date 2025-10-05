-- Создание таблиц для TradeAnalyzer
-- Выполните этот SQL в Supabase SQL Editor

-- Таблица для стратегий
CREATE TABLE IF NOT EXISTS strategies (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица для анализов
CREATE TABLE IF NOT EXISTS analyses (
    id BIGSERIAL PRIMARY KEY,
    strategy_id BIGINT REFERENCES strategies(id) ON DELETE CASCADE,
    strategy_name VARCHAR(255) NOT NULL,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_strategy_id ON analyses(strategy_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_strategies_updated_at ON strategies;
CREATE TRIGGER update_strategies_updated_at 
    BEFORE UPDATE ON strategies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Вставка примера стратегии для тестирования
INSERT INTO strategies (name, description, fields) VALUES
('Технический анализ движения', 'Анализ технических индикаторов и движения цены', 
'[
    {
        "name": "Анализ тренда",
        "description": "Определение направления основного тренда",
        "inputs": [
            {"label": "Направление тренда", "type": "select", "options": ["Восходящий", "Нисходящий", "Боковой"]},
            {"label": "Сила тренда", "type": "select", "options": ["Сильный", "Умеренный", "Слабый"]}
        ]
    },
    {
        "name": "Уровни поддержки и сопротивления",
        "description": "Анализ ключевых уровней",
        "inputs": [
            {"label": "Близость к поддержке", "type": "select", "options": ["Очень близко", "Близко", "Далеко"]},
            {"label": "Качество уровня", "type": "select", "options": ["Сильный", "Средний", "Слабый"]}
        ]
    }
]'::jsonb)
ON CONFLICT DO NOTHING;

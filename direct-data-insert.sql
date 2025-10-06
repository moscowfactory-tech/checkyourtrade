-- Прямая вставка данных в таблицу analyses для тестирования
-- Этот скрипт можно выполнить напрямую в Supabase SQL Editor

-- 1. Проверяем существование таблицы analyses
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analyses') THEN
        -- Создаем таблицу analyses если не существует
        CREATE TABLE analyses (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT,
            strategy_id TEXT,
            strategy_name TEXT NOT NULL,
            coin TEXT,
            positive_factors JSONB DEFAULT '[]'::jsonb,
            negative_factors JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Создаем индексы
        CREATE INDEX idx_analyses_user_id ON analyses(user_id);
        CREATE INDEX idx_analyses_created_at ON analyses(created_at);
        
        -- Отключаем RLS для простоты
        ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 2. Вставляем тестовые данные
INSERT INTO analyses (user_id, strategy_id, strategy_name, coin, positive_factors, negative_factors)
VALUES
    ('123456789', '1', 'Фундаментальный анализ', 'BTC', 
     '[{"name": "Рыночная капитализация", "value": "Высокая"}, {"name": "Объем торгов", "value": "Высокий"}]'::jsonb,
     '[{"name": "Волатильность", "value": "Высокая"}]'::jsonb),
    ('123456789', '2', 'Технический анализ', 'ETH', 
     '[{"name": "Тренд", "value": "Восходящий"}, {"name": "RSI", "value": "Нейтральный"}]'::jsonb,
     '[{"name": "Объем", "value": "Снижается"}]'::jsonb),
    ('123456789', '3', 'Свинг-трейдинг', 'SOL', 
     '[{"name": "Уровни поддержки", "value": "Сильные"}, {"name": "Momentum", "value": "Положительный"}]'::jsonb,
     '[{"name": "Сопротивление", "value": "Близко"}]'::jsonb),
    ('123456789', '4', 'Скальпинг', 'DOGE', 
     '[{"name": "Спред", "value": "Низкий"}, {"name": "Ликвидность", "value": "Высокая"}]'::jsonb,
     '[{"name": "Волатильность", "value": "Низкая"}]'::jsonb),
    ('123456789', '5', 'Долгосрочное инвестирование', 'ADA', 
     '[{"name": "Команда", "value": "Сильная"}, {"name": "Технология", "value": "Инновационная"}]'::jsonb,
     '[{"name": "Конкуренция", "value": "Высокая"}]'::jsonb);

-- 3. Проверяем существование таблицы strategies
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'strategies') THEN
        -- Создаем таблицу strategies если не существует
        CREATE TABLE strategies (
            id BIGSERIAL PRIMARY KEY,
            user_id TEXT,
            name TEXT NOT NULL,
            description TEXT,
            fields JSONB DEFAULT '[]'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Создаем индексы
        CREATE INDEX idx_strategies_user_id ON strategies(user_id);
        
        -- Отключаем RLS для простоты
        ALTER TABLE strategies DISABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- 4. Вставляем тестовые стратегии
INSERT INTO strategies (user_id, name, description, fields)
VALUES
    ('123456789', 'Фундаментальный анализ', 'Анализ фундаментальных показателей актива', 
     '[{"id": 1, "name": "Рыночная капитализация", "description": "Оценка общей стоимости актива"}, 
       {"id": 2, "name": "Объем торгов", "description": "Ликвидность актива на рынке"}, 
       {"id": 3, "name": "Команда проекта", "description": "Оценка команды разработчиков"}]'::jsonb),
    ('123456789', 'Технический анализ', 'Анализ графиков и индикаторов', 
     '[{"id": 1, "name": "Тренд", "description": "Определение направления движения цены"}, 
       {"id": 2, "name": "Уровни поддержки и сопротивления", "description": "Ключевые ценовые уровни"}, 
       {"id": 3, "name": "Индикаторы", "description": "Технические индикаторы (RSI, MACD и т.д.)"}]'::jsonb),
    ('123456789', 'Свинг-трейдинг', 'Стратегия среднесрочной торговли', 
     '[{"id": 1, "name": "Волатильность", "description": "Оценка колебаний цены"}, 
       {"id": 2, "name": "Объем", "description": "Анализ объемов торгов"}, 
       {"id": 3, "name": "Momentum", "description": "Оценка силы движения цены"}]'::jsonb);

-- 5. Вывод количества записей для проверки
SELECT 'analyses' as table_name, COUNT(*) as count FROM analyses;
SELECT 'strategies' as table_name, COUNT(*) as count FROM strategies;

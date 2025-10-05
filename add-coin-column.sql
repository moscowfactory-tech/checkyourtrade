-- Добавление колонки 'coin' в таблицу analyses

-- Проверяем, существует ли колонка, и добавляем её если нет
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'analyses' 
        AND column_name = 'coin'
    ) THEN
        ALTER TABLE analyses ADD COLUMN coin TEXT;
        RAISE NOTICE 'Column coin added to analyses table';
    ELSE
        RAISE NOTICE 'Column coin already exists in analyses table';
    END IF;
END $$;

-- Создаем индекс для оптимизации поиска по монетам
CREATE INDEX IF NOT EXISTS idx_analyses_coin ON analyses(coin);

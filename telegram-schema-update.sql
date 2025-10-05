-- Обновление схемы для поддержки Telegram пользователей
-- Выполните этот SQL в Supabase SQL Editor

-- Добавляем поле telegram_user_id в таблицу strategies
ALTER TABLE strategies 
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT;

-- Добавляем поле telegram_user_id в таблицу analyses
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT;

-- Создаем индексы для telegram_user_id
CREATE INDEX IF NOT EXISTS idx_strategies_telegram_user_id ON strategies(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_telegram_user_id ON analyses(telegram_user_id);

-- Создаем таблицу для хранения данных пользователей Telegram (опционально)
CREATE TABLE IF NOT EXISTS telegram_users (
    id BIGSERIAL PRIMARY KEY,
    telegram_user_id BIGINT UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    username VARCHAR(255),
    language_code VARCHAR(10),
    is_premium BOOLEAN DEFAULT FALSE,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индекс для быстрого поиска по telegram_user_id
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON telegram_users(telegram_user_id);

-- Триггер для автоматического обновления updated_at в telegram_users
DROP TRIGGER IF EXISTS update_telegram_users_updated_at ON telegram_users;
CREATE TRIGGER update_telegram_users_updated_at 
    BEFORE UPDATE ON telegram_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

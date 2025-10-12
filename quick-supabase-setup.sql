-- 🚀 БЫСТРАЯ НАСТРОЙКА SUPABASE ДЛЯ 200 ПОЛЬЗОВАТЕЛЕЙ
-- Выполнить в SQL Editor на supabase.com

-- 1. Включить RLS (Row Level Security) для безопасности
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- 2. Создать простые политики (пока разрешить всем)
-- Это временное решение для быстрого запуска
CREATE POLICY "Allow all operations for now" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON strategies FOR ALL USING (true);
CREATE POLICY "Allow all operations for now" ON analysis_results FOR ALL USING (true);

-- 3. Добавить индексы для производительности
CREATE INDEX IF NOT EXISTS idx_strategies_user_id ON strategies(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_strategies_created_at ON strategies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_created_at ON analysis_results(created_at DESC);

-- 4. Проверить структуру таблиц
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'strategies', 'analysis_results')
ORDER BY table_name, ordinal_position;

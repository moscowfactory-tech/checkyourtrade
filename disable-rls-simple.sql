-- ========================================
-- ПРОСТОЕ ОТКЛЮЧЕНИЕ RLS ДЛЯ TELEGRAM WEBAPP
-- Выполните этот SQL в Supabase Dashboard
-- ========================================

-- 1. ВРЕМЕННО ОТКЛЮЧАЕМ RLS НА ВСЕХ ТАБЛИЦАХ
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE strategies DISABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results DISABLE ROW LEVEL SECURITY;

-- 2. ПРОВЕРЯЕМ РЕЗУЛЬТАТ
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'strategies', 'analysis_results');

-- Результат должен показать rowsecurity = false для всех таблиц

-- 3. ТЕСТОВЫЙ ЗАПРОС
SELECT 'RLS DISABLED - TESTING ACCESS' as status;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_strategies FROM strategies;
SELECT COUNT(*) as total_analyses FROM analysis_results;

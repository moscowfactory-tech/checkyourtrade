-- ========================================
-- FIX RLS POLICIES v2
-- Исправление политик безопасности (обновленная версия)
-- ========================================

-- 1. УДАЛЯЕМ ВСЕ СУЩЕСТВУЮЩИЕ ПОЛИТИКИ (включая те что уже есть)
DROP POLICY IF EXISTS "Users can view public strategies and their own" ON strategies;
DROP POLICY IF EXISTS "Users can insert their own strategies" ON strategies;
DROP POLICY IF EXISTS "Users can update their own strategies" ON strategies;
DROP POLICY IF EXISTS "Users can delete their own strategies" ON strategies;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Users can view their own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can insert their own analysis results" ON analysis_results;

-- УДАЛЯЕМ ПОЛИТИКИ КОТОРЫЕ УЖЕ МОГУТ СУЩЕСТВОВАТЬ
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on strategies" ON strategies;
DROP POLICY IF EXISTS "Allow all operations on analysis_results" ON analysis_results;

-- 2. СОЗДАЕМ НОВЫЕ ПРОСТЫЕ ПОЛИТИКИ

-- Политики для users
CREATE POLICY "users_all_access" ON users
    FOR ALL USING (true);

-- Политики для strategies  
CREATE POLICY "strategies_all_access" ON strategies
    FOR ALL USING (true);

-- Политики для analysis_results
CREATE POLICY "analysis_results_all_access" ON analysis_results
    FOR ALL USING (true);

-- 3. ПРОВЕРЯЕМ РЕЗУЛЬТАТ
SELECT 'RLS POLICIES UPDATED SUCCESSFULLY!' as status;

-- Показываем текущие политики
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ========================================
-- FIX RLS POLICIES
-- Исправление политик безопасности
-- ========================================

-- 1. УДАЛЯЕМ ВСЕ СУЩЕСТВУЮЩИЕ ПОЛИТИКИ
DROP POLICY IF EXISTS "Users can view public strategies and their own" ON strategies;
DROP POLICY IF EXISTS "Users can insert their own strategies" ON strategies;
DROP POLICY IF EXISTS "Users can update their own strategies" ON strategies;
DROP POLICY IF EXISTS "Users can delete their own strategies" ON strategies;

DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

DROP POLICY IF EXISTS "Users can view their own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can insert their own analysis results" ON analysis_results;

-- 2. СОЗДАЕМ ПРОСТЫЕ ПОЛИТИКИ (ВРЕМЕННО РАЗРЕШАЕМ ВСЕ)

-- Политики для users
CREATE POLICY "Allow all operations on users" ON users
    FOR ALL USING (true);

-- Политики для strategies  
CREATE POLICY "Allow all operations on strategies" ON strategies
    FOR ALL USING (true);

-- Политики для analysis_results
CREATE POLICY "Allow all operations on analysis_results" ON analysis_results
    FOR ALL USING (true);

-- 3. ПРОВЕРЯЕМ РЕЗУЛЬТАТ
SELECT 'RLS POLICIES UPDATED!' as status;

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

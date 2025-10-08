-- ========================================
-- SUPABASE CHECK SCRIPT
-- Проверка состояния БД TradeAnalyzer
-- ========================================

-- 1. ПРОВЕРЯЕМ СУЩЕСТВОВАНИЕ ТАБЛИЦ
SELECT 'TABLE EXISTENCE CHECK:' as check_type;

SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status
FROM (
    VALUES 
        ('users'),
        ('strategies'),
        ('analysis_results'),
        ('schema_version')
) AS expected(table_name)
LEFT JOIN information_schema.tables t 
    ON t.table_name = expected.table_name 
    AND t.table_schema = 'public'
ORDER BY expected.table_name;

-- 2. ПРОВЕРЯЕМ СТРУКТУРУ ТАБЛИЦ
SELECT 'TABLE STRUCTURE CHECK:' as check_type;

-- Проверяем колонки таблицы users
SELECT 
    'users' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Проверяем колонки таблицы strategies
SELECT 
    'strategies' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'strategies' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. ПРОВЕРЯЕМ ИНДЕКСЫ
SELECT 'INDEXES CHECK:' as check_type;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'strategies', 'analysis_results')
ORDER BY tablename, indexname;

-- 4. ПРОВЕРЯЕМ RLS ПОЛИТИКИ
SELECT 'RLS POLICIES CHECK:' as check_type;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. ПРОВЕРЯЕМ ДАННЫЕ
SELECT 'DATA CHECK:' as check_type;

-- Количество записей в каждой таблице
SELECT 
    'users' as table_name, 
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM users
UNION ALL
SELECT 
    'strategies' as table_name, 
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM strategies
UNION ALL
SELECT 
    'analysis_results' as table_name, 
    COUNT(*) as record_count,
    MIN(created_at) as oldest_record,
    MAX(created_at) as newest_record
FROM analysis_results;

-- 6. ПРОВЕРЯЕМ СВЯЗИ МЕЖДУ ТАБЛИЦАМИ
SELECT 'RELATIONSHIPS CHECK:' as check_type;

SELECT 
    u.telegram_id,
    u.username,
    u.first_name,
    COUNT(s.id) as strategies_count,
    COUNT(ar.id) as analysis_count
FROM users u
LEFT JOIN strategies s ON u.id = s.user_id
LEFT JOIN analysis_results ar ON u.id = ar.user_id
GROUP BY u.id, u.telegram_id, u.username, u.first_name
ORDER BY u.created_at DESC;

-- 7. ТЕСТ СОЗДАНИЯ ЗАПИСИ (СИМУЛЯЦИЯ)
SELECT 'WRITE TEST SIMULATION:' as check_type;

-- Проверяем, можем ли мы теоретически создать пользователя
SELECT 
    'Can create user with telegram_id 123456789?' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM users WHERE telegram_id = 123456789) 
        THEN '❌ User already exists'
        ELSE '✅ Can create new user'
    END as result;

-- 8. ПРОВЕРЯЕМ ВЕРСИЮ СХЕМЫ
SELECT 'SCHEMA VERSION CHECK:' as check_type;

SELECT 
    version,
    applied_at,
    description
FROM schema_version
ORDER BY applied_at DESC;

-- 9. ФИНАЛЬНЫЙ СТАТУС
SELECT 'FINAL STATUS:' as check_type;

WITH table_counts AS (
    SELECT 
        (SELECT COUNT(*) FROM information_schema.tables 
         WHERE table_schema = 'public' 
         AND table_name IN ('users', 'strategies', 'analysis_results', 'schema_version')) as existing_tables,
        4 as required_tables
),
data_status AS (
    SELECT 
        (SELECT COUNT(*) FROM users) as users_count,
        (SELECT COUNT(*) FROM strategies) as strategies_count
)
SELECT 
    CASE 
        WHEN tc.existing_tables = tc.required_tables 
        THEN '✅ ALL TABLES EXIST'
        ELSE '❌ MISSING TABLES: ' || (tc.required_tables - tc.existing_tables)::text
    END as tables_status,
    CASE 
        WHEN ds.users_count > 0 
        THEN '✅ USERS TABLE HAS DATA (' || ds.users_count || ' records)'
        ELSE '⚠️ USERS TABLE IS EMPTY'
    END as users_status,
    CASE 
        WHEN ds.strategies_count > 0 
        THEN '✅ STRATEGIES TABLE HAS DATA (' || ds.strategies_count || ' records)'
        ELSE '⚠️ STRATEGIES TABLE IS EMPTY'
    END as strategies_status
FROM table_counts tc, data_status ds;

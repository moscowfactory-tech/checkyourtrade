-- Исправление таблицы анализов для публичного доступа

-- Отключаем RLS для таблицы analysis_results (если она существует)
ALTER TABLE IF EXISTS analysis_results DISABLE ROW LEVEL SECURITY;

-- Удаляем все политики RLS для analysis_results
DROP POLICY IF EXISTS analysis_results_select_policy ON analysis_results;
DROP POLICY IF EXISTS analysis_results_insert_policy ON analysis_results;
DROP POLICY IF EXISTS analysis_results_update_policy ON analysis_results;
DROP POLICY IF EXISTS analysis_results_delete_policy ON analysis_results;

-- Создаем простую таблицу для анализов без RLS
CREATE TABLE IF NOT EXISTS simple_analyses (
    id BIGSERIAL PRIMARY KEY,
    strategy_id TEXT,
    strategy_name TEXT NOT NULL,
    positive_factors JSONB DEFAULT '[]'::jsonb,
    negative_factors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создаем индекс для оптимизации
CREATE INDEX IF NOT EXISTS idx_simple_analyses_created_at ON simple_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_simple_analyses_strategy_id ON simple_analyses(strategy_id);

-- Добавляем политику для публичного доступа (без аутентификации)
ALTER TABLE simple_analyses ENABLE ROW LEVEL SECURITY;

-- Политика для публичного чтения
CREATE POLICY simple_analyses_public_select ON simple_analyses
    FOR SELECT
    USING (true);

-- Политика для публичной вставки
CREATE POLICY simple_analyses_public_insert ON simple_analyses
    FOR INSERT
    WITH CHECK (true);

-- Политика для публичного обновления
CREATE POLICY simple_analyses_public_update ON simple_analyses
    FOR UPDATE
    USING (true);

-- Политика для публичного удаления
CREATE POLICY simple_analyses_public_delete ON simple_analyses
    FOR DELETE
    USING (true);

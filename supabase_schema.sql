-- Создание таблицы пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id TEXT UNIQUE,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы стратегий
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы полей стратегии
CREATE TABLE strategy_fields (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы полей ввода для каждого поля стратегии
CREATE TABLE field_inputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_id UUID REFERENCES strategy_fields(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- text, number, select, boolean, textarea
    label TEXT NOT NULL,
    required BOOLEAN DEFAULT FALSE,
    options JSONB, -- для типа select
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы результатов анализа
CREATE TABLE analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    answers JSONB NOT NULL, -- массив ответов на вопросы
    positive_factors JSONB, -- положительные факторы
    neutral_factors JSONB, -- нейтральные факторы
    negative_factors JSONB, -- отрицательные факторы
    recommendation TEXT, -- итоговая рекомендация
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание RLS (Row Level Security) политик для безопасности
-- Политики для таблицы users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_policy ON users
    FOR SELECT
    USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM strategies s
        WHERE s.user_id = users.id AND s.is_public = TRUE
    ));

CREATE POLICY users_insert_policy ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY users_update_policy ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Политики для таблицы strategies
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY strategies_select_policy ON strategies
    FOR SELECT
    USING (user_id = auth.uid() OR is_public = TRUE);

CREATE POLICY strategies_insert_policy ON strategies
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY strategies_update_policy ON strategies
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY strategies_delete_policy ON strategies
    FOR DELETE
    USING (user_id = auth.uid());

-- Политики для таблицы strategy_fields
ALTER TABLE strategy_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY strategy_fields_select_policy ON strategy_fields
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM strategies s
        WHERE s.id = strategy_fields.strategy_id
        AND (s.user_id = auth.uid() OR s.is_public = TRUE)
    ));

CREATE POLICY strategy_fields_insert_policy ON strategy_fields
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM strategies s
        WHERE s.id = strategy_fields.strategy_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY strategy_fields_update_policy ON strategy_fields
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM strategies s
        WHERE s.id = strategy_fields.strategy_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY strategy_fields_delete_policy ON strategy_fields
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM strategies s
        WHERE s.id = strategy_fields.strategy_id
        AND s.user_id = auth.uid()
    ));

-- Политики для таблицы field_inputs
ALTER TABLE field_inputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY field_inputs_select_policy ON field_inputs
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM strategy_fields sf
        JOIN strategies s ON s.id = sf.strategy_id
        WHERE sf.id = field_inputs.field_id
        AND (s.user_id = auth.uid() OR s.is_public = TRUE)
    ));

CREATE POLICY field_inputs_insert_policy ON field_inputs
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM strategy_fields sf
        JOIN strategies s ON s.id = sf.strategy_id
        WHERE sf.id = field_inputs.field_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY field_inputs_update_policy ON field_inputs
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM strategy_fields sf
        JOIN strategies s ON s.id = sf.strategy_id
        WHERE sf.id = field_inputs.field_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY field_inputs_delete_policy ON field_inputs
    FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM strategy_fields sf
        JOIN strategies s ON s.id = sf.strategy_id
        WHERE sf.id = field_inputs.field_id
        AND s.user_id = auth.uid()
    ));

-- Политики для таблицы analysis_results
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY analysis_results_select_policy ON analysis_results
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY analysis_results_insert_policy ON analysis_results
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY analysis_results_update_policy ON analysis_results
    FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY analysis_results_delete_policy ON analysis_results
    FOR DELETE
    USING (user_id = auth.uid());

-- Создание индексов для оптимизации запросов
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategy_fields_strategy_id ON strategy_fields(strategy_id);
CREATE INDEX idx_field_inputs_field_id ON field_inputs(field_id);
CREATE INDEX idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX idx_analysis_results_strategy_id ON analysis_results(strategy_id);

-- Создание функций для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategies_updated_at
BEFORE UPDATE ON strategies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

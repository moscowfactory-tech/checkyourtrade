# Настройка таблицы анализов в Supabase

## Шаги для настройки:

### 1. Откройте Supabase Dashboard
- Перейдите на https://supabase.com/dashboard
- Выберите ваш проект

### 2. Откройте SQL Editor
- В левом меню нажмите "SQL Editor"
- Нажмите "New query"

### 3. Выполните SQL скрипт
Скопируйте и выполните следующий SQL код:

```sql
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
```

### 4. Нажмите "Run"
- Нажмите кнопку "Run" в правом нижнем углу
- Дождитесь выполнения запроса

### 5. Проверьте результат
- Должно появиться сообщение об успешном выполнении
- В разделе "Table Editor" должна появиться таблица `simple_analyses`

## Что делает этот скрипт:

1. **Отключает RLS** для старой таблицы `analysis_results`
2. **Создает новую таблицу** `simple_analyses` с простой структурой
3. **Настраивает публичный доступ** без необходимости аутентификации
4. **Создает индексы** для оптимизации запросов

После выполнения этого скрипта приложение сможет:
- ✅ Сохранять анализы в базу данных
- ✅ Загружать анализы из базы данных
- ✅ Отображать анализы в модальном окне "Мои анализы"

## Проверка работы:

1. Обновите страницу приложения
2. Создайте новый анализ
3. Откройте "Мои анализы" - анализ должен отображаться
4. Обновите страницу - анализ должен сохраниться

# 🚨 ИСПРАВЛЕНИЕ ОШИБКИ "Could not find the 'coin' column"

## Проблема:
В таблице `analyses` отсутствует колонка `coin`, которая нужна для сохранения информации о монете.

## ✅ РЕШЕНИЕ:

### Шаг 1: Откройте Supabase Dashboard
1. Перейдите на https://supabase.com/dashboard
2. Выберите ваш проект
3. Откройте SQL Editor

### Шаг 2: Выполните SQL скрипт
Скопируйте и выполните этот код:

```sql
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
```

### Шаг 3: Проверьте результат
После выполнения скрипта должно появиться сообщение:
- "Column coin added to analyses table" - если колонка была добавлена
- "Column coin already exists in analyses table" - если колонка уже существует

### Шаг 4: Обновите страницу приложения
Перезагрузите страницу TradeAnalyzer - ошибка должна исчезнуть.

## 🎯 После исправления:
- ✅ Анализы будут сохраняться с указанием монеты
- ✅ В "Мои анализы" будет отображаться монета в заголовке
- ✅ Ошибка "Could not find the 'coin' column" исчезнет

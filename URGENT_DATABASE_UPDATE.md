# 🚨 СРОЧНО: Обновление базы данных для бота

## ⚠️ ВАЖНО ВЫПОЛНИТЬ СЕЙЧАС!

Чтобы новая версия бота работала корректно, нужно добавить колонку `coin` в базу данных.

### 📋 Инструкция:

1. **Откройте Supabase Dashboard:**
   - Перейдите на https://supabase.com/dashboard
   - Выберите ваш проект

2. **Откройте SQL Editor**

3. **Выполните этот SQL код:**

```sql
-- Добавление колонки 'coin' в таблицу analyses
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

### ✅ После выполнения:

Ваш бот в Telegram будет работать с новой версией:
- ✅ Поле "Монета для анализа" над выбором стратегии
- ✅ Сохранение монеты в анализах
- ✅ Отображение монеты в "Мои анализы"
- ✅ Функция просмотра анализов
- ✅ Улучшенный интерфейс

### 🔗 Ссылка на бота:
Ваш бот доступен по адресу: https://moscowfactory-tech.github.io/checkyourtrade/

### 🧪 Тестирование:
1. Откройте бота в Telegram
2. Попробуйте создать анализ с указанием монеты
3. Проверьте "Мои анализы" - должна отображаться монета

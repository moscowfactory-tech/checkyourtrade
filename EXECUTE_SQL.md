# 🚀 Выполните этот SQL в Supabase

## Шаги:

1. **Откройте Supabase Dashboard**: https://supabase.com/dashboard
2. **Выберите ваш проект**
3. **Перейдите в SQL Editor** (левое меню)
4. **Нажмите "New query"**
5. **Скопируйте и вставьте этот код:**

```sql
-- Создание простой таблицы анализов
CREATE TABLE IF NOT EXISTS analyses (
    id BIGSERIAL PRIMARY KEY,
    strategy_id TEXT,
    strategy_name TEXT NOT NULL,
    positive_factors JSONB DEFAULT '[]'::jsonb,
    negative_factors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Отключаем RLS для публичного доступа
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;

-- Создаем индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_analyses_strategy_id ON analyses(strategy_id);
```

6. **Нажмите "Run"**
7. **Обновите страницу приложения**

## ✅ После выполнения:
- Анализы будут сохраняться в базу данных
- "Мои анализы" будут загружаться из БД
- Никакого localStorage не используется

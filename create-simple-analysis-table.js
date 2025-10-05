// Создание простой таблицы для анализов без RLS
console.log('📋 Loading simple analysis table creator...');

async function createSimpleAnalysisTable() {
    try {
        console.log('🔧 Creating simple analysis table...');
        
        if (!window.supabase) {
            console.error('❌ Supabase not available');
            return false;
        }
        
        // Создаем простую таблицу для анализов
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS simple_analyses (
                id BIGSERIAL PRIMARY KEY,
                strategy_id TEXT,
                strategy_name TEXT NOT NULL,
                positive_factors JSONB DEFAULT '[]'::jsonb,
                negative_factors JSONB DEFAULT '[]'::jsonb,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `;
        
        // Выполняем SQL через RPC функцию
        const { data, error } = await window.supabase.rpc('exec_sql', {
            sql_query: createTableSQL
        });
        
        if (error) {
            console.error('❌ Error creating simple analysis table:', error);
            return false;
        }
        
        console.log('✅ Simple analysis table created successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Exception creating simple analysis table:', error);
        return false;
    }
}

// Функция для использования простой таблицы
async function useSimpleAnalysisTable() {
    try {
        console.log('🔄 Switching to simple analysis table...');
        
        // Обновляем функции для работы с простой таблицей
        window.ANALYSIS_TABLE = 'simple_analyses';
        
        console.log('✅ Switched to simple analysis table');
        return true;
        
    } catch (error) {
        console.error('❌ Error switching to simple analysis table:', error);
        return false;
    }
}

// Экспорт функций
window.createSimpleAnalysisTable = createSimpleAnalysisTable;
window.useSimpleAnalysisTable = useSimpleAnalysisTable;

console.log('✅ Simple analysis table creator loaded');

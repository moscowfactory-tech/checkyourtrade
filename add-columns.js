// Добавление недостающих колонок в таблицу strategies
console.log('🔧 Loading column addition module...');

async function addMissingColumns() {
    try {
        console.log('🔧 Adding missing columns to strategies table...');
        
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return false;
        }
        
        // Пробуем добавить колонки через прямые SQL запросы
        const alterQueries = [
            'ALTER TABLE strategies ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE',
            'ALTER TABLE strategies ADD COLUMN IF NOT EXISTS user_id UUID',
            'ALTER TABLE strategies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
        ];
        
        for (const query of alterQueries) {
            try {
                console.log('🔧 Executing:', query);
                
                // Пробуем выполнить через rpc
                const { data, error } = await window.supabase
                    .rpc('exec_sql', { sql: query })
                    .catch(() => ({ data: null, error: 'RPC not available' }));
                
                if (error && error !== 'RPC not available') {
                    console.log('⚠️ RPC error:', error);
                } else if (error === 'RPC not available') {
                    console.log('⚠️ RPC not available, manual SQL needed');
                } else {
                    console.log('✅ Query executed successfully');
                }
            } catch (err) {
                console.log('⚠️ Error executing query:', err.message);
            }
        }
        
        // Проверяем, добавились ли колонки
        console.log('🔍 Checking if columns were added...');
        await checkTableStructure();
        
        return true;
        
    } catch (error) {
        console.error('❌ Error adding columns:', error);
        return false;
    }
}

// Функция для обновления существующих записей
async function updateExistingRecords() {
    try {
        console.log('🔄 Updating existing records...');
        
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return false;
        }
        
        // Обновляем все записи, устанавливая is_public = false для существующих стратегий
        const { data, error } = await window.supabase
            .from('strategies')
            .update({ 
                is_public: false,
                updated_at: new Date().toISOString()
            })
            .is('is_public', null);
            
        if (error) {
            console.error('❌ Error updating records:', error);
            return false;
        }
        
        console.log('✅ Updated existing records:', data);
        return true;
        
    } catch (error) {
        console.error('❌ Error updating records:', error);
        return false;
    }
}

// Экспорт функций
window.addMissingColumns = addMissingColumns;
window.updateExistingRecords = updateExistingRecords;

console.log('✅ Column addition module loaded');
console.log('Available commands:');
console.log('- await addMissingColumns() - добавить недостающие колонки');
console.log('- await updateExistingRecords() - обновить существующие записи');

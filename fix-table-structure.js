// Исправление структуры таблицы strategies
console.log('🔧 Loading table structure fix module...');

async function fixTableStructure() {
    try {
        console.log('🔧 Fixing table structure...');
        
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return false;
        }
        
        // Проверяем текущую структуру таблицы
        console.log('📊 Checking current table structure...');
        
        const { data: columns, error: columnsError } = await window.supabase
            .rpc('get_table_columns', { table_name: 'strategies' })
            .catch(() => {
                // Если RPC не работает, используем альтернативный способ
                return { data: null, error: 'RPC not available' };
            });
        
        if (columnsError) {
            console.log('⚠️ Could not check columns via RPC, will try direct approach');
        }
        
        // Пробуем выполнить запрос, чтобы понять какие колонки есть
        const { data: testData, error: testError } = await window.supabase
            .from('strategies')
            .select('id, name, description, fields, created_at')
            .limit(1);
            
        if (testError) {
            console.error('❌ Error testing table structure:', testError);
            return false;
        }
        
        console.log('✅ Basic table structure is working');
        
        // Пробуем добавить недостающие колонки через SQL
        const sqlCommands = [
            'ALTER TABLE strategies ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;',
            'ALTER TABLE strategies ADD COLUMN IF NOT EXISTS user_id UUID;',
            'ALTER TABLE strategies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();'
        ];
        
        for (const sql of sqlCommands) {
            try {
                console.log('🔧 Executing:', sql);
                const { error } = await window.supabase.rpc('execute_sql', { sql_query: sql });
                if (error) {
                    console.log('⚠️ Could not execute SQL via RPC:', error.message);
                } else {
                    console.log('✅ SQL executed successfully');
                }
            } catch (err) {
                console.log('⚠️ RPC not available for SQL execution');
            }
        }
        
        // Проверяем, можем ли мы теперь использовать is_public
        const { data: testPublic, error: publicError } = await window.supabase
            .from('strategies')
            .select('id, is_public')
            .limit(1);
            
        if (publicError) {
            console.log('⚠️ is_public column still not available:', publicError.message);
            console.log('📝 You need to manually add the column in Supabase SQL Editor:');
            console.log('ALTER TABLE strategies ADD COLUMN is_public BOOLEAN DEFAULT FALSE;');
            console.log('ALTER TABLE strategies ADD COLUMN user_id UUID;');
            console.log('ALTER TABLE strategies ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();');
            return false;
        } else {
            console.log('✅ is_public column is now available');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error fixing table structure:', error);
        return false;
    }
}

// Функция для проверки структуры таблицы
async function checkTableStructure() {
    try {
        console.log('📊 Checking table structure...');
        
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase client not available');
            return;
        }
        
        // Пробуем разные запросы для проверки колонок
        const tests = [
            { name: 'id', query: 'id' },
            { name: 'name', query: 'name' },
            { name: 'description', query: 'description' },
            { name: 'fields', query: 'fields' },
            { name: 'created_at', query: 'created_at' },
            { name: 'updated_at', query: 'updated_at' },
            { name: 'is_public', query: 'is_public' },
            { name: 'user_id', query: 'user_id' }
        ];
        
        console.log('Available columns:');
        for (const test of tests) {
            try {
                const { error } = await window.supabase
                    .from('strategies')
                    .select(test.query)
                    .limit(1);
                    
                if (error) {
                    console.log(`❌ ${test.name}: NOT AVAILABLE (${error.message})`);
                } else {
                    console.log(`✅ ${test.name}: AVAILABLE`);
                }
            } catch (err) {
                console.log(`❌ ${test.name}: ERROR (${err.message})`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking table structure:', error);
    }
}

// Экспорт функций
window.fixTableStructure = fixTableStructure;
window.checkTableStructure = checkTableStructure;

console.log('✅ Table structure fix module loaded');
console.log('Available commands:');
console.log('- await checkTableStructure() - проверить структуру таблицы');
console.log('- await fixTableStructure() - исправить структуру таблицы');

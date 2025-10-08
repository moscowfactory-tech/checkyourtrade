// Модуль проверки соединения с Supabase
console.log('🔌 Loading connection check module...');

// Функция для проверки соединения с Supabase
async function checkSupabaseConnection() {
    try {
        console.log('🔍 Checking Supabase connection...');
        
        if (!window.supabase) {
            console.error('❌ Supabase client not available');
            return { status: 'error', message: 'Supabase client not available' };
        }
        
        // Проверяем соединение с базой данных
        const { data, error } = await window.supabase
            .from('strategies')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Database connection error:', error);
            return { 
                status: 'error', 
                message: error.message || 'Database connection error',
                error: error
            };
        }
        
        console.log('✅ Supabase connection successful');
        return { status: 'success', message: 'Connection successful' };
        
    } catch (error) {
        console.error('❌ Exception checking connection:', error);
        return { 
            status: 'error', 
            message: error.message || 'Exception checking connection',
            error: error
        };
    }
}

// Функция для проверки доступности таблиц
async function checkTables() {
    try {
        console.log('🔍 Checking database tables...');
        
        if (!window.supabase) {
            console.error('❌ Supabase client not available');
            return { status: 'error', message: 'Supabase client not available' };
        }
        
        // Проверяем таблицы
        const tables = ['strategies', 'users', 'analysis_results'];
        const results = {};
        
        for (const table of tables) {
            try {
                const { data, error } = await window.supabase
                    .from(table)
                    .select('count')
                    .limit(1);
                    
                results[table] = {
                    status: error ? 'error' : 'success',
                    message: error ? error.message : 'Table accessible',
                    error: error
                };
                
            } catch (err) {
                results[table] = {
                    status: 'error',
                    message: err.message || `Exception checking table ${table}`,
                    error: err
                };
            }
        }
        
        console.log('📊 Table check results:', results);
        return { 
            status: 'completed', 
            results: results
        };
        
    } catch (error) {
        console.error('❌ Exception checking tables:', error);
        return { 
            status: 'error', 
            message: error.message || 'Exception checking tables',
            error: error
        };
    }
}

// Функция для проверки структуры таблицы strategies
async function checkStrategiesTable() {
    try {
        console.log('🔍 Checking strategies table structure...');
        
        if (!window.supabase) {
            console.error('❌ Supabase client not available');
            return { status: 'error', message: 'Supabase client not available' };
        }
        
        // Пробуем получить данные из таблицы strategies
        const { data, error } = await window.supabase
            .from('strategies')
            .select('id, name, description, fields, created_at')
            .limit(1);
            
        if (error) {
            console.error('❌ Error checking strategies table:', error);
            return { 
                status: 'error', 
                message: error.message || 'Error checking strategies table',
                error: error
            };
        }
        
        console.log('✅ Strategies table structure is valid');
        return { 
            status: 'success', 
            message: 'Strategies table structure is valid',
            sample: data
        };
        
    } catch (error) {
        console.error('❌ Exception checking strategies table:', error);
        return { 
            status: 'error', 
            message: error.message || 'Exception checking strategies table',
            error: error
        };
    }
}

// Функция для исправления проблем с соединением
async function fixConnectionIssues() {
    try {
        console.log('🔧 Attempting to fix connection issues...');
        
        // 1. Проверяем соединение
        const connectionStatus = await checkSupabaseConnection();
        if (connectionStatus.status === 'success') {
            console.log('✅ Connection is already working');
            return { status: 'success', message: 'Connection is already working' };
        }
        
        // 2. Пробуем переинициализировать Supabase
        if (typeof initializeSupabase === 'function') {
            console.log('🔄 Reinitializing Supabase client...');
            const client = initializeSupabase();
            if (client) {
                window.supabase = client;
                
                // Проверяем соединение снова
                const retryStatus = await checkSupabaseConnection();
                if (retryStatus.status === 'success') {
                    console.log('✅ Connection fixed successfully');
                    return { status: 'success', message: 'Connection fixed successfully' };
                }
            }
        }
        
        console.log('⚠️ Could not fix connection automatically');
        return { 
            status: 'error', 
            message: 'Could not fix connection automatically. Try reloading the page.'
        };
        
    } catch (error) {
        console.error('❌ Exception fixing connection:', error);
        return { 
            status: 'error', 
            message: error.message || 'Exception fixing connection',
            error: error
        };
    }
}

// Экспорт функций
window.checkSupabaseConnection = checkSupabaseConnection;
window.checkTables = checkTables;
window.checkStrategiesTable = checkStrategiesTable;
window.fixConnectionIssues = fixConnectionIssues;

console.log('✅ Connection check module loaded');
console.log('Available functions:');
console.log('- await checkSupabaseConnection()');
console.log('- await checkTables()');
console.log('- await checkStrategiesTable()');
console.log('- await fixConnectionIssues()');

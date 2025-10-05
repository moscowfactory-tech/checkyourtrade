// Supabase Configuration
// Замените эти значения на ваши реальные ключи из Supabase Dashboard

const SUPABASE_CONFIG = {
    url: 'https://wpexepphsdzwopltunnn.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZXhlcHBoc2R6d29wbHR1bm5uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTQ5MjIsImV4cCI6MjA3NDkzMDkyMn0.qrLKaW7zGNK6ak-Ll3VHq-Qr-2O9b9GOsMu87Lfm5M0',
};

// ИНСТРУКЦИЯ:
// 1. Откройте ваш проект в Supabase Dashboard
// 2. Перейдите в Settings → API  
// 3. Скопируйте Project URL и вставьте вместо 'YOUR_SUPABASE_URL'
// 4. Скопируйте anon public ключ и вставьте вместо 'YOUR_SUPABASE_ANON_KEY'

// Инициализация Supabase клиента
let supabase;

// Функция инициализации (вызывается после загрузки библиотеки)
function initializeSupabase() {
    try {
        // Проверяем доступность библиотеки Supabase
        if (typeof window.supabase === 'undefined') {
            console.error('❌ Supabase library not loaded');
            return null;
        }
        
        // Создаем клиент Supabase
        const client = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        
        if (!client) {
            console.error('❌ Failed to create Supabase client');
            return null;
        }
        
        // Сохраняем клиент в глобальную переменную
        supabase = client;
        window.supabase = client; // Перезаписываем window.supabase правильным клиентом
        
        console.log('✅ Supabase client initialized successfully');
        console.log('🔗 Supabase URL:', SUPABASE_CONFIG.url);
        
        return client;
        
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return null;
    }
}

// Проверка подключения к базе данных
async function testSupabaseConnection() {
    try {
        const { data, error } = await supabase
            .from('strategies')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('Supabase connection error:', error);
            return false;
        }
        
        console.log('Supabase connection successful');
        return true;
    } catch (err) {
        console.error('Supabase connection failed:', err);
        return false;
    }
}

// Простая инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Initializing Supabase...');
    
    // Ждем загрузки библиотеки Supabase
    const initSupabase = () => {
        if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
            try {
                console.log('🔧 Creating Supabase client...');
                const client = window.supabase.createClient(
                    SUPABASE_CONFIG.url,
                    SUPABASE_CONFIG.anonKey
                );
                
                if (client && typeof client.from === 'function') {
                    // Сохраняем клиент в глобальную переменную
                    window.supabase = client;
                    console.log('✅ Supabase client initialized successfully');
                    return true;
                } else {
                    console.error('❌ Failed to create Supabase client');
                    return false;
                }
            } catch (error) {
                console.error('❌ Error initializing Supabase:', error);
                return false;
            }
        } else {
            console.log('⏳ Waiting for Supabase library...');
            setTimeout(initSupabase, 100);
        }
    };
    
    // Запускаем инициализацию
    setTimeout(initSupabase, 100);
});

// Экспорт для использования в других файлах
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
window.initializeSupabase = initializeSupabase;
window.testSupabaseConnection = testSupabaseConnection;

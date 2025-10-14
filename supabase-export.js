// СКРИПТ ЭКСПОРТА ДАННЫХ ИЗ SUPABASE
// Запускать в консоли браузера на странице приложения

async function exportSupabaseData() {
    console.log('🚀 Начинаем экспорт данных из Supabase...');
    
    if (!window.supabase) {
        console.error('❌ Supabase client не найден');
        return;
    }
    
    const exportData = {
        users: [],
        strategies: [],
        analyses: [],
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    try {
        // Экспорт пользователей
        console.log('📥 Экспорт пользователей...');
        const { data: users, error: usersError } = await window.supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (usersError) throw usersError;
        exportData.users = users || [];
        console.log(`✅ Экспортировано ${exportData.users.length} пользователей`);
        
        // Экспорт стратегий
        console.log('📥 Экспорт стратегий...');
        const { data: strategies, error: strategiesError } = await window.supabase
            .from('strategies')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (strategiesError) throw strategiesError;
        exportData.strategies = strategies || [];
        console.log(`✅ Экспортировано ${exportData.strategies.length} стратегий`);
        
        // Экспорт анализов (из analysis_results)
        console.log('📥 Экспорт анализов...');
        const { data: analyses, error: analysesError } = await window.supabase
            .from('analysis_results')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (analysesError) throw analysesError;
        exportData.analyses = analyses || [];
        console.log(`✅ Экспортировано ${exportData.analyses.length} анализов`);
        
        // Сохранение в файл
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `supabase-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('🎉 Экспорт завершен успешно!');
        console.log('📊 Статистика экспорта:', {
            users: exportData.users.length,
            strategies: exportData.strategies.length,
            analyses: exportData.analyses.length
        });
        
        return exportData;
        
    } catch (error) {
        console.error('❌ Ошибка экспорта:', error);
        throw error;
    }
}

// Функция для экспорта только данных текущего пользователя
async function exportCurrentUserData() {
    console.log('🚀 Экспорт данных текущего пользователя...');
    
    const telegramUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString();
    if (!telegramUserId) {
        console.error('❌ Telegram User ID не найден');
        return;
    }
    
    try {
        // Находим пользователя
        const { data: user } = await window.supabase
            .from('users')
            .select('*')
            .eq('telegram_id', telegramUserId)
            .single();
            
        if (!user) {
            console.log('ℹ️ Пользователь не найден в БД');
            return;
        }
        
        // Экспорт стратегий пользователя
        const { data: strategies } = await window.supabase
            .from('strategies')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
            
        // Экспорт анализов пользователя
        const { data: analyses } = await window.supabase
            .from('analysis_results')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });
        
        const userData = {
            user,
            strategies: strategies || [],
            analyses: analyses || [],
            exportDate: new Date().toISOString()
        };
        
        // Сохранение
        const dataStr = JSON.stringify(userData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `my-data-export-${telegramUserId}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ Экспорт данных пользователя завершен');
        return userData;
        
    } catch (error) {
        console.error('❌ Ошибка экспорта данных пользователя:', error);
    }
}

// Запуск экспорта
console.log('📋 Доступные функции экспорта:');
console.log('1. exportSupabaseData() - экспорт всех данных');
console.log('2. exportCurrentUserData() - экспорт данных текущего пользователя');
console.log('');
console.log('Для запуска введите: await exportSupabaseData()');

// Автоматический экспорт при загрузке скрипта (раскомментировать при необходимости)
// exportCurrentUserData();

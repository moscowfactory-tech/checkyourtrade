// СИСТЕМА ДИНАМИЧЕСКОГО ПОДСЧЕТА СТАТИСТИКИ ИЗ БД
console.log('📊 STATS COUNTER LOADED');

// Функция для подсчета анализов из БД
async function countAnalysesFromDB() {
    try {
        console.log('📊 Counting analyses from database...');
        
        if (!window.supabase) {
            console.error('📊 Supabase not initialized');
            return 0;
        }
        
        // Получаем ID текущего пользователя Telegram
        const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
        
        if (!telegramUserId) {
            console.log('⚠️ No telegram user ID for analyses count');
            return 0;
        }
        
        // Сначала найдем user_id по telegram_id
        const { data: userData } = await window.supabase
            .from('users')
            .select('id')
            .eq('telegram_id', telegramUserId)
            .single();
        
        if (!userData) {
            console.log('📊 User not found in DB for analyses count');
            return 0;
        }
        
        // Проверяем, какая таблица существует: analyses или analysis_results
        let query = window.supabase
            .from('analysis_results') // По схеме recreate-database.sql
            .select('id', { count: 'exact' })
            .eq('user_id', userData.id);
        
        console.log('📊 Counting analyses for user_id:', userData.id);
        
        const { data, error } = await query;
            
        if (error) {
            console.error('📊 Error counting analyses:', error);
            return 0;
        }
        
        const count = data ? data.length : 0;
        console.log('📊 Analyses count from DB:', count);
        return count;
        
    } catch (error) {
        console.error('📊 Error in countAnalysesFromDB:', error);
        return 0;
    }
}

// Функция для подсчета стратегий из БД
async function countStrategiesFromDB() {
    try {
        console.log('📊 Counting strategies from database...');
        
        if (!window.supabase) {
            console.error('📊 Supabase not initialized');
            return 0;
        }
        
        // Получаем ID текущего пользователя Telegram
        const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
        
        if (!telegramUserId) {
            console.log('⚠️ No telegram user ID for strategies count');
            return 0;
        }
        
        // Сначала найдем user_id по telegram_id
        const { data: userData } = await window.supabase
            .from('users')
            .select('id')
            .eq('telegram_id', telegramUserId)
            .single();
        
        if (!userData) {
            console.log('📊 User not found in DB for strategies count');
            return 0;
        }
        
        // Считаем стратегии по user_id
        let query = window.supabase
            .from('strategies')
            .select('id', { count: 'exact' })
            .eq('user_id', userData.id);
        
        console.log('📊 Counting strategies for user_id:', userData.id);
        
        const { data, error } = await query;
            
        if (error) {
            console.error('📊 Error counting strategies:', error);
            return 0;
        }
        
        const count = data ? data.length : 0;
        console.log('📊 Strategies count from DB:', count);
        return count;
        
    } catch (error) {
        console.error('📊 Error in countStrategiesFromDB:', error);
        return 0;
    }
}

// Функция для обновления счетчиков в профиле
async function updateUserStats() {
    try {
        console.log('📊 Updating user stats...');
        
        const analysesCountEl = document.getElementById('analysesCount');
        const strategiesCountEl = document.getElementById('strategiesCount');
        
        if (!analysesCountEl || !strategiesCountEl) {
            console.error('📊 Stats elements not found');
            return;
        }
        
        // Показываем загрузку
        analysesCountEl.textContent = '...';
        strategiesCountEl.textContent = '...';
        
        // Получаем данные
        const [analysesCount, strategiesCount] = await Promise.all([
            countAnalysesFromDB(),
            countStrategiesFromDB()
        ]);
        
        // Обновляем отображение
        analysesCountEl.textContent = analysesCount.toString();
        strategiesCountEl.textContent = strategiesCount.toString();
        
        console.log('📊 User stats updated:', {
            analyses: analysesCount,
            strategies: strategiesCount
        });
        
    } catch (error) {
        console.error('📊 Error updating user stats:', error);
        
        // В случае ошибки показываем 0
        const analysesCountEl = document.getElementById('analysesCount');
        const strategiesCountEl = document.getElementById('strategiesCount');
        
        if (analysesCountEl) analysesCountEl.textContent = '0';
        if (strategiesCountEl) strategiesCountEl.textContent = '0';
    }
}

// Функция для обновления статистики при создании анализа
async function incrementAnalysesCount() {
    console.log('📊 Incrementing analyses count...');
    await updateUserStats();
}

// Функция для обновления статистики при создании стратегии
async function incrementStrategiesCount() {
    console.log('📊 Incrementing strategies count...');
    await updateUserStats();
}

// Функция для обновления статистики при удалении анализа
async function decrementAnalysesCount() {
    console.log('📊 Decrementing analyses count...');
    await updateUserStats();
}

// Функция для обновления статистики при удалении стратегии
async function decrementStrategiesCount() {
    console.log('📊 Decrementing strategies count...');
    await updateUserStats();
}

// Делаем функции глобальными
window.updateUserStats = updateUserStats;
window.incrementAnalysesCount = incrementAnalysesCount;
window.incrementStrategiesCount = incrementStrategiesCount;
window.decrementAnalysesCount = decrementAnalysesCount;
window.decrementStrategiesCount = decrementStrategiesCount;

// Автоматическое обновление при открытии профиля
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Setting up stats counter...');
    
    // Обновляем статистику при клике на профиль
    const userButton = document.getElementById('userButton');
    if (userButton) {
        userButton.addEventListener('click', function() {
            console.log('📊 Profile opened, updating stats...');
            setTimeout(updateUserStats, 200); // Увеличили задержку для надежности
        });
        console.log('📊 Profile button listener added');
    } else {
        console.error('📊 userButton not found!');
    }
    
    // Обновляем статистику при загрузке страницы (через 2 секунды для инициализации Supabase)
    setTimeout(updateUserStats, 2000);
});

console.log('📊 STATS COUNTER initialized');

// ЭКСТРЕННОЕ исправление подсчета статистики
console.log('🔥 EMERGENCY stats fix loaded');

// Глобальные переменные для отслеживания
let statsUpdateAttempts = 0;
let statsUpdateSuccess = false;

// Экстренная функция обновления статистики
async function emergencyUpdateStats() {
    console.log('🔥 EMERGENCY stats update attempt #' + (++statsUpdateAttempts));
    
    const analysesCountEl = document.getElementById('analysesCount');
    const strategiesCountEl = document.getElementById('strategiesCount');
    
    if (!analysesCountEl || !strategiesCountEl) {
        console.error('🔥 EMERGENCY: Stats elements not found, will retry');
        return false;
    }
    
    let analysesCount = 0;
    let strategiesCount = 0;
    
    try {
        // ПРЯМОЙ доступ к DOM элементам
        analysesCountEl.textContent = '...';
        strategiesCountEl.textContent = '...';
        
        // Проверяем доступ к Supabase
        if (window.supabase) {
            try {
                console.log('🔥 EMERGENCY: Checking Supabase connection');
                
                // Проверяем соединение с Supabase
                const { data: healthCheck } = await window.supabase.from('analyses').select('id').limit(1);
                console.log('🔥 EMERGENCY: Supabase health check:', !!healthCheck);
                
                // Получаем ID пользователя
                let userId = null;
                if (typeof window.getCurrentUserId === 'function') {
                    userId = window.getCurrentUserId();
                } else if (localStorage.getItem('userId')) {
                    userId = localStorage.getItem('userId');
                }
                
                console.log('🔥 EMERGENCY: User ID:', userId);
                
                if (userId) {
                    // Считаем анализы
                    const { count, error } = await window.supabase
                        .from('analyses')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', userId);
                    
                    if (error) {
                        console.error('🔥 EMERGENCY: Supabase error:', error);
                    } else if (count !== null) {
                        analysesCount = count;
                        console.log('🔥 EMERGENCY: Analyses count from DB:', analysesCount);
                    }
                }
            } catch (supabaseError) {
                console.error('🔥 EMERGENCY: Supabase access error:', supabaseError);
            }
        }
        
        // Если не удалось получить из Supabase, пробуем из localStorage
        if (analysesCount === 0) {
            console.log('🔥 EMERGENCY: Trying localStorage for analyses');
            try {
                const savedAnalyses = localStorage.getItem('savedAnalyses');
                if (savedAnalyses) {
                    const parsed = JSON.parse(savedAnalyses);
                    if (Array.isArray(parsed)) {
                        analysesCount = parsed.length;
                        console.log('🔥 EMERGENCY: Analyses from localStorage:', analysesCount);
                    }
                }
            } catch (e) {
                console.error('🔥 EMERGENCY: localStorage error:', e);
            }
        }
        
        // Считаем стратегии из window.strategies
        if (window.strategies && Array.isArray(window.strategies)) {
            strategiesCount = window.strategies.length;
            console.log('🔥 EMERGENCY: Strategies from window:', strategiesCount);
        } else {
            // Пробуем из localStorage
            try {
                const savedStrategies = localStorage.getItem('strategies');
                if (savedStrategies) {
                    const parsed = JSON.parse(savedStrategies);
                    if (Array.isArray(parsed)) {
                        strategiesCount = parsed.length;
                        console.log('🔥 EMERGENCY: Strategies from localStorage:', strategiesCount);
                    }
                }
            } catch (e) {
                console.error('🔥 EMERGENCY: localStorage error for strategies:', e);
            }
        }
        
        // ПРИНУДИТЕЛЬНО обновляем DOM
        analysesCountEl.textContent = analysesCount.toString();
        strategiesCountEl.textContent = strategiesCount.toString();
        
        // Добавляем стиль, чтобы убедиться, что числа видны
        analysesCountEl.style.color = '#00ff00';
        strategiesCountEl.style.color = '#00ff00';
        
        console.log('🔥 EMERGENCY: Stats updated successfully:', {
            analyses: analysesCount,
            strategies: strategiesCount
        });
        
        statsUpdateSuccess = true;
        return true;
    } catch (error) {
        console.error('🔥 EMERGENCY: Critical error updating stats:', error);
        
        // В случае ошибки показываем хоть что-то
        if (analysesCountEl) analysesCountEl.textContent = '0';
        if (strategiesCountEl) strategiesCountEl.textContent = '0';
        
        return false;
    }
}

// Делаем функцию глобальной
window.emergencyUpdateStats = emergencyUpdateStats;

// Автоматически запускаем обновление при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 EMERGENCY: DOM loaded, scheduling immediate stats update');
    
    // Немедленное обновление
    setTimeout(emergencyUpdateStats, 500);
    
    // Повторяем каждые 2 секунды, пока не получится
    const statsInterval = setInterval(() => {
        if (statsUpdateSuccess || statsUpdateAttempts >= 10) {
            console.log('🔥 EMERGENCY: Stopping automatic updates, success:', statsUpdateSuccess);
            clearInterval(statsInterval);
        } else {
            emergencyUpdateStats();
        }
    }, 2000);
});

// Добавляем обработчик для профиля
document.addEventListener('DOMContentLoaded', function() {
    const userButton = document.querySelector('.user-button');
    if (userButton) {
        console.log('🔥 EMERGENCY: Adding profile click handler');
        userButton.addEventListener('click', function() {
            console.log('🔥 EMERGENCY: Profile clicked, updating stats');
            emergencyUpdateStats();
        });
    }
});

console.log('🔥 EMERGENCY stats fix initialized');

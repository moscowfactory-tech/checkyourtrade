// Критическое исправление подсчета статистики
console.log('🚨 Critical stats fix loaded');

// Принудительная функция обновления статистики
async function forceUpdateStats() {
    console.log('🚨 Force updating user stats');
    
    const analysesCountEl = document.getElementById('analysesCount');
    const strategiesCountEl = document.getElementById('strategiesCount');
    
    if (!analysesCountEl || !strategiesCountEl) {
        console.error('❌ Stats elements not found');
        return;
    }
    
    let analysesCount = 0;
    let strategiesCount = 0;
    
    try {
        // Считаем анализы из Supabase
        if (window.supabase && window.getCurrentUserId && window.getCurrentUserId()) {
            console.log('🚨 Counting analyses from Supabase');
            const userId = window.getCurrentUserId();
            
            const { count } = await window.supabase
                .from('analyses')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);
                
            if (count !== null) {
                analysesCount = count;
                console.log('✅ Analyses from DB:', analysesCount);
            }
        } else {
            console.log('🚨 Fallback: counting from localStorage');
            // Fallback к localStorage
            const savedAnalyses = localStorage.getItem('savedAnalyses');
            if (savedAnalyses) {
                try {
                    const parsed = JSON.parse(savedAnalyses);
                    analysesCount = Array.isArray(parsed) ? parsed.length : 0;
                } catch (e) {
                    analysesCount = 0;
                }
            }
        }
        
        // Считаем стратегии (они хранятся локально)
        if (window.strategies && Array.isArray(window.strategies)) {
            strategiesCount = window.strategies.length;
        } else {
            const savedStrategies = localStorage.getItem('strategies');
            if (savedStrategies) {
                try {
                    const parsed = JSON.parse(savedStrategies);
                    strategiesCount = Array.isArray(parsed) ? parsed.length : 0;
                } catch (e) {
                    strategiesCount = 0;
                }
            }
        }
        
        // Обновляем элементы
        analysesCountEl.textContent = analysesCount;
        strategiesCountEl.textContent = strategiesCount;
        
        console.log('✅ Stats force updated:', {
            analyses: analysesCount,
            strategies: strategiesCount
        });
        
    } catch (error) {
        console.error('❌ Error force updating stats:', error);
        
        // В случае ошибки показываем 0
        analysesCountEl.textContent = '0';
        strategiesCountEl.textContent = '0';
    }
}

// Делаем функцию глобальной
window.forceUpdateStats = forceUpdateStats;

// Автоматически обновляем статистику при загрузке
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚨 DOM loaded, scheduling stats update');
    
    // Обновляем через 2 секунды после загрузки
    setTimeout(() => {
        forceUpdateStats();
    }, 2000);
    
    // Обновляем каждые 10 секунд
    setInterval(() => {
        forceUpdateStats();
    }, 10000);
});

console.log('🚨 Critical stats fix initialized');

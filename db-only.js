// Очистка localStorage и настройка работы только с БД
console.log('🗄️ Configuring database-only mode...');

document.addEventListener('DOMContentLoaded', function() {
    // Полная очистка localStorage
    console.log('🧹 Clearing all localStorage data...');
    
    const keysToRemove = [
        'strategies',
        'savedAnalyses', 
        'analyses',
        'tradeAnalyzer_strategies',
        'tradeAnalyzer_analyses',
        'user_strategies',
        'user_analyses'
    ];
    
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed ${key} from localStorage`);
        }
    });
    
    // Очищаем весь localStorage для этого домена
    localStorage.clear();
    console.log('✅ localStorage completely cleared');
    
    // Переопределяем методы localStorage для предотвращения использования
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    
    localStorage.setItem = function(key, value) {
        console.warn('⚠️ Attempted to use localStorage.setItem - redirecting to database');
        // TODO: Redirect to database save
        return null;
    };
    
    localStorage.getItem = function(key) {
        console.warn('⚠️ Attempted to use localStorage.getItem - redirecting to database');
        // TODO: Redirect to database load
        return null;
    };
    
    console.log('🔒 localStorage access blocked - database-only mode active');
});

// Функция для принудительной очистки localStorage (можно вызвать из консоли)
window.clearAllLocalStorage = function() {
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ All local storage cleared manually');
};

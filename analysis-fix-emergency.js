// ЭКСТРЕННОЕ исправление карточек анализа
console.log('🔥 EMERGENCY analysis cards fix loaded');

// Глобальные переменные
let analysisFixAttempts = 0;
let analysisFixSuccess = false;

// Функция для экстренного запуска анализа
function emergencyStartAnalysis() {
    console.log('🔥 EMERGENCY analysis start attempt #' + (++analysisFixAttempts));
    
    try {
        // Находим необходимые элементы
        const coinInput = document.getElementById('coinInput');
        const strategySelect = document.getElementById('strategySelect');
        const cardAnalysisContainer = document.getElementById('cardAnalysisContainer');
        
        if (!coinInput || !strategySelect || !cardAnalysisContainer) {
            console.error('🔥 EMERGENCY: Required elements not found');
            return false;
        }
        
        // Получаем значения
        const coin = coinInput.value.trim().toUpperCase();
        const strategyId = parseInt(strategySelect.value);
        
        console.log('🔥 EMERGENCY: Analysis inputs:', { coin, strategyId });
        
        // Проверяем условия
        if (!coin || !strategyId) {
            console.log('🔥 EMERGENCY: Missing coin or strategy');
            return false;
        }
        
        // Находим стратегию
        let strategy = null;
        if (window.strategies && Array.isArray(window.strategies)) {
            strategy = window.strategies.find(s => s.id === strategyId);
        }
        
        if (!strategy) {
            console.error('🔥 EMERGENCY: Strategy not found');
            return false;
        }
        
        console.log('🔥 EMERGENCY: Found strategy:', strategy.name);
        
        // Запускаем анализ напрямую
        console.log('🔥 EMERGENCY: Directly showing analysis cards');
        
        // Устанавливаем глобальные переменные
        window.currentAnalysisStrategy = strategy;
        window.currentCoin = coin;
        window.currentCardIndex = 0;
        window.analysisAnswers = new Array(strategy.fields.length).fill(null);
        
        // Показываем контейнер
        cardAnalysisContainer.classList.remove('hidden');
        cardAnalysisContainer.style.display = 'block';
        
        // Вызываем функцию рендеринга карточки
        if (typeof window.renderCurrentCard === 'function') {
            window.renderCurrentCard();
            console.log('🔥 EMERGENCY: renderCurrentCard called');
        } else {
            console.error('🔥 EMERGENCY: renderCurrentCard function not found');
            
            // Пытаемся найти и показать первую карточку напрямую
            const analysisCard = document.getElementById('analysisCard');
            if (analysisCard) {
                analysisCard.classList.add('active');
                analysisCard.style.display = 'block';
                console.log('🔥 EMERGENCY: Directly activated analysis card');
            }
        }
        
        analysisFixSuccess = true;
        return true;
    } catch (error) {
        console.error('🔥 EMERGENCY: Error starting analysis:', error);
        return false;
    }
}

// Делаем функцию глобальной
window.emergencyStartAnalysis = emergencyStartAnalysis;

// Добавляем обработчики событий
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔥 EMERGENCY: DOM loaded, setting up analysis handlers');
    
    // Находим элементы
    const coinInput = document.getElementById('coinInput');
    const strategySelect = document.getElementById('strategySelect');
    
    if (coinInput && strategySelect) {
        // Обработчик для поля ввода монеты
        coinInput.addEventListener('input', function() {
            console.log('🔥 EMERGENCY: Coin input changed');
            setTimeout(emergencyStartAnalysis, 500);
        });
        
        // Обработчик для выбора стратегии
        strategySelect.addEventListener('change', function() {
            console.log('🔥 EMERGENCY: Strategy selected');
            setTimeout(emergencyStartAnalysis, 500);
        });
        
        // Проверяем текущие значения
        setTimeout(emergencyStartAnalysis, 1000);
    }
});

console.log('🔥 EMERGENCY analysis cards fix initialized');

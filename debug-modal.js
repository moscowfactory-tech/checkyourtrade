// Отладочный скрипт для диагностики модальных окон

console.log('=== ДИАГНОСТИКА МОДАЛЬНЫХ ОКОН ===');

// 1. Проверяем наличие элементов
console.log('1. Проверка элементов:');
const supportBtn = document.getElementById('supportProjectBtn');
const supportModal = document.getElementById('supportModal');
const myAnalysesBtn = document.getElementById('myAnalysesBtn');
const analysesModal = document.getElementById('analysesModal');

console.log('supportProjectBtn:', supportBtn);
console.log('supportModal:', supportModal);
console.log('myAnalysesBtn:', myAnalysesBtn);
console.log('analysesModal:', analysesModal);

// 2. Проверяем функции
console.log('2. Проверка функций:');
console.log('window.openSupportModal:', typeof window.openSupportModal);
console.log('window.openAnalysesModal:', typeof window.openAnalysesModal);

// 3. Проверяем обработчики событий
console.log('3. Проверка обработчиков:');
if (supportBtn) {
    console.log('supportBtn listeners:', getEventListeners ? getEventListeners(supportBtn) : 'getEventListeners не доступен');
}

// 4. Тестовые функции
window.debugOpenSupportModal = function() {
    console.log('🧪 Тест открытия Support Modal');
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = 'flex';
        console.log('✅ Support Modal открыт принудительно');
    } else {
        console.error('❌ Support Modal не найден');
    }
};

window.debugOpenAnalysesModal = function() {
    console.log('🧪 Тест открытия Analyses Modal');
    const modal = document.getElementById('analysesModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = 'flex';
        console.log('✅ Analyses Modal открыт принудительно');
    } else {
        console.error('❌ Analyses Modal не найден');
    }
};

window.debugCloseModals = function() {
    console.log('🧪 Закрытие всех модальных окон');
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.add('hidden');
        modal.classList.remove('active');
        modal.style.display = 'none';
    });
    console.log('✅ Все модальные окна закрыты');
};

// 5. Добавляем обработчики напрямую
window.fixSupportButton = function() {
    console.log('🔧 Исправление кнопки Support');
    const btn = document.getElementById('supportProjectBtn');
    if (btn) {
        // Удаляем все старые обработчики
        btn.replaceWith(btn.cloneNode(true));
        const newBtn = document.getElementById('supportProjectBtn');
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Support button clicked!');
            debugOpenSupportModal();
        });
        console.log('✅ Support button fixed');
    }
};

window.fixAnalysesButton = function() {
    console.log('🔧 Исправление кнопки My Analyses');
    const btn = document.getElementById('myAnalysesBtn');
    if (btn) {
        // Удаляем все старые обработчики
        btn.replaceWith(btn.cloneNode(true));
        const newBtn = document.getElementById('myAnalysesBtn');
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 My Analyses button clicked!');
            debugOpenAnalysesModal();
        });
        console.log('✅ My Analyses button fixed');
    }
};

console.log('=== КОМАНДЫ ДЛЯ ТЕСТИРОВАНИЯ ===');
console.log('debugOpenSupportModal() - открыть Support Modal');
console.log('debugOpenAnalysesModal() - открыть Analyses Modal');
console.log('debugCloseModals() - закрыть все модальные окна');
console.log('fixSupportButton() - исправить кнопку Support');
console.log('fixAnalysesButton() - исправить кнопку My Analyses');

// Автоматически исправляем кнопки
setTimeout(() => {
    fixSupportButton();
    fixAnalysesButton();
}, 1000);

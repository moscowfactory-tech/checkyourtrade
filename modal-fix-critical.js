// Критическое исправление модальных окон
console.log('🚨 Critical modal fix loaded');

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚨 DOM loaded, initializing critical modal fixes');
    
    // Простые функции для модальных окон
    function openModal(modalId) {
        console.log('🚨 Opening modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            console.log('✅ Modal opened:', modalId);
        } else {
            console.error('❌ Modal not found:', modalId);
        }
    }
    
    function closeModal(modalId) {
        console.log('🚨 Closing modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                document.body.style.overflow = 'auto';
            }, 300);
            console.log('✅ Modal closed:', modalId);
        }
    }
    
    // Делаем функции глобальными
    window.openModal = openModal;
    window.closeModal = closeModal;
    
    // Обработчики для кнопок "Поддержать проект"
    const supportButtons = [
        'newSupportProjectBtn',
        'footerSupportProjectBtn'
    ];
    
    supportButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚨 Support button clicked:', buttonId);
                openModal('supportModal');
            });
            console.log('✅ Support button handler added:', buttonId);
        } else {
            console.warn('⚠️ Support button not found:', buttonId);
        }
    });
    
    // Обработчик для кнопки "Мои анализы"
    const myAnalysesBtn = document.getElementById('myAnalysesBtn');
    if (myAnalysesBtn) {
        myAnalysesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🚨 My analyses button clicked');
            
            // Рендерим список анализов
            if (typeof renderAnalysesList === 'function') {
                renderAnalysesList();
            }
            
            openModal('analysesModal');
        });
        console.log('✅ My analyses button handler added');
    } else {
        console.warn('⚠️ My analyses button not found');
    }
    
    // Обработчики для закрытия модальных окон
    const closeButtons = [
        'closeSupportModalBtn',
        'closeAnalysesModalBtn'
    ];
    
    closeButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🚨 Close button clicked:', buttonId);
                
                if (buttonId.includes('Support')) {
                    closeModal('supportModal');
                } else if (buttonId.includes('Analyses')) {
                    closeModal('analysesModal');
                }
            });
            console.log('✅ Close button handler added:', buttonId);
        }
    });
    
    // Закрытие по клику на backdrop
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-backdrop')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                console.log('🚨 Backdrop clicked, closing modal:', modal.id);
                closeModal(modal.id);
            }
        }
    });
    
    console.log('🚨 Critical modal fix initialization complete');
});

// Экспорт для использования в других файлах
window.criticalModalFix = true;

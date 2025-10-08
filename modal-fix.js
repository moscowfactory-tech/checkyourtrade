// Исправление модальных окон - простое и надежное решение
console.log('🔧 Loading modal fixes...');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing modal fixes...');
    
    // Функции для модальных окон
    function openSupportModal() {
        console.log('💖 Opening support modal');
        const modal = document.getElementById('supportModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('active');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('✅ Support modal opened successfully');
        } else {
            console.error('❌ Support modal not found');
        }
    }
    
    function closeSupportModal() {
        console.log('💖 Closing support modal');
        const modal = document.getElementById('supportModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
            console.log('✅ Support modal closed');
        }
    }
    
    function openAnalysesModal() {
        console.log('📊 Opening analyses modal');
        const modal = document.getElementById('analysesModal');
        if (modal) {
            // Рендерим список анализов
            renderAnalysesList();
            modal.classList.remove('hidden');
            modal.classList.add('active');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            console.log('✅ Analyses modal opened successfully');
        } else {
            console.error('❌ Analyses modal not found');
        }
    }
    
    function closeAnalysesModal() {
        console.log('📊 Closing analyses modal');
        const modal = document.getElementById('analysesModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
            console.log('✅ Analyses modal closed');
        }
    }
    
    function renderAnalysesList() {
        const analysesList = document.getElementById('analysesList');
        if (!analysesList) return;
        
        analysesList.innerHTML = '<p>Анализы загружаются из базы данных...</p>';
        
        // TODO: Загрузить из базы данных
        // const analyses = await AnalysisDB.getAll();
        // if (analyses.length === 0) {
        //     analysesList.innerHTML = '<p>Пока нет сохраненных анализов</p>';
        // } else {
        //     // Рендер анализов
        // }
    }
    
    // Универсальный обработчик кликов
    document.addEventListener('click', function(e) {
        const target = e.target;
        const closest = target.closest ? target.closest('[id]') : null;
        const targetId = target.id || (closest ? closest.id : '');
        
        // Кнопки "Поддержать проект"
        if (targetId === 'newSupportProjectBtn' || targetId === 'newSupportProjectFooterBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 Support button clicked:', targetId);
            openSupportModal();
            return;
        }
        
        // Кнопка "Мои анализы"
        if (targetId === 'myAnalysesBtn') {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎯 My analyses button clicked');
            openAnalysesModal();
            return;
        }
        
        // Кнопки закрытия
        if (targetId === 'closeSupportModalBtn' || targetId === 'closeSupportBtn') {
            e.preventDefault();
            closeSupportModal();
            return;
        }
        
        if (targetId === 'closeAnalysesModalBtn' || targetId === 'closeAnalysesBtn') {
            e.preventDefault();
            closeAnalysesModal();
            return;
        }
        
        // Закрытие по backdrop
        if (target.classList.contains('modal') || target.classList.contains('modal-backdrop')) {
            if (target.closest('#supportModal')) {
                closeSupportModal();
            } else if (target.closest('#analysesModal')) {
                closeAnalysesModal();
            }
        }
    });
    
    // Экспорт функций в глобальную область
    window.openSupportModal = openSupportModal;
    window.closeSupportModal = closeSupportModal;
    window.openAnalysesModal = openAnalysesModal;
    window.closeAnalysesModal = closeAnalysesModal;
    
    console.log('✅ Modal fixes initialized successfully');
});

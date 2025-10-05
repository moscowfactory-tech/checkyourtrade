// Простая и надежная версия TradeAnalyzer
console.log('🚀 Starting TradeAnalyzer Simple Version');

// Глобальные переменные
let strategies = [];
let savedAnalyses = [];
let currentAnalysisStrategy = null;
let currentCardIndex = 0;
let analysisAnswers = [];
let isEditMode = false;
let currentStrategy = null;

// Примеры стратегий
const sampleStrategies = [
    {
        id: 1,
        name: "Технический анализ движения",
        description: "Анализ технических индикаторов и движения цены",
        fields: [
            {
                name: "Анализ тренда",
                description: "Определение направления основного тренда",
                inputs: [
                    {
                        type: "select",
                        label: "Направление тренда",
                        options: ["Восходящий", "Нисходящий", "Боковой"],
                        required: true
                    },
                    {
                        type: "select",
                        label: "Сила тренда",
                        options: ["Сильный", "Умеренный", "Слабый"],
                        required: true
                    }
                ]
            },
            {
                name: "Уровни поддержки и сопротивления",
                description: "Анализ ключевых уровней",
                inputs: [
                    {
                        type: "select",
                        label: "Близость к поддержке",
                        options: ["Очень близко", "Близко", "Далеко"],
                        required: true
                    },
                    {
                        type: "select",
                        label: "Близость к сопротивлению",
                        options: ["Очень близко", "Близко", "Далеко"],
                        required: true
                    }
                ]
            }
        ]
    },
    {
        id: 2,
        name: "Фундаментальный анализ",
        description: "Анализ новостей и фундаментальных факторов",
        fields: [
            {
                name: "Анализ новостей",
                description: "Оценка влияния новостей на рынок",
                inputs: [
                    {
                        type: "select",
                        label: "Тип новостей",
                        options: ["Позитивные", "Негативные", "Нейтральные"],
                        required: true
                    },
                    {
                        type: "select",
                        label: "Важность новостей",
                        options: ["Высокая", "Средняя", "Низкая"],
                        required: true
                    }
                ]
            },
            {
                name: "Экономические показатели",
                description: "Анализ ключевых экономических данных",
                inputs: [
                    {
                        type: "select",
                        label: "Состояние экономики",
                        options: ["Растущая", "Стабильная", "Падающая"],
                        required: true
                    }
                ]
            }
        ]
    },
    {
        id: 3,
        name: "Пробой",
        description: "Стратегия торговли на пробоях уровней",
        fields: [
            {
                name: "Анализ уровня пробоя",
                description: "Оценка силы и качества пробоя",
                inputs: [
                    {
                        type: "select",
                        label: "Тип уровня",
                        options: ["Поддержка", "Сопротивление", "Трендовая линия"],
                        required: true
                    },
                    {
                        type: "select",
                        label: "Сила пробоя",
                        options: ["Сильный", "Умеренный", "Слабый"],
                        required: true
                    }
                ]
            },
            {
                name: "Подтверждение пробоя",
                description: "Анализ подтверждающих сигналов",
                inputs: [
                    {
                        type: "select",
                        label: "Объем при пробое",
                        options: ["Высокий", "Средний", "Низкий"],
                        required: true
                    },
                    {
                        type: "select",
                        label: "Ретест уровня",
                        options: ["Успешный", "Неуспешный", "Не было"],
                        required: true
                    }
                ]
            }
        ]
    }
];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 DOM loaded, initializing...');
    
    // Загружаем стратегии
    loadStrategies();
    
    // Настраиваем обработчики событий
    setupEventHandlers();
    
    // Рендерим интерфейс
    renderStrategies();
    updateStrategySelect();
    
    console.log('✅ TradeAnalyzer initialized');
});

// Загрузка стратегий
function loadStrategies() {
    console.log('📂 Loading strategies...');
    
    // Очищаем localStorage
    console.log('🧹 Clearing localStorage...');
    localStorage.removeItem('strategies');
    localStorage.removeItem('savedAnalyses');
    localStorage.removeItem('analyses');
    
    // Используем только примеры стратегий (в будущем будет загрузка из БД)
    strategies = [...sampleStrategies];
    savedAnalyses = [];
    
    console.log('✅ Using fresh sample strategies:', strategies.length);
    console.log('✅ Cleared saved analyses');
}

// Настройка обработчиков событий
function setupEventHandlers() {
    console.log('🔗 Setting up event handlers...');
    
    // Универсальный обработчик кликов
    document.addEventListener('click', function(e) {
        const target = e.target;
        const targetId = target.id;
        const closest = target.closest ? target.closest('[id]') : null;
        const closestId = closest ? closest.id : null;
        
        console.log('🖱️ Click detected:', targetId || closestId || 'unknown');
        
        // Кнопка "Поддержать проект"
        if (targetId === 'supportProjectBtn' || closestId === 'supportProjectBtn' ||
            targetId === 'supportProjectFooterBtn' || closestId === 'supportProjectFooterBtn') {
            e.preventDefault();
            console.log('💖 Opening support modal');
            openSupportModal();
            return;
        }
        
        // Кнопка "Мои анализы"
        if (targetId === 'myAnalysesBtn' || closestId === 'myAnalysesBtn') {
            e.preventDefault();
            console.log('📊 Opening analyses modal');
            openAnalysesModal();
            return;
        }
        
        // Навигация по секциям
        if (target.hasAttribute('data-section')) {
            e.preventDefault();
            const section = target.getAttribute('data-section');
            console.log('🧭 Navigating to section:', section);
            showSection(section);
            return;
        }
        
        // Кнопка создания стратегии
        if (targetId === 'createStrategyBtn' || target.textContent.includes('Создать стратегию')) {
            e.preventDefault();
            console.log('➕ Opening strategy modal');
            openModal();
            return;
        }
        
        // Кнопки навигации по карточкам
        if (targetId === 'prevBtn') {
            e.preventDefault();
            handlePrevCard();
            return;
        }
        
        if (targetId === 'nextBtn') {
            e.preventDefault();
            handleNextCard();
            return;
        }
        
        // Закрытие модальных окон
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
        if (target.classList.contains('modal-backdrop') || target.classList.contains('modal')) {
            if (target.closest('#supportModal')) {
                closeSupportModal();
            } else if (target.closest('#analysesModal')) {
                closeAnalysesModal();
            }
        }
    });
    
    console.log('✅ Event handlers set up');
}

// Показать секцию
function showSection(sectionName) {
    console.log('📄 Showing section:', sectionName);
    
    // Скрываем все секции
    const sections = document.querySelectorAll('main > section, main > div');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Показываем нужную секцию
    let targetSection;
    switch(sectionName) {
        case 'home':
            targetSection = document.querySelector('.hero').parentElement;
            break;
        case 'constructor':
            targetSection = document.getElementById('constructor');
            break;
        case 'analysis':
            targetSection = document.getElementById('analysis');
            break;
    }
    
    if (targetSection) {
        targetSection.style.display = 'block';
        
        // Обновляем данные при переходе
        if (sectionName === 'constructor') {
            renderStrategies();
        } else if (sectionName === 'analysis') {
            updateStrategySelect();
        }
    }
    
    // Обновляем активную ссылку в навигации
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionName) {
            link.classList.add('active');
        }
    });
}

// Рендеринг стратегий
function renderStrategies() {
    console.log('🎨 Rendering strategies...');
    
    const strategiesGrid = document.getElementById('strategiesGrid');
    if (!strategiesGrid) {
        console.error('❌ strategiesGrid not found');
        return;
    }
    
    strategiesGrid.innerHTML = '';
    
    if (strategies.length === 0) {
        strategiesGrid.innerHTML = `
            <div class="empty-state">
                <p>Пока нет созданных стратегий. Создайте свою первую стратегию!</p>
            </div>
        `;
        return;
    }
    
    strategies.forEach(strategy => {
        const strategyCard = document.createElement('div');
        strategyCard.className = 'strategy-card';
        strategyCard.innerHTML = `
            <div class="strategy-header">
                <h3>${strategy.name}</h3>
                <div class="strategy-actions">
                    <button class="btn btn--sm btn--outline" onclick="editStrategy(${strategy.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn--sm btn--outline btn--danger" onclick="deleteStrategy(${strategy.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="strategy-description">${strategy.description}</p>
            <div class="strategy-stats">
                <span class="stat">
                    <i class="fas fa-list"></i>
                    ${strategy.fields.length} оснований
                </span>
            </div>
        `;
        strategiesGrid.appendChild(strategyCard);
    });
    
    console.log('✅ Rendered', strategies.length, 'strategies');
}

// Обновление списка стратегий для анализа
function updateStrategySelect() {
    console.log('🔄 Updating strategy select...');
    
    const strategySelect = document.getElementById('strategySelect');
    if (!strategySelect) {
        console.error('❌ strategySelect not found');
        return;
    }
    
    strategySelect.innerHTML = '<option value="">Выберите стратегию...</option>';
    
    strategies.forEach(strategy => {
        const option = document.createElement('option');
        option.value = strategy.id;
        option.textContent = strategy.name;
        strategySelect.appendChild(option);
    });
    
    // Добавляем обработчик изменения стратегии
    strategySelect.addEventListener('change', function(e) {
        const strategyId = parseInt(e.target.value);
        if (strategyId) {
            const strategy = strategies.find(s => s.id === strategyId);
            if (strategy) {
                startCardAnalysis(strategy);
            }
        } else {
            hideCardAnalysis();
        }
    });
    
    console.log('✅ Updated strategy select with', strategies.length, 'options');
}

// Модальные окна
function openSupportModal() {
    console.log('💖 Opening support modal');
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log('✅ Support modal opened');
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
    }
}

function openAnalysesModal() {
    console.log('📊 Opening analyses modal');
    const modal = document.getElementById('analysesModal');
    if (modal) {
        renderAnalysesList();
        modal.classList.remove('hidden');
        modal.classList.add('active');
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        console.log('✅ Analyses modal opened');
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
    }
}

function renderAnalysesList() {
    const analysesList = document.getElementById('analysesList');
    if (!analysesList) return;
    
    analysesList.innerHTML = '';
    
    if (savedAnalyses.length === 0) {
        analysesList.innerHTML = '<p>Пока нет сохраненных анализов</p>';
        return;
    }
    
    savedAnalyses.forEach((analysis, index) => {
        const analysisCard = document.createElement('div');
        analysisCard.className = 'analysis-card';
        analysisCard.innerHTML = `
            <h4>${analysis.strategyName}</h4>
            <p>Дата: ${new Date(analysis.date).toLocaleDateString()}</p>
            <div class="analysis-actions">
                <button class="btn btn--outline btn--sm" onclick="viewAnalysis(${index})">Просмотр</button>
                <button class="btn btn--outline btn--sm" onclick="deleteAnalysis(${index})">Удалить</button>
            </div>
        `;
        analysesList.appendChild(analysisCard);
    });
}

// Простая функция создания стратегии
function openModal() {
    console.log('➕ Opening strategy modal (placeholder)');
    alert('Функция создания стратегии временно недоступна. Используйте существующие стратегии.');
}

// Функции для кнопок стратегий
function editStrategy(id) {
    console.log('✏️ Edit strategy:', id);
    alert('Функция редактирования временно недоступна');
}

function deleteStrategy(id) {
    console.log('🗑️ Delete strategy:', id);
    if (confirm('Удалить стратегию?')) {
        strategies = strategies.filter(s => s.id !== id);
        // TODO: Удалить из базы данных
        // await StrategyDB.delete(id);
        renderStrategies();
        updateStrategySelect();
    }
}

// Функции анализа сделок
function startCardAnalysis(strategy) {
    console.log('🎯 Starting card analysis for:', strategy.name);
    console.log('📊 Strategy data:', strategy);
    
    currentAnalysisStrategy = strategy;
    currentCardIndex = 0;
    analysisAnswers = new Array(strategy.fields.length).fill(null);
    
    const cardAnalysisContainer = document.getElementById('cardAnalysisContainer');
    const analysisResults = document.getElementById('analysisResults');
    
    console.log('🔍 Container elements:', {
        cardAnalysisContainer: !!cardAnalysisContainer,
        analysisResults: !!analysisResults
    });
    
    if (cardAnalysisContainer) {
        cardAnalysisContainer.classList.remove('hidden');
        cardAnalysisContainer.style.display = 'block';
        console.log('✅ Card analysis container shown');
        
        renderCurrentCard();
        updateProgress();
        updateNavigation();
    } else {
        console.error('❌ cardAnalysisContainer not found');
    }
    
    if (analysisResults) {
        analysisResults.classList.add('hidden');
    }
}

function hideCardAnalysis() {
    const cardAnalysisContainer = document.getElementById('cardAnalysisContainer');
    const analysisResults = document.getElementById('analysisResults');
    
    if (cardAnalysisContainer) {
        cardAnalysisContainer.classList.add('hidden');
    }
    if (analysisResults) {
        analysisResults.classList.add('hidden');
    }
}

function renderCurrentCard() {
    console.log('🎨 Rendering current card:', currentCardIndex);
    
    if (!currentAnalysisStrategy || currentCardIndex >= currentAnalysisStrategy.fields.length) {
        console.error('❌ No strategy or invalid card index');
        return;
    }
    
    const field = currentAnalysisStrategy.fields[currentCardIndex];
    console.log('📋 Current field:', field);
    
    const cardTitle = document.getElementById('cardTitle');
    const cardDescription = document.getElementById('cardDescription');
    const cardInputs = document.getElementById('cardInputs');
    
    console.log('🔍 Card elements found:', {
        cardTitle: !!cardTitle,
        cardDescription: !!cardDescription,
        cardInputs: !!cardInputs
    });
    
    if (cardTitle) {
        cardTitle.textContent = field.name;
        console.log('✅ Title set:', field.name);
    }
    
    if (cardDescription) {
        cardDescription.textContent = field.description;
        console.log('✅ Description set:', field.description);
    }
    
    if (cardInputs) {
        cardInputs.innerHTML = '';
        console.log('🧹 Cleared inputs container');
        
        if (field.inputs && field.inputs.length > 0) {
            field.inputs.forEach((input, inputIndex) => {
                console.log('🔧 Creating input:', input);
                
                const inputContainer = document.createElement('div');
                inputContainer.className = 'input-container';
                inputContainer.style.marginBottom = '16px';
                
                const label = document.createElement('label');
                label.textContent = input.label;
                label.className = 'form-label';
                label.style.cssText = `
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: var(--color-text-primary, #333);
                `;
                inputContainer.appendChild(label);
                
                if (input.type === 'select') {
                    const select = document.createElement('select');
                    select.className = 'form-control';
                    select.style.cssText = `
                        width: 100%;
                        padding: 12px;
                        border: 1px solid var(--color-border, #ddd);
                        border-radius: 8px;
                        background: var(--color-surface, #fff);
                        color: var(--color-text-primary, #333);
                        font-size: 14px;
                    `;
                    select.addEventListener('change', (e) => handleCardInput(inputIndex, e.target.value));
                    
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Выберите...';
                    select.appendChild(defaultOption);
                    
                    input.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option;
                        optionElement.textContent = option;
                        select.appendChild(optionElement);
                    });
                    
                    inputContainer.appendChild(select);
                    console.log('✅ Select created with', input.options.length, 'options');
                }
                
                cardInputs.appendChild(inputContainer);
            });
            
            console.log('✅ All inputs created:', field.inputs.length);
        } else {
            console.error('❌ No inputs found in field');
        }
    } else {
        console.error('❌ cardInputs element not found');
    }
    
    console.log('✅ Card rendered successfully');
}

function handleCardInput(inputIndex, value) {
    if (!analysisAnswers[currentCardIndex]) {
        analysisAnswers[currentCardIndex] = {
            fieldName: currentAnalysisStrategy.fields[currentCardIndex].name,
            fieldValues: {}
        };
    }
    
    analysisAnswers[currentCardIndex].fieldValues[inputIndex] = value;
    
    // Проверяем, заполнены ли все обязательные поля
    const field = currentAnalysisStrategy.fields[currentCardIndex];
    const allFilled = field.inputs.every((input, idx) => {
        return !input.required || analysisAnswers[currentCardIndex].fieldValues[idx];
    });
    
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.disabled = !allFilled;
    }
}

function updateProgress() {
    const current = currentCardIndex + 1;
    const total = currentAnalysisStrategy.fields.length;
    
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    
    if (progressText) {
        progressText.textContent = `Карточка ${current} из ${total}`;
    }
    
    if (progressFill) {
        const percentage = (current / total) * 100;
        progressFill.style.width = `${percentage}%`;
    }
}

function updateNavigation() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const nextBtnText = document.getElementById('nextBtnText');
    
    if (prevBtn) {
        prevBtn.disabled = currentCardIndex === 0;
    }
    
    const isLastCard = currentCardIndex === currentAnalysisStrategy.fields.length - 1;
    if (nextBtnText) {
        nextBtnText.textContent = isLastCard ? 'Завершить анализ' : 'Далее →';
    }
    
    const currentAnswer = analysisAnswers[currentCardIndex];
    if (nextBtn) {
        nextBtn.disabled = !currentAnswer;
    }
}

// Навигация по карточкам
function handlePrevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        renderCurrentCard();
        updateProgress();
        updateNavigation();
    }
}

function handleNextCard() {
    const currentAnswer = analysisAnswers[currentCardIndex];
    
    if (!currentAnswer) {
        alert('Пожалуйста, заполните все обязательные поля');
        return;
    }
    
    if (currentCardIndex < currentAnalysisStrategy.fields.length - 1) {
        currentCardIndex++;
        renderCurrentCard();
        updateProgress();
        updateNavigation();
    } else {
        completeAnalysis();
    }
}

function completeAnalysis() {
    console.log('🎯 Analysis completed');
    
    const analysis = {
        id: Date.now(),
        strategyName: currentAnalysisStrategy.name,
        strategyId: currentAnalysisStrategy.id,
        date: new Date().toISOString(),
        answers: analysisAnswers
    };
    
    savedAnalyses.push(analysis);
    // TODO: Сохранить в базу данных
    // await AnalysisDB.create(analysis);
    
    // Показываем результаты
    displayAnalysisResults(analysis);
}

function displayAnalysisResults(analysis) {
    const cardAnalysisContainer = document.getElementById('cardAnalysisContainer');
    const analysisResults = document.getElementById('analysisResults');
    
    if (cardAnalysisContainer) {
        cardAnalysisContainer.classList.add('hidden');
    }
    
    if (analysisResults) {
        analysisResults.classList.remove('hidden');
        
        let resultsHTML = `
            <div class="analysis-summary">
                <h3>Анализ завершен</h3>
                <p>Стратегия: ${analysis.strategyName}</p>
                <p>Дата: ${new Date(analysis.date).toLocaleString()}</p>
            </div>
            <div class="analysis-details">
        `;
        
        analysis.answers.forEach((answer, index) => {
            if (answer) {
                resultsHTML += `
                    <div class="result-item">
                        <h4>${answer.fieldName}</h4>
                        <ul>
                `;
                
                Object.values(answer.fieldValues).forEach(value => {
                    if (value) {
                        resultsHTML += `<li>${value}</li>`;
                    }
                });
                
                resultsHTML += `</ul></div>`;
            }
        });
        
        resultsHTML += `
            </div>
            <button class="btn btn--primary" onclick="startNewAnalysis()">Новый анализ</button>
        `;
        
        analysisResults.innerHTML = resultsHTML;
    }
}

function startNewAnalysis() {
    const strategySelect = document.getElementById('strategySelect');
    const cardAnalysisContainer = document.getElementById('cardAnalysisContainer');
    const analysisResults = document.getElementById('analysisResults');
    
    if (strategySelect) {
        strategySelect.value = '';
    }
    
    if (cardAnalysisContainer) {
        cardAnalysisContainer.classList.add('hidden');
    }
    
    if (analysisResults) {
        analysisResults.classList.add('hidden');
    }
    
    currentAnalysisStrategy = null;
    currentCardIndex = 0;
    analysisAnswers = [];
}

// Функции для анализов
function viewAnalysis(index) {
    console.log('👁️ View analysis:', index);
    alert('Функция просмотра анализа временно недоступна');
}

function deleteAnalysis(index) {
    console.log('🗑️ Delete analysis:', index);
    if (confirm('Удалить анализ?')) {
        const analysis = savedAnalyses[index];
        savedAnalyses.splice(index, 1);
        // TODO: Удалить из базы данных
        // await AnalysisDB.delete(analysis.id);
        renderAnalysesList();
    }
}

// Экспорт функций в глобальную область
window.showSection = showSection;
window.openSupportModal = openSupportModal;
window.closeSupportModal = closeSupportModal;
window.openAnalysesModal = openAnalysesModal;
window.closeAnalysesModal = closeAnalysesModal;
window.openModal = openModal;
window.editStrategy = editStrategy;
window.deleteStrategy = deleteStrategy;
window.viewAnalysis = viewAnalysis;
window.deleteAnalysis = deleteAnalysis;
window.startNewAnalysis = startNewAnalysis;
window.handlePrevCard = handlePrevCard;
window.handleNextCard = handleNextCard;

console.log('✅ TradeAnalyzer Simple Version loaded');

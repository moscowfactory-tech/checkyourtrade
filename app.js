// Application State
let strategies = [];
let currentStrategy = null;
let isEditMode = false;
let fieldCounter = 0;
let inputCounter = 0;

// Card Analysis State
let currentCardIndex = 0;
let analysisAnswers = [];
let currentAnalysisStrategy = null;

// Sample data with correct structure
const sampleStrategies = [
  {
    id: 1,
    name: "Технический анализ движения",
    description: "Комплексная стратегия технического анализа",
    fields: [
      {
        name: "Анализ уровней",
        description: "Определение уровней поддержки и сопротивления",
        inputs: [
          {type: "text", label: "Символ актива", required: true},
          {type: "select", label: "Тайм-фрейм", options: ["1m", "5m", "15m", "1h", "4h", "1d"], required: true},
          {type: "number", label: "Уровень поддержки", required: false}
        ]
      },
      {
        name: "Объемы торгов",
        description: "Анализ торговых объемов",
        inputs: [
          {type: "number", label: "Текущий объем", required: true},
          {type: "select", label: "Объем относительно среднего", options: ["Выше среднего", "Средний", "Ниже среднего"], required: true},
          {type: "boolean", label: "Есть аномальные всплески", required: false}
        ]
      },
      {
        name: "Индикаторы RSI",
        description: "Анализ индикатора относительной силы",
        inputs: [
          {type: "number", label: "Значение RSI", required: true},
          {type: "select", label: "Зона RSI", options: ["Перекупленность (>70)", "Нормальная (30-70)", "Перепроданность (<30)"], required: true}
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
        name: "Новостной фон",
        description: "Оценка влияния новостей на актив",
        inputs: [
          {type: "boolean", label: "Есть важные новости сегодня", required: true},
          {type: "textarea", label: "Описание новостей", required: false},
          {type: "select", label: "Тональность новостей", options: ["Позитивная", "Нейтральная", "Негативная"], required: true}
        ]
      },
      {
        name: "Экономические показатели", 
        description: "Анализ макроэкономических факторов",
        inputs: [
          {type: "select", label: "Настроение рынка", options: ["Бычье", "Нейтральное", "Медвежье"], required: true},
          {type: "number", label: "VIX (индекс страха)", required: false}
        ]
      }
    ]
  }
];

const colorOptions = [
  {value: "positive", color: "#22c55e", label: "Хорошо"},
  {value: "neutral", color: "#eab308", label: "Нейтрально"}, 
  {value: "negative", color: "#ef4444", label: "Плохо"}
];

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const createStrategyBtn = document.getElementById('createStrategyBtn');
const strategyModal = document.getElementById('strategyModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const strategyForm = document.getElementById('strategyForm');
const addFieldBtn = document.getElementById('addFieldBtn');
const fieldsContainer = document.getElementById('fieldsContainer');
const strategiesGrid = document.getElementById('strategiesGrid');
const strategySelect = document.getElementById('strategySelect');
const cardAnalysisContainer = document.getElementById('cardAnalysisContainer');
const analysisCard = document.getElementById('analysisCard');
const cardTitle = document.getElementById('cardTitle');
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const nextBtnText = document.getElementById('nextBtnText');
const analysisResults = document.getElementById('analysisResults');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    strategies = [...sampleStrategies];
    
    setupEventListeners();
    renderStrategies();
    updateStrategySelect();
    showSection('home');
    
    console.log('TradeAnalyzer initialized with correct field structure:', strategies);
});

// Event Listeners Setup
function setupEventListeners() {
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    document.querySelectorAll('[data-section]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const section = e.target.getAttribute('data-section');
            if (section) {
                showSection(section);
                updateActiveNavLink(section);
            }
        });
    });
    
    hamburger.addEventListener('click', toggleMobileMenu);
    
    createStrategyBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    strategyModal.addEventListener('click', (e) => {
        if (e.target === strategyModal) closeModal();
    });
    
    strategyForm.addEventListener('submit', handleStrategySubmit);
    addFieldBtn.addEventListener('click', addFieldBuilder);
    
    strategySelect.addEventListener('change', handleStrategySelection);
    
    prevBtn.addEventListener('click', handlePrevCard);
    nextBtn.addEventListener('click', handleNextCard);
    
    newAnalysisBtn.addEventListener('click', resetAnalysis);
}

// Navigation Functions
function handleNavigation(e) {
    e.preventDefault();
    const targetSection = e.target.getAttribute('data-section');
    showSection(targetSection);
    updateActiveNavLink(targetSection);
    
    navMenu.classList.remove('active');
    hamburger.classList.remove('active');
}

function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.classList.add('fade-in');
        
        setTimeout(() => {
            targetSection.classList.remove('fade-in');
        }, 300);
    }
}

function updateActiveNavLink(sectionId) {
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        }
    });
}

function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    hamburger.classList.toggle('active');
}

// Modal Functions
function openModal(strategy = null) {
    isEditMode = !!strategy;
    currentStrategy = strategy;
    
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = isEditMode ? 'Редактировать стратегию' : 'Создать стратегию';
    
    if (isEditMode) {
        populateForm(strategy);
    } else {
        resetForm();
    }
    
    strategyModal.classList.remove('hidden');
    strategyModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    strategyModal.classList.remove('active');
    setTimeout(() => {
        strategyModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        resetForm();
    }, 300);
}

function resetForm() {
    strategyForm.reset();
    fieldsContainer.innerHTML = '';
    fieldCounter = 0;
    inputCounter = 0;
    currentStrategy = null;
    isEditMode = false;
}

function populateForm(strategy) {
    document.getElementById('strategyName').value = strategy.name;
    document.getElementById('strategyDescription').value = strategy.description;
    
    fieldsContainer.innerHTML = '';
    fieldCounter = 0;
    inputCounter = 0;
    
    strategy.fields.forEach(field => {
        addFieldBuilder(field);
    });
}

// Field Builder Functions - Updated for new structure
function addFieldBuilder(fieldData = null) {
    fieldCounter++;
    
    const fieldBuilder = document.createElement('div');
    fieldBuilder.className = 'field-builder';
    fieldBuilder.setAttribute('data-field-id', fieldCounter);
    
    fieldBuilder.innerHTML = `
        <div class="field-header">
            <h4>Пункт чек-листа ${fieldCounter}</h4>
            <button type="button" class="remove-field" title="Удалить пункт">🗑️</button>
        </div>
        <div class="field-info">
            <div class="form-group">
                <label class="form-label">Название пункта</label>
                <input type="text" class="form-control" name="fieldName" value="${fieldData?.name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Описание пункта</label>
                <textarea class="form-control" name="fieldDescription" rows="2">${fieldData?.description || ''}</textarea>
            </div>
        </div>
        <div class="inputs-section">
            <div class="inputs-header">
                <label class="form-label">Поля ввода для этого пункта</label>
                <button type="button" class="btn btn--outline btn--sm add-input-btn">+ Добавить поле</button>
            </div>
            <div class="inputs-container"></div>
        </div>
    `;
    
    const removeBtn = fieldBuilder.querySelector('.remove-field');
    const addInputBtn = fieldBuilder.querySelector('.add-input-btn');
    const inputsContainer = fieldBuilder.querySelector('.inputs-container');
    
    removeBtn.addEventListener('click', () => {
        fieldBuilder.remove();
    });
    
    addInputBtn.addEventListener('click', () => {
        addInputBuilder(inputsContainer);
    });
    
    // Add existing inputs if editing
    if (fieldData && fieldData.inputs) {
        fieldData.inputs.forEach(input => {
            addInputBuilder(inputsContainer, input);
        });
    } else {
        // Add one default input
        addInputBuilder(inputsContainer);
    }
    
    fieldsContainer.appendChild(fieldBuilder);
}

function addInputBuilder(container, inputData = null) {
    inputCounter++;
    
    const inputBuilder = document.createElement('div');
    inputBuilder.className = 'input-builder';
    inputBuilder.setAttribute('data-input-id', inputCounter);
    
    const isSelect = inputData?.type === 'select';
    const options = inputData?.options || [];
    
    inputBuilder.innerHTML = `
        <div class="input-row">
            <div class="form-group">
                <label class="form-label">Название поля</label>
                <input type="text" class="form-control" name="inputLabel" value="${inputData?.label || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Тип поля</label>
                <select class="form-control" name="inputType" required>
                    <option value="text" ${inputData?.type === 'text' ? 'selected' : ''}>Текст</option>
                    <option value="number" ${inputData?.type === 'number' ? 'selected' : ''}>Число</option>
                    <option value="select" ${inputData?.type === 'select' ? 'selected' : ''}>Выбор из списка</option>
                    <option value="boolean" ${inputData?.type === 'boolean' ? 'selected' : ''}>Да/Нет</option>
                    <option value="textarea" ${inputData?.type === 'textarea' ? 'selected' : ''}>Многострочный текст</option>
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Обязательное</label>
                <select class="form-control" name="inputRequired">
                    <option value="true" ${inputData?.required ? 'selected' : ''}>Да</option>
                    <option value="false" ${!inputData?.required ? 'selected' : ''}>Нет</option>
                </select>
            </div>
            <button type="button" class="remove-input" title="Удалить поле">🗑️</button>
        </div>
        <div class="input-options ${isSelect ? '' : 'hidden'}">
            <label class="form-label">Варианты выбора (через запятую)</label>
            <input type="text" class="form-control" name="inputOptions" 
                   value="${options.join(', ')}" 
                   placeholder="Вариант 1, Вариант 2, Вариант 3">
        </div>
    `;
    
    const typeSelect = inputBuilder.querySelector('select[name="inputType"]');
    const optionsDiv = inputBuilder.querySelector('.input-options');
    const removeBtn = inputBuilder.querySelector('.remove-input');
    
    typeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'select') {
            optionsDiv.classList.remove('hidden');
        } else {
            optionsDiv.classList.add('hidden');
        }
    });
    
    removeBtn.addEventListener('click', () => {
        inputBuilder.remove();
    });
    
    container.appendChild(inputBuilder);
}

// Strategy Management
function handleStrategySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(strategyForm);
    const strategyName = formData.get('strategyName');
    const strategyDescription = formData.get('strategyDescription');
    
    if (!strategyName.trim()) {
        alert('Пожалуйста, введите название стратегии');
        return;
    }
    
    // Collect fields
    const fields = [];
    const fieldBuilders = fieldsContainer.querySelectorAll('.field-builder');
    
    fieldBuilders.forEach(builder => {
        const fieldName = builder.querySelector('input[name="fieldName"]').value;
        const fieldDescription = builder.querySelector('textarea[name="fieldDescription"]').value;
        const inputBuilders = builder.querySelectorAll('.input-builder');
        
        if (!fieldName.trim()) return;
        
        const inputs = [];
        inputBuilders.forEach(inputBuilder => {
            const inputLabel = inputBuilder.querySelector('input[name="inputLabel"]').value;
            const inputType = inputBuilder.querySelector('select[name="inputType"]').value;
            const inputRequired = inputBuilder.querySelector('select[name="inputRequired"]').value === 'true';
            const inputOptionsInput = inputBuilder.querySelector('input[name="inputOptions"]');
            
            if (!inputLabel.trim()) return;
            
            const input = {
                type: inputType,
                label: inputLabel,
                required: inputRequired
            };
            
            if (inputType === 'select' && inputOptionsInput) {
                const options = inputOptionsInput.value
                    .split(',')
                    .map(opt => opt.trim())
                    .filter(opt => opt);
                
                if (options.length > 0) {
                    input.options = options;
                }
            }
            
            inputs.push(input);
        });
        
        if (inputs.length > 0) {
            const field = {
                name: fieldName,
                description: fieldDescription,
                inputs: inputs
            };
            fields.push(field);
        }
    });
    
    if (fields.length === 0) {
        alert('Добавьте хотя бы один пункт чек-листа с полями');
        return;
    }
    
    const strategy = {
        id: isEditMode ? currentStrategy.id : Date.now(),
        name: strategyName,
        description: strategyDescription,
        fields: fields
    };
    
    if (isEditMode) {
        const index = strategies.findIndex(s => s.id === currentStrategy.id);
        strategies[index] = strategy;
        console.log('Strategy updated:', strategy);
    } else {
        strategies.push(strategy);
        console.log('New strategy created:', strategy);
    }
    
    renderStrategies();
    updateStrategySelect();
    closeModal();
    
    showNotification(isEditMode ? 'Стратегия обновлена!' : 'Стратегия создана!', 'success');
}

function deleteStrategy(id) {
    if (confirm('Вы уверены, что хотите удалить эту стратегию?')) {
        strategies = strategies.filter(s => s.id !== id);
        console.log('Strategy deleted, ID:', id);
        renderStrategies();
        updateStrategySelect();
        showNotification('Стратегия удалена', 'info');
    }
}

function renderStrategies() {
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
        const totalInputs = strategy.fields.reduce((sum, field) => sum + field.inputs.length, 0);
        const strategyCard = document.createElement('div');
        strategyCard.className = 'strategy-card';
        
        strategyCard.innerHTML = `
            <h4>${strategy.name}</h4>
            <p>${strategy.description || 'Без описания'}</p>
            <div class="strategy-meta">
                <span class="fields-count">${strategy.fields.length} пунктов, ${totalInputs} полей</span>
            </div>
            <div class="strategy-actions">
                <button class="btn-icon edit" onclick="openModal(strategies.find(s => s.id === ${strategy.id}))" title="Редактировать">✏️</button>
                <button class="btn-icon delete" onclick="deleteStrategy(${strategy.id})" title="Удалить">🗑️</button>
            </div>
        `;
        
        strategiesGrid.appendChild(strategyCard);
    });
}

// Analysis Section Functions
function updateStrategySelect() {
    const currentValue = strategySelect.value;
    strategySelect.innerHTML = '<option value="">-- Выберите стратегию --</option>';
    
    strategies.forEach(strategy => {
        const option = document.createElement('option');
        option.value = strategy.id;
        option.textContent = strategy.name;
        if (currentValue == strategy.id) {
            option.selected = true;
        }
        strategySelect.appendChild(option);
    });
}

function handleStrategySelection(e) {
    const strategyId = parseInt(e.target.value);
    
    if (!strategyId) {
        cardAnalysisContainer.classList.add('hidden');
        analysisResults.classList.add('hidden');
        return;
    }
    
    const strategy = strategies.find(s => s.id === strategyId);
    if (strategy) {
        startCardAnalysis(strategy);
    }
}

function startCardAnalysis(strategy) {
    currentAnalysisStrategy = strategy;
    currentCardIndex = 0;
    analysisAnswers = new Array(strategy.fields.length).fill(null);
    
    cardAnalysisContainer.classList.remove('hidden');
    analysisResults.classList.add('hidden');
    
    renderCurrentCard();
    updateProgress();
    updateNavigation();
    
    setTimeout(() => {
        analysisCard.classList.add('active');
    }, 100);
}

function renderCurrentCard() {
    if (!currentAnalysisStrategy || currentCardIndex >= currentAnalysisStrategy.fields.length) {
        return;
    }
    
    const currentField = currentAnalysisStrategy.fields[currentCardIndex];
    
    // Update card content with field inputs
    const cardContent = analysisCard.querySelector('.card-content');
    cardContent.innerHTML = `
        <h3 class="card-title">${currentField.name}</h3>
        <p class="card-description">${currentField.description || ''}</p>
        
        <div class="card-inputs">
            ${currentField.inputs.map((input, index) => renderInput(input, index)).join('')}
        </div>
        
        <div class="color-rating">
            <div class="rating-label">Общая оценка этого пункта:</div>
            <div class="color-options">
                <div class="color-option positive" data-value="positive">
                    <div class="color-circle"></div>
                    <span class="color-label">Хорошо</span>
                </div>
                <div class="color-option neutral" data-value="neutral">
                    <div class="color-circle"></div>
                    <span class="color-label">Нейтрально</span>
                </div>
                <div class="color-option negative" data-value="negative">
                    <div class="color-circle"></div>
                    <span class="color-label">Плохо</span>
                </div>
            </div>
        </div>
    `;
    
    // Setup color option event listeners
    const colorOptions = cardContent.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.getAttribute('data-value');
            handleColorSelection(value);
        });
    });
    
    // Restore previous selection if exists
    const previousAnswer = analysisAnswers[currentCardIndex];
    if (previousAnswer) {
        const selectedOption = cardContent.querySelector(`[data-value="${previousAnswer.rating}"]`);
        if (selectedOption) {
            selectedOption.classList.add('selected');
        }
        
        // Restore field values
        if (previousAnswer.fieldValues) {
            previousAnswer.fieldValues.forEach((value, index) => {
                const input = cardContent.querySelector(`[data-input-index="${index}"]`);
                if (input) {
                    if (input.type === 'checkbox') {
                        input.checked = value;
                    } else {
                        input.value = value;
                    }
                }
            });
        }
    }
}

function renderInput(input, index) {
    const inputId = `input_${currentCardIndex}_${index}`;
    
    switch (input.type) {
        case 'text':
            return `
                <div class="form-group">
                    <label class="form-label" for="${inputId}">${input.label} ${input.required ? '*' : ''}</label>
                    <input type="text" class="form-control" id="${inputId}" data-input-index="${index}" ${input.required ? 'required' : ''}>
                </div>
            `;
        
        case 'number':
            return `
                <div class="form-group">
                    <label class="form-label" for="${inputId}">${input.label} ${input.required ? '*' : ''}</label>
                    <input type="number" class="form-control" id="${inputId}" data-input-index="${index}" ${input.required ? 'required' : ''}>
                </div>
            `;
        
        case 'select':
            const options = input.options || [];
            return `
                <div class="form-group">
                    <label class="form-label" for="${inputId}">${input.label} ${input.required ? '*' : ''}</label>
                    <select class="form-control" id="${inputId}" data-input-index="${index}" ${input.required ? 'required' : ''}>
                        <option value="">-- Выберите --</option>
                        ${options.map(option => `<option value="${option}">${option}</option>`).join('')}
                    </select>
                </div>
            `;
        
        case 'boolean':
            return `
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="${inputId}" data-input-index="${index}"> 
                        ${input.label}
                    </label>
                </div>
            `;
        
        case 'textarea':
            return `
                <div class="form-group">
                    <label class="form-label" for="${inputId}">${input.label} ${input.required ? '*' : ''}</label>
                    <textarea class="form-control" id="${inputId}" data-input-index="${index}" rows="3" ${input.required ? 'required' : ''}></textarea>
                </div>
            `;
        
        default:
            return '';
    }
}

function handleColorSelection(value) {
    const colorOptions = analysisCard.querySelectorAll('.color-option');
    colorOptions.forEach(option => option.classList.remove('selected'));
    
    const selectedOption = analysisCard.querySelector(`[data-value="${value}"]`);
    selectedOption.classList.add('selected');
    
    // Save field values and rating
    const fieldValues = [];
    const inputs = analysisCard.querySelectorAll('[data-input-index]');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            fieldValues.push(input.checked);
        } else {
            fieldValues.push(input.value);
        }
    });
    
    analysisAnswers[currentCardIndex] = {
        rating: value,
        fieldValues: fieldValues
    };
    
    nextBtn.disabled = false;
    
    console.log(`Card ${currentCardIndex + 1} answered:`, analysisAnswers[currentCardIndex]);
}

function handlePrevCard() {
    if (currentCardIndex > 0) {
        analysisCard.classList.add('slide-out-right');
        
        setTimeout(() => {
            currentCardIndex--;
            renderCurrentCard();
            updateProgress();
            updateNavigation();
            
            analysisCard.classList.remove('slide-out-right');
            analysisCard.classList.add('slide-out-left');
            
            setTimeout(() => {
                analysisCard.classList.remove('slide-out-left');
            }, 50);
        }, 150);
    }
}

function handleNextCard() {
    const currentAnswer = analysisAnswers[currentCardIndex];
    
    if (!currentAnswer) {
        showNotification('Пожалуйста, выберите оценку для этого пункта', 'warning');
        return;
    }
    
    if (currentCardIndex < currentAnalysisStrategy.fields.length - 1) {
        analysisCard.classList.add('slide-out-left');
        
        setTimeout(() => {
            currentCardIndex++;
            renderCurrentCard();
            updateProgress();
            updateNavigation();
            
            analysisCard.classList.remove('slide-out-left');
            analysisCard.classList.add('slide-out-right');
            
            setTimeout(() => {
                analysisCard.classList.remove('slide-out-right');
            }, 50);
        }, 150);
    } else {
        completeAnalysis();
    }
}

function updateProgress() {
    const current = currentCardIndex + 1;
    const total = currentAnalysisStrategy.fields.length;
    
    progressText.textContent = `Карточка ${current} из ${total}`;
    
    const progressPercentage = (current / total) * 100;
    progressFill.style.width = `${progressPercentage}%`;
}

function updateNavigation() {
    if (currentCardIndex > 0) {
        prevBtn.classList.add('visible');
    } else {
        prevBtn.classList.remove('visible');
    }
    
    const isLastCard = currentCardIndex === currentAnalysisStrategy.fields.length - 1;
    nextBtnText.textContent = isLastCard ? 'Завершить анализ' : 'Далее →';
    
    const currentAnswer = analysisAnswers[currentCardIndex];
    nextBtn.disabled = !currentAnswer;
}

function completeAnalysis() {
    console.log('Analysis completed with answers:', analysisAnswers);
    
    analysisCard.classList.add('slide-out-left');
    
    setTimeout(() => {
        cardAnalysisContainer.classList.add('hidden');
        displayAnalysisResults();
    }, 300);
}

function displayAnalysisResults() {
    const analysis = {
        positive: [],
        neutral: [],
        negative: []
    };
    
    // Process answers by field names
    currentAnalysisStrategy.fields.forEach((field, index) => {
        const answer = analysisAnswers[index];
        if (answer && answer.rating) {
            const factor = {
                name: field.name,
                description: field.description
            };
            analysis[answer.rating].push(factor);
        }
    });
    
    // Render results
    renderFactors('positiveFactors', analysis.positive, 'positive');
    renderFactors('neutralFactors', analysis.neutral, 'neutral');  
    renderFactors('negativeFactors', analysis.negative, 'negative');
    
    // Generate summary statistics
    const total = analysis.positive.length + analysis.neutral.length + analysis.negative.length;
    const positivePercent = total > 0 ? Math.round((analysis.positive.length / total) * 100) : 0;
    const neutralPercent = total > 0 ? Math.round((analysis.neutral.length / total) * 100) : 0;
    const negativePercent = total > 0 ? Math.round((analysis.negative.length / total) * 100) : 0;
    
    const summaryStats = document.getElementById('summaryStats');
    summaryStats.innerHTML = `
        <div class="stat-item">
            <span class="stat-value" style="color: var(--color-success)">${positivePercent}%</span>
            <span class="stat-label">Положительные</span>
        </div>
        <div class="stat-item">
            <span class="stat-value" style="color: var(--color-info)">${neutralPercent}%</span>
            <span class="stat-label">Нейтральные</span>
        </div>
        <div class="stat-item">
            <span class="stat-value" style="color: var(--color-error)">${negativePercent}%</span>
            <span class="stat-label">Отрицательные</span>
        </div>
    `;
    
    // Generate recommendation
    const recommendation = document.getElementById('recommendation');
    let recommendationText = '';
    
    if (positivePercent >= 60) {
        recommendationText = '✅ Сделка выглядит привлекательно. Большинство факторов говорят в пользу входа.';
    } else if (negativePercent >= 50) {
        recommendationText = '❌ Рекомендуется воздержаться от сделки. Слишком много негативных факторов.';
    } else {
        recommendationText = '⚠️ Сделка требует дополнительного анализа. Факторы противоречивы.';
    }
    
    recommendation.textContent = recommendationText;
    
    analysisResults.classList.remove('hidden');
    analysisResults.scrollIntoView({ behavior: 'smooth' });
    
    console.log('Analysis results displayed:', { analysis, positivePercent, neutralPercent, negativePercent });
}

function renderFactors(containerId, factors, category) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (factors.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Нет факторов</p>';
        return;
    }
    
    factors.forEach((factor, index) => {
        const factorElement = document.createElement('div');
        factorElement.className = `factor-item ${category}`;
        factorElement.style.animationDelay = `${index * 0.1}s`;
        
        factorElement.innerHTML = `
            <strong>${factor.name}</strong>
            ${factor.description ? `<br><small>${factor.description}</small>` : ''}
        `;
        
        container.appendChild(factorElement);
    });
}

function resetAnalysis() {
    currentCardIndex = 0;
    analysisAnswers = [];
    currentAnalysisStrategy = null;
    
    analysisResults.classList.add('hidden');
    cardAnalysisContainer.classList.add('hidden');
    analysisCard.classList.remove('active', 'slide-out-left', 'slide-out-right');
    
    strategySelect.value = '';
    
    showNotification('Готов к новому анализу!', 'info');
}

// Utility Functions
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 16px 20px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 3000;
        font-weight: 500;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
    `;
    
    if (type === 'success') {
        notification.style.borderLeft = '4px solid var(--color-success)';
        notification.style.color = 'var(--color-success)';
    } else if (type === 'error') {
        notification.style.borderLeft = '4px solid var(--color-error)';
        notification.style.color = 'var(--color-error)';
    } else if (type === 'warning') {
        notification.style.borderLeft = '4px solid var(--color-warning)';
        notification.style.color = 'var(--color-warning)';
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Make functions globally accessible for onclick handlers
window.openModal = openModal;
window.deleteStrategy = deleteStrategy;
window.strategies = strategies;
// Application State
let strategies = [];
let currentStrategy = null;
let isEditMode = false;
let fieldCounter = 0;
let inputCounter = 0;
let savedAnalyses = [];

// Функции для работы с localStorage (ОТКЛЮЧЕНО - используем только Supabase)
function saveStrategiesToLocalStorage() {
    // ОТКЛЮЧЕНО: Не сохраняем в localStorage, только в Supabase
    console.log('⚠️ localStorage saving disabled - using Supabase only');
}

function loadStrategiesFromLocalStorage() {
    // ОТКЛЮЧЕНО: Не загружаем из localStorage, только из Supabase
    console.log('⚠️ localStorage loading disabled - using Supabase only');
    strategies = []; // Пустой массив, данные будут загружены из БД
}

function saveAnalysesToLocalStorage() {
    localStorage.setItem('savedAnalyses', JSON.stringify(savedAnalyses));
    console.log('Analyses saved to localStorage:', savedAnalyses);
}

function loadAnalysesFromLocalStorage() {
    const saved = localStorage.getItem('savedAnalyses');
    if (saved) {
        try {
            savedAnalyses = JSON.parse(saved);
            console.log('Analyses loaded from localStorage:', savedAnalyses);
        } catch (error) {
            console.error('Error parsing saved analyses:', error);
            savedAnalyses = [];
        }
    } else {
        savedAnalyses = [];
    }
}

// Функция для загрузки анализов из базы данных
async function loadAnalysesFromDatabase(retryCount = 0) {
    try {
        console.log('🔄 Loading analyses from database...');
        
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            if (retryCount < 3) {
                console.warn(`⚠️ Supabase client not available, retrying... (${retryCount + 1}/3)`);
                
                // Попробуем еще раз через секунду
                setTimeout(() => {
                    loadAnalysesFromDatabase(retryCount + 1);
                }, 1000);
                return;
            } else {
                console.error('❌ Supabase client not available after 3 attempts');
                savedAnalyses = [];
                return;
            }
        }
        
        // Получаем ID текущего пользователя
        const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
        let currentUserId = null;
        
        if (telegramUserId) {
            const { data: user } = await window.supabase
                .from('users')
                .select('id')
                .eq('telegram_id', telegramUserId)
                .single();
                
            if (user) {
                currentUserId = user.id;
                console.log('👤 Current user ID:', currentUserId);
            }
        }
        
        // Загружаем анализы только текущего пользователя
        let query = window.supabase
            .from('analysis_results')
            .select('*')
            .order('created_at', { ascending: false });
            
        // Фильтруем по пользователю если он найден
        if (currentUserId) {
            query = query.eq('user_id', currentUserId);
        }
        
        const { data: analysesData, error } = await query;
        
        if (error) {
            console.error('❌ Error loading analyses from database:', error);
            return;
        }
        
        if (analysesData && Array.isArray(analysesData)) {
            // Форматируем данные из БД в формат приложения
            console.log('📊 Raw analyses data from DB:', analysesData);
            
            // Загружаем стратегии для получения названий
            const { data: strategiesData } = await window.supabase
                .from('strategies')
                .select('id, name');
            
            const strategiesMap = {};
            if (strategiesData) {
                strategiesData.forEach(strategy => {
                    strategiesMap[strategy.id] = strategy.name;
                });
            }
            
            savedAnalyses = analysesData.map(analysis => {
                const results = analysis.results || {};
                return {
                    id: analysis.id,
                    date: analysis.created_at,
                    strategyName: strategiesMap[analysis.strategy_id] || 'Неизвестная стратегия',
                    coin: results.coin || 'BTC',
                    results: {
                        positive: results.positive_factors || [],
                        negative: results.negative_factors || [],
                        totalScore: analysis.total_score || results.total_score || 0,
                        maxScore: analysis.max_score || results.max_score || 0,
                        percentage: analysis.percentage || results.percentage || 0
                    }
                };
            });
            console.log('📊 Formatted analyses:', savedAnalyses);
        
        // Обновляем статистику пользователя
        if (typeof window.updateUserStats === 'function') {
            window.updateUserStats();
        }
        } else {
            console.log('📝 No analyses found in database');
            savedAnalyses = [];
        }
        
    } catch (error) {
        console.error('❌ Exception loading analyses from database:', error);
        savedAnalyses = [];
    }
}

// Card Analysis State
let currentCardIndex = 0;
let analysisAnswers = [];
let currentAnalysisStrategy = null;
let currentCoin = '';
// Sample data removed - new users start with empty strategies
const sampleStrategies = [ // Оставляем для совместимости, но не используем
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
const coinInput = document.getElementById('coinInput');
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

// My Analyses Modal Elements
const myAnalysesBtn = document.getElementById('myAnalysesBtn');
const analysesModal = document.getElementById('analysesModal');
const closeAnalysesModalBtn = document.getElementById('closeAnalysesModalBtn');
const closeAnalysesBtn = document.getElementById('closeAnalysesBtn');
const analysesList = document.getElementById('analysesList');

// Support Modal Elements (will be initialized in DOMContentLoaded)
let supportProjectBtn, supportProjectFooterBtn, supportModal, closeSupportModalBtn, closeSupportBtn, copyAddressBtn, walletAddress;

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing TradeAnalyzer...');
    
    // Инициализируем Telegram WebApp
    if (typeof initializeTelegramWebApp === 'function') {
        const telegramUser = initializeTelegramWebApp();
        if (telegramUser) {
            console.log('✅ Telegram user authenticated:', telegramUser);
            if (typeof syncTelegramTheme === 'function') {
                syncTelegramTheme();
            }
        }
    }
    
    // Инициализируем базу данных
    let dbInitialized = false;
    if (typeof initializeDatabase === 'function') {
        dbInitialized = await initializeDatabase();
    }
    
    // Простая загрузка стратегий из базы данных
    strategies = [];
    
    // Подождем немного для инициализации Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (window.supabase && typeof window.supabase.from === 'function') {
        try {
            console.log('🔄 Loading strategies from database...');
            
            // Получаем ID текущего пользователя Telegram
            const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
            
            let dbStrategies = [];
            let error = null;
            
            if (telegramUserId) {
                // Сначала найдем user_id по telegram_id
                const { data: userData } = await window.supabase
                    .from('users')
                    .select('id')
                    .eq('telegram_id', telegramUserId)
                    .single();
                
                if (userData) {
                    // Загружаем стратегии по user_id
                    const result = await window.supabase
                        .from('strategies')
                        .select('*')
                        .eq('user_id', userData.id)
                        .order('created_at', { ascending: false });
                    
                    dbStrategies = result.data || [];
                    error = result.error;
                    console.log('👤 Loading strategies for user_id:', userData.id);
                } else {
                    console.log('👤 User not found in DB, will be created on first strategy save');
                    dbStrategies = [];
                }
            } else {
                // Загружаем публичные стратегии
                const result = await window.supabase
                    .from('strategies')
                    .select('*')
                    .eq('is_public', true)
                    .order('created_at', { ascending: false });
                
                dbStrategies = result.data || [];
                error = result.error;
                console.log('⚠️ No telegram user ID, loading public strategies only');
            }
                
            if (error) {
                console.error('❌ Error loading strategies:', error);
                console.log('❌ Full error details:', JSON.stringify(error, null, 2));
            } else if (dbStrategies && Array.isArray(dbStrategies)) {
                strategies = dbStrategies;
                console.log(`✅ Loaded ${strategies.length} strategies from database`);
                console.log('✅ Strategies data:', strategies);
        
                // Обновляем статистику пользователя
                if (typeof window.updateUserStats === 'function') {
                    window.updateUserStats();
                }
            } else {
                console.log('📝 No strategies found in database');
                console.log('📝 dbStrategies:', dbStrategies);
            }
        } catch (error) {
            console.error('❌ Exception loading strategies:', error);
            console.log('❌ Full exception:', JSON.stringify(error, null, 2));
        }
    } else {
        console.warn('⚠️ Supabase client not available or not functional');
        console.log('⚠️ window.supabase:', window.supabase);
        console.log('⚠️ typeof window.supabase.from:', typeof window.supabase?.from);
        
        // Новые пользователи начинают с пустым списком
        console.log('📝 New user - starting with empty strategies list');
        strategies = [];
    }
    
    setupEventListeners();
    
    // Рендерим стратегии после загрузки
    console.log('🎨 About to render strategies. Current count:', strategies.length);
    renderStrategies();
    updateStrategySelect();
    showSection('home');
    
    console.log('✅ TradeAnalyzer initialized with strategies:', strategies);
});

// Event Listeners Setup
function setupEventListeners() {
    // Initialize Support Modal Elements
    supportProjectBtn = document.getElementById('supportProjectBtn');
    supportProjectFooterBtn = document.getElementById('footerSupportBtn');
    supportModal = document.getElementById('supportModal');
    closeSupportModalBtn = document.getElementById('closeSupportModalBtn');
    closeSupportBtn = document.getElementById('closeSupportBtn');
    copyAddressBtn = document.getElementById('copyAddressBtn');
    walletAddress = document.getElementById('walletAddress');
    
    console.log('Support elements initialized:', {
        supportProjectBtn: !!supportProjectBtn,
        supportProjectFooterBtn: !!supportProjectFooterBtn,
        supportModal: !!supportModal
    });
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    const sectionButtons = document.querySelectorAll('[data-section]');
    console.log('Found section buttons:', sectionButtons.length);
    
    sectionButtons.forEach((btn, index) => {
        const section = btn.getAttribute('data-section');
        console.log(`Button ${index + 1}: section="${section}", text="${btn.textContent.trim()}"`);
        
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = e.target.getAttribute('data-section') || e.target.closest('[data-section]')?.getAttribute('data-section');
            console.log('Section button clicked:', targetSection);
            if (targetSection) {
                showSection(targetSection);
                updateActiveNavLink(targetSection);
            }
        });
    });
    
    hamburger.addEventListener('click', toggleMobileMenu);
    
    // User Profile Event Listeners
    const userProfileBtn = document.getElementById('userButton');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userProfileBtn && userDropdown) {
        userProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('👤 User profile clicked');
            
            // Переключаем видимость dropdown
            const isHidden = userDropdown.classList.contains('hidden');
            
            if (isHidden) {
                userDropdown.classList.remove('hidden');
                console.log('👤 User dropdown opened');
                
                // Обновляем статистику при открытии
                if (window.updateUserStats) {
                    setTimeout(window.updateUserStats, 100);
                }
            } else {
                userDropdown.classList.add('hidden');
                console.log('👤 User dropdown closed');
            }
        });
        
        // Закрытие при клике вне dropdown
        document.addEventListener('click', function(e) {
            if (!userDropdown.contains(e.target) && !userProfileBtn.contains(e.target)) {
                userDropdown.classList.add('hidden');
            }
        });
        
        // Обработчики навигации в профиле
        const profileNavConstructor = document.getElementById('profileNavConstructor');
        const profileNavAnalysis = document.getElementById('profileNavAnalysis');
        
        if (profileNavConstructor) {
            profileNavConstructor.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('👤 Profile navigation: Constructor');
                showSection('constructor');
                userDropdown.classList.add('hidden');
            });
        }
        
        if (profileNavAnalysis) {
            profileNavAnalysis.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('👤 Profile navigation: Analysis');
                showSection('analysis');
                userDropdown.classList.add('hidden');
            });
        }
        
        console.log('👤 User profile initialized');
    } else {
        console.error('👤 User profile elements not found:', {
            userProfileBtn: !!userProfileBtn,
            userDropdown: !!userDropdown
        });
    }
    
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
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', startNewAnalysis);
    }
    
    const backToAnalysesBtn = document.getElementById('backToAnalysesBtn');
    if (backToAnalysesBtn) {
        backToAnalysesBtn.addEventListener('click', () => {
            openAnalysesModal();
        });
    }
    
    // My Analyses Modal Event Listeners
    if (myAnalysesBtn) {
        myAnalysesBtn.addEventListener('click', openAnalysesModal);
        console.log('My Analyses button event listener added');
    } else {
        console.error('myAnalysesBtn not found');
    }
    
    if (closeAnalysesModalBtn) {
        closeAnalysesModalBtn.addEventListener('click', closeAnalysesModal);
    }
    
    if (closeAnalysesBtn) {
        closeAnalysesBtn.addEventListener('click', closeAnalysesModal);
    }
    
    if (analysesModal) {
        analysesModal.addEventListener('click', (e) => {
            if (e.target === analysesModal) closeAnalysesModal();
        });
    }
    
    // Support Modal Event Listeners
    if (supportProjectBtn) {
        supportProjectBtn.addEventListener('click', openSupportModal);
        console.log('Support project button (header) event listener added');
    } else {
        console.error('supportProjectBtn not found');
    }
    
    if (supportProjectFooterBtn) {
        supportProjectFooterBtn.addEventListener('click', openSupportModal);
        console.log('Support project button (footer) event listener added');
    } else {
        console.error('supportProjectFooterBtn not found');
    }
    
    if (closeSupportModalBtn) {
        closeSupportModalBtn.addEventListener('click', closeSupportModal);
    }
    
    if (closeSupportBtn) {
        closeSupportBtn.addEventListener('click', closeSupportModal);
    }
    
    if (copyAddressBtn) {
        copyAddressBtn.addEventListener('click', copyWalletAddress);
    }
    
    if (supportModal) {
        supportModal.addEventListener('click', (e) => {
            if (e.target === supportModal) closeSupportModal();
        });
    }
    
    // Мобильная иконка поддержки
    const mobileSupportIcon = document.getElementById('mobileSupportIcon');
    if (mobileSupportIcon) {
        mobileSupportIcon.addEventListener('click', openSupportModal);
        console.log('Mobile support icon event listener added');
    }
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

async function showSection(sectionId) {
    console.log('📍 Showing section:', sectionId);
    
    // Скрываем все секции
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Показываем выбранную секцию
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
        targetSection.classList.add('fade-in');
        
        setTimeout(() => {
            targetSection.classList.remove('fade-in');
        }, 300);
        
        console.log('Section activated:', sectionId);
        
        // Отображаем стратегии без перезагрузки (используем уже загруженные данные)
        if (sectionId === 'constructor') {
            console.log('🏠 Showing constructor with current strategies:', strategies.length);
            renderStrategies();
        } else if (sectionId === 'analysis') {
            console.log('📊 Showing analysis with current strategies:', strategies.length);
            updateStrategySelect();
        }
    } else {
        console.error('Section not found:', sectionId);
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
            <h4>Основание ${fieldCounter}</h4>
            <button type="button" class="remove-field" title="Удалить основание"><i class="fas fa-times-circle"></i></button>
        </div>
        <div class="field-info">
            <div class="form-group">
                <label class="form-label">Название основания</label>
                <input type="text" class="form-control" name="fieldName" value="${fieldData?.name || ''}" required>
            </div>
            <div class="form-group">
                <label class="form-label">Описание основания</label>
                <textarea class="form-control" name="fieldDescription" rows="2">${fieldData?.description || ''}</textarea>
            </div>
        </div>
        <div class="inputs-section">
            <div class="inputs-header">
                <div class="inputs-header-title">
                    <label class="form-label">Подпункты</label>
                    <button type="button" class="toggle-inputs-btn" title="Развернуть/свернуть подпункты">
                        <i class="fas fa-chevron-down"></i>
                    </button>
                </div>
                <button type="button" class="btn btn--primary btn--sm add-input-btn">+ Добавить подпункт</button>
            </div>
            <div class="inputs-container"></div>
        </div>
    `;
    
    const removeBtn = fieldBuilder.querySelector('.remove-field');
    const addInputBtn = fieldBuilder.querySelector('.add-input-btn');
    const inputsContainer = fieldBuilder.querySelector('.inputs-container');
    const toggleBtn = fieldBuilder.querySelector('.toggle-inputs-btn');
    
    removeBtn.addEventListener('click', () => {
        fieldBuilder.remove();
        updateFieldNumbers();
    });
    
    addInputBtn.addEventListener('click', () => {
        addInputBuilder(inputsContainer);
    });
    
    toggleBtn.addEventListener('click', () => {
        const icon = toggleBtn.querySelector('i');
        if (inputsContainer.classList.contains('hidden')) {
            inputsContainer.classList.remove('hidden');
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        } else {
            inputsContainer.classList.add('hidden');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        }
    });
    
    // Add existing inputs if editing
    if (fieldData && fieldData.inputs) {
        fieldData.inputs.forEach(input => {
            addInputBuilder(inputsContainer, input);
        });
    }
    // Не добавляем подпункт автоматически
    
    fieldsContainer.appendChild(fieldBuilder);
    updateFieldNumbers();
}

function updateFieldNumbers() {
    const fieldBuilders = fieldsContainer.querySelectorAll('.field-builder');
    fieldBuilders.forEach((builder, index) => {
        const header = builder.querySelector('.field-header h4');
        if (header) {
            header.textContent = `Основание ${index + 1}`;
        }
        builder.setAttribute('data-field-id', index + 1);
    });
}

function addInputBuilder(container, inputData = null) {
    inputCounter++;
    
    const inputBuilder = document.createElement('div');
    inputBuilder.className = 'input-builder';
    inputBuilder.setAttribute('data-input-id', inputCounter);
    
    const isSelect = inputData?.type === 'select';
    const options = inputData?.options || [];
    
    // Определяем номер подпункта на основе количества существующих подпунктов в контейнере
    const existingInputs = container.querySelectorAll('.input-builder').length + 1;
    
    inputBuilder.innerHTML = `
        <div class="input-header">
            <h5>Подпункт ${existingInputs}</h5>
            <button type="button" class="remove-input" title="Удалить подпункт"><i class="fas fa-times-circle"></i></button>
        </div>
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
        const parentContainer = inputBuilder.parentElement;
        inputBuilder.remove();
        updateInputNumbers(parentContainer);
    });
    
    container.appendChild(inputBuilder);
    updateInputNumbers(container);
}

function updateInputNumbers(container) {
    const inputBuilders = container.querySelectorAll('.input-builder');
    inputBuilders.forEach((builder, index) => {
        const header = builder.querySelector('.input-header h5');
        if (header) {
            header.textContent = `Подпункт ${index + 1}`;
        }
        builder.setAttribute('data-input-id', index + 1);
    });
}

// Strategy Management
async function handleStrategySubmit(e) {
    e.preventDefault();
    console.log('📝 FORM SUBMITTED - Starting strategy creation...');
    
    const formData = new FormData(strategyForm);
    const strategyName = formData.get('strategyName');
    const strategyDescription = formData.get('strategyDescription');
    
    console.log('📝 Strategy name:', strategyName);
    console.log('📝 Strategy description:', strategyDescription);
    console.log('📝 Form data:', Object.fromEntries(formData.entries()));
    
    if (!strategyName || !strategyName.trim()) {
        alert('Пожалуйста, введите название стратегии');
        return;
    }
    
    // Collect fields
    const fields = [];
    const fieldBuilders = fieldsContainer.querySelectorAll('.field-builder');
    
    console.log('📝 Found field builders:', fieldBuilders.length);
    
    fieldBuilders.forEach((builder, index) => {
        console.log(`📝 Processing field builder ${index + 1}:`, builder);
        const fieldName = builder.querySelector('input[name="fieldName"]').value.trim();
        const fieldDescription = builder.querySelector('textarea[name="fieldDescription"]').value.trim();
        const inputBuilders = builder.querySelectorAll('.input-builder');
        
        if (!fieldName) return;
        
        console.log(`📝 Field ${index + 1}: name="${fieldName}", description="${fieldDescription}"`);
        
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
        
        // Добавляем поле даже если нет подпунктов
        const field = {
            name: fieldName,
            description: fieldDescription,
            inputs: inputs
        };
        fields.push(field);
    });
    
    if (fields.length === 0) {
        alert('Добавьте хотя бы одно основание');
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
        
        // TODO: Обновить стратегию в базе данных
        // await StrategyDB.update(strategy);
        
    } else {
        // Сохраняем новую стратегию в базу данных
        try {
            console.log('💾 Saving strategy to database...');
            
            // Получаем ID текущего пользователя Telegram
            const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
            
            console.log('🔍 TELEGRAM USER ID:', telegramUserId);
            console.log('🔍 SUPABASE CLIENT:', window.supabase);
            
            if (!telegramUserId) {
                console.error('❌ Cannot save strategy: No telegram user ID');
                showNotification('Необходима авторизация через Telegram', 'error');
                return;
            }
            
            // ТЕСТ: Проверим подключение к Supabase
            try {
                console.log('🔍 Testing Supabase connection...');
                const { data: testData, error: testError } = await window.supabase
                    .from('strategies')
                    .select('count')
                    .limit(1);
                console.log('🔍 Supabase test result:', { testData, testError });
            } catch (testErr) {
                console.error('🔍 Supabase connection test failed:', testErr);
            }
            
            // Найдем или создадим пользователя в таблице users
            let userId = null;
            
            console.log('🔍 Checking for existing user with telegram_id:', telegramUserId);
            
            // Проверяем, есть ли пользователь в таблице users
            const { data: existingUser, error: findError } = await window.supabase
                .from('users')
                .select('id')
                .eq('telegram_id', telegramUserId)
                .single();
            
            console.log('🔍 User lookup result:', { existingUser, findError });
            
            if (existingUser) {
                userId = existingUser.id;
                console.log('✅ Found existing user:', userId);
            } else {
                // Создаем нового пользователя
                console.log('🆕 Creating new user...');
                const telegramUserData = window.getTelegramUserData ? window.getTelegramUserData() : {};
                
                const newUserData = {
                    telegram_id: telegramUserId,
                    username: telegramUserData.username || null,
                    first_name: telegramUserData.first_name || null,
                    last_name: telegramUserData.last_name || null
                };
                
                console.log('📝 Creating user with data:', newUserData);
                
                const { data: newUser, error: userError } = await window.supabase
                    .from('users')
                    .insert(newUserData)
                    .select('id')
                    .single();
                
                console.log('📝 User creation result:', { newUser, userError });
                
                if (userError) {
                    console.error('❌ Error creating user:', userError);
                    showNotification('Ошибка создания пользователя: ' + userError.message, 'error');
                    return;
                }
                
                userId = newUser.id;
                console.log('✅ Created new user with ID:', userId);
            }
            
            // Теперь сохраняем стратегию
            console.log('💾 Saving strategy data:', {
                name: strategyName,
                description: strategyDescription,
                fields: fields, // ✅ Исправлено: было strategyFields
                user_id: userId
            });
            
            const { data: savedStrategy, error } = await window.supabase
                .from('strategies')
                .insert({
                    name: strategyName,
                    description: strategyDescription,
                    fields: fields, // ✅ Исправлено: было strategyFields
                    user_id: userId // UUID ссылка на users.id
                })
                .select()
                .single();
                
            if (error) {
                console.error('❌ Error saving strategy:', error);
                alert('Ошибка сохранения стратегии: ' + error.message);
                return;
            }
            
            strategy.id = savedStrategy.id;
            strategies.push(strategy);
            console.log('✅ Strategy saved successfully:', savedStrategy);
            
            // Обновляем счетчик стратегий
            if (window.incrementStrategiesCount) {
                window.incrementStrategiesCount();
            }
            
            // Обновляем селект стратегий для анализа
            updateStrategySelect();
            
        } catch (error) {
            console.error('❌ Exception saving strategy:', error);
            alert('Ошибка сохранения стратегии');
            return;
        }
    }
    
    renderStrategies();
    updateStrategySelect();
    closeModal();
    
    showNotification(isEditMode ? 'Стратегия обновлена!' : 'Стратегия создана!', 'success');
}

function editStrategy(id) {
    const strategy = strategies.find(s => s.id === id);
    if (strategy) {
        openModal(strategy);
    }
}

// Функция обновления стратегии в БД
async function updateStrategyInDB(strategyId, updatedData) {
    try {
        console.log('🔄 Updating strategy in database...', strategyId);
        
        const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
        
        if (!telegramUserId) {
            console.error('❌ Cannot update strategy: No telegram user ID');
            showNotification('Необходима авторизация через Telegram', 'error');
            return false;
        }
        
        // Найдем user_id
        const { data: userData } = await window.supabase
            .from('users')
            .select('id')
            .eq('telegram_id', telegramUserId)
            .single();
        
        if (!userData) {
            console.error('❌ User not found for telegram_id:', telegramUserId);
            showNotification('Пользователь не найден', 'error');
            return false;
        }
        
        // Обновляем стратегию
        const { data: updatedStrategy, error } = await window.supabase
            .from('strategies')
            .update({
                name: updatedData.name,
                description: updatedData.description,
                fields: updatedData.fields
            })
            .eq('id', strategyId)
            .eq('user_id', userData.id) // Проверяем владельца
            .select()
            .single();
        
        if (error) {
            console.error('❌ Error updating strategy:', error);
            showNotification('Ошибка обновления стратегии: ' + error.message, 'error');
            return false;
        }
        
        // Обновляем локальные данные
        const strategyIndex = strategies.findIndex(s => s.id === strategyId);
        if (strategyIndex !== -1) {
            strategies[strategyIndex] = updatedStrategy;
        }
        
        console.log('✅ Strategy updated successfully:', updatedStrategy);
        showNotification('Стратегия обновлена', 'success');
        
        // Обновляем интерфейс
        renderStrategies();
        updateStrategySelect();
        
        return true;
        
    } catch (error) {
        console.error('❌ Exception updating strategy:', error);
        showNotification('Ошибка обновления стратегии', 'error');
        return false;
    }
}

async function deleteStrategy(id) {
    if (confirm('Вы уверены, что хотите удалить эту стратегию?')) {
        try {
            // Получаем ID текущего пользователя Telegram
            const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
            
            if (!telegramUserId) {
                console.error('❌ Cannot delete strategy: No telegram user ID');
                showNotification('Необходима авторизация через Telegram', 'error');
                return;
            }
            
            // Сначала найдем user_id по telegram_id
            const { data: userData } = await window.supabase
                .from('users')
                .select('id')
                .eq('telegram_id', telegramUserId)
                .single();
            
            if (!userData) {
                console.error('❌ User not found for telegram_id:', telegramUserId);
                showNotification('Пользователь не найден', 'error');
                return;
            }
            
            // Удаляем стратегию, проверяя владельца
            const { error } = await window.supabase
                .from('strategies')
                .delete()
                .eq('id', id)
                .eq('user_id', userData.id); // Проверяем владельца по user_id
            
            if (error) {
                console.error('❌ Error deleting strategy from database:', error);
                showNotification('Ошибка удаления стратегии: ' + error.message, 'error');
                return;
            }
            
            // Удаляем из локального массива
            strategies = strategies.filter(s => s.id !== id);
            console.log('✅ Strategy deleted from database and local array, ID:', id);
            
            // Обновляем интерфейс
            renderStrategies();
            updateStrategySelect();
            
            // Обновляем статистику
            if (window.updateUserStats) {
                window.updateUserStats();
            }
            
            showNotification('Стратегия удалена', 'success');
            
        } catch (error) {
            console.error('❌ Exception deleting strategy:', error);
            showNotification('Ошибка удаления стратегии', 'error');
        }
    }
}

function renderStrategies() {
    console.log('🎨 Rendering strategies...');
    console.log('Strategies to render:', strategies.length);
    console.log('strategiesGrid element:', strategiesGrid);
    
    if (!strategiesGrid) {
        console.error('❌ strategiesGrid element not found');
        return;
    }
    
    strategiesGrid.innerHTML = '';
    
    if (strategies.length === 0) {
        console.log('📝 No strategies found - showing empty state');
        strategiesGrid.innerHTML = `
            <div class="empty-state">
                <p>Пока нет созданных стратегий. Создайте свою первую стратегию!</p>
            </div>
        `;
        return;
    }
    
    console.log('📋 Rendering', strategies.length, 'strategies');
    
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
                <button class="btn-icon edit" onclick="editStrategy(${strategy.id})" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete" onclick="deleteStrategy(${strategy.id})" title="Удалить"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        
        strategiesGrid.appendChild(strategyCard);
    });
    
    console.log('✅ Strategies rendered successfully');
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
    // Проверяем, что введена монета
    const coin = coinInput.value.trim().toUpperCase();
    if (!coin) {
        alert('Пожалуйста, укажите монету для анализа');
        coinInput.focus();
        return;
    }
    
    currentAnalysisStrategy = strategy;
    currentCoin = coin;
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
        
        ${currentField.inputs && currentField.inputs.length > 0 ? `
        <div class="card-inputs">
            ${currentField.inputs.map((input, index) => renderInput(input, index)).join('')}
        </div>
        ` : ''}
        
        <div class="color-rating">
            <div class="rating-label">Есть ли основание для входа?</div>
            <div class="color-options">
                <div class="color-option positive" data-value="positive">
                    <div class="color-circle"></div>
                    <span class="color-label">Есть</span>
                </div>
                <div class="color-option neutral" data-value="neutral">
                    <div class="color-circle"></div>
                    <span class="color-label">Нейтрально</span>
                </div>
                <div class="color-option negative" data-value="negative">
                    <div class="color-circle"></div>
                    <span class="color-label">Отсутствует</span>
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
        
        // Update next button state
        nextBtn.disabled = false;
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
    
    // Save field values and rating with labels
    const fieldValues = [];
    const answers = [];
    const inputs = analysisCard.querySelectorAll('[data-input-index]');
    
    inputs.forEach((input, index) => {
        const label = input.closest('.form-group')?.querySelector('.form-label')?.textContent || `Поле ${index + 1}`;
        let value = '';
        
        if (input.type === 'checkbox') {
            value = input.checked;
            fieldValues.push(value);
        } else {
            value = input.value;
            fieldValues.push(value);
        }
        
        // Сохраняем структурированный ответ
        if (value && value !== '' && value !== false) {
            answers.push({
                label: label.replace('*', '').trim(),
                value: value
            });
        }
    });
    
    analysisAnswers[currentCardIndex] = {
        rating: value,
        fieldValues: fieldValues,
        answers: answers
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
                description: field.description,
                answers: answer.answers || [], // Добавляем ответы пользователя
                rating: answer.rating
            };
            analysis[answer.rating].push(factor);
        }
    });
    
    // Render results
    renderFactors('positiveFactors', analysis.positive, 'positive');
    // Не отображаем нейтральные факторы
    renderFactors('negativeFactors', analysis.negative, 'negative');
    
    // Generate summary statistics (без нейтральных факторов)
    const total = analysis.positive.length + analysis.negative.length;
    const positivePercent = total > 0 ? Math.round((analysis.positive.length / total) * 100) : 0;
    const negativePercent = total > 0 ? Math.round((analysis.negative.length / total) * 100) : 0;
    
    const summaryStats = document.getElementById('summaryStats');
    summaryStats.innerHTML = `
        <div class="stat-item">
            <span class="stat-value" style="color: var(--color-success)">${positivePercent}%</span>
            <span class="stat-label">Есть основания</span>
        </div>
        <div class="stat-item">
            <span class="stat-value" style="color: var(--color-error)">${negativePercent}%</span>
            <span class="stat-label">Отсутствуют основания</span>
        </div>
    `;
    
    // Generate recommendation
    const recommendation = document.getElementById('recommendation');
    let recommendationText = '';
    
    if (positivePercent >= 70) {
        recommendationText = '✅ Сделка выглядит привлекательно. Большинство оснований присутствуют.';
    } else if (negativePercent >= 60) {
        recommendationText = '❌ Рекомендуется воздержаться от сделки. Слишком много отсутствующих оснований.';
    } else if (positivePercent > negativePercent) {
        recommendationText = '⚠️ Сделка может быть рассмотрена, но требует осторожности.';
    } else {
        recommendationText = '⚠️ Сделка требует дополнительного анализа. Недостаточно оснований для входа.';
    }
    
    recommendation.textContent = recommendationText;
    
    analysisResults.classList.remove('hidden');
    analysisResults.scrollIntoView({ behavior: 'smooth' });
    
    // Сохраняем анализ
    saveCurrentAnalysis();
    
    console.log('Analysis results displayed:', { analysis, positivePercent, negativePercent });
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
        
        // Формируем HTML с ответами пользователя
        let answersHtml = '';
        if (factor.answers && factor.answers.length > 0) {
            answersHtml = '<div class="factor-answers">';
            factor.answers.forEach(answer => {
                if (answer.value) {
                    answersHtml += `<div class="answer-item"><strong>${answer.label}:</strong> ${answer.value}</div>`;
                }
            });
            answersHtml += '</div>';
        }
        
        factorElement.innerHTML = `
            <div class="factor-header">
                <strong>Основание: ${factor.name}</strong>
            </div>
            ${factor.description ? `<div class="factor-description">${factor.description}</div>` : ''}
            ${answersHtml}
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

// My Analyses Modal Functions
function openAnalysesModal() {
    renderAnalysesList();
    analysesModal.classList.remove('hidden');
    analysesModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeAnalysesModal() {
    analysesModal.classList.remove('active');
    setTimeout(() => {
        analysesModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }, 300);
}

async function renderAnalysesList() {
    analysesList.innerHTML = `
        <div class="loading-state">
            <p>Анализы загружаются из базы данных...</p>
        </div>
    `;
    
    // Загружаем анализы из базы данных
    await loadAnalysesFromDatabase();
    
    analysesList.innerHTML = '';
    
    if (savedAnalyses.length === 0) {
        analysesList.innerHTML = `
            <div class="empty-state">
                <p>Пока нет сохраненных анализов. Проведите свой первый анализ!</p>
            </div>
        `;
        return;
    }
    
    savedAnalyses.forEach((analysis, index) => {
        const analysisCard = document.createElement('div');
        analysisCard.className = 'analysis-item';
        
        const date = new Date(analysis.date).toLocaleDateString('ru-RU');
        const positiveCount = analysis.results.positive.length;
        const negativeCount = analysis.results.negative.length;
        
        const coinDisplay = analysis.coin ? ` (${analysis.coin})` : '';
        
        analysisCard.innerHTML = `
            <div class="analysis-header">
                <h4>${analysis.strategyName}${coinDisplay}</h4>
                <span class="analysis-date">${date}</span>
            </div>
            <div class="analysis-summary">
                <span class="positive-count">+${positiveCount}</span>
                <span class="negative-count">-${negativeCount}</span>
            </div>
            <div class="analysis-actions">
                <button class="btn btn--outline btn--sm" onclick="viewAnalysis(${index})">Просмотр</button>
                <button class="btn btn--outline btn--sm" onclick="deleteAnalysis(${index})">Удалить</button>
            </div>
        `;
        
        analysesList.appendChild(analysisCard);
    });
}

async function saveCurrentAnalysis() {
    if (!currentAnalysisStrategy || !analysisAnswers) return;
    
    const analysis = {
        id: Date.now(),
        date: new Date().toISOString(),
        strategyName: currentAnalysisStrategy.name,
        strategyId: currentAnalysisStrategy.id,
        coin: currentCoin,
        results: {
            positive: [],
            negative: []
        }
    };
    
    // Process answers
    currentAnalysisStrategy.fields.forEach((field, index) => {
        const answer = analysisAnswers[index];
        if (answer && answer.rating) {
            const factor = {
                name: field.name,
                description: field.description
            };
            if (answer.rating === 'positive') {
                analysis.results.positive.push(factor);
            } else if (answer.rating === 'negative') {
                analysis.results.negative.push(factor);
            }
        }
    });
    
    // Сохраняем в базу данных
    if (window.supabase && typeof window.supabase.from === 'function') {
        try {
            console.log('💾 Saving analysis to database...');
            
            // Получаем ID пользователя
            const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
            let userId = null;
            
            if (telegramUserId) {
                // Находим пользователя
                const { data: user } = await window.supabase
                    .from('users')
                    .select('id')
                    .eq('telegram_id', telegramUserId)
                    .single();
                    
                if (user) {
                    userId = user.id;
                }
            }
            
            const { data: savedAnalysis, error } = await window.supabase
                .from('analysis_results')
                .insert({
                    strategy_id: currentAnalysisStrategy.id,
                    user_id: userId,
                    results: {
                        coin: currentCoin,
                        positive_factors: analysis.results.positive,
                        negative_factors: analysis.results.negative,
                        total_score: analysis.results.totalScore,
                        max_score: analysis.results.maxScore,
                        percentage: analysis.results.percentage
                    },
                    total_score: analysis.results.totalScore,
                    max_score: analysis.results.maxScore,
                    percentage: analysis.results.percentage
                })
                .select()
                .single();
                
            if (error) {
                console.error('❌ Error saving analysis to database:', error);
                alert('Ошибка сохранения анализа: ' + error.message);
                return;
            }
            
            // Обновляем ID анализа и название
            analysis.id = savedAnalysis.id;
            analysis.strategyName = currentAnalysisStrategy.name; // Правильное название стратегии
            analysis.coin = currentCoin; // Монета
            analysis.date = savedAnalysis.created_at; // Дата создания
            
            // Добавляем в локальный массив для отображения
            savedAnalyses.unshift(analysis); // unshift чтобы новые были сверху
            
            // Обновляем счетчик анализов
            if (window.incrementAnalysesCount) {
                window.incrementAnalysesCount();
            }
            
            console.log('✅ Analysis saved to database:', savedAnalysis);
            
        } catch (error) {
            console.error('❌ Exception saving analysis to database:', error);
            alert('Ошибка сохранения анализа');
            return;
        }
    } else {
        console.error('❌ Supabase client not available');
        alert('База данных недоступна. Анализ не сохранен.');
        return;
    }
}

function viewAnalysis(index) {
    const analysis = savedAnalyses[index];
    if (!analysis) {
        console.error('Analysis not found at index:', index);
        return;
    }
    
    console.log('🔍 Viewing analysis:', analysis);
    console.log('🔍 Analysis results:', analysis.results);
    console.log('🔍 Positive factors:', analysis.results?.positive);
    console.log('🔍 Negative factors:', analysis.results?.negative);
    
    // Закрываем модальное окно "Мои анализы"
    closeAnalysesModal();
    
    // Переходим на раздел анализа
    showSection('analysis');
    
    // Показываем результаты анализа
    setTimeout(() => {
        displaySavedAnalysisResults(analysis);
    }, 300);
}

function displaySavedAnalysisResults(analysis) {
    console.log('📊 Displaying saved analysis results:', analysis);
    
    // Скрываем карточки анализа и селект стратегии
    if (cardAnalysisContainer) {
        cardAnalysisContainer.classList.add('hidden');
    }
    
    // Показываем результаты
    const resultsContainer = document.getElementById('analysisResults');
    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
    }
    
    // Проверяем структуру данных
    const positive = analysis.results?.positive || [];
    const negative = analysis.results?.negative || [];
    
    console.log('📊 Positive factors to render:', positive);
    console.log('📊 Negative factors to render:', negative);
    
    // Отображаем результаты
    renderFactors('positiveFactors', positive, 'positive');
    renderFactors('negativeFactors', negative, 'negative');
    
    // Генерируем статистику
    const total = positive.length + negative.length;
    const positivePercent = total > 0 ? Math.round((positive.length / total) * 100) : 0;
    const negativePercent = total > 0 ? Math.round((negative.length / total) * 100) : 0;
    
    console.log('📊 Statistics:', { total, positivePercent, negativePercent });
    
    const summaryStats = document.getElementById('summaryStats');
    if (summaryStats) {
        summaryStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-value" style="color: var(--color-success)">${positivePercent}%</span>
                <span class="stat-label">Есть основания</span>
            </div>
            <div class="stat-item">
                <span class="stat-value" style="color: var(--color-error)">${negativePercent}%</span>
                <span class="stat-label">Отсутствуют основания</span>
            </div>
        `;
    }
    
    // Генерируем рекомендацию
    let recommendationText = '';
    if (positivePercent >= 70) {
        recommendationText = '✅ Сделка выглядит привлекательно. Большинство оснований присутствуют.';
    } else if (negativePercent >= 60) {
        recommendationText = '❌ Рекомендуется воздержаться от сделки. Слишком много отсутствующих оснований.';
    } else if (positivePercent > negativePercent) {
        recommendationText = '⚠️ Сделка может быть рассмотрена, но требует осторожности.';
    } else {
        recommendationText = '⚠️ Сделка требует дополнительного анализа. Недостаточно оснований для входа.';
    }
    
    const recommendation = document.getElementById('recommendation');
    if (recommendation) {
        recommendation.innerHTML = `
            <h4>Рекомендация</h4>
            <p>${recommendationText}</p>
        `;
    }
    
    // Показываем результаты
    if (analysisResults) {
        analysisResults.classList.remove('hidden');
    }
    
    // Показываем кнопку "Назад к анализам"
    const backToAnalysesBtn = document.getElementById('backToAnalysesBtn');
    if (backToAnalysesBtn) {
        backToAnalysesBtn.style.display = 'inline-flex';
    }
    
    console.log('✅ Saved analysis results displayed');
}

async function deleteAnalysis(index) {
    if (!confirm('Вы уверены, что хотите удалить этот анализ?')) {
        return;
    }
    
    const analysis = savedAnalyses[index];
    
    if (window.supabase && typeof window.supabase.from === 'function' && analysis.id) {
        try {
            console.log('🗑️ Deleting analysis from database...');
            
            const { error } = await window.supabase
                .from('analysis_results')
                .delete()
                .eq('id', analysis.id);
                
            if (error) {
                console.error('❌ Error deleting analysis from database:', error);
                alert('Ошибка удаления анализа: ' + error.message);
                return;
            }
            
            console.log('✅ Analysis deleted from database');
            
        } catch (error) {
            console.error('❌ Exception deleting analysis from database:', error);
            alert('Ошибка удаления анализа');
            return;
        }
    }
    
    // Удаляем из локального массива
    savedAnalyses.splice(index, 1);
    renderAnalysesList();
}

// Функция для начала нового анализа
function startNewAnalysis() {
    console.log('🔄 Starting new analysis...');
    
    // Полный сброс состояния анализа
    currentCardIndex = 0;
    analysisAnswers = [];
    currentAnalysisStrategy = null;
    currentCoin = '';
    
    // Скрываем результаты анализа
    if (analysisResults) {
        analysisResults.classList.add('hidden');
    }
    
    // Скрываем карточки анализа
    if (cardAnalysisContainer) {
        cardAnalysisContainer.classList.add('hidden');
    }
    
    // Полный сброс карточки анализа
    if (analysisCard) {
        analysisCard.classList.remove('active', 'slide-out-left', 'slide-out-right');
        // Очищаем содержимое карточки
        const cardContent = analysisCard.querySelector('.card-content');
        if (cardContent) {
            cardContent.innerHTML = '';
        }
    }
    
    // Сбрасываем кнопки навигации
    if (prevBtn) {
        prevBtn.classList.remove('visible');
    }
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = 'Далее →';
    }
    
    // Сбрасываем прогресс
    if (progressText) {
        progressText.textContent = '';
    }
    if (cardTitle) {
        cardTitle.textContent = '';
    }
    
    // Сбрасываем выбор стратегии и монету
    if (strategySelect) {
        strategySelect.value = '';
    }
    if (coinInput) {
        coinInput.value = '';
    }
    
    // Скрываем кнопку "Назад к анализам"
    const backToAnalysesBtn = document.getElementById('backToAnalysesBtn');
    if (backToAnalysesBtn) {
        backToAnalysesBtn.style.display = 'none';
    }
    
    // Переходим на раздел анализа сделки
    showSection('analysis');
    
    console.log('✅ New analysis started - select a strategy to begin');
}

// Support Modal Functions
function openSupportModal() {
    console.log('openSupportModal called');
    if (supportModal) {
        supportModal.classList.remove('hidden');
        supportModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        console.error('supportModal not found');
    }
}

function closeSupportModal() {
    if (supportModal) {
        supportModal.classList.remove('active');
        setTimeout(() => {
            supportModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

async function copyWalletAddress() {
    if (!walletAddress) {
        console.error('Wallet address element not found');
        return;
    }
    
    const addressText = walletAddress.value;
    
    try {
        // Используем современный Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(addressText);
            console.log('✅ Address copied using Clipboard API');
        } else {
            // Fallback для старых браузеров
            walletAddress.select();
            walletAddress.setSelectionRange(0, 99999); // For mobile devices
            document.execCommand('copy');
            console.log('✅ Address copied using execCommand fallback');
        }
        
        showNotification('Адрес кошелька скопирован в буфер обмена!', 'success');
        
        // Change button icon temporarily to show success
        const icon = copyAddressBtn.querySelector('i');
        if (icon) {
            const originalClass = icon.className;
            icon.className = 'fas fa-check';
            
            // Change button color temporarily
            copyAddressBtn.style.color = '#28a745';
            
            setTimeout(() => {
                icon.className = originalClass;
                copyAddressBtn.style.color = '';
            }, 2000);
        }
        
    } catch (err) {
        console.error('❌ Failed to copy address:', err);
        showNotification('Не удалось скопировать адрес в буфер обмена', 'error');
    }
}

// Функция для принудительного обновления стратегий из БД
async function refreshStrategiesFromDB() {
    try {
        console.log('🔄 Force refreshing strategies from database...');
        
        const telegramUserId = window.getTelegramUserId ? window.getTelegramUserId() : null;
        
        if (!telegramUserId) {
            console.error('❌ Cannot refresh: No telegram user ID');
            showNotification('Необходима авторизация через Telegram', 'error');
            return;
        }
        
        if (!window.supabase) {
            console.error('❌ Supabase not available');
            showNotification('Ошибка подключения к базе данных', 'error');
            return;
        }
        
        const { data: dbStrategies, error } = await window.supabase
            .from('strategies')
            .select('*')
            .eq('telegram_user_id', telegramUserId)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('❌ Error refreshing strategies:', error);
            showNotification('Ошибка обновления стратегий: ' + error.message, 'error');
            return;
        }
        
        // Обновляем локальные данные
        strategies.length = 0;
        if (dbStrategies && Array.isArray(dbStrategies)) {
            strategies.push(...dbStrategies);
        }
        
        console.log(`✅ Strategies refreshed: ${strategies.length} found`);
        
        // Обновляем интерфейс
        renderStrategies();
        updateStrategySelect();
        
        // Обновляем статистику
        if (window.updateUserStats) {
            window.updateUserStats();
        }
        
        showNotification(`Обновлено: ${strategies.length} стратегий`, 'success');
        
    } catch (error) {
        console.error('❌ Exception refreshing strategies:', error);
        showNotification('Ошибка обновления стратегий', 'error');
    }
}

// 📱 МОБИЛЬНАЯ ОПТИМИЗАЦИЯ КЛАВИАТУРЫ

// Обработка появления/скрытия клавиатуры
function initMobileKeyboardHandling() {
    let initialViewportHeight = window.innerHeight;
    let keyboardVisible = false;
    
    // Отслеживание изменения размера экрана
    function handleViewportChange() {
        const currentHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        
        // Клавиатура появилась, если высота уменьшилась на 150px+
        if (heightDifference > 150 && !keyboardVisible) {
            keyboardVisible = true;
            document.body.classList.add('keyboard-active');
            console.log('📱 Keyboard shown, height difference:', heightDifference);
        } 
        // Клавиатура скрылась
        else if (heightDifference < 100 && keyboardVisible) {
            keyboardVisible = false;
            document.body.classList.remove('keyboard-active');
            console.log('📱 Keyboard hidden, height difference:', heightDifference);
        }
    }
    
    // Обработчики событий
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            initialViewportHeight = window.innerHeight;
            handleViewportChange();
        }, 500);
    });
    
    // Обработка фокуса на полях ввода
    document.addEventListener('focusin', (e) => {
        if (e.target.matches('input, textarea, select')) {
            setTimeout(() => {
                // Прокручиваем к элементу через небольшую задержку
                e.target.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 300);
        }
    });
    
    console.log('📱 Mobile keyboard handling initialized');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Проверяем, что это мобильное устройство
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        initMobileKeyboardHandling();
    }
});

// Make functions globally accessible for onclick handlers
window.openModal = openModal;
window.editStrategy = editStrategy;
window.updateStrategyInDB = updateStrategyInDB;
window.deleteStrategy = deleteStrategy;
window.viewAnalysis = viewAnalysis;
window.refreshStrategiesFromDB = refreshStrategiesFromDB;
window.deleteAnalysis = deleteAnalysis;
window.strategies = strategies;
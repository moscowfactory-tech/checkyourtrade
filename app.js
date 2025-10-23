// Application State
let strategies = [];

// Helper function to parse strategy fields
function parseStrategyFields(strategy) {
    if (!strategy || !strategy.fields) return [];
    
    try {
        if (typeof strategy.fields === 'string') {
            return JSON.parse(strategy.fields);
        } else if (Array.isArray(strategy.fields)) {
            return strategy.fields;
        }
    } catch (e) {
        console.warn('Failed to parse strategy fields:', e);
    }
    
    return [];
}

// Keep window.strategies always bound to the internal array to avoid detaching references
// Some modules may do `window.strategies = newArray`, which would otherwise break UI rendering.
// This getter/setter ensures any assignment updates the same array in place.
try {
  const desc = Object.getOwnPropertyDescriptor(window, 'strategies');
  if (!desc || desc.configurable) {
    Object.defineProperty(window, 'strategies', {
      configurable: true,
      get() { return strategies; },
      set(value) {
        try {
          console.log('🧩 window.strategies setter invoked', Array.isArray(value) ? `len=${value.length}` : typeof value);
          strategies.length = 0;
          if (Array.isArray(value)) {
            strategies.push(...value);
          } else if (value && Array.isArray(value.data)) {
            // Support objects like { data: [...] }
            strategies.push(...value.data);
          }
        } catch (e) {
          console.warn('🧩 window.strategies setter error:', e);
        }
      }
    });
  }
} catch (e) {
  console.warn('🧩 Unable to bind window.strategies property:', e);
}
let currentStrategy = null;
let isEditMode = false;
let fieldCounter = 0;
let inputCounter = 0;
let savedAnalyses = [];

// 📱 TELEGRAM WEBAPP MINIMAL INTEGRATION
const IS_TELEGRAM_WEBAPP = !!(window.Telegram && window.Telegram.WebApp);

// Минимальная инициализация Telegram WebApp
if (IS_TELEGRAM_WEBAPP) {
    console.log('📱 Telegram WebApp detected - applying minimal integration');
    try {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
        console.log('✅ Telegram WebApp initialized');
    } catch (error) {
        console.error('❌ Telegram WebApp initialization error:', error);
    }
} else {
    console.log('💻 Browser version detected');
}

// ⚡ МГНОВЕННАЯ ИНИЦИАЛИЗАЦИЯ КНОПОК - БЕЗ ЗАДЕРЖКИ!
// Инициализируем кнопки сразу, как только DOM готов
function initializeButtonsImmediately() {
    console.log('⚡ Initializing buttons immediately...');
    
    // Проверяем каждые 100мс, пока кнопки не появятся
    const checkButtons = () => {
        const createBtn = document.getElementById('createStrategyBtn');
        const myStrategiesBtn = document.getElementById('myStrategiesBtn');
        const profileBtn = document.getElementById('userButton');
        
        if (createBtn && myStrategiesBtn && profileBtn) {
            console.log('✅ Buttons found - setting up event listeners immediately');
            
            // Основные кнопки
            createBtn.onclick = () => {
                console.log('📝 Create strategy clicked');
                if (typeof openModal === 'function') {
                    openModal();
                } else {
                    console.log('⚠️ openModal not ready yet');
                }
            };
            
            // Настройка кнопок навигации по data-section
            const navigationButtons = document.querySelectorAll('[data-section]');
            console.log('🔍 Found navigation buttons:', navigationButtons.length);
            navigationButtons.forEach((btn, index) => {
                const section = btn.getAttribute('data-section');
                console.log(`🔍 Button ${index + 1}: section="${section}", text="${btn.textContent.trim()}"`);
                
                btn.onclick = async (e) => {
                    e.preventDefault();
                    const sectionId = btn.getAttribute('data-section');
                    console.log('📊 Navigation clicked:', sectionId, 'from button:', btn.textContent.trim());
                    
                    // Мгновенное отображение конструктора с параллельной загрузкой
                    if (sectionId === 'constructor') {
                        console.log('⚡ INSTANT: Showing constructor immediately...');
                        
                        // Мгновенно показываем секцию
                        if (typeof showSection === 'function') {
                            showSection(sectionId);
                        }
                        
                        // Проверяем готовность UserManager и запускаем загрузку
                        console.log('⚡ INSTANT: Checking UserManager readiness...');
                        console.log('⚡ INSTANT: UserManager exists:', !!window.userManager);
                        console.log('⚡ INSTANT: UserManager initialized:', window.userManager?.isInitialized);
                        console.log('⚡ INSTANT: Current strategies count:', strategies.length);
                        
                        if (!window.userManager?.isInitialized) {
                            console.log('⚡ INSTANT: UserManager not ready, initializing now...');
                            try {
                                await window.userManager.initialize();
                                console.log('⚡ INSTANT: UserManager initialized on demand');
                            } catch (err) {
                                console.error('❌ INSTANT: Failed to initialize UserManager:', err);
                            }
                        }
                        
                        if (typeof loadStrategiesFromDatabase === 'function') {
                            console.log('⚡ INSTANT: Starting parallel strategies loading...');
                            loadStrategiesFromDatabase().then(() => {
                                console.log('⚡ INSTANT: Parallel load completed, updating UI...');
                                if (typeof renderStrategies === 'function') {
                                    renderStrategies();
                                    console.log('✅ INSTANT: Strategies updated after parallel load');
                                }
                            }).catch(err => {
                                console.error('❌ INSTANT: Parallel load failed:', err);
                            });
                        } else {
                            console.error('❌ INSTANT: loadStrategiesFromDatabase not available');
                        }
                    } else {
                        // Обычная навигация для других секций
                        if (typeof showSection === 'function') {
                            showSection(sectionId);
                        } else {
                            console.log('⚠️ showSection not ready yet');
                        }
                    }
                };
            });
            
            profileBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('👤 Profile clicked');
                const dropdown = document.getElementById('userDropdown');
                if (dropdown) {
                    dropdown.classList.toggle('hidden');
                }
            };
            
            console.log('✅ Buttons activated immediately!');
            return true;
        }
        return false;
    };
    
    // Проверяем сразу
    if (!checkButtons()) {
        // Если кнопки еще не готовы, проверяем каждые 100мс
        const interval = setInterval(() => {
            if (checkButtons()) {
                clearInterval(interval);
            }
        }, 100);
        
        // Останавливаем попытки через 5 секунд
        setTimeout(() => clearInterval(interval), 5000);
    }
}

// Запускаем сразу
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeButtonsImmediately);
} else {
    initializeButtonsImmediately();
}

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
        
        // Получаем ID текущего пользователя через UserManager
        let currentUserId = null;
        
        if (window.userManager && window.userManager.isInitialized) {
            currentUserId = window.userManager.getUserId();
            console.log('👤 Current user UUID:', currentUserId);
        } else {
            console.warn('⚠️ UserManager not initialized, trying to initialize...');
            try {
                await window.userManager.initialize();
                await window.userManager.ensureUserInDatabase();
                currentUserId = window.userManager.getUserId();
                console.log('👤 User initialized, UUID:', currentUserId);
            } catch (err) {
                console.error('❌ Failed to initialize user for analyses loading:', err);
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
                .eq('user_id', currentUserId)
                .select('id, name');
            
            console.log('📋 Loaded strategies for map:', strategiesData);
            
            const strategiesMap = {};
            if (strategiesData) {
                strategiesData.forEach(strategy => {
                    strategiesMap[strategy.id] = strategy.name;
                });
            }
            
            console.log('📋 Strategies map:', strategiesMap);
            
            savedAnalyses = analysesData.map(analysis => {
                // Парсим results если это строка JSON
                let results = analysis.results || {};
                console.log('🔍 Raw analysis from DB:', {
                    id: analysis.id,
                    strategy_id: analysis.strategy_id,
                    coin: analysis.coin,
                    results_type: typeof results,
                    results: results,
                    positive_factors: analysis.positive_factors,
                    negative_factors: analysis.negative_factors
                });
                
                if (typeof results === 'string') {
                    try {
                        results = JSON.parse(results);
                        console.log('✅ Parsed results:', results);
                    } catch (e) {
                        console.error('❌ Error parsing results JSON:', e);
                        results = {};
                    }
                }
                
                // Получаем название стратегии
                let strategyName = 'Неизвестная стратегия';
                if (analysis.strategy_id && strategiesMap[analysis.strategy_id]) {
                    strategyName = strategiesMap[analysis.strategy_id];
                    console.log('✅ Strategy name from map:', strategyName);
                } else if (results.strategy_name) {
                    strategyName = results.strategy_name;
                    console.log('✅ Strategy name from results:', strategyName);
                } else {
                    console.log('❌ No strategy name found. strategy_id:', analysis.strategy_id, 'results.strategy_name:', results.strategy_name);
                }
                
                // Получаем монету
                let coin = 'BTC';
                if (results.coin) {
                    coin = results.coin;
                } else if (analysis.coin) {
                    coin = analysis.coin;
                }
                
                return {
                    id: analysis.id,
                    date: analysis.created_at,
                    strategyName: strategyName,
                    coin: coin,
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
    console.log('🚀🚀🚀 STARTING TradeAnalyzer INITIALIZATION 🚀🚀🚀');
    console.log('🔍 DEBUG: window.userManager exists:', !!window.userManager);
    console.log('🔍 DEBUG: window.supabase exists:', !!window.supabase);
    console.log('🔍 DEBUG: IS_TELEGRAM_WEBAPP:', IS_TELEGRAM_WEBAPP);
    
    // 👤 Агрессивная инициализация пользователя
    console.log('👤 AGGRESSIVE: Initializing user manager immediately...');
    
    try {
        const currentUser = await window.userManager.initialize();
        
        if (currentUser) {
            console.log('✅ AGGRESSIVE: User initialized:', currentUser.type, currentUser.id);
            
            // Критически важно: сразу создаём/находим пользователя в БД
            console.log('💾 AGGRESSIVE: Ensuring user in database first...');
            
            try {
                const ensureSuccess = await window.userManager.ensureUserInDatabase();
                if (ensureSuccess) {
                    console.log('✅ AGGRESSIVE: User ensured in database, UUID:', window.userManager.getUserId());
                    
                    // Теперь загружаем стратегии с множественными попытками
                    console.log('💾 AGGRESSIVE: Loading strategies with multiple attempts...');
                    const loadAttempts = [100, 500, 1000, 2000];
                    
                    loadAttempts.forEach((delay, index) => {
                        setTimeout(async () => {
                            console.log(`💾 AGGRESSIVE: Load attempt #${index + 1} (${delay}ms delay)`);
                            try {
                                await loadStrategiesFromDatabase();
                                console.log(`✅ AGGRESSIVE: Load attempt #${index + 1} completed, strategies:`, strategies.length);
                            } catch (err) {
                                console.error(`❌ AGGRESSIVE: Load attempt #${index + 1} failed:`, err);
                            }
                        }, delay);
                    });
                } else {
                    console.error('❌ AGGRESSIVE: Failed to ensure user in database');
                }
            } catch (err) {
                console.error('❌ AGGRESSIVE: Exception ensuring user in database:', err);
            }
            
        } else {
            console.error('❌ AGGRESSIVE: Failed to initialize user');
            showNotification('Ошибка инициализации пользователя', 'error');
        }
    } catch (error) {
        console.error('❌ AGGRESSIVE: User initialization exception:', error);
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
    
    // 🆘 Инициализация экстренной диагностики (скрыта по умолчанию)
    setupEmergencyDiagnostics();
    
    // ✅ Стратегии теперь загружаются надежно при переходе в конструктор
    console.log('✅ Initialization completed - strategies will load reliably when entering constructor');

// 📊 СИСТЕМА АНАЛИТИКИ ДЛЯ АДМИН ПАНЕЛИ
class SimpleAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.setupEventTracking();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    setupEventTracking() {
        // Отслеживаем начало сессии
        this.trackEvent('session_start', {
            user_agent: navigator.userAgent,
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        });
        
        // Отслеживаем закрытие
        window.addEventListener('beforeunload', () => {
            this.trackEvent('session_end', {
                duration: Date.now() - this.sessionStart
            });
        });
    }
    
    async trackEvent(eventName, properties = {}) {
        try {
            const event = {
                event_name: eventName,
                user_id: window.userManager?.getUserId(),
                session_id: this.sessionId,
                timestamp: new Date().toISOString(),
                properties: {
                    ...properties,
                    url: window.location.href
                }
            };
            
            if (window.supabase) {
                await window.supabase
                    .from('user_events')
                    .insert(event);
                    
                console.log('📊 Event tracked:', eventName);
            }
        } catch (error) {
            console.error('Analytics error:', error);
        }
    }
    
    async trackError(error, context = {}) {
        try {
            const errorLog = {
                type: 'javascript_error',
                message: error.message || error,
                stack: error.stack,
                user_id: window.userManager?.getUserId(),
                session_id: this.sessionId,
                user_agent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date().toISOString()
            };
            
            if (window.supabase) {
                await window.supabase
                    .from('error_logs')
                    .insert(errorLog);
            }
                
        } catch (e) {
            console.error('Error logging failed:', e);
        }
    }
}

// Инициализация аналитики
window.analytics = new SimpleAnalytics();

// Принудительная запись регистрации при первом запуске
setTimeout(async () => {
    if (window.userManager?.isInitialized && window.analytics) {
        const regKey = `reg_tracked_${window.userManager.getTelegramId()}`;
        if (!localStorage.getItem(regKey)) {
            console.log('🔥 FORCE: Recording user_registered event...');
            localStorage.setItem(regKey, '1');
            await window.analytics.trackEvent('user_registered', {
                telegram_id: window.userManager.getTelegramId(),
                source: window.userManager.getCurrentUser()?.type || 'unknown',
                forced: true
            });
            console.log('✅ FORCE: user_registered recorded');
        }
    }
}, 2000);

// Интеграция с существующими функциями
const originalOpenModal = window.openModal;
if (originalOpenModal) {
    window.openModal = function() {
        window.analytics.trackEvent('strategy_creation_started');
        return originalOpenModal.apply(this, arguments);
    };
}

const originalSaveStrategy = window.saveStrategy;
if (originalSaveStrategy) {
    window.saveStrategy = function() {
        window.analytics.trackEvent('strategy_created', {
            strategy_name: document.getElementById('strategyName')?.value
        });
        return originalSaveStrategy.apply(this, arguments);
    };
}

// Глобальная обработка ошибок
window.addEventListener('error', (event) => {
    window.analytics.trackError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

console.log('📊 Analytics system initialized');
    
    console.log('✅ TradeAnalyzer initialization completed successfully');
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
        
        // 🔧 НАДЕЖНАЯ ИНИЦИАЛИЗАЦИЯ КОНСТРУКТОРА
        if (sectionId === 'constructor') {
            console.log('🏠 CONSTRUCTOR: Activating with reliable initialization...');
            ensureConstructorReady().catch(err => {
                console.error('❌ CONSTRUCTOR: Initialization failed:', err);
                showEmergencyDiagnostics();
            });
        } else if (sectionId === 'analysis') {
            console.log('📊 Showing analysis with current strategies:', strategies.length);
            updateStrategySelect();
        }
    } else {
        console.error('❌ Section not found:', sectionId);
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

// 📱 ОПТИМИЗИРОВАННАЯ ФУНКЦИЯ ОТКРЫТИЯ МОДАЛЬНОГО ОКНА
function openModal(strategy = null) {
    console.log('📝 Opening modal for strategy:', strategy);
    
    isEditMode = !!strategy;
    currentStrategy = strategy;
    
    const modal = document.getElementById('strategyModal');
    const modalTitle = document.getElementById('modalTitle');
    const strategyForm = document.getElementById('strategyForm');
    
    if (!modal || !modalTitle || !strategyForm) {
        console.error('❌ Modal elements not found');
        return;
    }
    
    modalTitle.textContent = isEditMode ? 'Редактировать стратегию' : 'Создать стратегию';
    
    if (isEditMode) {
        populateForm(strategy);
    } else {
        strategyForm.reset();
        const fieldsContainer = document.getElementById('fieldsContainer');
        if (fieldsContainer) {
            fieldsContainer.innerHTML = '';
        }
        fieldCounter = 0;
    }
    
    // 📱 Оптимизация для Telegram WebApp
    if (IS_TELEGRAM_WEBAPP) {
        // Расширяем WebApp для лучшей работы с клавиатурой
        if (window.Telegram?.WebApp?.expand) {
            window.Telegram.WebApp.expand();
        }
        
        // Добавляем класс для мобильной оптимизации
        modal.classList.add('telegram-webapp-modal');
        
        // Обработчик для клавиатуры
        const handleKeyboard = () => {
            // Прокручиваем к активному полю при открытии клавиатуры
            setTimeout(() => {
                const activeElement = document.activeElement;
                if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
                    activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        };
        
        // Добавляем обработчики на все поля ввода
        const inputs = modal.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', handleKeyboard);
        });
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('active');
    
    // Фокус на первом поле (с задержкой для мобильных)
    setTimeout(() => {
        const firstInput = modal.querySelector('input[type="text"]');
        if (firstInput) {
            firstInput.focus();
        }
    }, IS_TELEGRAM_WEBAPP ? 300 : 100);
}

function closeModal() {
    const modal = document.getElementById('strategyModal');
    if (modal) {
        modal.classList.remove('active');
        modal.classList.remove('telegram-webapp-modal');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
    
    // Сбрасываем состояние
    isEditMode = false;
    currentStrategy = null;
}

function toggleMobileMenu() {
    navMenu.classList.toggle('active');
    setTimeout(() => {
        document.body.style.overflow = 'auto';
        resetForm();
    }, 300);
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
    
    const fieldsArr = parseStrategyFields(strategy);
    
    fieldsArr.forEach(field => {
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
        
        // Обновляем стратегию в базе данных
        try {
            console.log('💾 Updating strategy in database...');
            
            const telegramUserId = window.userManager && window.userManager.getTelegramId 
                ? window.userManager.getTelegramId() 
                : null;
            
            if (!telegramUserId) {
                console.error('❌ Cannot update strategy: No telegram user ID');
                showNotification('Необходима авторизация через Telegram', 'error');
                return;
            }
            
            // Получаем user_id из таблицы users
            const { data: user } = await window.supabase
                .from('users')
                .select('id')
                .eq('telegram_id', telegramUserId)
                .single();
            
            if (!user) {
                console.error('❌ User not found');
                showNotification('Пользователь не найден', 'error');
                return;
            }
            
            const result = await window.supabase
                .from('strategies')
                .eq('id', currentStrategy.id)
                .update({
                    name: strategyName,
                    description: strategyDescription,
                    fields: fields,
                    user_id: user.id
                });
            
            const error = result.error;
            
            if (error) {
                console.error('❌ Error updating strategy:', error);
                showNotification('Ошибка обновления стратегии: ' + error.message, 'error');
                return;
            }
            
            console.log('✅ Strategy updated successfully in database');
            
            // Обновляем UI и закрываем модальное окно
            renderStrategies();
            updateStrategySelect();
            closeModal();
            showNotification('Стратегия обновлена!', 'success');
            return;
            
        } catch (error) {
            console.error('❌ Exception updating strategy:', error);
            showNotification('Ошибка обновления стратегии', 'error');
            return;
        }
        
    } else {
        // Сохраняем новую стратегию в базу данных
        try {
            console.log('💾 Saving strategy to database...');
            
            // Получаем ID текущего пользователя Telegram
            const telegramUserId = window.userManager && window.userManager.getTelegramId 
                ? window.userManager.getTelegramId() 
                : null;
            
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
            
            // Записываем событие создания стратегии
            if (window.analytics) {
                await window.analytics.trackEvent('strategy_created', {
                    strategy_name: strategyName,
                    strategy_id: savedStrategy.id
                });
            }
            
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
        
        const telegramUserId = window.userManager && window.userManager.getTelegramId 
            ? window.userManager.getTelegramId() 
            : null;
        
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
    console.log('🗑️ Delete strategy called, ID:', id);
    console.log('🔍 window.userManager exists:', !!window.userManager);
    console.log('🔍 window.supabase exists:', !!window.supabase);
    
    if (confirm('Вы уверены, что хотите удалить эту стратегию?')) {
        try {
            // Получаем ID текущего пользователя
            const userId = window.userManager && window.userManager.getUserId 
                ? window.userManager.getUserId() 
                : null;
            
            console.log('🔍 User ID for deletion:', userId);
            
            if (!userId) {
                console.error('❌ Cannot delete strategy: No user ID');
                alert('Ошибка: не удалось получить ID пользователя. Попробуйте перезагрузить приложение.');
                return;
            }
            
            // Удаляем стратегию через Timeweb API
            const result = await window.supabase
                .from('strategies')
                .eq('id', id)
                .delete();
            
            if (result.error) {
                console.error('❌ Error deleting strategy from database:', result.error);
                showNotification('Ошибка удаления стратегии: ' + result.error, 'error');
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
        const fieldsArr = parseStrategyFields(strategy);
        const totalInputs = fieldsArr.reduce((sum, field) => sum + (Array.isArray(field?.inputs) ? field.inputs.length : 0), 0);
        const strategyCard = document.createElement('div');
        strategyCard.className = 'strategy-card';
        
        strategyCard.innerHTML = `
            <h4>${strategy.name}</h4>
            <p>${strategy.description || 'Без описания'}</p>
            <div class="strategy-meta">
                <span class="fields-count">${fieldsArr.length} пунктов, ${totalInputs} полей</span>
            </div>
            <div class="strategy-actions">
                <button class="btn-icon edit" onclick="editStrategy('${strategy.id}')" title="Редактировать"><i class="fas fa-edit"></i></button>
                <button class="btn-icon delete" onclick="deleteStrategy('${strategy.id}')" title="Удалить"><i class="fas fa-trash-alt"></i></button>
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
    const strategyId = e.target.value; // UUID - строка, не число!
    
    console.log('🎯 Strategy selected, ID:', strategyId);
    
    if (!strategyId) {
        cardAnalysisContainer.classList.add('hidden');
        analysisResults.classList.add('hidden');
        return;
    }
    
    // Если уже был завершен анализ, сбрасываем результаты для нового анализа
    if (!analysisResults.classList.contains('hidden')) {
        console.log('🔄 Resetting previous analysis results for new analysis');
        analysisResults.classList.add('hidden');
        currentCardIndex = 0;
        analysisAnswers = [];
        analysisCard.classList.remove('active', 'slide-out-left', 'slide-out-right');
    }
    
    const strategy = strategies.find(s => s.id === strategyId);
    console.log('🔍 Found strategy:', strategy);
    
    if (strategy) {
        startCardAnalysis(strategy);
    } else {
        console.error('❌ Strategy not found for ID:', strategyId);
    }
}

function startCardAnalysis(strategy) {
    console.log('🎯 Starting card analysis for strategy:', strategy);
    
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
    
    const fieldsArr = parseStrategyFields(strategy);
    console.log('📊 Parsed fields:', fieldsArr);
    
    if (!fieldsArr || fieldsArr.length === 0) {
        console.error('❌ No fields found in strategy');
        alert('Ошибка: в стратегии нет полей для анализа');
        return;
    }
    
    analysisAnswers = new Array(fieldsArr.length).fill(null);
    
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
    const fieldsArr = parseStrategyFields(currentAnalysisStrategy);
    if (!currentAnalysisStrategy || currentCardIndex >= fieldsArr.length) {
        return;
    }
    
    const currentField = fieldsArr[currentCardIndex];
    
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
    
    const fieldsArr = parseStrategyFields(currentAnalysisStrategy);
    if (currentCardIndex < fieldsArr.length - 1) {
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
    const fieldsArr = parseStrategyFields(currentAnalysisStrategy);
    const total = fieldsArr.length;
    
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
    
    const fieldsArr = parseStrategyFields(currentAnalysisStrategy);
    const isLastCard = currentCardIndex === fieldsArr.length - 1;
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
    const fieldsArr = parseStrategyFields(currentAnalysisStrategy);
    fieldsArr.forEach((field, index) => {
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
        const positiveCount = (analysis.results && analysis.results.positive) ? analysis.results.positive.length : 0;
        const negativeCount = (analysis.results && analysis.results.negative) ? analysis.results.negative.length : 0;
        
        const coinDisplay = analysis.coin ? ` (${analysis.coin})` : '';
        const strategyName = analysis.strategyName || 'Неизвестная стратегия';
        
        console.log('📊 Rendering analysis:', { strategyName, coin: analysis.coin, positiveCount, negativeCount, analysis });
        
        analysisCard.innerHTML = `
            <div class="analysis-header">
                <h4>${strategyName}${coinDisplay}</h4>
                <span class="analysis-date">${date}</span>
            </div>
            <div class="analysis-summary">
                <span class="positive-count">+${positiveCount}</span>
                <span class="negative-count">-${negativeCount}</span>
            </div>
            <div class="analysis-actions">
                <button class="btn btn--outline btn--sm" onclick="viewAnalysis(${index})">Просмотр</button>
                <button class="btn btn--danger btn--sm" onclick="deleteAnalysis(${index})"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        
        analysesList.appendChild(analysisCard);
    });
}

async function saveCurrentAnalysis() {
    console.log('💾 saveCurrentAnalysis called with:', {
        currentAnalysisStrategy: currentAnalysisStrategy,
        currentCoin: currentCoin,
        analysisAnswers: analysisAnswers
    });
    
    if (!currentAnalysisStrategy || !analysisAnswers) {
        console.error('❌ Cannot save: missing strategy or answers');
        return;
    }
    
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
    
    console.log('📊 Analysis object before processing:', analysis);
    
    // Process answers
    const fieldsArr = parseStrategyFields(currentAnalysisStrategy);
    fieldsArr.forEach((field, index) => {
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
            const telegramUserId = window.userManager && window.userManager.getTelegramId 
                ? window.userManager.getTelegramId() 
                : null;
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
                    coin: currentCoin,
                    results: {
                        strategy_name: currentAnalysisStrategy.name,
                        coin: currentCoin,
                        positive_factors: analysis.results.positive,
                        negative_factors: analysis.results.negative,
                        total_score: analysis.results.totalScore,
                        max_score: analysis.results.maxScore,
                        percentage: analysis.results.percentage
                    },
                    positive_factors: analysis.results.positive,
                    negative_factors: analysis.results.negative,
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
            
            // Записываем событие завершения анализа
            if (window.analytics) {
                await window.analytics.trackEvent('analysis_completed', {
                    strategy_name: currentAnalysisStrategy.name,
                    strategy_id: currentAnalysisStrategy.id,
                    coin: currentCoin,
                    analysis_id: savedAnalysis.id
                });
            }
            
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
            
            const result = await window.supabase
                .from('analysis_results')
                .eq('id', analysis.id)
                .delete();
            
            const error = result.error;
                
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
        
        const telegramUserId = window.userManager && window.userManager.getTelegramId 
            ? window.userManager.getTelegramId() 
            : null;
        
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

// 💾 ФУНКЦИЯ ЗАГРУЗКИ СТРАТЕГИЙ ИЗ БД
async function loadStrategiesFromDatabase() {
    console.log('💾 loadStrategiesFromDatabase: Starting...');
    console.log('🔍 DEBUG: window.supabase exists:', !!window.supabase);
    console.log('🔍 DEBUG: window.userManager exists:', !!window.userManager);
    console.log('🔍 DEBUG: userManager.isInitialized:', window.userManager?.isInitialized);
    
    if (!window.supabase) {
        console.error('❌ CRITICAL: Supabase not available');
        showNotification('Ошибка загрузки стратегий: Нет подключения к БД', 'error');
        return;
    }
    
    if (!window.userManager) {
        console.error('❌ CRITICAL: UserManager not available');
        showNotification('Ошибка загрузки стратегий: Не инициализирован UserManager', 'error');
        return;
    }
    
    if (!window.userManager.isInitialized) {
        console.warn('⚠️ UserManager not initialized, trying to initialize...');
        try {
            await window.userManager.initialize();
            console.log('✅ UserManager initialized successfully');
        } catch (err) {
            console.error('❌ Failed to initialize UserManager:', err);
            showNotification('Ошибка загрузки стратегий: Не удалось инициализировать пользователя', 'error');
            return;
        }
    }
    
    let userId = window.userManager.getUserId();
    console.log('👤 Loading strategies for user:', userId);
    
    if (!userId) {
        console.warn('⚠️ No user ID available, ensuring user in database...');
        
        // Критически важно: создаём/находим пользователя в БД
        try {
            const success = await window.userManager.ensureUserInDatabase();
            if (success) {
                userId = window.userManager.getUserId();
                console.log('✅ User ensured in database, UUID:', userId);
            } else {
                console.error('❌ Failed to ensure user in database');
                return;
            }
        } catch (err) {
            console.error('❌ Exception ensuring user in database:', err);
            return;
        }
        
        if (!userId) {
            console.error('❌ Still no user ID after ensuring user in database');
            return;
        }
    }
    
    try {
        console.log('🔍 DEBUG: About to query strategies for userId:', userId);
        console.log('🔍 DEBUG: Supabase client ready:', !!window.supabase.from);
        
        const { data, error } = await window.supabase
            .from('strategies')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        
        console.log('🔍 DEBUG: Query completed. Error:', error, 'Data count:', data?.length || 0);
        
        if (error) {
            console.error('❌ Error loading strategies:', error);
            console.error('❌ Error details:', JSON.stringify(error, null, 2));
            showNotification(`Ошибка загрузки стратегий: ${error.message || error.code || 'Неизвестная ошибка'}`, 'error');
        } else {
            strategies.length = 0; // Очищаем массив
            if (data && Array.isArray(data)) {
                strategies.push(...data);
            }
            console.log('🔄 Forcing UI update after loading strategies...');
            
            // Проверяем, что элемент strategiesGrid доступен
            const strategiesGrid = document.getElementById('strategiesGrid');
            console.log('💻 strategiesGrid element found:', !!strategiesGrid);
            
            if (typeof forceUIUpdate === 'function') {
                forceUIUpdate();
            } else {
                // Фолбэк на старые функции
                if (typeof updateStrategySelect === 'function') {
                    updateStrategySelect();
                }
                if (typeof renderStrategies === 'function') {
                    renderStrategies();
                    console.log('✅ renderStrategies() called from loadStrategiesFromDatabase');
                }
                if (typeof window.updateUserStats === 'function') {
                    window.updateUserStats();
                }
            }
            
            // Дополнительная проверка через 500мс
            setTimeout(() => {
                const grid = document.getElementById('strategiesGrid');
                if (grid) {
                    console.log('🔄 Double-checking UI update...');
                    if (typeof renderStrategies === 'function') {
                        renderStrategies();
                        console.log('✅ Double-check renderStrategies() completed');
                    }
                } else {
                    console.error('❌ strategiesGrid still not found after 500ms');
                }
            }, 500);
        }
    } catch (err) {
        console.error('❌ Exception loading strategies:', err);
        showNotification('Ошибка подключения к базе данных', 'error');
    }
}

// 🔧 ФУНКЦИЯ ПРИНУДИТЕЛЬНОГО ОБНОВЛЕНИЯ UI
function forceUIUpdate() {
    console.log('🔧 FORCE UI UPDATE...');
    console.log('📊 Current strategies count:', strategies.length);
    console.log('📊 Strategies data:', strategies);
    
    // Проверяем элементы
    const strategiesGrid = document.getElementById('strategiesGrid');
    const strategySelect = document.getElementById('strategySelect');
    
    console.log('💻 strategiesGrid element:', strategiesGrid);
    console.log('💻 strategySelect element:', strategySelect);
    
    if (strategiesGrid) {
        console.log('✅ strategiesGrid found - updating...');
        renderStrategies();
    } else {
        console.error('❌ strategiesGrid NOT FOUND!');
    }
    
    if (strategySelect) {
        console.log('✅ strategySelect found - updating...');
        updateStrategySelect();
    } else {
        console.error('❌ strategySelect NOT FOUND!');
    }
    
    // Обновляем счетчики
    if (typeof window.updateUserStats === 'function') {
        console.log('✅ Updating user stats...');
        window.updateUserStats();
    }
    
    console.log('✅ Force UI update completed!');
}

// Отладочные функции удалены - архитектура работает корректно

// Make functions globally accessible for onclick handlers
window.openModal = openModal;
window.editStrategy = editStrategy;
window.updateStrategyInDB = updateStrategyInDB;
window.deleteStrategy = deleteStrategy;
window.viewAnalysis = viewAnalysis;
window.refreshStrategiesFromDB = refreshStrategiesFromDB;
window.deleteAnalysis = deleteAnalysis;
window.forceUIUpdate = forceUIUpdate;

// 🔧 НАДЕЖНАЯ ИНИЦИАЛИЗАЦИЯ КОНСТРУКТОРА (БЕЗ UI)
async function ensureConstructorReady() {
    console.log('🔧 CONSTRUCTOR: Starting reliable initialization...');
    
    try {
        // 1. Проверяем и инициализируем UserManager
        if (!window.userManager?.isInitialized) {
            console.log('🔧 CONSTRUCTOR: Initializing UserManager...');
            await window.userManager.initialize();
            console.log('✅ CONSTRUCTOR: UserManager initialized');
        }
        
        // 2. Проверяем UUID
        let userId = window.userManager.getUserId();
        if (!userId) {
            console.log('🔧 CONSTRUCTOR: Creating user in database...');
            await window.userManager.ensureUserInDatabase();
            userId = window.userManager.getUserId();
            console.log(`✅ CONSTRUCTOR: User created: ${userId?.substring(0, 8)}...`);
        }
        
        // 3. Принудительная загрузка стратегий
        console.log('🔧 CONSTRUCTOR: Loading strategies...');
        await loadStrategiesFromDatabase();
        console.log(`✅ CONSTRUCTOR: Strategies loaded: ${window.strategies?.length || 0}`);
        
        // 4. Обновляем UI
        if (typeof renderStrategies === 'function') {
            renderStrategies();
            console.log('✅ CONSTRUCTOR: UI updated');
        }
        
        // 5. Загружаем анализы и обновляем статистику
        console.log('🔧 CONSTRUCTOR: Loading analyses and updating stats...');
        if (typeof loadAnalysesFromDatabase === 'function') {
            await loadAnalysesFromDatabase();
            console.log('✅ CONSTRUCTOR: Analyses loaded');
        }
        
        if (typeof window.updateUserStats === 'function') {
            window.updateUserStats();
            console.log('✅ CONSTRUCTOR: User stats updated');
        }
        
        console.log('✅ CONSTRUCTOR: Reliable initialization completed successfully');
        
    } catch (err) {
        console.error('❌ CONSTRUCTOR: Initialization failed:', err);
        // Показываем экстренную диагностику только при ошибке
        showEmergencyDiagnostics();
    }
}

// 🆘 ЭКСТРЕННАЯ ДИАГНОСТИКА (АКТИВИРУЕТСЯ ПРИ ОШИБКАХ)
function showEmergencyDiagnostics() {
    const emergencyBtn = document.getElementById('emergencyDiagnosticsBtn');
    if (emergencyBtn) {
        emergencyBtn.style.display = 'block';
        console.log('🆘 Emergency diagnostics button activated');
    }
}

function setupEmergencyDiagnostics() {
    const emergencyBtn = document.getElementById('emergencyDiagnosticsBtn');
    const emergencyPanel = document.getElementById('emergencyDiagnosticsPanel');
    const emergencyOutput = document.getElementById('emergencyOutput');
    const emergencyFixBtn = document.getElementById('emergencyFixBtn');
    
    if (!emergencyBtn || !emergencyPanel || !emergencyOutput) {
        console.warn('⚠️ Emergency diagnostics elements not found');
        return;
    }
    
    function addEmergencyLog(message, type = 'error') {
        const timestamp = new Date().toLocaleTimeString();
        const color = type === 'success' ? '#66ff66' : type === 'warning' ? '#ffaa00' : '#ff6666';
        const logEntry = document.createElement('div');
        logEntry.style.color = color;
        logEntry.style.marginBottom = '4px';
        logEntry.innerHTML = `[${timestamp}] ${message}`;
        emergencyOutput.appendChild(logEntry);
        emergencyOutput.scrollTop = emergencyOutput.scrollHeight;
    }
    
    emergencyBtn.addEventListener('click', async () => {
        emergencyPanel.style.display = emergencyPanel.style.display === 'none' ? 'block' : 'none';
        
        if (emergencyPanel.style.display === 'block') {
            emergencyOutput.innerHTML = '';
            addEmergencyLog('🆘 Начинаем экстренную диагностику...', 'warning');
            
            // Проверяем компоненты
            addEmergencyLog(`🔍 window.supabase: ${!!window.supabase}`, window.supabase ? 'success' : 'error');
            addEmergencyLog(`🔍 window.userManager: ${!!window.userManager}`, window.userManager ? 'success' : 'error');
            
            if (window.userManager) {
                addEmergencyLog(`🔍 UserManager.isInitialized: ${window.userManager.isInitialized}`, window.userManager.isInitialized ? 'success' : 'error');
                
                if (window.userManager.isInitialized) {
                    const userId = window.userManager.getUserId();
                    addEmergencyLog(`🔍 UUID: ${userId ? userId.substring(0, 8) + '...' : 'NONE'}`, userId ? 'success' : 'error');
                } else {
                    addEmergencyLog('❌ UserManager не инициализирован!', 'error');
                }
            }
            
            addEmergencyLog(`🔍 Количество стратегий: ${window.strategies?.length || 0}`, 'warning');
            
            // Проверяем функции
            addEmergencyLog(`🔍 loadStrategiesFromDatabase: ${typeof loadStrategiesFromDatabase}`, typeof loadStrategiesFromDatabase === 'function' ? 'success' : 'error');
            addEmergencyLog(`🔍 renderStrategies: ${typeof renderStrategies}`, typeof renderStrategies === 'function' ? 'success' : 'error');
        }
    });
    
    if (emergencyFixBtn) {
        emergencyFixBtn.addEventListener('click', async () => {
            addEmergencyLog('🔧 Попытка аварийного восстановления...', 'warning');
            
            try {
                // Проверяем и инициализируем UserManager
                if (!window.userManager?.isInitialized) {
                    addEmergencyLog('🔧 Переинициализация UserManager...', 'warning');
                    await window.userManager.initialize();
                    addEmergencyLog('✅ UserManager переинициализирован', 'success');
                }
                
                // Проверяем UUID
                let userId = window.userManager.getUserId();
                if (!userId) {
                    addEmergencyLog('🔧 Создание пользователя...', 'warning');
                    await window.userManager.ensureUserInDatabase();
                    userId = window.userManager.getUserId();
                    addEmergencyLog(`✅ Пользователь создан: ${userId?.substring(0, 8)}...`, 'success');
                }
                
                // Принудительная загрузка стратегий
                addEmergencyLog('🔧 Принудительная загрузка стратегий...', 'warning');
                await loadStrategiesFromDatabase();
                addEmergencyLog(`✅ Стратегии загружены: ${window.strategies?.length || 0}`, 'success');
                
                // Обновляем UI
                if (typeof renderStrategies === 'function') {
                    renderStrategies();
                    addEmergencyLog('✅ UI обновлен', 'success');
                }
                
                // Скрываем кнопку после успешного исправления
                setTimeout(() => {
                    emergencyBtn.style.display = 'none';
                    emergencyPanel.style.display = 'none';
                    addEmergencyLog('✅ Проблема устранена, скрываем диагностику', 'success');
                }, 2000);
                
            } catch (err) {
                addEmergencyLog(`❌ Ошибка восстановления: ${err.message}`, 'error');
            }
        });
    }
}

window.showEmergencyDiagnostics = showEmergencyDiagnostics;
window.setupEmergencyDiagnostics = setupEmergencyDiagnostics;
window.strategies = strategies;
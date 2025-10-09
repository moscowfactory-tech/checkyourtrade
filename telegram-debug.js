// 🔍 TELEGRAM WEBAPP ДИАГНОСТИКА И ОТЛАДКА

console.log('🔍 Starting Telegram WebApp diagnostics...');

// Функция для диагностики Telegram WebApp
function diagnoseTelegramWebApp() {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: {},
        telegram: {},
        issues: [],
        recommendations: []
    };

    // 1. Проверка окружения
    diagnostics.environment = {
        userAgent: navigator.userAgent,
        isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        },
        url: window.location.href
    };

    // 2. Проверка Telegram WebApp API
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        diagnostics.telegram = {
            isAvailable: true,
            version: tg.version || 'unknown',
            platform: tg.platform || 'unknown',
            colorScheme: tg.colorScheme || 'unknown',
            themeParams: tg.themeParams || {},
            initData: tg.initData || 'empty',
            initDataUnsafe: tg.initDataUnsafe || {},
            viewportHeight: tg.viewportHeight || window.innerHeight,
            viewportStableHeight: tg.viewportStableHeight || window.innerHeight,
            isExpanded: tg.isExpanded || false,
            headerColor: tg.headerColor || 'unknown',
            backgroundColor: tg.backgroundColor || 'unknown'
        };

        // Проверка пользователя
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            diagnostics.telegram.user = {
                id: tg.initDataUnsafe.user.id,
                first_name: tg.initDataUnsafe.user.first_name,
                username: tg.initDataUnsafe.user.username || 'no_username',
                language_code: tg.initDataUnsafe.user.language_code || 'unknown'
            };
        } else {
            diagnostics.issues.push('❌ No user data available in Telegram WebApp');
            diagnostics.recommendations.push('🔧 Check if app is properly configured in BotFather');
        }

        // Проверка методов
        const methods = ['ready', 'expand', 'close', 'disableVerticalSwipes', 'onEvent', 'offEvent'];
        diagnostics.telegram.availableMethods = {};
        methods.forEach(method => {
            diagnostics.telegram.availableMethods[method] = typeof tg[method] === 'function';
        });

    } else {
        diagnostics.telegram.isAvailable = false;
        diagnostics.issues.push('❌ Telegram WebApp API not available');
        diagnostics.recommendations.push('🔧 Ensure app is opened through Telegram bot');
    }

    // 3. Проверка DOM элементов
    const criticalElements = [
        'strategyForm',
        'createStrategyBtn', 
        'strategyModal',
        'addFieldBtn'
    ];

    diagnostics.dom = {};
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        diagnostics.dom[id] = {
            exists: !!element,
            visible: element ? !element.classList.contains('hidden') : false,
            hasEventListeners: element ? element.onclick !== null || element.addEventListener !== null : false
        };

        if (!element) {
            diagnostics.issues.push(`❌ Critical element #${id} not found`);
        }
    });

    // 4. Проверка Supabase
    diagnostics.supabase = {
        available: !!window.supabase,
        hasFrom: window.supabase ? typeof window.supabase.from === 'function' : false,
        hasAuth: window.supabase ? typeof window.supabase.auth === 'object' : false
    };

    if (!diagnostics.supabase.available) {
        diagnostics.issues.push('❌ Supabase client not available');
        diagnostics.recommendations.push('🔧 Check supabase-config.js loading');
    }

    // 5. Проверка стилей
    const body = document.body;
    diagnostics.styles = {
        hasTelegramClass: body.classList.contains('telegram-webapp'),
        touchAction: getComputedStyle(body).touchAction,
        fontSize: getComputedStyle(body).fontSize
    };

    return diagnostics;
}

// Функция для исправления проблем
function fixTelegramWebAppIssues() {
    console.log('🔧 Attempting to fix Telegram WebApp issues...');

    // 1. Принудительная инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        try {
            tg.ready();
            tg.expand();
            
            // Добавляем класс для стилей
            document.body.classList.add('telegram-webapp');
            
            // Отключаем вертикальные свайпы если доступно
            if (typeof tg.disableVerticalSwipes === 'function') {
                tg.disableVerticalSwipes();
            }

            // Устанавливаем CSS переменные
            document.documentElement.style.setProperty('--tg-viewport-height', tg.viewportHeight + 'px');
            
            if (tg.themeParams) {
                Object.keys(tg.themeParams).forEach(key => {
                    document.documentElement.style.setProperty(`--tg-${key.replace(/_/g, '-')}`, tg.themeParams[key]);
                });
            }

            console.log('✅ Telegram WebApp initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Error initializing Telegram WebApp:', error);
            return false;
        }
    }

    return false;
}

// Функция для исправления форм
function fixTelegramForms() {
    console.log('📝 Fixing forms for Telegram WebApp...');

    const strategyForm = document.getElementById('strategyForm');
    if (strategyForm) {
        // Удаляем все существующие обработчики
        const newForm = strategyForm.cloneNode(true);
        strategyForm.parentNode.replaceChild(newForm, strategyForm);

        // Добавляем новый обработчик
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📱 Telegram form submission intercepted');
            
            // Собираем данные формы
            const formData = new FormData(newForm);
            const strategyData = {
                name: formData.get('strategyName'),
                description: formData.get('strategyDescription') || '',
                fields: []
            };

            console.log('📊 Strategy data:', strategyData);

            // Вызываем создание стратегии напрямую
            if (typeof createStrategyInDatabase === 'function') {
                createStrategyInDatabase(strategyData);
            } else {
                console.error('❌ createStrategyInDatabase function not found');
                showNotification('Ошибка: функция создания стратегии недоступна', 'error');
            }
        });

        console.log('✅ Form handlers fixed');
        return true;
    }

    console.error('❌ Strategy form not found');
    return false;
}

// Запуск диагностики
function runFullDiagnostics() {
    console.log('🔍 Running full Telegram WebApp diagnostics...');
    
    const results = diagnoseTelegramWebApp();
    
    console.log('📊 DIAGNOSTIC RESULTS:', results);
    
    if (results.issues.length > 0) {
        console.log('❌ ISSUES FOUND:');
        results.issues.forEach(issue => console.log(issue));
        
        console.log('🔧 RECOMMENDATIONS:');
        results.recommendations.forEach(rec => console.log(rec));
        
        // Попытка автоматического исправления
        const telegramFixed = fixTelegramWebAppIssues();
        const formsFixed = fixTelegramForms();
        
        console.log(`🔧 Auto-fix results: Telegram=${telegramFixed}, Forms=${formsFixed}`);
    } else {
        console.log('✅ No critical issues found');
    }
    
    return results;
}

// Экспорт функций
window.diagnoseTelegramWebApp = diagnoseTelegramWebApp;
window.fixTelegramWebAppIssues = fixTelegramWebAppIssues;
window.fixTelegramForms = fixTelegramForms;
window.runFullDiagnostics = runFullDiagnostics;

// Автоматический запуск диагностики через 2 секунды после загрузки
setTimeout(() => {
    if (window.Telegram && window.Telegram.WebApp) {
        runFullDiagnostics();
    }
}, 2000);

console.log('🔍 Telegram WebApp diagnostics loaded. Use runFullDiagnostics() to test manually.');

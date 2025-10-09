// 🔍 TELEGRAM WEBAPP DIAGNOSTICS - Диагностика проблем

console.log('🔍 TELEGRAM DIAGNOSTICS: Starting...');

// Функция для детальной диагностики
function runTelegramDiagnostics() {
    const results = {
        timestamp: new Date().toISOString(),
        environment: {},
        telegram: {},
        user: {},
        database: {},
        issues: [],
        recommendations: []
    };

    console.log('🔍 === TELEGRAM WEBAPP DIAGNOSTICS ===');

    // 1. Проверка окружения
    results.environment = {
        userAgent: navigator.userAgent,
        isTelegramWebApp: !!(window.Telegram && window.Telegram.WebApp),
        windowTelegram: !!window.Telegram,
        telegramWebApp: !!window.Telegram?.WebApp,
        IS_TELEGRAM_WEBAPP: typeof IS_TELEGRAM_WEBAPP !== 'undefined' ? IS_TELEGRAM_WEBAPP : 'undefined'
    };

    console.log('🌍 Environment:', results.environment);

    // 2. Проверка Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        results.telegram = {
            isAvailable: true,
            version: tg.version || 'unknown',
            platform: tg.platform || 'unknown',
            colorScheme: tg.colorScheme || 'unknown',
            isExpanded: tg.isExpanded || false,
            viewportHeight: tg.viewportHeight || 0,
            initData: !!tg.initData,
            initDataUnsafe: !!tg.initDataUnsafe,
            user: tg.initDataUnsafe?.user || null
        };

        if (!tg.initDataUnsafe?.user) {
            results.issues.push('❌ No Telegram user data available');
            results.recommendations.push('🔧 Check if WebApp is properly configured in BotFather');
        }
    } else {
        results.telegram.isAvailable = false;
        results.issues.push('❌ Telegram WebApp API not available');
    }

    console.log('📱 Telegram:', results.telegram);

    // 3. Проверка пользователя
    if (window.userManager) {
        const user = window.userManager.getCurrentUser();
        results.user = {
            managerExists: true,
            isInitialized: window.userManager.isInitialized,
            currentUser: user,
            userId: window.userManager.getUserId(),
            telegramId: window.userManager.getTelegramId(),
            displayName: window.userManager.getDisplayName()
        };

        if (!user) {
            results.issues.push('❌ User Manager: No current user');
        }
    } else {
        results.user.managerExists = false;
        results.issues.push('❌ User Manager not found');
    }

    console.log('👤 User:', results.user);

    // 4. Проверка базы данных
    results.database = {
        supabaseExists: !!window.supabase,
        supabaseFrom: window.supabase ? typeof window.supabase.from === 'function' : false
    };

    if (!window.supabase) {
        results.issues.push('❌ Supabase client not available');
        results.recommendations.push('🔧 Check supabase-config.js loading');
    }

    console.log('💾 Database:', results.database);

    // 5. Проверка DOM элементов
    const criticalElements = [
        'createStrategyBtn',
        'strategyModal', 
        'strategyForm',
        'myStrategiesBtn',
        'profileBtn'
    ];

    results.dom = {};
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        results.dom[id] = {
            exists: !!element,
            disabled: element ? element.disabled : null,
            onclick: element ? !!element.onclick : null
        };

        if (!element) {
            results.issues.push(`❌ Critical element #${id} not found`);
        } else if (element.disabled) {
            results.issues.push(`⚠️ Element #${id} is disabled`);
        }
    });

    console.log('🏗️ DOM Elements:', results.dom);

    // 6. Проверка стратегий
    if (typeof strategies !== 'undefined') {
        results.strategies = {
            arrayExists: true,
            count: strategies.length,
            data: strategies.slice(0, 2) // Первые 2 для примера
        };
    } else {
        results.strategies = { arrayExists: false };
        results.issues.push('❌ Strategies array not found');
    }

    console.log('📊 Strategies:', results.strategies);

    // Итоговый отчет
    console.log('📋 === DIAGNOSTIC SUMMARY ===');
    console.log('✅ Working:', Object.keys(results).filter(key => 
        key !== 'issues' && key !== 'recommendations' && key !== 'timestamp'
    ).length);
    console.log('❌ Issues found:', results.issues.length);
    
    if (results.issues.length > 0) {
        console.log('🚨 ISSUES:');
        results.issues.forEach(issue => console.log(issue));
        
        if (results.recommendations.length > 0) {
            console.log('💡 RECOMMENDATIONS:');
            results.recommendations.forEach(rec => console.log(rec));
        }
    } else {
        console.log('🎉 No critical issues found!');
    }

    return results;
}

// Функция для тестирования кнопок
function testButtons() {
    console.log('🔘 TESTING BUTTONS...');
    
    const buttons = ['createStrategyBtn', 'myStrategiesBtn', 'profileBtn'];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            console.log(`🔘 ${btnId}:`, {
                exists: true,
                disabled: btn.disabled,
                onclick: !!btn.onclick,
                addEventListener: typeof btn.addEventListener === 'function',
                style: {
                    display: btn.style.display || getComputedStyle(btn).display,
                    pointerEvents: getComputedStyle(btn).pointerEvents
                }
            });
        } else {
            console.log(`❌ ${btnId}: not found`);
        }
    });
}

// Функция для тестирования загрузки стратегий
async function testStrategiesLoad() {
    console.log('📊 TESTING STRATEGIES LOAD...');
    
    if (!window.supabase) {
        console.log('❌ Supabase not available');
        return;
    }

    if (!window.userManager || !window.userManager.isInitialized) {
        console.log('❌ User manager not initialized');
        return;
    }

    const userId = window.userManager.getUserId();
    console.log('👤 Testing with user ID:', userId);

    try {
        const { data, error } = await window.supabase
            .from('strategies')
            .select('*')
            .eq('user_id', userId);

        console.log('📊 Strategies query result:', { data, error });
        
        if (error) {
            console.log('❌ Database error:', error);
        } else {
            console.log('✅ Found strategies:', data?.length || 0);
        }
    } catch (err) {
        console.log('❌ Exception during strategies load:', err);
    }
}

// Автоматический запуск диагностики
setTimeout(() => {
    console.log('🔍 Auto-running diagnostics...');
    runTelegramDiagnostics();
    testButtons();
    
    // Тест загрузки стратегий через 2 секунды
    setTimeout(testStrategiesLoad, 2000);
}, 1000);

// Экспорт функций для ручного вызова
window.runTelegramDiagnostics = runTelegramDiagnostics;
window.testButtons = testButtons;
window.testStrategiesLoad = testStrategiesLoad;

console.log('🔍 Telegram diagnostics loaded. Use runTelegramDiagnostics() for manual testing.');
